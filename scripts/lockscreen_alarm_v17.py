from pathlib import Path

root = Path("android")
svc = root / "app/src/main/java/com/findphone/home/FindPhoneService.java"
s = svc.read_text(encoding="utf-8")

needle = '    private static final String CHANNEL = "find_phone_service";\n    private static final int NOTIF = 4107;'
replace = '''    private static final String CHANNEL = "find_phone_service";
    private static final String ALARM_CHANNEL = "find_phone_alarm_v17";
    private static final int NOTIF = 4107;'''
if needle not in s:
    raise SystemExit("No se encontró la declaración del canal")
s = s.replace(needle, replace, 1)

needle = '        createChannel();'
if needle not in s:
    raise SystemExit("No se encontró createChannel()")
s = s.replace(needle, '        createChannels();', 1)

old_method = '''    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel c = new NotificationChannel(CHANNEL, "Encontrar mi móvil", NotificationManager.IMPORTANCE_LOW);
            c.setDescription("Mantiene disponible el localizador con consumo mínimo");
            c.setSound(null, null);
            c.enableVibration(false);
            getSystemService(NotificationManager.class).createNotificationChannel(c);
        }
    }
'''
new_method = '''    private void createChannels() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = getSystemService(NotificationManager.class);

            NotificationChannel service = new NotificationChannel(
                    CHANNEL,
                    "Encontrar mi móvil",
                    NotificationManager.IMPORTANCE_LOW);
            service.setDescription("Mantiene disponible el localizador con consumo mínimo");
            service.setSound(null, null);
            service.enableVibration(false);
            service.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            nm.createNotificationChannel(service);

            NotificationChannel alarm = new NotificationChannel(
                    ALARM_CHANNEL,
                    "Alarma de Encontrar mi móvil",
                    NotificationManager.IMPORTANCE_HIGH);
            alarm.setDescription("Muestra el aviso para detener la alarma desde la pantalla bloqueada");
            alarm.setSound(null, null);
            alarm.enableVibration(true);
            alarm.setVibrationPattern(new long[]{0, 250, 150, 250});
            alarm.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(alarm);
        }
    }
'''
if old_method not in s:
    raise SystemExit("No se encontró createChannel original")
s = s.replace(old_method, new_method, 1)

anchor = '''    private void updateNotification(String s) {
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF, notification(s));
    }
'''
addition = '''    private Notification alarmNotification() {
        Intent stop = new Intent(this, FindPhoneService.class);
        stop.setAction(ACTION_STOP_RING);
        PendingIntent stopPi = PendingIntent.getService(
                this,
                4108,
                stop,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, ALARM_CHANNEL)
                : new Notification.Builder(this);

        b.setContentTitle("ENCONTRAR MI MÓVIL")
                .setContentText("Este teléfono está sonando para poder localizarlo.")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setOngoing(true)
                .setAutoCancel(false)
                .setCategory(Notification.CATEGORY_ALARM)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setPriority(Notification.PRIORITY_MAX)
                .setShowWhen(false)
                .setContentIntent(stopPi)
                .addAction(android.R.drawable.ic_media_pause, "DETENER ALARMA", stopPi);

        if (Build.VERSION.SDK_INT >= 31) {
            b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        }
        return b.build();
    }

    private void updateAlarmNotification() {
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF, alarmNotification());
    }

''' + anchor
if anchor not in s:
    raise SystemExit("No se encontró updateNotification")
s = s.replace(anchor, addition, 1)

needle = '            updateNotification("ALARMA SONANDO · toca para abrir");'
if needle not in s:
    raise SystemExit("No se encontró aviso de alarma")
s = s.replace(needle, '            updateAlarmNotification();', 1)

svc.write_text(s, encoding="utf-8")
