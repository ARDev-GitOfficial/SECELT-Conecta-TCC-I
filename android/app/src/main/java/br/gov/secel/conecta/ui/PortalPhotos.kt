package br.gov.secel.conecta.ui

import android.graphics.BitmapFactory
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import br.gov.secel.conecta.data.PortalApi
import java.net.URLEncoder
import java.util.Locale
import java.util.concurrent.Executor
import org.json.JSONArray
import org.json.JSONObject

internal class PortalPhotos(
    private val ui: PortalUi,
    private val api: PortalApi,
    private val executor: Executor
) {
    private val credits = PhotoCredits(ui.muted, ui.brandStrong)

    fun add(content: LinearLayout, photo: JSONObject, index: Int) {
        with(ui) {
            val card = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(12), dp(12), dp(12), dp(12))
                background = glassSurface(panelColor, 16f)
            }
            val image = ImageView(activity).apply {
                scaleType = ImageView.ScaleType.CENTER_CROP
                contentDescription = photo.optString("altText", photo.optString("title"))
            }
            card.addView(image, LinearLayout.LayoutParams(-1, dp(190)))
            val credit = label("", 9, muted)
            card.addView(credit)
            card.addView(label("FOTOGRAFIA LOCAL  ·  " + String.format(Locale.US, "%02d", index + 1), 9, brandStrong, true))
            card.addView(label(photo.optString("title"), 18, ink, true))
            if (photo.optString("altText").isNotBlank()) card.addView(label(photo.optString("altText"), 12, bodyText))
            load(photo.optString("fileUrl"), image, creditView = credit, media = photo)
            content.addView(card, margin(0, dp(4), 0, dp(12)))
        }
    }

    fun load(path: String, image: ImageView, creditView: TextView? = null, media: JSONObject? = null) {
        with(ui) {
            if (creditView != null) {
                if (media == null) credits.setLocalPhotoCredit(creditView, path) else credits.setMediaPhotoCredit(creditView, media)
            }
            executor.execute {
                val bytes = try { api.download(path) } catch (_: Exception) { null }
                val bitmap = bytes?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
                activity.runOnUiThread {
                    if (bitmap != null && !activity.isFinishing && !activity.isDestroyed) image.setImageBitmap(bitmap)
                }
            }
        }
    }

    fun loadGooglePhotos(point: JSONObject, row: LinearLayout) {
        with(ui) {
            executor.execute {
                val photos = try { api.get("/api/tourism/${point.optString("id")}/visual").optJSONArray("photos") ?: JSONArray() } catch (_: Exception) { JSONArray() }
                activity.runOnUiThread {
                    if (!row.isAttachedToWindow || activity.isFinishing || activity.isDestroyed) return@runOnUiThread
                    for (index in 0 until photos.length()) {
                        val photo = photos.optJSONObject(index) ?: continue
                        if (photo.optString("photoName").isBlank()) continue
                        googlePhotoCard(point, photo, index, row)
                    }
                }
            }
        }
    }

    private fun googlePhotoCard(point: JSONObject, photo: JSONObject, index: Int, row: LinearLayout) {
        with(ui) {
            val item = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(8), dp(8), dp(8), dp(8))
                background = glassSurface(panelColor, 14f)
            }
            val image = ImageView(activity).apply {
                scaleType = ImageView.ScaleType.CENTER_CROP
                contentDescription = "Foto ${index + 1} de ${point.optString("name")} no Google Maps"
            }
            item.addView(image, LinearLayout.LayoutParams(dp(174), dp(116)))
            val credit = label("Carregando foto do Maps…", 8, muted)
            item.addView(credit)
            row.addView(item, LinearLayout.LayoutParams(-2, -2).apply { setMargins(0, 0, dp(8), 0) })
            loadGooglePhoto(point.optString("id"), photo, image, credit)
        }
    }

    private fun loadGooglePhoto(pointId: String, photo: JSONObject, image: ImageView, creditView: TextView) {
        with(ui) {
            executor.execute {
                val bytes = try {
                    val encoded = URLEncoder.encode(photo.optString("photoName"), "UTF-8")
                    api.download("/api/tourism/$pointId/photo?name=$encoded")
                } catch (_: Exception) { null }
                val bitmap = bytes?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
                activity.runOnUiThread {
                    if (bitmap != null && !activity.isFinishing && !activity.isDestroyed) {
                        image.setImageBitmap(bitmap)
                        credits.setGooglePhotoCredit(creditView, photo)
                    } else if (!activity.isFinishing && !activity.isDestroyed) {
                        (image.parent as? View)?.visibility = View.GONE
                    }
                }
            }
        }
    }
}
