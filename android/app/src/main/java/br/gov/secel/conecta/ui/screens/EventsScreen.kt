package br.gov.secel.conecta.ui.screens

import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import br.gov.secel.conecta.data.PortalData
import br.gov.secel.conecta.ui.EventCards
import br.gov.secel.conecta.ui.NewsCards
import br.gov.secel.conecta.ui.PortalDestination
import br.gov.secel.conecta.ui.PortalScreen
import br.gov.secel.conecta.ui.PortalUi
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import org.json.JSONArray

internal class EventsScreen(
    private val ui: PortalUi,
    private val news: NewsCards,
    private val cards: EventCards,
    private val refresh: () -> Unit
) : PortalScreen {
    override val destination = PortalDestination.EVENTS
    private val calendarMonth = Calendar.getInstance()
    private var selectedDateKey = ""

    override fun render(content: LinearLayout, data: PortalData) {
        with(ui) {
            if (selectedDateKey.isBlank()) selectedDateKey = nextEventDateKey(data.events)
            news.add(content, data.news, "Cultura")
            val latestUpdate = (0 until data.events.length()).map { data.events.getJSONObject(it).optString("updatedAt") }
                .filter { it.length >= 16 }.maxOrNull()
            val updateLabel = if (latestUpdate == null) "Calendário oficial · aguardando a primeira publicação" else {
                "Calendário atualizado em ${latestUpdate.substring(8, 10)}/${latestUpdate.substring(5, 7)}/${latestUpdate.substring(0, 4)} às ${latestUpdate.substring(11, 16)}"
            }
            content.addView(label(updateLabel, 11, muted).apply {
                setPadding(dp(12), dp(10), dp(12), dp(10))
                background = glassSurface(if (darkMode) Color.rgb(20, 48, 66) else Color.rgb(234, 243, 251), 12f)
            }, margin(0, 0, 0, dp(12)))
            content.addView(label("Selecione uma data", 18, ink, true))
            calendarControl(content, data.events)
            val todays = (0 until data.events.length()).map { data.events.getJSONObject(it) }
                .filter { eventDateKey(it.optString("startsAt")) == selectedDateKey }
                .sortedBy { it.optString("startsAt") }
            content.addView(label("EVENTOS DO DIA · " + selectedDateKey, 10, green, true))
            if (todays.isEmpty()) content.addView(label("Nenhum evento nesta data. Escolha outro dia para consultar a agenda.", 12, muted))
            todays.forEach { cards.add(content, it, data.readOnly) }
            content.addView(label("Eventos encerrados e cancelados continuam disponíveis no histórico.", 10, muted))
        }
    }

    private fun eventDateKey(value: String): String = value.take(10)

    private fun nextEventDateKey(events: JSONArray): String {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)
        val next = (0 until events.length()).map { events.getJSONObject(it) }
            .filter { it.optString("status", "Publicado") == "Publicado" }
            .map { eventDateKey(it.optString("startsAt")) }
            .filter { it >= today }
            .minOrNull() ?: today
        val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(next)
        if (parsed != null) calendarMonth.time = parsed
        return next
    }

    private fun calendarControl(content: LinearLayout, events: JSONArray) {
        with(ui) {
            val monthBar = LinearLayout(activity).apply {
                gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(8), dp(4), dp(8), dp(4))
            }
            val prev = Button(activity).apply {
                text = "‹"
                textSize = 22f
                setTextColor(brandStrong)
                setBackgroundColor(Color.TRANSPARENT)
                contentDescription = "Mês anterior"
            }
            val next = Button(activity).apply {
                text = "›"
                textSize = 22f
                setTextColor(brandStrong)
                setBackgroundColor(Color.TRANSPARENT)
                contentDescription = "Próximo mês"
            }
            val monthLabel = SimpleDateFormat("MMMM 'de' yyyy", Locale("pt", "BR")).format(calendarMonth.time)
                .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("pt", "BR")) else it.toString() }
            monthBar.addView(prev, LinearLayout.LayoutParams(dp(48), dp(44)))
            monthBar.addView(label(monthLabel, 16, ink, true), LinearLayout.LayoutParams(0, -2, 1f).apply { gravity = Gravity.CENTER })
            monthBar.addView(next, LinearLayout.LayoutParams(dp(48), dp(44)))
            prev.setOnClickListener {
                calendarMonth.add(Calendar.MONTH, -1)
                refresh()
            }
            next.setOnClickListener {
                calendarMonth.add(Calendar.MONTH, 1)
                refresh()
            }
            content.addView(monthBar, margin(0, dp(4), 0, dp(4)))

            val eventDays = (0 until events.length()).map { eventDateKey(events.getJSONObject(it).optString("startsAt")) }.toSet()
            val weekdayRow = LinearLayout(activity).apply { orientation = LinearLayout.HORIZONTAL }
            listOf("SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM").forEach { day ->
                weekdayRow.addView(label(day, 9, muted, true).apply { gravity = Gravity.CENTER }, LinearLayout.LayoutParams(0, dp(24), 1f))
            }
            content.addView(weekdayRow)

            val firstDay = (calendarMonth.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, 1) }
            val dayOffset = (firstDay.get(Calendar.DAY_OF_WEEK) + 5) % 7
            val monthLength = calendarMonth.getActualMaximum(Calendar.DAY_OF_MONTH)
            for (week in 0 until 6) {
                val row = LinearLayout(activity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER
                }
                for (column in 0 until 7) {
                    val day = week * 7 + column - dayOffset + 1
                    if (day in 1..monthLength) {
                        val date = (calendarMonth.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, day) }
                        val key = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date.time)
                        val hasEvent = key in eventDays
                        val selected = key == selectedDateKey
                        val cellText = if (hasEvent) "$day\n•" else day.toString()
                        val cell = TextView(activity).apply {
                            text = cellText
                            gravity = Gravity.CENTER
                            textSize = if (hasEvent) 11f else 12f
                            setTextColor(if (selected) Color.WHITE else if (hasEvent) brandStrong else bodyText)
                            background = if (selected) pill(blue) else glassSurface(Color.TRANSPARENT, 12f)
                            isClickable = true
                            contentDescription = SimpleDateFormat("d 'de' MMMM", Locale("pt", "BR")).format(date.time) + if (hasEvent) ", evento" else ""
                            setOnClickListener {
                                selectedDateKey = key
                                refresh()
                            }
                        }
                        row.addView(cell, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(2), dp(2), dp(2), dp(2)) })
                    } else {
                        row.addView(View(activity), LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(2), dp(2), dp(2), dp(2)) })
                    }
                }
                content.addView(row)
            }
        }
    }
}
