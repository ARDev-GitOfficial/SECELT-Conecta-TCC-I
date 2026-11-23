package br.gov.secel.conecta.ui

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import br.gov.secel.conecta.ui.glass.GlassEffects
import br.gov.secel.conecta.ui.glass.WaterBackdropView
import java.net.URLEncoder
import org.json.JSONObject

internal class PortalUi(val activity: Activity) {
    val darkMode = true
    val blue = Color.rgb(20, 115, 184)
    val brandStrong = Color.rgb(108, 206, 241)
    val brandSoft = Color.rgb(30, 65, 46)
    val ink = Color.rgb(231, 242, 249)
    val green = Color.rgb(127, 219, 156)
    val gold = Color.rgb(155, 222, 179)
    val muted = Color.rgb(162, 186, 203)
    val bodyText = Color.rgb(207, 222, 232)
    val pageColor = Color.rgb(7, 9, 8)
    val panelColor = Color.rgb(21, 26, 23)
    private val lineColor = Color.rgb(49, 83, 106)
    val liquidBackdrop = WaterBackdropView(activity, darkMode)
    val glassEffects = GlassEffects(activity, liquidBackdrop, darkMode)

    fun dp(value: Int) = dp(value.toFloat())

    private fun dp(value: Float) = (value * activity.resources.displayMetrics.density).toInt()

    fun margin(left: Int, top: Int, right: Int, bottom: Int) = LinearLayout.LayoutParams(-1, -2).apply {
        setMargins(left, top, right, bottom)
    }

    fun label(text: String, size: Int, color: Int, bold: Boolean = false) = TextView(activity).apply {
        this.text = text
        textSize = size.toFloat()
        setTextColor(color)
        if (bold) typeface = Typeface.DEFAULT_BOLD
        setPadding(0, dp(4), 0, dp(4))
    }

    fun glassSurface(color: Int, radiusDp: Float) = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = dp(radiusDp).toFloat()
        val tinted = if (Color.alpha(color) < 255) color else Color.argb(242, Color.red(color), Color.green(color), Color.blue(color))
        setColor(tinted)
        setStroke(dp(1), 0x554f7892)
    }

    fun pill(color: Int) = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = dp(14).toFloat()
        setColor(color)
        if (color != blue) setStroke(dp(1), lineColor)
    }

    fun card(content: LinearLayout, title: String, subtitle: String, onClick: () -> Unit) {
        val box = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(13), dp(16), dp(13))
            background = glassSurface(panelColor, 16f)
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }
        }
        box.addView(label(title, 16, ink, true))
        box.addView(label(subtitle, 12, muted))
        content.addView(box, margin(0, dp(5), 0, dp(5)))
    }

    fun openMap(point: JSONObject) {
        val latitude = point.optString("latitude")
        val query = if (latitude.isNotBlank() && !point.isNull("latitude")) {
            "$latitude,${point.optString("longitude")}"
        } else {
            "${point.optString("name")}, ${point.optString("address")}, São Miguel do Guamá, PA"
        }
        val placeId = point.optString("placeId")
        val base = "https://www.google.com/maps/search/?api=1&query=${URLEncoder.encode(query, "UTF-8")}"
        val url = if (placeId.isNotBlank()) "$base&query_place_id=${URLEncoder.encode(placeId, "UTF-8")}" else base
        try {
            activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (_: android.content.ActivityNotFoundException) {
            Toast.makeText(activity, "Não há um aplicativo de mapas disponível.", Toast.LENGTH_SHORT).show()
        }
    }
}
