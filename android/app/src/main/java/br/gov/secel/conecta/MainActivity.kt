package br.gov.secel.conecta

import android.app.Activity
import android.os.Bundle
import br.gov.secel.conecta.data.PortalApi
import br.gov.secel.conecta.data.PortalData
import br.gov.secel.conecta.ui.EventCards
import br.gov.secel.conecta.ui.NewsCards
import br.gov.secel.conecta.ui.PortalDestination
import br.gov.secel.conecta.ui.PortalPhotos
import br.gov.secel.conecta.ui.PortalScreen
import br.gov.secel.conecta.ui.PortalSettings
import br.gov.secel.conecta.ui.PortalShell
import br.gov.secel.conecta.ui.PortalUi
import br.gov.secel.conecta.ui.screens.EventsScreen
import br.gov.secel.conecta.ui.screens.HomeScreen
import br.gov.secel.conecta.ui.screens.SportsScreen
import br.gov.secel.conecta.ui.screens.TourismScreen
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val executor = Executors.newSingleThreadExecutor()
    private val settings by lazy { PortalSettings(this) }
    private val api = PortalApi { settings.address }
    private lateinit var ui: PortalUi
    private lateinit var shell: PortalShell
    private lateinit var screens: Map<PortalDestination, PortalScreen>
    private var destination = PortalDestination.HOME
    private var data: PortalData? = null
    private var loadGeneration = 0
    private var loading = false

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        ui = PortalUi(this)
        val news = NewsCards(ui)
        val photos = PortalPhotos(ui, api, executor)
        val events = EventCards(ui, photos, api, executor)
        screens = listOf(
            HomeScreen(ui, news, events, photos, ::navigate),
            SportsScreen(ui, news, photos, ::render),
            EventsScreen(ui, news, events, ::render),
            TourismScreen(ui, news, photos)
        ).associateBy { it.destination }
        shell = PortalShell(ui, ::navigate) { settings.show(::load) }
        shell.attach(destination)
        load()
    }

    private fun navigate(next: PortalDestination) {
        val changed = next != destination
        destination = next
        shell.select(next)
        if (!loading) render()
        if (changed) shell.resetScroll()
    }

    private fun render() {
        val loaded = data ?: return
        shell.content.removeAllViews()
        screens.getValue(destination).render(shell.content, loaded)
    }

    private fun load() {
        val generation = ++loadGeneration
        loading = true
        data = null
        shell.showLoading()
        executor.execute {
            val result = runCatching { api.load() }
            runOnUiThread {
                if (generation != loadGeneration || isFinishing || isDestroyed) return@runOnUiThread
                loading = false
                result.onSuccess {
                    data = it
                    render()
                }.onFailure {
                    shell.showConnectionError(it.message ?: "Não foi possível conectar ao sistema.", ::load)
                }
            }
        }
    }

    override fun onDestroy() {
        ui.glassEffects.dispose()
        executor.shutdownNow()
        super.onDestroy()
    }
}
