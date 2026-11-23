package br.gov.secel.conecta.ui.screens

import android.graphics.Color
import android.graphics.Outline
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import br.gov.secel.conecta.data.PortalData
import br.gov.secel.conecta.ui.EventCards
import br.gov.secel.conecta.ui.NewsCards
import br.gov.secel.conecta.ui.PortalDestination
import br.gov.secel.conecta.ui.PortalPhotos
import br.gov.secel.conecta.ui.PortalScreen
import br.gov.secel.conecta.ui.PortalUi
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import org.json.JSONArray

internal class HomeScreen(
    private val ui: PortalUi,
    private val news: NewsCards,
    private val events: EventCards,
    private val photos: PortalPhotos,
    private val navigate: (PortalDestination) -> Unit
) : PortalScreen {
    override val destination = PortalDestination.HOME

    override fun render(content: LinearLayout, data: PortalData) {
        with(ui) {
            content.addView(label("Agenda, esporte e cultura", 22, ink, true))
            content.addView(label("SECELT Conecta", 13, bodyText))

            val hero = FrameLayout(activity).apply {
                background = glassSurface(panelColor, 20f)
                clipToOutline = true
                outlineProvider = object : ViewOutlineProvider() {
                    override fun getOutline(view: View, outline: Outline) { outline.setRoundRect(0, 0, view.width, view.height, dp(20).toFloat()) }
                }
            }
            val river = ImageView(activity).apply {
                scaleType = ImageView.ScaleType.CENTER_CROP
                contentDescription = "Rio Guamá ao pôr do sol"
            }
            hero.addView(river, FrameLayout.LayoutParams(-1, -1))
            hero.addView(View(activity).apply {
                background = GradientDrawable(GradientDrawable.Orientation.BOTTOM_TOP, intArrayOf(Color.argb(230, 8, 21, 34), Color.argb(154, 8, 21, 34), Color.TRANSPARENT))
            }, FrameLayout.LayoutParams(-1, -1))
            val latestNews = (0 until data.news.length()).mapNotNull { data.news.optJSONObject(it) }
                .sortedByDescending { it.optString("updatedAt", it.optString("createdAt")) }.firstOrNull()
            val storyContent = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(16), dp(14), dp(16), dp(14))
                setBackgroundColor(Color.TRANSPARENT)
                isClickable = true
                isFocusable = true
                contentDescription = latestNews?.optString("title") ?: "Publicação mais recente da SECELT"
                setOnClickListener { latestNews?.let { news.show(it) } ?: run { navigate(PortalDestination.EVENTS) } }
            }
            storyContent.addView(label(if (latestNews != null) "PUBLICAÇÃO MAIS RECENTE" else "SECELT CONECTA", 10, gold, true))
            storyContent.addView(label(latestNews?.optString("category", "Agenda") ?: "Informação pública", 10, brandStrong, true))
            storyContent.addView(label(latestNews?.optString("title") ?: "Agenda e vida pública em um lugar.", 20, Color.WHITE, true))
            val storyBody = latestNews?.optString("body")?.takeIf { it.isNotBlank() }
                ?: "Consulte eventos, esporte e pontos turísticos de São Miguel do Guamá."
            storyContent.addView(label(storyBody.take(150) + if (storyBody.length > 150) "…" else "", 12, Color.rgb(226, 236, 242)))
            val storyGlass = glassEffects.wrap(storyContent, 18f)
            hero.addView(storyGlass, FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM).apply {
                setMargins(dp(11), 0, dp(11), dp(12))
            })
            content.addView(hero, LinearLayout.LayoutParams(-1, dp(280)).apply { setMargins(0, dp(14), 0, dp(4)) })
            val riverCredit = label("", 9, muted)
            content.addView(riverCredit)
            photos.load("/assets/tourism-river.jpg", river, creditView = riverCredit)

            content.addView(label("DESTAQUES", 10, gold, true).apply { setPadding(0, dp(16), 0, dp(4)) })
            val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)
            val next = (0 until data.events.length()).mapNotNull { data.events.optJSONObject(it) }
                .filter { it.optString("status", "Publicado") == "Publicado" && it.optString("startsAt").take(10) >= today }
                .sortedBy { it.optString("startsAt") }.firstOrNull()
            content.addView(label("PRÓXIMO EVENTO", 10, brandStrong, true))
            if (next == null) card(content, "Ainda não há eventos futuros", "Os próximos eventos publicados aparecerão aqui.") { navigate(PortalDestination.EVENTS) }
            else events.add(content, next, data.readOnly)

            val sportsMatches = data.sports.optJSONArray("matches") ?: JSONArray()
            val latestResult = (0 until sportsMatches.length()).mapNotNull { sportsMatches.optJSONObject(it) }
                .filter { it.optString("status") == "Encerrada" }
                .sortedByDescending { it.optString("startsAt") }.firstOrNull()
            content.addView(label("RESULTADO MAIS RECENTE", 10, brandStrong, true).apply { setPadding(0, dp(8), 0, dp(1)) })
            if (latestResult == null) card(content, "Nenhum resultado publicado", "Os placares oficiais aparecerão aqui.") { navigate(PortalDestination.SPORTS) }
            else card(content,
                latestResult.optString("homeTeam") + "   " + latestResult.optString("homeScore") + " — " + latestResult.optString("awayScore") + "   " + latestResult.optString("awayTeam"),
                latestResult.optString("startsAt").take(10) + " · " + latestResult.optString("competition", "Resultado oficial")
            ) { navigate(PortalDestination.SPORTS) }

            content.addView(label("ACESSE POR TEMA", 10, gold, true).apply { setPadding(0, dp(14), 0, dp(2)) })
            val tiles = listOf(
                PortalDestination.SPORTS to "Competições e resultados",
                PortalDestination.EVENTS to "Calendário e inscrições",
                PortalDestination.TOURISM to "Lugares e como chegar"
            )
            tiles.forEach { item -> card(content, item.first.label, item.second) { navigate(item.first) } }
        }
    }
}
