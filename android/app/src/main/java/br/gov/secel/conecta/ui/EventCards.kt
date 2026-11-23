package br.gov.secel.conecta.ui

import android.app.AlertDialog
import android.graphics.Bitmap
import android.graphics.Color
import android.text.InputType
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Toast
import br.gov.secel.conecta.data.PortalApi
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.util.concurrent.Executor
import org.json.JSONObject

internal class EventCards(
    private val ui: PortalUi,
    private val photos: PortalPhotos,
    private val api: PortalApi,
    private val executor: Executor
) {
    fun add(content: LinearLayout, event: JSONObject, readOnly: Boolean) {
        with(ui) {
            val card = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(12), dp(12), dp(12), dp(12))
                background = glassSurface(panelColor, 16f)
                setOnClickListener { showDetails(event, readOnly) }
            }
            val title = event.optString("title")
            val photo = event.optJSONArray("photos")?.optJSONObject(0)
            if (photo != null) {
                val image = ImageView(activity).apply {
                    scaleType = ImageView.ScaleType.CENTER_CROP
                    contentDescription = photo.optString("altText", title)
                }
                card.addView(image, LinearLayout.LayoutParams(-1, dp(118)))
                val photoCredit = label("", 8, muted)
                card.addView(photoCredit)
                photos.load(photo.optString("fileUrl"), image, creditView = photoCredit, media = photo)
            }
            val startsAt = event.optString("startsAt")
            val date = startsAt.take(10).split("-")
            val dateLabel = "${date.getOrNull(2).orEmpty()}/${date.getOrNull(1).orEmpty()}"
            card.addView(label("$dateLabel  ·  ${event.optString("category").uppercase()}", 10, brandStrong, true).apply {
                setPadding(0, dp(8), 0, dp(2))
            })
            card.addView(label(title, 17, ink, true))
            card.addView(label("${startsAt.drop(11).take(5)}  ·  ${event.optString("location")}", 11, bodyText))
            val status = event.optString("status", "Publicado")
            val statusColor = if (status == "Cancelado") muted else green
            card.addView(label("$status  ·  ${ticketLabel(event)}", 10, statusColor, true))
            content.addView(card, margin(0, 0, 0, dp(10)))
        }
    }

    private fun isFree(event: JSONObject): Boolean = event.optBoolean("isFree", event.optInt("isFree") == 1)

    private fun ticketLabel(event: JSONObject) = if (isFree(event)) "Gratuito" else "Pago"

    private fun showDetails(event: JSONObject, readOnly: Boolean) {
        val canRegister = !readOnly && event.optString("status", "Publicado") == "Publicado" && isFree(event)
        val details = buildString {
            appendLine(event.optString("description"))
            appendLine()
            appendLine("Status: ${event.optString("status", "Publicado")}")
            appendLine("Data: ${event.optString("startsAt").replace('T', ' ').take(16)}")
            appendLine("Local: ${event.optString("location")}")
            appendLine("Faixa etária: ${event.optString("ageRange")}")
            appendLine("Regra de bebida: ${event.optString("drinkRule")}")
            appendLine("Organizador: ${event.optString("organizerType")}")
            append("Ingresso: ${ticketLabel(event)}")
            if (readOnly && isFree(event) && event.optString("status", "Publicado") == "Publicado") {
                append("\n\nInscrições indisponíveis nesta demonstração.")
            }
        }
        AlertDialog.Builder(ui.activity)
            .setTitle(event.optString("title"))
            .setMessage(details)
            .setNegativeButton("Fechar", null)
            .setPositiveButton(if (canRegister) "Inscrever-se e gerar QR Code" else "Abrir no Maps") { _, _ ->
                if (canRegister) {
                    showRegistrationForm(event)
                } else {
                    ui.openMap(JSONObject().put("name", event.optString("title")).put("address", event.optString("location")))
                }
            }
            .show()
    }

    private fun showRegistrationForm(event: JSONObject) {
        val activity = ui.activity
        val name = EditText(activity).apply { hint = "Nome completo" }
        val email = EditText(activity).apply {
            hint = "E-mail"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        }
        val layout = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(20, 4, 20, 4)
            addView(name)
            addView(email)
        }
        val dialog = AlertDialog.Builder(activity)
            .setTitle("Inscrição gratuita")
            .setMessage("Informe apenas os dados necessários para gerar seu ingresso.")
            .setView(layout)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Gerar ingresso", null)
            .create()
        dialog.setOnShowListener {
            val submit = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            submit.setOnClickListener {
                if (name.text.isBlank() || !email.text.contains("@")) {
                    Toast.makeText(activity, "Preencha nome e e-mail válidos.", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                val request = JSONObject().put("name", name.text.toString()).put("email", email.text.toString())
                submit.isEnabled = false
                executor.execute {
                    val result = runCatching {
                        api.post("/api/events?id=${event.optString("id")}", request).getString("qrCode")
                    }
                    activity.runOnUiThread {
                        if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
                        result.onSuccess { token ->
                            dialog.dismiss()
                            showTicket(event, token)
                        }.onFailure { error ->
                            submit.isEnabled = true
                            Toast.makeText(activity, error.message ?: "Falha ao salvar inscrição.", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }
        }
        dialog.show()
    }

    private fun showTicket(event: JSONObject, token: String) {
        val size = 500
        val matrix = QRCodeWriter().encode(token, BarcodeFormat.QR_CODE, size, size)
        val colors = IntArray(size * size) { pixel ->
            if (matrix[pixel % size, pixel / size]) Color.BLACK else Color.WHITE
        }
        val bitmap = Bitmap.createBitmap(colors, size, size, Bitmap.Config.ARGB_8888)
        val image = ImageView(ui.activity).apply {
            setImageBitmap(bitmap)
            setPadding(24, 24, 24, 24)
        }
        AlertDialog.Builder(ui.activity)
            .setTitle("Ingresso SECELT")
            .setMessage("${event.optString("title")}\nApresente este QR Code na entrada.")
            .setView(image)
            .setPositiveButton("Concluir", null)
            .show()
    }
}
