package br.gov.secel.conecta.ui

import android.animation.ArgbEvaluator
import android.content.res.ColorStateList
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.Gravity
import android.view.WindowInsets
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

internal class PortalShell(
    private val ui: PortalUi,
    private val navigate: (PortalDestination) -> Unit,
    private val openSettings: () -> Unit
) {
    val content = LinearLayout(ui.activity).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(16, 18, 16, 24)
    }
    private val scroll = ScrollView(ui.activity).apply { addView(content) }
    private val pageTitle = ui.label("", 21, Color.WHITE, true)
    private val pageSummary = ui.label("", 12, Color.rgb(225, 239, 248))
    private val tabs = mutableMapOf<PortalDestination, NavigationTab>()

    fun attach(initial: PortalDestination) = with(ui) {
        val shell = FrameLayout(activity).apply { setBackgroundColor(pageColor) }
        shell.addView(liquidBackdrop, FrameLayout.LayoutParams(-1, -1))
        val root = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL }
        shell.addView(root, FrameLayout.LayoutParams(-1, -1))
        root.addView(topBar(), margin(dp(12), dp(8), dp(12), dp(8)))
        root.addView(header(), margin(dp(12), 0, dp(12), 0))
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(navigationBar(), margin(dp(12), dp(8), dp(12), dp(8)))

        shell.setOnApplyWindowInsetsListener { view, insets ->
            if (Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                view.setPadding(0, bars.top, 0, bars.bottom)
            } else {
                view.setPadding(0, insets.systemWindowInsetTop, 0, insets.systemWindowInsetBottom)
            }
            insets
        }
        activity.window.apply {
            statusBarColor = pageColor
            navigationBarColor = pageColor
            decorView.setBackgroundColor(pageColor)
            decorView.systemUiVisibility = 0
        }
        activity.setContentView(shell)
        shell.requestApplyInsets()
        select(initial)
    }

    fun select(destination: PortalDestination) = with(ui) {
        pageTitle.text = destination.title
        pageSummary.text = destination.summary
        tabs.forEach { (candidate, tab) ->
            val selected = candidate == destination
            val textColor = if (selected) brandStrong else muted
            tab.view.background = GradientDrawable().apply {
                cornerRadius = dp(14).toFloat()
                setColor(if (selected) brandSoft else Color.TRANSPARENT)
            }
            tab.view.isSelected = selected
            tab.icon.imageTintList = ColorStateList.valueOf(textColor)
            tab.text.setTextColor(textColor)
            tab.text.typeface = if (selected) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
        }
    }

    fun resetScroll() {
        scroll.post { scroll.scrollTo(0, 0) }
    }

    fun showLoading() = with(ui) {
        content.removeAllViews()
        content.addView(label("Atualizando informações…", 13, muted))
    }

    fun showConnectionError(message: String, retry: () -> Unit) = with(ui) {
        content.removeAllViews()
        content.addView(label("Não foi possível conectar", 19, ink, true))
        content.addView(label("$message\n\nConfira o endereço do portal na engrenagem acima e tente novamente.", 13, bodyText))
        content.addView(Button(activity).apply {
            text = "Tentar novamente"
            setOnClickListener { retry() }
        })
    }

    private fun topBar() = with(ui) {
        val bar = LinearLayout(activity).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(14), dp(8), dp(14), dp(8))
        }
        val badge = ImageView(activity).apply {
            activity.assets.open("prefeitura-guama.png").use { setImageBitmap(BitmapFactory.decodeStream(it)) }
            contentDescription = "Prefeitura de São Miguel do Guamá"
        }
        val name = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(10, 0, 0, 0)
            addView(label("SECELT", 14, ink, true))
            addView(label("CONECTA", 9, muted, true))
        }
        val settings = Button(activity).apply {
            text = "⚙"
            textSize = 16f
            contentDescription = "Configurar conexão"
            setTextColor(brandStrong)
            setBackgroundColor(Color.TRANSPARENT)
            setOnClickListener { openSettings() }
        }
        bar.addView(badge, LinearLayout.LayoutParams(dp(54), dp(54)))
        bar.addView(name, LinearLayout.LayoutParams(0, -2, 1f))
        bar.addView(settings)
        glassEffects.wrap(bar, 16f)
    }

    private fun header() = with(ui) {
        val evaluator = ArgbEvaluator()
        fun gradient(progress: Float, radius: Int): GradientDrawable {
            val start = evaluator.evaluate(progress, Color.rgb(22, 56, 39), Color.rgb(24, 68, 98)) as Int
            val end = evaluator.evaluate(progress, Color.rgb(14, 27, 26), Color.rgb(13, 43, 65)) as Int
            return GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(start, end)).apply {
                cornerRadius = dp(radius).toFloat()
            }
        }
        val header = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(18), dp(20), dp(17))
            background = gradient(0f, 21)
            elevation = dp(4).toFloat()
            addView(pageTitle)
            addView(pageSummary)
        }
        scroll.setOnScrollChangeListener { _, _, y, _, _ ->
            val range = (content.height - scroll.height).coerceAtLeast(1)
            header.background = gradient((y.toFloat() / range).coerceIn(0f, 1f), 26)
        }
        header
    }

    private fun navigationBar() = with(ui) {
        val navigation = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(5), dp(4), dp(5), dp(4))
        }
        PortalDestination.entries.forEach { destination ->
            val item = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                contentDescription = destination.label
                isClickable = true
                isFocusable = true
                setPadding(dp(4), dp(4), dp(4), dp(4))
                setOnClickListener { navigate(destination) }
            }
            val icon = ImageView(activity).apply { setImageResource(destination.icon) }
            val title = label(destination.label, 10, muted)
            item.addView(icon, LinearLayout.LayoutParams(dp(18), dp(18)))
            item.addView(title)
            tabs[destination] = NavigationTab(item, icon, title)
            navigation.addView(item, LinearLayout.LayoutParams(0, dp(52), 1f).apply {
                setMargins(dp(2), 0, dp(2), 0)
            })
        }
        glassEffects.wrap(navigation, 20f)
    }

    private data class NavigationTab(val view: LinearLayout, val icon: ImageView, val text: TextView)
}
