package com.intruderguard.app

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class IntruderAdminReceiver : DeviceAdminReceiver() {

    override fun onPasswordFailed(context: Context, intent: Intent) {
        super.onPasswordFailed(context, intent)
        Log.d("IntruderGuard", "🚨 WRONG SYSTEM PASSWORD ENTERED ON ANDROID LOCKSCREEN!")
        
        // Trigger Background Camera Service to capture snapshot secretly
        val serviceIntent = Intent(context, CameraBackgroundService::class.java)
        context.startForegroundService(serviceIntent)
    }

    override fun onPasswordSucceeded(context: Context, intent: Intent) {
        super.onPasswordSucceeded(context, intent)
        Log.d("IntruderGuard", "🟢 Device Unlocked Successfully.")
    }
}
