// https://developer.android.com/reference/android/bluetooth/le/AdvertiseCallback
package expo.modules.advertiser

import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseCallback.ADVERTISE_FAILED_ALREADY_STARTED
import android.bluetooth.le.AdvertiseCallback.ADVERTISE_FAILED_DATA_TOO_LARGE
import android.bluetooth.le.AdvertiseCallback.ADVERTISE_FAILED_FEATURE_UNSUPPORTED
import android.bluetooth.le.AdvertiseCallback.ADVERTISE_FAILED_INTERNAL_ERROR
import android.bluetooth.le.AdvertiseCallback.ADVERTISE_FAILED_TOO_MANY_ADVERTISERS
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.os.ParcelUuid
import android.content.Context
import android.util.Log

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

class AdvertiserModule : Module() {
  companion object {
    private const val MAX_PAYLOAD_SIZE = 31
  }

  private var advertiser: BluetoothLeAdvertiser? = null
  private var advertiseCallback: AdvertiseCallback? = null
  private var isAdvertising = false

  override fun definition() = ModuleDefinition {
    Name("Advertiser")
    Events("onAdvertiseStatusChanged")

    OnCreate {
      val bluetoothManager = appContext.reactContext?.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      val bluetoothAdapter: BluetoothAdapter? = bluetoothManager?.adapter

      if (bluetoothAdapter == null) {
        Log.e("AdvertiserModule", "Bluetooth is not available on this device")
        return@OnCreate
      }
      
      if (!bluetoothAdapter.isEnabled) {
        Log.w("AdvertiserModule", "Bluetooth is disabled - please enable it")
        // Don't return early - allow initialization, check enabled state when advertising
      }
      
      advertiser = bluetoothAdapter.bluetoothLeAdvertiser
      if (advertiser == null) {
        Log.e("AdvertiserModule", "Device does not support BLE advertising (peripheral mode)")
      } else {
        Log.i("AdvertiserModule", "BLE Advertiser initialized successfully")
      }
    }

    OnDestroy { stopAdvertisingInternal() }

    Function("startAdvertising") { uuidData: String, payloadHex: String ->
      val bluetoothManager = appContext.reactContext?.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
      val bluetoothAdapter: BluetoothAdapter? = bluetoothManager?.adapter
      
      // Check if Bluetooth is enabled at advertising time
      if (bluetoothAdapter != null && !bluetoothAdapter.isEnabled) {
        sendEvent(
          "onAdvertiseStatusChanged",
          mapOf("success" to false, "error" to "Bluetooth is disabled - please enable it in settings")
        )
        return@Function
      }
      
      if (advertiser == null) {
        sendEvent(
          "onAdvertiseStatusChanged",
          mapOf("success" to false, "error" to "BLE advertising not supported on this device")
        )
        return@Function
      }

      if (isAdvertising) {
        stopAdvertisingInternal()
      }

      val payload = try {
        hexStringToBytes(payloadHex)
      } catch (e: Exception) {
        sendEvent(
          "onAdvertiseStatusChanged",
          mapOf("success" to false, "error" to "Invalid hex string: ${e.message}")
        )
        return@Function
      }

      if (payload.size > MAX_PAYLOAD_SIZE) {
        sendEvent(
          "onAdvertiseStatusChanged",
          mapOf("success" to false, "error" to "Payload exceeds $MAX_PAYLOAD_SIZE bytes")
        )
        return@Function
      }

      val parcelUuid = try {
        ParcelUuid(UUID.fromString(uuidData))
      } catch (e: IllegalArgumentException) {
        sendEvent(
          "onAdvertiseStatusChanged",
          mapOf("success" to false, "error" to "Invalid UUID format")
        )
        return@Function
      }

      try {
        val settings =
          AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build()

        val data =
          AdvertiseData.Builder()
            .addServiceUuid(parcelUuid)
            .addServiceData(parcelUuid, payload)
            .setIncludeDeviceName(false)
            .build()

        advertiseCallback =
          object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
              isAdvertising = true
              sendEvent(
                "onAdvertiseStatusChanged",
                mapOf("success" to true, "uuid" to uuidData, "payload" to payloadHex)
              )
            }

            override fun onStartFailure(errorCode: Int) {
              val message =
                when (errorCode) {
                  ADVERTISE_FAILED_ALREADY_STARTED -> "Already started"
                  ADVERTISE_FAILED_DATA_TOO_LARGE -> "Data too large"
                  ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "Feature unsupported"
                  ADVERTISE_FAILED_INTERNAL_ERROR -> "Internal error"
                  ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Too many advertisers"
                  else -> "Unknown error: $errorCode"
                }
              sendEvent(
                "onAdvertiseStatusChanged",
                mapOf("success" to false, "error" to message)
              )
            }
          }

        advertiser?.startAdvertising(settings, data, advertiseCallback)
      } catch (e: Exception) {
        sendEvent(
          "onAdvertiseStatusChanged",
          mapOf("success" to false, "error" to "Advertising error: ${e.message}")
        )
      }
    }

    Function("stopAdvertising") {
      stopAdvertisingInternal()
      sendEvent("onAdvertiseStatusChanged", mapOf("success" to true, "stopped" to true))
    }
  }

  private fun stopAdvertisingInternal() {
    try {
      advertiseCallback?.let {
        advertiser?.stopAdvertising(it)
        advertiseCallback = null
        isAdvertising = false
      }
    } catch (e: Exception) {
      Log.e("AdvertiserModule", "Error stopping advertising: ${e.message}")
    }
  }

  private fun hexStringToBytes(s: String): ByteArray {
    if (s.isEmpty() || s.length % 2 != 0) {
      throw IllegalArgumentException("Invalid hex string length")
    }
    return s.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
  }
}
