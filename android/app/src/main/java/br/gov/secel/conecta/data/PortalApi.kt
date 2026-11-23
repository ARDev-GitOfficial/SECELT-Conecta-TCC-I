package br.gov.secel.conecta.data

import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

internal class PortalApi(private val address: () -> String) {
    fun get(path: String) = request(path)

    fun post(path: String, body: JSONObject) = request(path, body)

    fun load(): PortalData {
        val addressSnapshot = address()
        val connectedApi = PortalApi { addressSnapshot }
        val events = connectedApi.get("/api/events").getJSONArray("items")
        val news = connectedApi.get("/api/news").getJSONArray("items")
        val sports = connectedApi.get("/api/sports")
        val tourism = connectedApi.get("/api/tourism")
        val media = connectedApi.get("/api/media").getJSONArray("items")
        val readOnly = runCatching { connectedApi.get("/api/health").optBoolean("readOnly") }.getOrDefault(false)
        return PortalData(events, news, sports, tourism.getJSONArray("items"), media, tourism.optBoolean("googlePhotosEnabled"), readOnly)
    }

    private fun request(path: String, body: JSONObject? = null): JSONObject {
        val connection = URL(address() + path).openConnection() as HttpURLConnection
        connection.connectTimeout = 5000
        connection.readTimeout = 7000
        try {
            if (body != null) {
                connection.requestMethod = "POST"
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.writer(Charsets.UTF_8).use { it.write(body.toString()) }
            }
            val status = connection.responseCode
            if (status !in 200..299) {
                if (body == null) throw Exception("Servidor respondeu $status")
                val text = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                val message = runCatching { JSONObject(text).optString("error") }.getOrNull()
                throw Exception(message?.takeIf { it.isNotBlank() } ?: "Falha ao salvar inscrição.")
            }
            return JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
        } finally {
            connection.disconnect()
        }
    }

    fun download(path: String): ByteArray {
        val connection = URL(address() + path).openConnection() as HttpURLConnection
        connection.connectTimeout = 6000
        connection.readTimeout = 8000
        connection.useCaches = false
        return try {
            if (connection.responseCode !in 200..299) throw Exception("Imagem indisponível")
            connection.inputStream.use { it.readBytes() }
        } finally {
            connection.disconnect()
        }
    }
}
