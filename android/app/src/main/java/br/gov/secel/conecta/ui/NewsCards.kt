package br.gov.secel.conecta.ui

import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.widget.LinearLayout
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject

internal class NewsCards(private val ui: PortalUi) {
    fun show(news: JSONObject) {
        with(ui) {
            val category = news.optString("category", "Publicação SECELT")
            val body = news.optString("body", "Informação publicada pela SECELT.")
            val dialog = AlertDialog.Builder(activity)
                .setTitle(news.optString("title", "Publicação SECELT"))
                .setMessage("$category\n\n$body\n\nAtualizado em ${news.optString("updatedAt", "")}")
                .setPositiveButton("Fechar", null)
            val source = news.optString("sourceUrl")
            if (source.startsWith("https://saomigueldoguama.pa.gov.br/")) {
                dialog.setNeutralButton("Ler na Prefeitura") { _, _ ->
                    try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(source))) }
                    catch (_: ActivityNotFoundException) { Toast.makeText(activity, "Nenhum navegador disponível.", Toast.LENGTH_SHORT).show() }
                }
            }
            dialog.show()
        }
    }

    fun add(content: LinearLayout, news: JSONArray, vararg categories: String) {
        with(ui) {
            val items = (0 until news.length()).map { news.getJSONObject(it) }
                .filter { !it.isNull("sourceUrl") && it.optString("category") in categories }
            if (items.isEmpty()) return
            content.addView(label("Notícias da Prefeitura", 18, ink, true))
            items.forEach { item ->
                card(content, item.optString("title"), item.optString("category") + " · " + item.optString("updatedAt").take(10).split("-").reversed().joinToString("/")) { show(item) }
            }
        }
    }
}
