package br.gov.secel.conecta.data

import org.json.JSONArray
import org.json.JSONObject

internal data class PortalData(
    val events: JSONArray,
    val news: JSONArray,
    val sports: JSONObject,
    val places: JSONArray,
    val media: JSONArray,
    val googlePhotosEnabled: Boolean,
    val readOnly: Boolean
)
