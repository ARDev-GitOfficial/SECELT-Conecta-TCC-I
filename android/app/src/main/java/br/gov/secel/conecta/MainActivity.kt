package br.gov.secel.conecta

import android.app.Activity
import android.app.AlertDialog
import android.animation.ArgbEvaluator
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.content.Intent
import android.net.Uri
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Build
import android.text.SpannableString
import android.text.Spanned
import android.text.method.LinkMovementMethod
import android.text.style.URLSpan
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.widget.*
import org.json.JSONArray
import org.json.JSONObject
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.io.OutputStreamWriter
import java.util.Calendar
import java.util.Locale
import java.text.SimpleDateFormat
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private var darkMode = false
    private val blue get() = if (darkMode) Color.rgb(139, 207, 255) else Color.rgb(13, 91, 166)
    private val brandStrong get() = if (darkMode) Color.rgb(105, 184, 235) else Color.rgb(8, 75, 137)
    private val brandSoft get() = if (darkMode) Color.rgb(23, 56, 79) else Color.rgb(234, 243, 251)
    private val ink get() = if (darkMode) Color.rgb(232, 242, 248) else Color.rgb(25, 54, 75)
    private val green get() = if (darkMode) Color.rgb(135, 223, 160) else Color.rgb(46, 139, 61)
    private val muted get() = if (darkMode) Color.rgb(174, 195, 208) else Color.rgb(83, 108, 126)
    private val bodyText get() = if (darkMode) Color.rgb(207, 222, 232) else Color.rgb(54, 83, 101)
    private val pageColor get() = if (darkMode) Color.rgb(9, 24, 39) else Color.rgb(246, 249, 251)
    private val panelColor get() = if (darkMode) Color.rgb(17, 38, 56) else Color.WHITE
    private val lineColor get() = if (darkMode) Color.rgb(41, 71, 92) else Color.rgb(217, 229, 236)
    private val executor = Executors.newSingleThreadExecutor()
    private lateinit var content: LinearLayout
    private lateinit var pageTitle: TextView
    private lateinit var pageSummary: TextView
    private var page = "Início"
    private var cachedEvents = JSONArray()
    private var cachedSports = JSONObject()
    private var cachedPlaces = JSONArray()
    private var googlePhotosEnabled = false
    private var selectedCompetitionId = ""
    private var calendarMonth = Calendar.getInstance()
    private var selectedDateKey = ""
    private val baseUrl: String get() = getSharedPreferences("settings", MODE_PRIVATE).getString("api", "http://10.0.2.2:4173")!!.trimEnd('/')

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        darkMode = getSharedPreferences("settings", MODE_PRIVATE).getBoolean("dark", false)
        window.statusBarColor = pageColor
        window.navigationBarColor = pageColor
        window.decorView.setBackgroundColor(pageColor)
        window.decorView.systemUiVisibility = if (darkMode) 0 else View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        buildShell()
        loadAll()
    }

    private fun buildShell() {
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(pageColor) }
        val top = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL; setPadding(dp(14), dp(8), dp(14), dp(8)); background = glassSurface(panelColor, 16f); elevation = dp(2).toFloat() }
        val badge = ImageView(this).apply { setImageResource(R.drawable.secelt_mark); contentDescription = "SECELT Conecta" }
        val name = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(10, 0, 0, 0) }
        name.addView(label("SECELT", 14, ink, true)); name.addView(label("CONECTA", 9, muted, true))
        top.addView(badge, LinearLayout.LayoutParams(dp(42), dp(42))); top.addView(name, LinearLayout.LayoutParams(0, -2, 1f))
        val settings = Button(this).apply { text = "⚙"; textSize = 16f; setTextColor(blue); setBackgroundColor(Color.TRANSPARENT); setOnClickListener { apiSettings() } }
        val themeButton = Button(this).apply { text = if (darkMode) "☀" else "◐"; textSize = 17f; contentDescription = if (darkMode) "Ativar tema claro" else "Ativar tema escuro"; setTextColor(blue); setBackgroundColor(Color.TRANSPARENT); setOnClickListener { getSharedPreferences("settings", MODE_PRIVATE).edit().putBoolean("dark", !darkMode).apply(); recreate() } }
        top.addView(themeButton); top.addView(settings); root.addView(top, LinearLayout.LayoutParams(-1, -2).apply { setMargins(dp(12), dp(8), dp(12), dp(8)) })
        val header = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20), dp(18), dp(20), dp(17)); background = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(if (darkMode) Color.rgb(11, 65, 105) else blue, if (darkMode) Color.rgb(9, 43, 70) else Color.rgb(8, 75, 137))).apply { cornerRadius = dp(21).toFloat() }; elevation = dp(4).toFloat() }
        pageTitle = label("Agenda e informações", 21, Color.WHITE, true); header.addView(pageTitle)
        pageSummary = label("Destaques e calendário oficial", 12, Color.rgb(225, 239, 248)); header.addView(pageSummary)
        root.addView(header, LinearLayout.LayoutParams(-1, -2).apply { setMargins(dp(12), 0, dp(12), 0) })
        val scroll = ScrollView(this); content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(16, 18, 16, 24) }; scroll.addView(content); root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        scroll.setOnScrollChangeListener { _, _, y, _, _ ->
            val range = (content.height - scroll.height).coerceAtLeast(1)
            val progress = (y.toFloat() / range).coerceIn(0f, 1f)
            val start = ArgbEvaluator().evaluate(progress, if (darkMode) Color.rgb(11, 65, 105) else Color.rgb(13, 91, 166), if (darkMode) Color.rgb(15, 76, 118) else Color.rgb(17, 105, 174)) as Int
            val end = ArgbEvaluator().evaluate(progress, if (darkMode) Color.rgb(9, 43, 70) else Color.rgb(8, 75, 137), if (darkMode) Color.rgb(10, 52, 80) else Color.rgb(9, 83, 145)) as Int
            header.background = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(start, end)).apply { cornerRadius = dp(26).toFloat() }
        }
        val nav = LinearLayout(this).apply { gravity = Gravity.CENTER; background = glassSurface(panelColor, 20f); elevation = dp(4).toFloat(); setPadding(dp(5), dp(4), dp(5), dp(4)) }
        listOf("Início", "Esporte", "Eventos", "Turismo").forEachIndexed { index, item ->
            val glyph = listOf("⌂", "⚽", "▦", "⌖")[index]
            val selected = item == page
            nav.addView(TextView(this).apply {
                text = "$glyph\n$item"; contentDescription = item; gravity = Gravity.CENTER
                textSize = 10f; maxLines = 2; setTextColor(if (selected) brandStrong else muted)
                isClickable = true; isFocusable = true; setPadding(dp(4), dp(2), dp(4), dp(2))
                background = GradientDrawable().apply { cornerRadius = dp(14).toFloat(); setColor(if (selected) brandSoft else Color.TRANSPARENT) }
                setOnClickListener { page=item; render() }
            }, LinearLayout.LayoutParams(0, dp(50), 1f).apply { setMargins(dp(2), 0, dp(2), 0) })
        }
        root.addView(nav, LinearLayout.LayoutParams(-1, -2).apply { setMargins(dp(12), dp(8), dp(12), dp(8)) })
        root.setOnApplyWindowInsetsListener { view, insets ->
            val topInset = if (Build.VERSION.SDK_INT >= 30) insets.getInsets(WindowInsets.Type.statusBars()).top else insets.systemWindowInsetTop
            val bottomInset = if (Build.VERSION.SDK_INT >= 30) insets.getInsets(WindowInsets.Type.navigationBars()).bottom else insets.systemWindowInsetBottom
            view.setPadding(0, topInset, 0, bottomInset)
            insets
        }
        setContentView(root)
        root.requestApplyInsets()
    }
    private fun loadAll() {
        content.removeAllViews(); content.addView(label("Atualizando informações…", 13, muted))
        executor.execute {
            try {
                cachedEvents = JSONArray(get("/api/events").getJSONArray("items").toString())
                cachedSports = get("/api/sports")
                val tourism = get("/api/tourism")
                cachedPlaces = JSONArray(tourism.getJSONArray("items").toString())
                googlePhotosEnabled = tourism.optBoolean("googlePhotosEnabled", false)
                if (selectedCompetitionId.isBlank()) selectedCompetitionId = cachedSports.optJSONArray("competitions")?.optJSONObject(0)?.optString("id", "") ?: ""
                if (selectedDateKey.isBlank()) selectedDateKey = nextEventDateKey()
                runOnUiThread { render() }
            } catch (e: Exception) { runOnUiThread { showError(e.message ?: "Não foi possível conectar ao sistema.") } }
        }
    }
    private fun get(path: String): JSONObject { val c=URL(baseUrl+path).openConnection() as HttpURLConnection; c.connectTimeout=5000; c.readTimeout=7000; c.requestMethod="GET"; val body=(if(c.responseCode in 200..299)c.inputStream else c.errorStream).bufferedReader().use{it.readText()}; if(c.responseCode !in 200..299)throw Exception("Servidor respondeu ${c.responseCode}"); return JSONObject(body) }
    private fun post(path: String, body: JSONObject): JSONObject { val c=URL(baseUrl+path).openConnection() as HttpURLConnection; c.connectTimeout=5000;c.readTimeout=7000;c.requestMethod="POST";c.doOutput=true;c.setRequestProperty("Content-Type","application/json");OutputStreamWriter(c.outputStream).use{it.write(body.toString())};val text=(if(c.responseCode in 200..299)c.inputStream else c.errorStream).bufferedReader().use{it.readText()};if(c.responseCode !in 200..299)throw Exception(JSONObject(text).optString("error","Falha ao salvar inscrição."));return JSONObject(text) }
    private fun render() {
        content.removeAllViews()
        pageTitle.text = when(page) { "Início" -> "Agenda e informações"; "Esporte" -> "Esporte"; "Eventos" -> "Calendário de eventos"; else -> "Turismo" }
        pageSummary.text = when(page) { "Início" -> "Destaques e calendário oficial"; "Esporte" -> "Competições, equipes e resultados"; "Eventos" -> "Agenda e informações de inscrição"; else -> "Pontos de interesse e acesso ao Maps" }
        when(page) { "Início" -> home(); "Esporte" -> sports(); "Eventos" -> events(); else -> tourism() }
    }

    private fun home() {
        content.addView(label("Agenda, esporte e cultura", 23, ink, true))
        content.addView(label("Consulte informações publicadas pela SECELT.", 13, bodyText))
        val river = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; background = glassSurface(panelColor, 18f); contentDescription = "Rio Guamá ao pôr do sol" }
        content.addView(river, LinearLayout.LayoutParams(-1, dp(178)).apply { setMargins(0, dp(10), 0, dp(2)) })
        val riverCredit = label("", 9, muted)
        content.addView(riverCredit)
        setLocalPhotoCredit(riverCredit, "/assets/tourism-river.jpg")
        loadPhoto("/assets/tourism-river.jpg", river, creditView = riverCredit)
        content.addView(label("PRÓXIMO EVENTO", 10, green, true))
        val next = (0 until cachedEvents.length()).map { cachedEvents.getJSONObject(it) }
            .filter { it.optString("status", "Publicado") == "Publicado" }
            .sortedBy { it.optString("startsAt") }.firstOrNull()
        if (next == null) content.addView(label("Ainda não há eventos publicados.", 12, muted)) else eventCard(next)
        content.addView(label("ACESSE POR TEMA", 10, blue, true).apply { setPadding(0, dp(14), 0, dp(2)) })
        val tiles = listOf("Esporte" to "Competições e resultados", "Eventos" to "Calendário e inscrições", "Turismo" to "Lugares e como chegar")
        tiles.forEach { item -> card(item.first, item.second) { page = item.first; render() } }
    }

    private fun sports() {
        val sportsImage = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; contentDescription = "Campo e arquibancada esportiva" }
        content.addView(sportsImage, LinearLayout.LayoutParams(-1, dp(150)).apply { setMargins(0, 0, 0, dp(4)) })
        val sportsCredit = label("", 9, muted)
        content.addView(sportsCredit)
        setLocalPhotoCredit(sportsCredit, "/assets/sports-field.jpg")
        loadPhoto("/assets/sports-field.jpg", sportsImage, creditView = sportsCredit)
        content.addView(label("Competições", 18, ink, true))
        val comps = cachedSports.optJSONArray("competitions") ?: JSONArray()
        val chips = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        for (i in 0 until comps.length()) {
            val c = comps.getJSONObject(i)
            chips.addView(Button(this).apply {
                text = c.optString("name"); isAllCaps = false; textSize = 10f
                setTextColor(if (c.optString("id") == selectedCompetitionId) Color.WHITE else blue)
                background = pill(if (c.optString("id") == selectedCompetitionId) blue else panelColor)
                setOnClickListener { selectedCompetitionId = c.optString("id"); render() }
            }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(2), dp(4), dp(2), dp(8)) })
        }
        content.addView(chips)
        val comp = (0 until comps.length()).map { comps.getJSONObject(it) }.firstOrNull { it.optString("id") == selectedCompetitionId }
        content.addView(label(comp?.optString("name") ?: "Tabela de classificação", 17, ink, true))
        content.addView(label("Edição " + (comp?.optInt("edition") ?: "") + " · " + (comp?.optString("status") ?: ""), 10, muted))
        val teams = cachedSports.optJSONArray("teams") ?: JSONArray()
        val matches = cachedSports.optJSONArray("matches") ?: JSONArray()
        var rank = 1
        for (i in 0 until teams.length()) {
            val t = teams.getJSONObject(i)
            if (t.optString("competitionId") != selectedCompetitionId) continue
            var wins = 0
            for (j in 0 until matches.length()) {
                val m = matches.getJSONObject(j)
                if (m.optString("status") != "Encerrada") continue
                if (m.optString("homeTeam") == t.optString("name") && m.optInt("homeScore") > m.optInt("awayScore")) wins++
                if (m.optString("awayTeam") == t.optString("name") && m.optInt("awayScore") > m.optInt("homeScore")) wins++
            }
            val winLabel = if (wins == 1) "vitória" else "vitórias"
            card(rank.toString().padStart(2, '0') + "   " + t.optString("name"), t.optInt("points").toString() + " pts  ·  " + wins + " $winLabel  ·  saldo " + t.optInt("goalDifference")) { showCompetition(selectedCompetitionId, comp?.optString("name") ?: "Equipes") }
            rank++
        }
        content.addView(label("PRÓXIMAS PARTIDAS E RESULTADOS", 10, green, true))
        for (i in 0 until matches.length()) {
            val m = matches.getJSONObject(i)
            if (m.optString("competition") != comp?.optString("name")) continue
            val score = if (m.isNull("homeScore")) "Agendada" else m.optString("homeScore") + " — " + m.optString("awayScore")
            card(m.optString("homeTeam") + "  ·  " + score + "  ·  " + m.optString("awayTeam"), m.optString("startsAt").take(10) + " · " + m.optString("location")) {}
        }
    }

    private fun events() {
        val latestUpdate = (0 until cachedEvents.length()).map { cachedEvents.getJSONObject(it).optString("updatedAt") }
            .filter { it.length >= 16 }.maxOrNull()
        val updateLabel = if (latestUpdate == null) "Calendário oficial · aguardando a primeira publicação" else {
            "Calendário atualizado em ${latestUpdate.substring(8, 10)}/${latestUpdate.substring(5, 7)}/${latestUpdate.substring(0, 4)} às ${latestUpdate.substring(11, 16)}"
        }
        content.addView(label(updateLabel, 11, muted).apply {
            setPadding(dp(12), dp(10), dp(12), dp(10))
            background = glassSurface(if (darkMode) Color.rgb(20, 48, 66) else Color.rgb(234, 243, 251), 12f)
        }, margin(0, 0, 0, dp(12)))
        content.addView(label("Selecione uma data", 18, ink, true))
        calendarControl()
        val todays = (0 until cachedEvents.length()).map { cachedEvents.getJSONObject(it) }
            .filter { eventDateKey(it.optString("startsAt")) == selectedDateKey }
            .sortedBy { it.optString("startsAt") }
        content.addView(label("EVENTOS DO DIA · " + selectedDateKey, 10, green, true))
        if (todays.isEmpty()) content.addView(label("Nenhum evento nesta data. Escolha outro dia para consultar a agenda.", 12, muted))
        todays.forEach { eventCard(it) }
        content.addView(label("Eventos encerrados e cancelados continuam disponíveis no histórico.", 10, muted))
    }

    private fun tourism() {
        content.addView(label("Pontos de interesse", 18, ink, true))
        content.addView(label("Fotos locais e acesso rápido à localização.", 12, bodyText))
        for (i in 0 until cachedPlaces.length()) tourismPhotoCard(cachedPlaces.getJSONObject(i), i)
        if (cachedPlaces.length() == 0) content.addView(label("Nenhum ponto turístico publicado.", 12, muted))
    }
    private fun eventDateKey(value: String): String = value.take(10)

    private fun nextEventDateKey(): String {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)
        val next = (0 until cachedEvents.length()).map { cachedEvents.getJSONObject(it) }
            .filter { it.optString("status", "Publicado") == "Publicado" }
            .map { eventDateKey(it.optString("startsAt")) }
            .filter { it >= today }
            .minOrNull() ?: today
        val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(next)
        if (parsed != null) calendarMonth.time = parsed
        return next
    }

    private fun calendarControl() {
        val monthBar = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL; setPadding(dp(8), dp(4), dp(8), dp(4)) }
        val prev = Button(this).apply { text = "‹"; textSize = 22f; setTextColor(blue); setBackgroundColor(Color.TRANSPARENT); contentDescription = "Mês anterior" }
        val next = Button(this).apply { text = "›"; textSize = 22f; setTextColor(blue); setBackgroundColor(Color.TRANSPARENT); contentDescription = "Próximo mês" }
        val monthLabel = SimpleDateFormat("MMMM 'de' yyyy", Locale("pt", "BR")).format(calendarMonth.time)
            .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("pt", "BR")) else it.toString() }
        monthBar.addView(prev, LinearLayout.LayoutParams(dp(48), dp(44)))
        monthBar.addView(label(monthLabel, 16, ink, true), LinearLayout.LayoutParams(0, -2, 1f).apply { gravity = Gravity.CENTER })
        monthBar.addView(next, LinearLayout.LayoutParams(dp(48), dp(44)))
        prev.setOnClickListener { calendarMonth.add(Calendar.MONTH, -1); render() }
        next.setOnClickListener { calendarMonth.add(Calendar.MONTH, 1); render() }
        content.addView(monthBar, margin(0, dp(4), 0, dp(4)))

        val eventDays = (0 until cachedEvents.length()).map { eventDateKey(cachedEvents.getJSONObject(it).optString("startsAt")) }.toSet()
        val weekdayRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        listOf("S", "T", "Q", "Q", "S", "S", "D").forEach { day ->
            weekdayRow.addView(label(day, 10, muted, true).apply { gravity = Gravity.CENTER }, LinearLayout.LayoutParams(0, dp(24), 1f))
        }
        content.addView(weekdayRow)

        val firstDay = (calendarMonth.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, 1) }
        val dayOffset = (firstDay.get(Calendar.DAY_OF_WEEK) + 5) % 7
        val monthLength = calendarMonth.getActualMaximum(Calendar.DAY_OF_MONTH)
        for (week in 0 until 6) {
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
            for (column in 0 until 7) {
                val day = week * 7 + column - dayOffset + 1
                if (day in 1..monthLength) {
                    val date = (calendarMonth.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, day) }
                    val key = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date.time)
                    val hasEvent = key in eventDays
                    val selected = key == selectedDateKey
                    val cellText = if (hasEvent) "$day\n•" else day.toString()
                    val cell = TextView(this).apply {
                        text = cellText; gravity = Gravity.CENTER; textSize = if (hasEvent) 11f else 12f
                        setTextColor(if (selected) Color.WHITE else if (hasEvent) blue else bodyText)
                        background = if (selected) pill(blue) else glassSurface(Color.TRANSPARENT, 12f)
                        isClickable = true
                        contentDescription = SimpleDateFormat("d 'de' MMMM", Locale("pt", "BR")).format(date.time) + if (hasEvent) ", evento" else ""
                        setOnClickListener { selectedDateKey = key; render() }
                    }
                    row.addView(cell, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(2), dp(2), dp(2), dp(2)) })
                } else {
                    row.addView(View(this), LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(2), dp(2), dp(2), dp(2)) })
                }
            }
            content.addView(row)
        }
    }

    private fun eventCard(e: JSONObject) {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; setPadding(dp(12), dp(12), dp(12), dp(12))
            background = glassSurface(panelColor, 18f); elevation = dp(3).toFloat()
            setOnClickListener { eventDetails(e) }
        }
        val image = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; contentDescription = "Imagem de referência do evento" }
        card.addView(image, LinearLayout.LayoutParams(-1, dp(118)))
        val photo = if (e.optString("category") == "Esporte") "/assets/sports-field.jpg" else "/assets/culture-stage.jpg"
        val photoCredit = label("", 8, muted)
        card.addView(photoCredit)
        setLocalPhotoCredit(photoCredit, photo)
        loadPhoto(photo, image, creditView = photoCredit)
        val date = e.optString("startsAt").take(10).split("-")
        card.addView(label("${date.getOrNull(2) ?: ""}/${date.getOrNull(1) ?: ""}  ·  ${e.optString("category").uppercase()}", 10, blue, true).apply { setPadding(0, dp(8), 0, dp(2)) })
        card.addView(label(e.optString("title"), 17, ink, true))
        card.addView(label("${e.optString("startsAt").drop(11).take(5)}  ·  ${e.optString("location")}", 11, bodyText))
        card.addView(label("${e.optString("status", "Publicado")}  ·  ${if (e.optBoolean("isFree")) "Gratuito" else "Pago"}", 10, if (e.optString("status") == "Cancelado") muted else green, true))
        content.addView(card, margin(0, 0, 0, dp(10)))
    }

    private fun tourismPhotoCard(point: JSONObject, index: Int) {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; setPadding(dp(12), dp(12), dp(12), dp(12))
            background = glassSurface(panelColor, 20f); elevation = dp(3).toFloat()
        }
        val image = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; contentDescription = point.optString("name") }
        card.addView(image, LinearLayout.LayoutParams(-1, dp(if (index % 2 == 0) 190 else 158)))
        val credit = label("Foto de referência · carregando…", 9, muted)
        card.addView(credit)
        loadPhoto(point.optString("imageUrl", "/assets/tourism-river.jpg"), image, point.optString("id"), point.optString("placeId"), credit)
        card.addView(label(point.optString("category").uppercase() + "  ·  " + String.format(Locale.US, "%02d", index + 1), 9, blue, true))
        card.addView(label(point.optString("name"), 18, ink, true))
        if (point.optString("description").isNotBlank()) card.addView(label(point.optString("description"), 12, bodyText))
        card.addView(label("⌖  " + point.optString("address", "Endereço não cadastrado"), 11, muted))
        val mapButton = Button(this).apply {
            text = "Abrir no Maps"; isAllCaps = false; textSize = 12f; setTextColor(Color.WHITE)
            background = pill(blue)
            setOnClickListener { openMap(point) }
        }
        card.addView(mapButton, margin(0, dp(8), 0, 0))
        content.addView(card, margin(0, dp(4), 0, dp(12)))
    }

    private fun loadPhoto(path: String, image: ImageView, pointId: String? = null, placeId: String? = null, creditView: TextView? = null) {
        executor.execute {
            var author: String? = null
            var authorUri: String? = null
            var sourceUrl: String? = null
            var bytes: ByteArray? = null
            var googlePhotoLoaded = false
            if (googlePhotosEnabled && !pointId.isNullOrBlank() && !placeId.isNullOrBlank()) {
                try {
                    val visual = get("/api/tourism/$pointId/visual")
                    val photoName = visual.optString("photoName")
                    if (photoName.isNotBlank()) {
                        val encoded = URLEncoder.encode(photoName, "UTF-8")
                        bytes = download("/api/tourism/$pointId/photo?name=$encoded")
                        googlePhotoLoaded = true
                        val attributions = visual.optJSONArray("authorAttributions")
                        if (attributions != null && attributions.length() > 0) {
                            author = attributions.optJSONObject(0)?.optString("displayName")
                            authorUri = attributions.optJSONObject(0)?.optString("uri")
                        }
                        sourceUrl = visual.optString("sourceUrl").takeIf { it.isNotBlank() }
                    }
                } catch (_: Exception) { /* Usa a foto local de reserva. */ }
            }
            if (bytes == null) try { bytes = download(path) } catch (_: Exception) { }
            val bitmap = bytes?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
            runOnUiThread {
                if (bitmap != null && !isFinishing) image.setImageBitmap(bitmap)
                if (creditView != null && !isFinishing) {
                    if (googlePhotoLoaded && !sourceUrl.isNullOrBlank()) {
                        val displayAuthor = author?.takeIf { it.isNotBlank() }
                        val attributionUri = authorUri?.takeIf { it.isNotBlank() }
                        val source = sourceUrl?.takeIf { it.isNotBlank() }
                        val text = if (displayAuthor != null) "Foto: Google Maps · $displayAuthor" else "Foto: Google Maps"
                        val span = SpannableString(text)
                        val link = attributionUri ?: source
                        if (link != null) span.setSpan(URLSpan(link), if (displayAuthor != null && attributionUri != null) text.indexOf(displayAuthor) else 6, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        creditView.text = span
                        creditView.movementMethod = LinkMovementMethod.getInstance()
                    } else {
                        setLocalPhotoCredit(creditView, path)
                    }
                }
            }
        }
    }

    private fun download(path: String): ByteArray {
        val connection = URL(baseUrl + path).openConnection() as HttpURLConnection
        connection.connectTimeout = 6000; connection.readTimeout = 8000; connection.useCaches = false
        return try {
            if (connection.responseCode !in 200..299) throw Exception("Imagem indisponível")
            connection.inputStream.use { it.readBytes() }
        } finally { connection.disconnect() }
    }

    private fun localPhotoCredit(path: String): String = when (path.substringAfterLast('/')) {
        "tourism-river.jpg", "tourism-landmark.jpg", "tourism-church-side.jpg" -> "Foto: Guilherme J. Corrêa · CC BY-SA 3.0"
        "sports-field.jpg" -> "Foto: PattayaPatrol · CC BY-SA 4.0 · referência"
        "culture-stage.jpg" -> "Foto: Roberto de Vasconcelos · CC BY-SA 3.0 · referência"
        else -> "Imagem de referência"
    }

    private fun setLocalPhotoCredit(view: TextView, path: String) {
        view.textSize = 10f
        view.setTextColor(muted)
        view.setLinkTextColor(brandStrong)
        view.highlightColor = Color.TRANSPARENT
        view.setPadding(0, dp(5), 0, dp(7))
        val file = path.substringAfterLast('/')
        val attribution = when (file) {
            "tourism-river.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:P%C3%B4r_do_Sol_em_S%C3%A3o_Miguel_do_Guama_-_panoramio.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "tourism-landmark.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:S%C3%A3o_Miguel_do_Guam%C3%A1_-_State_of_Par%C3%A1,_Brazil_-_panoramio.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "tourism-church-side.jpg" -> Triple("Guilherme J. Corrêa", "https://commons.wikimedia.org/wiki/File:S%C3%A3o_Miguel_Arcanjo_-_panoramio_-_Guilherme_J._Corr%C3%AAa.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            "sports-field.jpg" -> Triple("PattayaPatrol", "https://commons.wikimedia.org/wiki/File:DZ6_2354_Empty_bleachers_and_a_covered_grandstand_overlook_a_quiet_artificial-turf_sports_field_at_dusk.jpg", "https://creativecommons.org/licenses/by-sa/4.0/")
            "culture-stage.jpg" -> Triple("Roberto de Vasconcelos", "https://commons.wikimedia.org/wiki/File:Festival_internacional_de_musica_do_par%C3%A1_-_panoramio.jpg", "https://creativecommons.org/licenses/by-sa/3.0/")
            else -> null
        }
        if (attribution == null) { view.text = localPhotoCredit(path); return }
        val suffix = if (file == "sports-field.jpg" || file == "culture-stage.jpg") " · imagem de referência" else ""
        val license = if (file == "sports-field.jpg") "CC BY-SA 4.0" else "CC BY-SA 3.0"
        val text = "Foto: ${attribution.first} · $license$suffix"
        val span = SpannableString(text)
        span.setSpan(URLSpan(attribution.second), 6, 6 + attribution.first.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        val licenseStart = text.indexOf(license)
        span.setSpan(URLSpan(attribution.third), licenseStart, licenseStart + license.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        view.text = span
        view.movementMethod = LinkMovementMethod.getInstance()
    }

    private fun openMap(point: JSONObject) {
        val query = when {
            !point.optString("latitude").isBlank() && !point.isNull("latitude") -> "${point.optString("latitude")},${point.optString("longitude")}" 
            else -> "${point.optString("name")}, ${point.optString("address")}, São Miguel do Guamá, PA"
        }
        val url = "https://www.google.com/maps/search/?api=1&query=${URLEncoder.encode(query, "UTF-8")}" +
            if (point.optString("placeId").isNotBlank()) "&query_place_id=${URLEncoder.encode(point.optString("placeId"), "UTF-8")}" else ""
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
        catch (_: Exception) { Toast.makeText(this, "Não há um aplicativo de mapas disponível.", Toast.LENGTH_SHORT).show() }
    }

    private fun pill(color: Int) = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE; cornerRadius = dp(14).toFloat(); setColor(color)
        if (color != blue) setStroke(dp(1), lineColor)
    }
    private fun card(title:String,subtitle:String,onClick:()->Unit) {
        val box=LinearLayout(this).apply {
            orientation=LinearLayout.VERTICAL; setPadding(dp(16),dp(13),dp(16),dp(13))
            background=glassSurface(panelColor,16f); elevation=dp(2).toFloat()
            isClickable=true; isFocusable=true; setOnClickListener{onClick()}
        }
        box.addView(label(title,16,ink,true)); box.addView(label(subtitle,12,muted))
        content.addView(box,margin(0,dp(5),0,dp(5)))
    }
    private fun showCompetition(id:String,name:String){
        val teams=cachedSports.optJSONArray("teams")?:JSONArray()
        val members=cachedSports.optJSONArray("members")?:JSONArray()
        val text=StringBuilder("Equipes e participantes\n\n")
        for(i in 0 until teams.length()){
            val t=teams.getJSONObject(i)
            if(t.optString("competitionId")==id){
                text.append("• ${t.optString("name")} · ${t.optString("coach")}\n")
                for(j in 0 until members.length()){
                    val m=members.getJSONObject(j)
                    if(m.optString("teamId")==t.optString("id"))text.append("   ${m.optString("name")} — ${m.optString("role")}\n")
                }
            }
        }
        AlertDialog.Builder(this).setTitle(name).setMessage(text.toString()).setPositiveButton("Fechar",null).show()
    }
    private fun eventDetails(e:JSONObject){
        val msg=buildString {
            appendLine(e.optString("description"));appendLine()
            appendLine("Status: ${e.optString("status", "Publicado")}")
            appendLine("Data: ${e.optString("startsAt").replace('T', ' ').take(16)}")
            appendLine("Local: ${e.optString("location")}")
            appendLine("Faixa etária: ${e.optString("ageRange")}")
            appendLine("Regra de bebida: ${e.optString("drinkRule")}")
            appendLine("Organizador: ${e.optString("organizerType")}")
            append("Ingresso: ${if(e.optBoolean("isFree"))"Gratuito" else "Pago"}")
        }
        val canRegister = e.optString("status", "Publicado") == "Publicado" && e.optBoolean("isFree")
        AlertDialog.Builder(this).setTitle(e.optString("title")).setMessage(msg).setNegativeButton("Fechar",null)
            .setPositiveButton(if(canRegister) "Inscrever-se e gerar QR Code" else "Abrir no Maps") { _, _ ->
                if (canRegister) registrationForm(e) else openMap(JSONObject().put("name", e.optString("title")).put("address", e.optString("location")))
            }.show()
    }
    private fun registrationForm(e:JSONObject){val layout=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(20,4,20,4)};val name=EditText(this).apply{hint="Nome completo"};val email=EditText(this).apply{hint="E-mail";inputType=33};layout.addView(name);layout.addView(email);AlertDialog.Builder(this).setTitle("Inscrição gratuita").setMessage("Informe apenas os dados necessários para gerar seu ingresso.").setView(layout).setNegativeButton("Cancelar",null).setPositiveButton("Gerar ingresso",null).create().also{dialog->dialog.setOnShowListener{dialog.getButton(-1).setOnClickListener{if(name.text.isBlank()||!email.text.contains("@")){Toast.makeText(this,"Preencha nome e e-mail válidos.",Toast.LENGTH_SHORT).show();return@setOnClickListener};executor.execute{try{val result=post("/api/events?id=${e.optString("id")}",JSONObject().put("name",name.text.toString()).put("email",email.text.toString()));runOnUiThread{dialog.dismiss();showTicket(e,result.optString("qrCode"))}}catch(x:Exception){runOnUiThread{Toast.makeText(this,x.message,Toast.LENGTH_LONG).show()}}}}};dialog.show()}}
    private fun showTicket(event:JSONObject,token:String){
        val matrix=QRCodeWriter().encode(token,BarcodeFormat.QR_CODE,500,500)
        val bmp=Bitmap.createBitmap(500,500,Bitmap.Config.ARGB_8888)
        for(x in 0 until 500)for(y in 0 until 500)bmp.setPixel(x,y,if(matrix[x,y])Color.BLACK else Color.WHITE)
        val img=ImageView(this).apply{setImageBitmap(bmp);setPadding(24,24,24,24)}
        AlertDialog.Builder(this).setTitle("Ingresso SECELT").setMessage("${event.optString("title")}\nApresente este QR Code na entrada.").setView(img).setPositiveButton("Concluir",null).show()
    }
    private fun apiSettings(){val input=EditText(this).apply{setText(baseUrl);hint="http://10.0.2.2:4173"};AlertDialog.Builder(this).setTitle("Conexão do sistema").setMessage("No celular físico, informe o IP do computador que está executando a API (ex.: http://192.168.0.20:4173). Em emulador, use 10.0.2.2.").setView(input).setNegativeButton("Cancelar",null).setPositiveButton("Salvar e reconectar"){_,_->getSharedPreferences("settings",MODE_PRIVATE).edit().putString("api",input.text.toString()).apply();loadAll()}.show() }
    private fun label(text: String, size: Int, color: Int, bold: Boolean = false) = TextView(this).apply {
        this.text = text
        textSize = size.toFloat()
        setTextColor(color)
        if (bold) typeface = Typeface.DEFAULT_BOLD
        setPadding(0, dp(4), 0, dp(4))
    }
    private fun glassSurface(color: Int, radiusDp: Float) = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = dp(radiusDp).toFloat()
        setColor(color)
        setStroke(dp(1), lineColor)
    }
    private fun dp(value: Float) = (value * resources.displayMetrics.density).toInt()
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
    private fun showError(message: String) {
        content.removeAllViews()
        content.addView(label("Não foi possível conectar", 19, ink, true))
        content.addView(label("$message\n\nConfira se o servidor está ativo e tente novamente.", 13, bodyText))
        val retry = Button(this).apply {
            text = "Tentar novamente"
            setOnClickListener { loadAll() }
        }
        content.addView(retry)
    }
    private fun LinearLayout.LayoutParams.width(value:Int){width=value}
    private fun LinearLayout.LayoutParams.height(value:Int){height=value}
    private fun margin(l:Int,t:Int,r:Int,b:Int)=LinearLayout.LayoutParams(-1,-2).apply{setMargins(l,t,r,b)}
}





