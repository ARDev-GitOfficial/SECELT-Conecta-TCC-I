package br.gov.secel.conecta.ui.glass

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import android.view.View

internal class WaterBackdropView(context: Context, private val darkMode: Boolean) : View(context) {
    private fun dp(value: Float) = (value * resources.displayMetrics.density).toInt()
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val wave = Path()
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat(); val h = height.toFloat()
        canvas.drawColor(if (darkMode) Color.rgb(7, 9, 8) else Color.rgb(235, 244, 248))
        paint.shader = RadialGradient(w * .08f, h * .16f, h * .66f,
            intArrayOf(if (darkMode) 0x33286a94 else 0x4463b8d9, Color.TRANSPARENT), null, Shader.TileMode.CLAMP)
        canvas.drawCircle(w * .08f, h * .16f, h * .66f, paint)
        paint.shader = RadialGradient(w * .94f, h * .78f, h * .58f,
            intArrayOf(if (darkMode) 0x222a5d7e else 0x3346b89b, Color.TRANSPARENT), null, Shader.TileMode.CLAMP)
        canvas.drawCircle(w * .94f, h * .78f, h * .58f, paint)
        paint.shader = null
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = dp(2f).toFloat()
        paint.color = if (darkMode) 0x1e5a9bc2 else 0x226aaec2
        wave.reset(); wave.moveTo(-w * .1f, h * .32f)
        wave.cubicTo(w * .28f, h * .22f, w * .52f, h * .48f, w * 1.12f, h * .34f)
        canvas.drawPath(wave, paint)
        paint.strokeWidth = dp(1f).toFloat()
        paint.color = if (darkMode) 0x164b7895 else 0x1d55b991
        wave.reset(); wave.moveTo(-w * .08f, h * .7f)
        wave.cubicTo(w * .36f, h * .58f, w * .61f, h * .84f, w * 1.08f, h * .64f)
        canvas.drawPath(wave, paint)
        paint.style = Paint.Style.FILL
    }
}
