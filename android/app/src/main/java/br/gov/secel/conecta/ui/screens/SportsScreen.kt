package br.gov.secel.conecta.ui.screens

import android.app.AlertDialog
import android.graphics.Color
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import br.gov.secel.conecta.data.PortalData
import br.gov.secel.conecta.ui.NewsCards
import br.gov.secel.conecta.ui.PortalDestination
import br.gov.secel.conecta.ui.PortalPhotos
import br.gov.secel.conecta.ui.PortalScreen
import br.gov.secel.conecta.ui.PortalUi
import org.json.JSONArray
import org.json.JSONObject

internal class SportsScreen(
    private val ui: PortalUi,
    private val news: NewsCards,
    private val photos: PortalPhotos,
    private val refresh: () -> Unit
) : PortalScreen {
    override val destination = PortalDestination.SPORTS
    private var selectedCompetitionId = ""

    override fun render(content: LinearLayout, data: PortalData) {
        with(ui) {
            val photo = (0 until data.media.length()).map { data.media.getJSONObject(it) }.firstOrNull { it.optString("id") == "mid-futsal-quadra" }
            if (photo != null) photos.add(content, photo, 0)
            news.add(content, data.news, "Esporte")
            content.addView(label("Competições", 18, ink, true))
            val comps = data.sports.optJSONArray("competitions") ?: JSONArray()
            if (selectedCompetitionId.isBlank()) {
                selectedCompetitionId = comps.optJSONObject(0)?.optString("id").orEmpty()
            }
            val chips = LinearLayout(activity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
            }
            for (i in 0 until comps.length()) {
                val c = comps.getJSONObject(i)
                chips.addView(Button(activity).apply {
                    text = c.optString("name")
                    isAllCaps = false
                    textSize = 10f
                    setTextColor(if (c.optString("id") == selectedCompetitionId) Color.WHITE else brandStrong)
                    background = pill(if (c.optString("id") == selectedCompetitionId) blue else panelColor)
                    setOnClickListener { selectedCompetitionId = c.optString("id")
                        refresh() }
                }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(2), dp(4), dp(2), dp(8)) })
            }
            content.addView(chips)
            val comp = (0 until comps.length()).map { comps.getJSONObject(it) }.firstOrNull { it.optString("id") == selectedCompetitionId }
            val matches = data.sports.optJSONArray("matches") ?: JSONArray()
            val competitionMatches = (0 until matches.length()).mapNotNull { matches.optJSONObject(it) }
                .filter { it.optString("competition") == comp?.optString("name") }
            val nextMatch = competitionMatches.filter { it.optString("status") == "Agendada" }
                .minByOrNull { it.optString("startsAt") }
            val latestResult = competitionMatches.filter { it.optString("status") == "Encerrada" }
                .maxByOrNull { it.optString("startsAt") }
            content.addView(label("PRÓXIMO CONFRONTO", 10, gold, true).apply { setPadding(0, dp(10), 0, dp(2)) })
            if (nextMatch == null) card(content, "Nenhuma partida agendada", "Novos confrontos aparecerão aqui.") {}
            else card(content, nextMatch.optString("homeTeam") + "  ·  VS  ·  " + nextMatch.optString("awayTeam"), nextMatch.optString("startsAt").take(10) + " · " + nextMatch.optString("location")) {}
            content.addView(label("ÚLTIMO RESULTADO", 10, brandStrong, true).apply { setPadding(0, dp(6), 0, dp(2)) })
            if (latestResult == null) card(content, "Nenhum resultado publicado", "Os placares oficiais aparecerão aqui.") {}
            else card(content, latestResult.optString("homeTeam") + "  " + latestResult.optString("homeScore") + " — " + latestResult.optString("awayScore") + "  " + latestResult.optString("awayTeam"), latestResult.optString("startsAt").take(10) + " · " + latestResult.optString("competition")) {}
            content.addView(label(comp?.optString("name") ?: "Tabela de classificação", 17, ink, true))
            content.addView(label("Edição " + (comp?.optInt("edition") ?: "") + " · " + (comp?.optString("status") ?: ""), 10, muted))
            val teams = data.sports.optJSONArray("teams") ?: JSONArray()
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
                card(content, rank.toString().padStart(2, '0') + "   " + t.optString("name"), t.optInt("points").toString() + " pts  ·  " + wins + " $winLabel  ·  saldo " + t.optInt("goalDifference")) { showCompetition(data.sports, selectedCompetitionId, comp?.optString("name") ?: "Equipes") }
                rank++
            }
            content.addView(label("PARTIDAS DA COMPETIÇÃO", 10, gold, true).apply { setPadding(0, dp(10), 0, dp(2)) })
            for (i in 0 until matches.length()) {
                val m = matches.getJSONObject(i)
                if (m.optString("competition") != comp?.optString("name")) continue
                val score = if (m.isNull("homeScore")) "Agendada" else m.optString("homeScore") + " — " + m.optString("awayScore")
                card(content, m.optString("homeTeam") + "  ·  " + score + "  ·  " + m.optString("awayTeam"), m.optString("startsAt").take(10) + " · " + m.optString("location")) {}
            }
        }
    }

    private fun showCompetition(sports: JSONObject, id: String, name: String) {
        with(ui) {
            val teams=sports.optJSONArray("teams")?:JSONArray()
            val members=sports.optJSONArray("members")?:JSONArray()
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
            AlertDialog.Builder(activity).setTitle(name).setMessage(text.toString()).setPositiveButton("Fechar",null).show()
        }
    }
}
