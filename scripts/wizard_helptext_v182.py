from pathlib import Path

root = Path("android")
main = root / "app/src/main/java/com/findphone/home/MainActivity.java"
s = main.read_text(encoding="utf-8")

field_anchor = '''    private TextView wizardState;
    private Button wizardPrimary;
    private Button wizardSecondary;
'''
field_repl = '''    private TextView wizardState;
    private TextView wizardWhyTitle;
    private TextView wizardWhyText;
    private Button wizardPrimary;
    private Button wizardSecondary;
'''
if field_anchor not in s:
    raise SystemExit("No se encontraron los campos del asistente")
s = s.replace(field_anchor, field_repl, 1)

layout_anchor = '''        ScrollView scroll = new ScrollView(this);
        wizardRoot = new LinearLayout(this);
        wizardRoot.setOrientation(LinearLayout.VERTICAL);
        wizardRoot.setGravity(Gravity.CENTER_HORIZONTAL);
        wizardRoot.setPadding(pad, dp(26), pad, dp(26));
        wizardRoot.setBackgroundColor(Color.rgb(15, 23, 42));
        scroll.addView(wizardRoot);
'''
layout_repl = '''        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);

        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setBackgroundColor(Color.WHITE);
        scroll.addView(page, new ScrollView.LayoutParams(-1, -2));

        wizardRoot = new LinearLayout(this);
        wizardRoot.setOrientation(LinearLayout.VERTICAL);
        wizardRoot.setGravity(Gravity.CENTER_HORIZONTAL);
        wizardRoot.setPadding(pad, dp(26), pad, dp(26));
        wizardRoot.setBackgroundColor(Color.rgb(15, 23, 42));
        page.addView(wizardRoot, new LinearLayout.LayoutParams(-1, -2));
'''
if layout_anchor not in s:
    raise SystemExit("No se encontró la estructura principal del asistente")
s = s.replace(layout_anchor, layout_repl, 1)

detected_anchor = '''        TextView detected = text(deviceLabel(), 12, Color.rgb(100, 116, 139));
        detected.setGravity(Gravity.CENTER_HORIZONTAL);
        detected.setPadding(0, dp(28), 0, 0);
        wizardRoot.addView(detected);

        setContentView(scroll);
'''
detected_repl = '''        TextView detected = text(deviceLabel(), 12, Color.rgb(100, 116, 139));
        detected.setGravity(Gravity.CENTER_HORIZONTAL);
        detected.setPadding(0, dp(28), 0, 0);
        wizardRoot.addView(detected);

        LinearLayout helpPanel = new LinearLayout(this);
        helpPanel.setOrientation(LinearLayout.VERTICAL);
        helpPanel.setPadding(pad, dp(24), pad, dp(34));
        helpPanel.setBackgroundColor(Color.WHITE);
        helpPanel.setMinimumHeight(dp(260));

        wizardWhyTitle = text("¿Por qué hace falta?", 16, Color.rgb(15, 23, 42));
        wizardWhyTitle.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        wizardWhyTitle.setPadding(0, 0, 0, dp(8));
        helpPanel.addView(wizardWhyTitle);

        wizardWhyText = text("", 14, Color.rgb(71, 85, 105));
        wizardWhyText.setLineSpacing(0, 1.12f);
        wizardWhyText.setPadding(0, 0, 0, 0);
        helpPanel.addView(wizardWhyText);

        page.addView(helpPanel, new LinearLayout.LayoutParams(-1, -2));

        setContentView(scroll);
'''
if detected_anchor not in s:
    raise SystemExit("No se encontró la zona inferior del asistente")
s = s.replace(detected_anchor, detected_repl, 1)

reset_anchor = '''        wizardState.setText("");
        wizardSecondary.setVisibility(View.GONE);
        wizardPrimary.setTag("action");
'''
reset_repl = '''        wizardState.setText("");
        wizardWhyTitle.setText("¿Por qué hace falta?");
        wizardWhyText.setText("");
        wizardSecondary.setVisibility(View.GONE);
        wizardPrimary.setTag("action");
'''
if reset_anchor not in s:
    raise SystemExit("No se encontró el reinicio visual del paso")
s = s.replace(reset_anchor, reset_repl, 1)

replacements = {
'''                wizardInstruction.setText("Activa: Permitir notificaciones");
''': '''                wizardInstruction.setText("Activa: Permitir notificaciones");
                wizardWhyText.setText("Permite mostrar avisos importantes y el botón para detener la alarma.");
''',
'''                wizardInstruction.setText("Selecciona: Sin restricciones");
''': '''                wizardInstruction.setText("Selecciona: Sin restricciones");
                wizardWhyText.setText("Evita que el sistema cierre la app y deje de escuchar órdenes remotas.");
''',
'''                wizardInstruction.setText("Activa inicio y ejecución en segundo plano");
''': '''                wizardInstruction.setText("Activa inicio y ejecución en segundo plano");
                wizardWhyText.setText("Ayuda a que la app siga funcionando tras reinicios y en segundo plano.");
''',
'''                wizardInstruction.setText("Permite: Alarmas");
''': '''                wizardInstruction.setText("Permite: Alarmas");
                wizardWhyText.setText("Permite que la alarma pueda sonar cuando el modo No molestar está activo.");
''',
'''                wizardInstruction.setText("Activa: Datos en segundo plano");
''': '''                wizardInstruction.setText("Activa: Datos en segundo plano");
                wizardWhyText.setText("La app necesita Internet para recibir la orden de hacer sonar el móvil.");
''',
'''                wizardInstruction.setText(soundTestStarted ? "¿Puedes oír la alarma?" : "Pon el móvil en silencio y prueba el sonido");
''': '''                wizardInstruction.setText(soundTestStarted ? "¿Puedes oír la alarma?" : "Pon el móvil en silencio y prueba el sonido");
                wizardWhyText.setText(soundTestStarted
                        ? "Si oyes la alarma, la configuración está lista."
                        : "Comprueba que todo está bien configurado y que la alarma funciona.");
''',
}
for old, new in replacements.items():
    if old not in s:
        raise SystemExit("Falta patrón: " + old.strip())
    s = s.replace(old, new, 1)

main.write_text(s, encoding="utf-8")
