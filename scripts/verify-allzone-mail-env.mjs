const key = String(process.env.RESEND_API_KEY || '').trim();
const vercelEnv = String(process.env.VERCEL_ENV || 'local');

if (!key) {
  console.error(`[ALLZONE MAIL CHECK] RESEND_API_KEY missing in ${vercelEnv} environment.`);
  process.exit(42);
}

if (!/^re_[A-Za-z0-9_-]{8,}$/.test(key)) {
  console.error(`[ALLZONE MAIL CHECK] RESEND_API_KEY is present but has an unexpected format in ${vercelEnv}.`);
  process.exit(43);
}

const from = String(process.env.ALLZONE_MAIL_FROM || 'Allzone Logistics <noreply@encumbrate.es>').trim();
console.log(`[ALLZONE MAIL CHECK] OK: RESEND_API_KEY is available in ${vercelEnv}; sender=${from.replace(/^[^<]*</, '<')}`);
