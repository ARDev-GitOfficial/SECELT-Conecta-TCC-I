package br.gov.secel.conecta

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import br.gov.secel.conecta.web.PortalOrigin
import br.gov.secel.conecta.web.PortalStatusView
import br.gov.secel.conecta.web.PortalWebClient

class MainActivity : Activity() {
    private val origin = PortalOrigin(BuildConfig.PORTAL_URL)
    private lateinit var root: FrameLayout
    private lateinit var status: PortalStatusView
    private var webView: WebView? = null
    private var lastUrl = origin.entry
    private var failed = false
    private var backCallback: OnBackInvokedCallback? = null

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        status = PortalStatusView(this) { load(lastUrl) }
        root = FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            addView(status, FrameLayout.LayoutParams(-1, -1))
        }
        setContentView(root)
        applyWindowInsets()
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = OnBackInvokedCallback(::goBack).also {
                onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, it)
            }
        }
        val restoredUrl = state?.getString("portalUrl")?.takeIf { origin.contains(Uri.parse(it)) }
        load(restoredUrl ?: origin.entry)
    }

    private fun applyWindowInsets() {
        if (Build.VERSION.SDK_INT < 30) return
        window.setDecorFitsSystemWindows(false)
        root.setOnApplyWindowInsetsListener { view, insets ->
            val type = WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout() or WindowInsets.Type.ime()
            val padding = insets.getInsets(type)
            view.setPadding(padding.left, padding.top, padding.right, padding.bottom)
            WindowInsets.CONSUMED
        }
        root.requestApplyInsets()
    }

    @Suppress("SetJavaScriptEnabled")
    private fun createWebView() = WebView(this).apply {
        setBackgroundColor(Color.BLACK)
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            userAgentString += " SECELTConectaAndroid"
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, false)
        webChromeClient = WebChromeClient()
        webViewClient = PortalWebClient(origin, ::showLoading, ::showReady, ::showError, ::onRendererGone, ::openExternal)
        setDownloadListener { url, _, _, _, _ ->
            val download = Uri.parse(url)
            if (origin.contains(download) && download.path == "/downloads/SECELT-Conecta-demo.apk") {
                openExternal(download)
            }
        }
    }

    private fun load(url: String) {
        showLoading(url)
        val view = webView ?: try {
            createWebView().also {
                root.addView(it, 0, FrameLayout.LayoutParams(-1, -1))
                webView = it
            }
        } catch (_: RuntimeException) {
            showError()
            return
        }
        view.loadUrl(url)
    }

    private fun showLoading(url: String) {
        lastUrl = url
        failed = false
        webView?.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        status.showLoading()
    }

    private fun showReady() {
        if (failed) return
        webView?.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_AUTO
        status.visibility = View.GONE
    }

    private fun showError() {
        failed = true
        webView?.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        status.showError()
    }

    private fun openExternal(url: Uri) {
        val intent = Intent(Intent.ACTION_VIEW, url).addCategory(Intent.CATEGORY_BROWSABLE)
        try {
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, "Nenhum navegador disponível.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun onRendererGone(view: WebView) {
        destroyWebView(view)
        showError()
    }

    private fun destroyWebView(view: WebView) {
        root.removeView(view)
        view.destroy()
        if (webView == view) webView = null
    }

    private fun goBack() {
        val view = webView
        if (view?.canGoBack() == true) view.goBack() else finish()
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() = goBack()

    override fun onSaveInstanceState(state: Bundle) {
        super.onSaveInstanceState(state)
        val current = webView?.url?.takeIf { origin.contains(Uri.parse(it)) }
        state.putString("portalUrl", current ?: lastUrl)
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback?.let(onBackInvokedDispatcher::unregisterOnBackInvokedCallback)
        }
        webView?.let(::destroyWebView)
        super.onDestroy()
    }
}
