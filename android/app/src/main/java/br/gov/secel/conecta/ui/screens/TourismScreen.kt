package br.gov.secel.conecta.ui.screens

import android.graphics.Color
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import br.gov.secel.conecta.data.PortalData
import br.gov.secel.conecta.ui.NewsCards
import br.gov.secel.conecta.ui.PortalDestination
import br.gov.secel.conecta.ui.PortalPhotos
import br.gov.secel.conecta.ui.PortalScreen
import br.gov.secel.conecta.ui.PortalUi
import java.util.Locale
import org.json.JSONObject

internal class TourismScreen(
    private val ui: PortalUi,
    private val news: NewsCards,
    private val photos: PortalPhotos
) : PortalScreen {
    override val destination = PortalDestination.TOURISM

    override fun render(content: LinearLayout, data: PortalData) {
        with(ui) {
            news.add(content, data.news, "Lazer", "Turismo")
            val localPhotos = (0 until data.media.length()).map { data.media.getJSONObject(it) }
                .filter { it.optString("section") == "Turismo" }
            content.addView(label("São Miguel em imagens", 20, ink, true))
            content.addView(label("Fotografias locais com autoria e origem identificadas.", 12, bodyText))
            if (localPhotos.isEmpty()) content.addView(label("Nenhuma foto local publicada no acervo.", 12, muted))
            localPhotos.forEachIndexed { index, photo -> photos.add(content, photo, index) }

            content.addView(label("Pontos de interesse", 18, ink, true).apply { setPadding(0, dp(14), 0, 0) })
            content.addView(label("Consulte as informações e abra a localização no Maps.", 12, bodyText))
            for (i in 0 until data.places.length()) pointCard(content, data.places.getJSONObject(i), i, data.googlePhotosEnabled)
            if (data.places.length() == 0) content.addView(label("Nenhum ponto turístico publicado.", 12, muted))
        }
    }

    private fun pointCard(content: LinearLayout, point: JSONObject, index: Int, googlePhotosEnabled: Boolean) {
        with(ui) {
            val card = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(14), dp(13), dp(14), dp(13))
                background = glassSurface(panelColor, 16f)
            }
            card.addView(label(point.optString("category").uppercase() + "  ·  " + String.format(Locale.US, "%02d", index + 1), 9, brandStrong, true))
            card.addView(label(point.optString("name"), 18, ink, true))
            if (point.optString("description").isNotBlank()) card.addView(label(point.optString("description"), 12, bodyText))
            card.addView(label("⌖  " + point.optString("address", "Endereço não cadastrado"), 11, muted))
            val mapButton = Button(activity).apply {
                text = "Abrir no Maps"
                isAllCaps = false
                textSize = 12f
                setTextColor(Color.WHITE)
                background = pill(blue)
                setOnClickListener { openMap(point) }
            }
            card.addView(mapButton, margin(0, dp(8), 0, 0))
            if (googlePhotosEnabled && point.optString("placeId").isNotBlank()) {
                val photoRow = LinearLayout(activity).apply { orientation = LinearLayout.HORIZONTAL }
                val photoRail = HorizontalScrollView(activity).apply {
                    isHorizontalScrollBarEnabled = false
                    addView(photoRow)
                }
                card.addView(photoRail, margin(-dp(3), dp(8), -dp(3), 0))
                photos.loadGooglePhotos(point, photoRow)
            }
            content.addView(card, margin(0, dp(4), 0, dp(12)))
        }
    }
}
