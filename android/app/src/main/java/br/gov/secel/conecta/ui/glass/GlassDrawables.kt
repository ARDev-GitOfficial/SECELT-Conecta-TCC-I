package br.gov.secel.conecta.ui.glass

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

internal class GlassGlintDrawable(private val cornerRadius: Float, private val dp: (Float) -> Int) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        xfermode = PorterDuffXfermode(PorterDuff.Mode.SCREEN)
    }
    private val clip = Path()
    var positionX = .5f
        private set
    var positionY = .5f
        private set
    var alphaValue = 0
        private set
    var isVertical = false
        private set

    fun update(x: Float, y: Float, alpha: Int, vertical: Boolean) {
        positionX = x.coerceIn(.04f, .96f)
        positionY = y.coerceIn(.04f, .96f)
        alphaValue = alpha.coerceIn(0, 255)
        isVertical = vertical
        invalidateSelf()
    }

    override fun draw(canvas: Canvas) {
        val width = bounds.width().toFloat()
        val height = bounds.height().toFloat()
        if (width <= 0f || height <= 0f || alphaValue == 0) return
        clip.reset()
        clip.addRoundRect(RectF(0f, 0f, width, height), cornerRadius, cornerRadius, Path.Direction.CW)
        val save = canvas.save()
        canvas.clipPath(clip)
        val cx = positionX * width
        val cy = positionY * height
        val radius = max(dp(30f).toFloat(), min(width, height) * .3f)
        paint.shader = RadialGradient(
            cx, cy, radius,
            intArrayOf(Color.argb(238, 246, 252, 255), Color.argb(100, 203, 231, 255), Color.TRANSPARENT),
            floatArrayOf(0f, .43f, 1f), Shader.TileMode.CLAMP
        )
        paint.alpha = alphaValue
        val shape = canvas.save()
        canvas.scale(if (isVertical) .78f else 1.75f, if (isVertical) 1.75f else .78f, cx, cy)
        canvas.drawCircle(cx, cy, radius, paint)
        canvas.restoreToCount(shape)
        paint.shader = null
        canvas.restoreToCount(save)
    }

    override fun setAlpha(alpha: Int) { alphaValue = alpha.coerceIn(0, 255); invalidateSelf() }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter; invalidateSelf() }
    @Deprecated("Deprecated in Java") override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
}

internal class GlassWaterRippleDrawable(
    private val dp: (Float) -> Int,
    private val bitmap: Bitmap,
    private val originX: Float,
    private val originY: Float,
    private val cornerRadius: Float
) : Drawable() {
    private val meshWidth = 14
    private val meshHeight = 14
    private val vertices = FloatArray((meshWidth + 1) * (meshHeight + 1) * 2)
    private val clip = Path()
    private val rect = RectF()
    private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    private val crestPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    var progress = 0f
        set(value) { field = value.coerceIn(0f, 1f); invalidateSelf() }

    override fun draw(canvas: Canvas) {
        val width = bounds.width().toFloat()
        val height = bounds.height().toFloat()
        if (width <= 0f || height <= 0f || bitmap.isRecycled) return
        rect.set(0f, 0f, width, height)
        clip.reset()
        clip.addRoundRect(rect, cornerRadius, cornerRadius, Path.Direction.CW)
        val save = canvas.save()
        canvas.clipPath(clip)

        val frontRadius = hypot(width.toDouble(), height.toDouble()).toFloat() * progress
        val sigma = dp(18f).toFloat().coerceAtLeast(12f)
        val amplitude = dp(6f).toFloat()
        var offset = 0
        for (row in 0..meshHeight) {
            val targetY = row * height / meshHeight
            for (column in 0..meshWidth) {
                val targetX = column * width / meshWidth
                val dx = targetX - originX
                val dy = targetY - originY
                val distance = hypot(dx.toDouble(), dy.toDouble()).toFloat()
                val delta = distance - frontRadius
                val envelope = exp((-(delta * delta) / (2f * sigma * sigma)).toDouble()).toFloat()
                val wave = sin((delta / (sigma * .34f)).toDouble()).toFloat() * envelope * amplitude
                val direction = if (distance > .001f) 1f / distance else 0f
                vertices[offset++] = targetX + dx * direction * wave
                vertices[offset++] = targetY + dy * direction * wave
            }
        }
        canvas.drawBitmapMesh(bitmap, meshWidth, meshHeight, vertices, 0, null, 0, bitmapPaint)

        val edgeFade = if (progress < .72f) 1f else ((1f - progress) / .28f).coerceIn(0f, 1f)
        crestPaint.strokeWidth = dp(1.2f).toFloat()
        crestPaint.color = Color.argb((42f * edgeFade).toInt(), 239, 249, 255)
        canvas.drawCircle(originX, originY, frontRadius, crestPaint)
        crestPaint.strokeWidth = dp(.8f).toFloat()
        crestPaint.color = Color.argb((19f * edgeFade).toInt(), 190, 225, 255)
        canvas.drawCircle(originX, originY, frontRadius * .78f, crestPaint)
        canvas.restoreToCount(save)
    }

    override fun setAlpha(alpha: Int) { bitmapPaint.alpha = alpha; invalidateSelf() }
    override fun setColorFilter(colorFilter: ColorFilter?) { bitmapPaint.colorFilter = colorFilter; invalidateSelf() }
    @Deprecated("Deprecated in Java") override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
}
