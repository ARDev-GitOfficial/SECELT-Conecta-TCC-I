package br.gov.secel.conecta.ui

import android.graphics.Color
import android.text.SpannableString
import android.text.Spanned
import android.text.method.LinkMovementMethod
import android.text.style.URLSpan
import android.widget.TextView
import org.json.JSONObject

internal class PhotoCredits(private val muted: Int, private val brandStrong: Int) {
    fun setGooglePhotoCredit(view: TextView, photo: JSONObject) {
        view.textSize = 9f
        view.setTextColor(muted)
        view.setLinkTextColor(brandStrong)
        view.highlightColor = Color.TRANSPARENT
        view.setPadding(0, (5 * view.resources.displayMetrics.density).toInt(), 0, 0)
        val author = photo.optJSONArray("authorAttributions")?.optJSONObject(0)
        val name = author?.optString("displayName")?.takeIf { it.isNotBlank() }
        val text = if (name == null) "Google Maps" else "Google Maps · $name"
        val span = SpannableString(text)
        val authorUri = author?.optString("uri")?.takeIf { it.isNotBlank() }
        val sourceUrl = photo.optString("sourceUrl").takeIf { it.isNotBlank() }
        val link = authorUri ?: sourceUrl
        if (link != null) span.setSpan(URLSpan(link), if (name != null && authorUri != null) text.indexOf(name) else 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        view.text = span
        view.movementMethod = LinkMovementMethod.getInstance()
    }

    fun localPhotoCredit(path: String): String = when (path.substringAfterLast('/')) {
        "tourism-river.jpg", "tourism-landmark.jpg", "tourism-church-side.jpg", "tourism-externato.jpg" -> "Foto: Guilherme J. Corrêa · CC BY-SA 3.0"
        "tourism-igreja-matriz.jpg" -> "Foto: Vanessa S. Braga · CC BY-SA 4.0"
        else -> "Crédito da imagem indisponível"
    }

    fun setMediaPhotoCredit(view: TextView, photo: JSONObject) {
        view.textSize = 10f
        view.setTextColor(muted)
        view.setLinkTextColor(brandStrong)
        view.highlightColor = Color.TRANSPARENT
        view.setPadding(0, (5 * view.resources.displayMetrics.density).toInt(), 0, (7 * view.resources.displayMetrics.density).toInt())
        val author = photo.optString("author").ifBlank { "Acervo SECELT" }
        val license = photo.optString("licenseName")
        val text = if (license.isBlank()) "Foto: $author" else "Foto: $author · $license"
        val span = SpannableString(text)
        val sourceUrl = photo.optString("sourceUrl")
        val licenseUrl = photo.optString("licenseUrl")
        if (sourceUrl.isNotBlank()) span.setSpan(URLSpan(sourceUrl), 6, 6 + author.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        if (license.isNotBlank() && licenseUrl.isNotBlank()) {
            val start = text.indexOf(license)
            span.setSpan(URLSpan(licenseUrl), start, start + license.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        view.text = span
        view.movementMethod = LinkMovementMethod.getInstance()
    }

    fun setLocalPhotoCredit(view: TextView, path: String) {
        view.textSize = 10f
        view.setTextColor(muted)
        view.setLinkTextColor(brandStrong)
        view.highlightColor = Color.TRANSPARENT
        view.setPadding(0, (5 * view.resources.displayMetrics.density).toInt(), 0, (7 * view.resources.displayMetrics.density).toInt())
        val file = path.substringAfterLast('/')
        val attribution = when (file) {
            "tourism-river.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:P%C3%B4r_do_Sol_em_S%C3%A3o_Miguel_do_Guama_-_panoramio.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "tourism-landmark.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:S%C3%A3o_Miguel_do_Guam%C3%A1_-_State_of_Par%C3%A1,_Brazil_-_panoramio.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "tourism-church-side.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:S%C3%A3o_Miguel_Arcanjo_-_panoramio_-_Guilherme_J._Corr%C3%AAa.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "tourism-externato.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:Tibi_pater_Instiituto_S._Antonio_Maria_Zacaria_S%C3%A3o_Miguel_do_Guama_-_panoramio.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "tourism-igreja-matriz.jpg" -> Triple("Vanessa S. Braga", "https://commons.wikimedia.org/wiki/File:Primeira_igreja_de_S%C3%A3o_Miguel_do_Guam%C3%A1,_ao_p%C3%B4r_do_sol.jpg", "https://creativecommons.org/licenses/by-sa/4.0/")
            else -> null
        }
        if (attribution == null) { view.text = localPhotoCredit(path); return }
        val license = if (file == "tourism-igreja-matriz.jpg") "CC BY-SA 4.0" else "CC BY-SA 3.0"
        val text = "Foto: ${attribution.first} · $license"
        val span = SpannableString(text)
        span.setSpan(URLSpan(attribution.second), 6, 6 + attribution.first.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        val licenseStart = text.indexOf(license)
        span.setSpan(URLSpan(attribution.third), licenseStart, licenseStart + license.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        view.text = span
        view.movementMethod = LinkMovementMethod.getInstance()
    }

}
