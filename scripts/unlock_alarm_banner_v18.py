from pathlib import Path

root = Path("android")
svc = root / "app/src/main/java/com/findphone/home/FindPhoneService.java"
s = svc.read_text(encoding="utf-8")

s = s.replace('import android.content.Context;\nimport android.content.Intent;\n',
              'import android.content.BroadcastReceiver;\nimport android.content.Context;\nimport android.content.Intent;\nimport android.content.IntentFilter;\n')

s = s.replace('    private static final String ALARM_CHANNEL = "find_phone_alarm_v17";\n    private static final int NOTIF = 4107;',
'''    private static final String ALARM_CHANNEL = "find_phone_alarm_v18";
    private static final int NOTIF = 4107;
    private static final int ALARM_NOTIF_A = 4109;
    private static final int ALARM_NOTIF_B = 4110;''')

s = s.replace('    private volatile javax.net.ssl.HttpsURLConnection currentPoll;\n',
'''    private volatile javax.net.ssl.HttpsURLConnection currentPoll;
    private BroadcastReceiver screenReceiver;
    private int currentAlarmNotifId = ALARM_NOTIF_A;
    private long lastAlarmBannerAt = 0L;
''')

s = s.replace('        createChannels();\n        startForegroundCompat(notification("Protección activa · consumo mínimo"));',
              '        createChannels();\n        registerScreenReceiver();\n        startForegroundCompat(notification("Protección activa · consumo mínimo"));')

s = s.replace('        signalCloud();\n        stopAlarm();\n        super.onDestroy();',
              '        signalCloud();\n        unregisterScreenReceiver();\n        stopAlarm();\n        super.onDestroy();')

s = s.replace('''    private void updateAlarmNotification() {
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF, alarmNotification());
    }
''',
'''    private void updateAlarmNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.cancel(ALARM_NOTIF_A);
        nm.cancel(ALARM_NOTIF_B);
        currentAlarmNotifId = (currentAlarmNotifId == ALARM_NOTIF_A) ? ALARM_NOTIF_B : ALARM_NOTIF_A;
        nm.notify(currentAlarmNotifId, alarmNotification());
    }

    private void registerScreenReceiver() {
        screenReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                if (tone == null || intent == null) return;
                String action = intent.getAction();
                if (Intent.ACTION_USER_PRESENT.equals(action)) {
                    handler.postDelayed(() -> reshowAlarmBanner(true), 220);
                } else if (Intent.ACTION_SCREEN_ON.equals(action)) {
                    handler.postDelayed(() -> reshowAlarmBanner(false), 700);
                }
            }
        };
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_USER_PRESENT);
        f.addAction(Intent.ACTION_SCREEN_ON);
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                registerReceiver(screenReceiver, f, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(screenReceiver, f);
            }
        } catch (Exception ignored) { }
    }

    private void unregisterScreenReceiver() {
        if (screenReceiver == null) return;
        try { unregisterReceiver(screenReceiver); } catch (Exception ignored) { }
        screenReceiver = null;
    }

    private void reshowAlarmBanner(boolean force) {
        if (tone == null) return;
        long now = SystemClock.elapsedRealtime();
        if (!force && now - lastAlarmBannerAt < 1200L) return;
        lastAlarmBannerAt = now;
        updateAlarmNotification();
    }
''')

s = s.replace('''        releaseWake();
        updateNotification("Protección activa · consumo mínimo");
''',
'''        releaseWake();
        try {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            nm.cancel(ALARM_NOTIF_A);
            nm.cancel(ALARM_NOTIF_B);
        } catch (Exception ignored) { }
        updateNotification("Protección activa · consumo mínimo");
''')

s = s.replace('.setPriority(Notification.PRIORITY_MAX)\n                .setShowWhen(false)',
              '.setPriority(Notification.PRIORITY_MAX)\n                .setOnlyAlertOnce(false)\n                .setStyle(new Notification.BigTextStyle().bigText("Este teléfono está sonando para poder localizarlo. Pulsa DETENER ALARMA para silenciarlo."))\n                .setShowWhen(false)')

svc.write_text(s, encoding="utf-8")
