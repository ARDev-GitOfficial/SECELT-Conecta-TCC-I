package br.gov.secel.conecta.ui

import android.widget.LinearLayout
import br.gov.secel.conecta.R
import br.gov.secel.conecta.data.PortalData

internal enum class PortalDestination(val label: String, val title: String, val summary: String, val icon: Int) {
    HOME("Início", "Agenda e informações", "Destaques e calendário oficial", R.drawable.ic_home),
    SPORTS("Esporte", "Esporte", "Competições, equipes e resultados", R.drawable.ic_trophy),
    EVENTS("Eventos", "Calendário de eventos", "Agenda e informações de inscrição", R.drawable.ic_calendar),
    TOURISM("Turismo", "Turismo", "Pontos de interesse e acesso ao Maps", R.drawable.ic_map_pin)
}

internal interface PortalScreen {
    val destination: PortalDestination
    fun render(content: LinearLayout, data: PortalData)
}
