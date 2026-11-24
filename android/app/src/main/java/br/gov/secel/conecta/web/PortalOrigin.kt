package br.gov.secel.conecta.web

import android.net.Uri
import java.net.URI

internal class PortalOrigin(address: String) {
    private val portal = URI(address)
    val entry = "$address/#/feed"

    fun contains(url: Uri): Boolean {
        val candidate = parse(url) ?: return false
        return portal.scheme.equals(candidate.scheme, ignoreCase = true) &&
            portal.host.equals(candidate.host, ignoreCase = true) &&
            port(portal) == port(candidate)
    }

    fun isHttps(url: Uri): Boolean = parse(url)?.scheme.equals("https", ignoreCase = true)

    private fun parse(url: Uri): URI? = runCatching { URI(url.toString()) }.getOrNull()
        ?.takeIf { it.host != null && it.rawUserInfo == null && it.port != 0 && it.port <= 65535 }

    private fun port(uri: URI): Int = when {
        uri.port != -1 -> uri.port
        uri.scheme.equals("https", ignoreCase = true) -> 443
        else -> 80
    }
}
