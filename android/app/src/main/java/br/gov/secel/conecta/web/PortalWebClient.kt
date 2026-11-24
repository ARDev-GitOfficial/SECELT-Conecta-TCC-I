package br.gov.secel.conecta.web

import android.graphics.Bitmap
import android.net.Uri
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.ByteArrayInputStream

internal class PortalWebClient(
    private val origin: PortalOrigin,
    private val onLoading: (String) -> Unit,
    private val onReady: () -> Unit,
    private val onError: () -> Unit,
    private val onRendererGone: (WebView) -> Unit,
    private val openExternal: (Uri) -> Unit
) : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url
        if (origin.contains(url)) return false
        if (request.isForMainFrame && request.hasGesture() && origin.isHttps(url)) {
            openExternal(url)
        }
        return true
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        if (!request.isForMainFrame || origin.contains(request.url)) return null
        return WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
    }

    override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
        if (origin.contains(Uri.parse(url))) {
            onLoading(url)
        } else {
            view.stopLoading()
            onError()
        }
    }

    override fun onPageCommitVisible(view: WebView, url: String) {
        if (origin.contains(Uri.parse(url))) onReady()
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        if (request.isForMainFrame) onError()
    }

    override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, error: WebResourceResponse) {
        if (request.isForMainFrame) onError()
    }

    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        onRendererGone(view)
        return true
    }
}
