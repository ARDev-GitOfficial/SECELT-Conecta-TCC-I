package br.gov.secel.conecta.web

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

internal class PortalStatusView(context: Context, retry: () -> Unit) : FrameLayout(context) {
    private val progress = ProgressBar(context).apply {
        contentDescription = "Carregando SECELT Conecta"
    }
    private val error = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        val margin = (24 * resources.displayMetrics.density).toInt()
        setPadding(margin, margin, margin, margin)
        accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_POLITE
        addView(TextView(context).apply {
            text = "Não foi possível carregar o portal. Verifique sua conexão e tente novamente."
            textSize = 17f
            gravity = Gravity.CENTER
        })
        addView(Button(context).apply {
            text = "Tentar novamente"
            isAllCaps = false
            setOnClickListener { retry() }
        })
    }

    init {
        setBackgroundColor(Color.BLACK)
        isClickable = true
        addView(progress, LayoutParams(-2, -2, Gravity.CENTER))
        addView(error, LayoutParams(-1, -2, Gravity.CENTER))
        showLoading()
    }

    fun showLoading() {
        visibility = VISIBLE
        progress.visibility = VISIBLE
        error.visibility = GONE
    }

    fun showError() {
        visibility = VISIBLE
        progress.visibility = GONE
        error.visibility = VISIBLE
    }
}
