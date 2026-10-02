from pathlib import Path
import re

root = Path("android")

svc = root / "app/src/main/java/com/findphone/home/FindPhoneService.java"
s = svc.read_text()

for x in (
    "import java.util.HashMap;\n",
    "import java.util.Map;\n",
    "import java.util.concurrent.ExecutorService;\n",
    "import java.util.concurrent.Executors;\n",
):
    s = s.replace(x, "")

s = s.replace("    private Thread localThread;\n", "")
s = s.replace("    private ServerSocket localServer;\n", "")
s = s.replace("    private final ExecutorService localClients = Executors.newFixedThreadPool(2);\n", "")
s = s.replace("        startLocalServer();\n", "")
s = s.replace("        closeLocalServer();\n        if (localThread != null) localThread.interrupt();\n", "")
s = s.replace("        localClients.shutdownNow();\n", "")

a = s.index("    // MODO CASA:")
b = s.index("    // MODO REMOTO:")
s = s[:a] + s[b:]

s = s.replace(
    "    private volatile HttpURLConnection currentPoll;",
    "    private volatile javax.net.ssl.HttpsURLConnection currentPoll;"
)
s = s.replace(
    "        HttpURLConnection c = currentPoll;",
    "        javax.net.ssl.HttpsURLConnection c = currentPoll;"
)

start = s.index("    private String get(String u) throws Exception {")
end = s.index("    private static String read(InputStream in) throws IOException {")
network_block = r'''    private javax.net.ssl.HttpsURLConnection openHttps(String u) throws Exception {
        URL url = new URL(u);
        if (!"https".equalsIgnoreCase(url.getProtocol())) throw new SecurityException("Solo HTTPS");
        URLConnection raw = url.openConnection();
        if (!(raw instanceof javax.net.ssl.HttpsURLConnection)) throw new SecurityException("Conexión no TLS");
        javax.net.ssl.HttpsURLConnection c = (javax.net.ssl.HttpsURLConnection) raw;
        c.setInstanceFollowRedirects(false);
        c.setUseCaches(false);
        return c;
    }

    private String get(String u) throws Exception {
        javax.net.ssl.HttpsURLConnection c = openHttps(u);
        currentPoll = c;
        try {
            c.setConnectTimeout(12_000);
            c.setReadTimeout(285_000);
            c.setRequestProperty("Authorization", "Bearer " + Config.token(this));
            c.setRequestProperty("Accept", "application/json");
            c.setRequestProperty("Connection", "keep-alive");
            int code = c.getResponseCode();
            InputStream in = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
            String body = read(in);
            if (code < 200 || code >= 300) throw new IOException("HTTPS " + code);
            return body;
        } finally {
            currentPoll = null;
        }
    }

    private void ack(long seq) {
        try {
            javax.net.ssl.HttpsURLConnection c = openHttps(Config.url(this) + "/api/device/ack");
            c.setConnectTimeout(8_000);
            c.setReadTimeout(8_000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("Authorization", "Bearer " + Config.token(this));
            c.setRequestProperty("Content-Type", "application/json");
            byte[] b = ("{\"seq\":" + seq + "}").getBytes(StandardCharsets.UTF_8);
            try (OutputStream out = c.getOutputStream()) { out.write(b); }
            int code = c.getResponseCode();
            InputStream in = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
            read(in);
            if (code < 200 || code >= 300) throw new IOException("HTTPS " + code);
        } catch (Exception ignored) { }
    }

'''
s = s[:start] + network_block + s[end:]

read_start = s.index("    private static String read(InputStream in) throws IOException {")
read_end = s.index("    private static long longField", read_start)
read_block = r'''    private static String read(InputStream in) throws IOException {
        if (in == null) return "";
        final int MAX = 32 * 1024;
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] b = new byte[2048];
            int n, total = 0;
            while ((n = input.read(b)) != -1) {
                total += n;
                if (total > MAX) throw new IOException("Respuesta demasiado grande");
                out.write(b, 0, n);
            }
            return out.toString("UTF-8");
        }
    }

'''
s = s[:read_start] + read_block + s[read_end:]
svc.write_text(s)

