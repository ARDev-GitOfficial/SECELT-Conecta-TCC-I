package br.gov.secel.conecta.ui

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.text.InputType
import android.widget.EditText
import br.gov.secel.conecta.BuildConfig
import java.net.URI

internal class PortalSettings(private val activity: Activity) {
    private val preferences = activity.getSharedPreferences("settings", Context.MODE_PRIVATE)
    val address: String
        get() = preferences.getString("api", null)?.takeIf { it.isNotBlank() } ?: BuildConfig.PORTAL_API_URL

    fun show(reconnect: () -> Unit) {
        val input = EditText(activity).apply {
            setText(address)
            hint = "https://seu-site.netlify.app"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            setSingleLine()
        }
        val dialog = AlertDialog.Builder(activity)
            .setTitle("Conexão do sistema")
            .setMessage("Cole a URL inicial do portal publicado, sem o caminho da página. Para o servidor local, use o IP do computador ou 10.0.2.2 no emulador.")
            .setView(input)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Salvar e reconectar", null)
            .create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val address = input.text.toString().trim().trimEnd('/')
                if (!validOrigin(address)) {
                    input.error = "Informe um endereço HTTP ou HTTPS, sem o caminho da página."
                    return@setOnClickListener
                }
                preferences.edit().putString("api", address).apply()
                dialog.dismiss()
                reconnect()
            }
        }
        dialog.show()
    }

    private fun validOrigin(address: String): Boolean {
        val uri = runCatching { URI(address) }.getOrNull() ?: return false
        return uri.scheme in setOf("http", "https") && uri.host != null && uri.userInfo == null &&
            uri.path.isNullOrEmpty() && uri.query == null && uri.fragment == null
    }
}
