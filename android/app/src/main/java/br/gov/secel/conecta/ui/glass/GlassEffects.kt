package br.gov.secel.conecta.ui.glass

import android.animation.Animator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import com.example.liquidglass.GlassAccessibilityMode
import com.example.liquidglass.GlassMaterial
import com.example.liquidglass.LiquidGlassView
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.sin
import kotlin.random.Random

internal class GlassEffects(private val context: Context, private val backdrop: View, private val darkMode: Boolean) {
    private val surfaceAnimators = mutableSetOf<ValueAnimator>()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val glintControllers = mutableSetOf<AmbientGlintController>()
    private val rippleControllers = mutableSetOf<GlassRippleController>()

    private fun dp(value: Float) = (value * context.resources.displayMetrics.density).toInt()

    fun wrap(contentView: View, radiusDp: Float): LiquidGlassView {
        val glass = LiquidGlassView(context).apply {
            clipChildren = true
            clipToPadding = true
            cornerRadius = dp(radiusDp).toFloat()
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    outline.setRoundRect(0, 0, view.width, view.height, dp(radiusDp).toFloat())
                }
            }
            clipToOutline = true
            material = GlassMaterial.REGULAR
            accessibilityMode = GlassAccessibilityMode.FORCE_FULL
            enablePressEffect = false
            enableSensorHighlight = false
            enableAdaptiveTint = true
            enableDynamicBackground = false
            refractionHeight = dp(16f).toFloat()
            bevelWidth = dp(24f).toFloat()
            refractionFalloff = 1.8f
            dispersionStrength = .12f
            blurAmount = .22f
            saturation = 138f
            aberrationIntensity = 1.6f
            displacementScale = 68f
            elasticity = .22f
            enableEdgeHighlight = true
            edgeHighlightOpacity = 76f
            setGlassTint(if (darkMode) Color.rgb(38, 91, 123) else Color.rgb(221, 243, 251), if (darkMode) .18f else .2f)
            backdropSource = backdrop
        }
        val radiusPx = dp(radiusDp).toFloat()
        val glint = AmbientGlintController(glass, radiusPx)
        val ripple = GlassRippleController(glass, contentView, glint, radiusPx)
        val inputHost = GlassTouchHost(context, contentView, ripple::onMotion)
        glass.addView(inputHost, FrameLayout.LayoutParams(-1, -2))
        glass.invalidateOutline()
        return glass
    }

    private fun keepSurfaceAnimator(animator: ValueAnimator) {
        surfaceAnimators.add(animator)
        animator.addListener(object : Animator.AnimatorListener {
            override fun onAnimationStart(animation: Animator) = Unit
            override fun onAnimationEnd(animation: Animator) { surfaceAnimators.remove(animator) }
            override fun onAnimationCancel(animation: Animator) { surfaceAnimators.remove(animator) }
            override fun onAnimationRepeat(animation: Animator) = Unit
        })
    }

    private class GlassTouchHost(
        context: Context,
        contentView: View,
        private val onMotion: (MotionEvent) -> Unit
    ) : FrameLayout(context) {
        init {
            setBackgroundColor(Color.TRANSPARENT)
            isClickable = false
            addView(contentView, LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        }

        override fun dispatchTouchEvent(event: MotionEvent): Boolean {
            onMotion(event)
            return super.dispatchTouchEvent(event) || event.actionMasked == MotionEvent.ACTION_DOWN ||
                event.actionMasked == MotionEvent.ACTION_MOVE || event.actionMasked == MotionEvent.ACTION_UP ||
                event.actionMasked == MotionEvent.ACTION_CANCEL
        }
    }

    private inner class AmbientGlintController(
        private val glass: LiquidGlassView,
        cornerRadius: Float
    ) : View.OnAttachStateChangeListener {
        private val glint = GlassGlintDrawable(cornerRadius, ::dp)
        private var animator: ValueAnimator? = null
        private var pending: Runnable? = null
        private var running = false

        init {
            glass.addOnAttachStateChangeListener(this)
            glass.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
                glint.setBounds(0, 0, glass.width, glass.height)
            }
        }

        override fun onViewAttachedToWindow(view: View) {
            if (running) return
            running = true
            glintControllers.add(this)
            glint.setBounds(0, 0, glass.width, glass.height)
            glass.overlay.add(glint)
            schedule(Random.nextLong(1800L, 5001L))
        }

        override fun onViewDetachedFromWindow(view: View) = stop()

        private fun schedule(delay: Long) {
            pending?.let(mainHandler::removeCallbacks)
            val task = Runnable {
                pending = null
                if (running) glideToNextEdge()
            }
            pending = task
            mainHandler.postDelayed(task, delay)
        }

        private fun cancelMotion() {
            animator?.cancel()
            animator = null
            pending?.let(mainHandler::removeCallbacks)
            pending = null
        }

        private fun glideToNextEdge() {
            val startX = glint.positionX
            val startY = glint.positionY
            val edge = Random.nextInt(4)
            val along = Random.nextFloat() * .68f + .16f
            val endX = when (edge) { 1 -> .92f; 3 -> .08f; else -> along }
            val endY = when (edge) { 0 -> .08f; 2 -> .92f; else -> along }
            val vertical = edge == 1 || edge == 3
            val movement = ValueAnimator.ofFloat(0f, 1f).apply {
                duration = Random.nextLong(4000L, 6001L)
                interpolator = LinearInterpolator()
                addUpdateListener { value ->
                    val fraction = value.animatedValue as Float
                    val alpha = (22f * sin(PI * fraction)).toInt().coerceAtLeast(0)
                    glint.update(
                        startX + (endX - startX) * fraction,
                        startY + (endY - startY) * fraction,
                        alpha,
                        vertical
                    )
                }
            }
            animator = movement
            movement.addListener(object : Animator.AnimatorListener {
                override fun onAnimationStart(animation: Animator) = Unit
                override fun onAnimationEnd(animation: Animator) {
                    if (animator === movement) {
                        animator = null
                        schedule(Random.nextLong(8000L, 12001L))
                    }
                }
                override fun onAnimationCancel(animation: Animator) = Unit
                override fun onAnimationRepeat(animation: Animator) = Unit
            })
            keepSurfaceAnimator(movement)
            movement.start()
        }

        fun touchDown(x: Float, y: Float) {
            if (!running) return
            cancelMotion()
            val startX = glint.positionX
            val startY = glint.positionY
            val endX = (x / max(1, glass.width)).coerceIn(.06f, .94f)
            val endY = (y / max(1, glass.height)).coerceIn(.06f, .94f)
            val vertical = endX < .23f || endX > .77f
            val movement = ValueAnimator.ofFloat(0f, 1f).apply {
                duration = 280L
                interpolator = AccelerateDecelerateInterpolator()
                addUpdateListener { value ->
                    val fraction = value.animatedValue as Float
                    glint.update(startX + (endX - startX) * fraction, startY + (endY - startY) * fraction, 34, vertical)
                }
            }
            animator = movement
            keepSurfaceAnimator(movement)
            movement.start()
        }

        fun drag(x: Float, y: Float) {
            if (!running) return
            val xRatio = (x / max(1, glass.width)).coerceIn(.06f, .94f)
            val yRatio = (y / max(1, glass.height)).coerceIn(.06f, .94f)
            val nextX = glint.positionX * .58f + xRatio * .42f
            val nextY = glint.positionY * .58f + yRatio * .42f
            glint.update(nextX, nextY, 34, nextX < .23f || nextX > .77f)
        }

        fun touchEnd() {
            if (!running) return
            cancelMotion()
            val startAlpha = glint.alphaValue
            val fade = ValueAnimator.ofInt(startAlpha, 0).apply {
                duration = 520L
                interpolator = AccelerateDecelerateInterpolator()
                addUpdateListener { value -> glint.update(glint.positionX, glint.positionY, value.animatedValue as Int, glint.isVertical) }
            }
            animator = fade
            fade.addListener(object : Animator.AnimatorListener {
                override fun onAnimationStart(animation: Animator) = Unit
                override fun onAnimationEnd(animation: Animator) {
                    if (animator === fade) {
                        animator = null
                        schedule(Random.nextLong(8000L, 12001L))
                    }
                }
                override fun onAnimationCancel(animation: Animator) = Unit
                override fun onAnimationRepeat(animation: Animator) = Unit
            })
            keepSurfaceAnimator(fade)
            fade.start()
        }

        fun stop() {
            if (!running) return
            running = false
            cancelMotion()
            glass.overlay.remove(glint)
            glint.update(glint.positionX, glint.positionY, 0, glint.isVertical)
            glintControllers.remove(this)
        }
    }

    private inner class GlassRippleController(
        private val glass: LiquidGlassView,
        private val contentView: View,
        private val glint: AmbientGlintController,
        private val cornerRadius: Float
    ) : View.OnAttachStateChangeListener {
        private var gestureActive = false
        private var rippleAnimator: ValueAnimator? = null
        private var rippleDrawable: GlassWaterRippleDrawable? = null
        private var snapshot: Bitmap? = null
        private var savedAlpha = 1f
        private var generation = 0

        init {
            glass.addOnAttachStateChangeListener(this)
            rippleControllers.add(this)
        }

        fun onMotion(event: MotionEvent) {
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    gestureActive = true
                    startRipple(event.x, event.y)
                    glint.touchDown(event.x, event.y)
                }
                MotionEvent.ACTION_MOVE -> if (gestureActive) glint.drag(event.x, event.y)
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> if (gestureActive) {
                    gestureActive = false
                    glint.touchEnd()
                }
            }
        }

        private fun startRipple(x: Float, y: Float) {
            clearRipple()
            if (glass.width <= 0 || glass.height <= 0 || contentView.width <= 0 || contentView.height <= 0) return
            val image = Bitmap.createBitmap(contentView.width, contentView.height, Bitmap.Config.ARGB_8888)
            contentView.draw(Canvas(image))
            snapshot = image
            savedAlpha = contentView.alpha
            val wave = GlassWaterRippleDrawable(::dp, image, x.coerceIn(0f, glass.width.toFloat()), y.coerceIn(0f, glass.height.toFloat()), cornerRadius)
            wave.setBounds(0, 0, glass.width, glass.height)
            glass.overlay.add(wave)
            rippleDrawable = wave
            val ownGeneration = ++generation
            contentView.post { if (generation == ownGeneration && rippleDrawable === wave) contentView.alpha = 0f }

            val animation = ValueAnimator.ofFloat(0f, 1f).apply {
                duration = 980L
                interpolator = LinearInterpolator()
                addUpdateListener { value ->
                    val progress = value.animatedValue as Float
                    wave.progress = progress
                    val strength = sin(PI * progress).toFloat()
                    if (Build.VERSION.SDK_INT >= 33) glass.refractionHeight = dp(16f).toFloat() + dp(8f).toFloat() * strength
                    else glass.displacementScale = 68f + 30f * strength
                }
            }
            rippleAnimator = animation
            animation.addListener(object : Animator.AnimatorListener {
                override fun onAnimationStart(animation: Animator) = Unit
                override fun onAnimationEnd(animation: Animator) { if (rippleAnimator === animation) finishRipple() }
                override fun onAnimationCancel(animation: Animator) = Unit
                override fun onAnimationRepeat(animation: Animator) = Unit
            })
            keepSurfaceAnimator(animation)
            animation.start()
        }

        private fun finishRipple() {
            rippleAnimator = null
            rippleDrawable?.let(glass.overlay::remove)
            rippleDrawable = null
            contentView.alpha = savedAlpha
            snapshot?.takeUnless { it.isRecycled }?.recycle()
            snapshot = null
            if (Build.VERSION.SDK_INT >= 33) glass.refractionHeight = dp(16f).toFloat() else glass.displacementScale = 68f
        }

        private fun clearRipple() {
            generation++
            val previous = rippleAnimator
            rippleAnimator = null
            previous?.cancel()
            rippleDrawable?.let(glass.overlay::remove)
            rippleDrawable = null
            contentView.alpha = savedAlpha
            snapshot?.takeUnless { it.isRecycled }?.recycle()
            snapshot = null
        }

        fun stop() {
            gestureActive = false
            clearRipple()
            rippleControllers.remove(this)
        }

        override fun onViewAttachedToWindow(view: View) = Unit
        override fun onViewDetachedFromWindow(view: View) = stop()
    }

    fun dispose() {
        glintControllers.toList().forEach { it.stop() }
        rippleControllers.toList().forEach { it.stop() }
        surfaceAnimators.toList().forEach { it.cancel() }
        surfaceAnimators.clear()
    }
}