cfg = root / "app/src/main/java/com/findphone/home/Config.java"
c = cfg.read_text()
c = c.replace("import java.security.SecureRandom;\n", "")
c = c.replace("    private static final SecureRandom RNG = new SecureRandom();\n", "")
c = re.sub(
    r"\n    public static int localPort\(Context c\).*?\n    }\n",
    "\n",
    c,
    flags=re.S,
)
cfg.write_text(c)

main = root / "app/src/main/java/com/findphone/home/MainActivity.java"
m = main.read_text()
for x in (
    "import android.content.ClipData;\n",
    "import android.content.ClipboardManager;\n",
    "import android.content.Context;\n",
    "import android.os.PowerManager;\n",
    "import java.net.Inet4Address;\n",
    "import java.net.NetworkInterface;\n",
    "import java.util.Collections;\n",
):
    m = m.replace(x, "")

m = m.replace("    private TextView localUrl;\n    private TextView localPin;\n", "")
m = m.replace("        Config.localPin(this);\n", "")

a = m.index('        heading(root, "Acceso local · misma Wi‑Fi (opcional)");')
b = m.index('        heading(root, "Fiabilidad en segundo plano");')
m = m[:a] + m[b:]

refresh_start = m.index("    private void refresh() {")
refresh_end = m.index("    private String networkLabel()", refresh_start)
m = m[:refresh_start] + '''    private void refresh() {
        status.setText("● RECEPTOR ACTIVADO · " + networkLabel());
    }

''' + m[refresh_end:]

local_start = m.find("    private String getLocalUrl() {")
if local_start != -1:
    local_end = m.index("    private void requestBatteryExemption()", local_start)
    m = m[:local_start] + m[local_end:]

batt_start = m.index("    private void requestBatteryExemption() {")
batt_end = m.index("    private void openVendorBackgroundSettings()", batt_start)
batt = '''    private void requestBatteryExemption() {
        try {
            startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
            Toast.makeText(this,"En Batería, selecciona Sin restricciones si quieres máxima disponibilidad",Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            try { startActivity(new Intent(Settings.ACTION_SETTINGS)); } catch (Exception ignored) { }
        }
    }

'''
m = m[:batt_start] + batt + m[batt_end:]
m = m.replace("t.length() < 12", "t.length() < 32")
m = m.replace("El código remoto debe tener al menos 12 caracteres", "El código remoto debe tener al menos 32 caracteres")
m = m.replace(
    "Este es el modo principal: funciona aunque el móvil perdido no tenga Wi‑Fi. Con cobertura y datos móviles activos, recibe la orden desde la web privada. La conexión de espera es de muy bajo tráfico y se reconecta automáticamente al cambiar entre Wi‑Fi y datos.",
    "Modo seguro: la app NO abre puertos ni acepta conexiones entrantes. Solo inicia conexiones salientes cifradas por HTTPS hacia tu servidor privado. Funciona con Wi‑Fi o datos móviles y se reconecta automáticamente."
)
main.write_text(m)

man = root / "app/src/main/AndroidManifest.xml"
x = man.read_text()
x = x.replace('    <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />\n', "")
x = x.replace('    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />\n', "")
x = x.replace(
    '        android:usesCleartextTraffic="false">',
    '        android:usesCleartextTraffic="false"\n        android:networkSecurityConfig="@xml/network_security_config">'
)
x = x.replace(
    "from a local or private web panel.",
    "from a private HTTPS control panel. No inbound network listener."
)
x = x.replace(
    'android:name=".BootReceiver"\n            android:enabled="true"\n            android:exported="true"',
    'android:name=".BootReceiver"\n            android:enabled="true"\n            android:exported="false"'
)
man.write_text(x)

xml = root / "app/src/main/res/xml"
xml.mkdir(parents=True, exist_ok=True)
(xml / "network_security_config.xml").write_text("""<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
""")

grad = root / "app/build.gradle"
g = grad.read_text()
g = g.replace("applicationId 'com.findphone.home'", "applicationId 'com.jorgefelipe.encontrarmovil'")
g = g.replace("versionCode 4\n        versionName '1.3.0'", "versionCode 8\n        versionName '1.5.1'")
grad.write_text(g)
