// PUBLIC configuration only. Never put secrets here (no bot token, no service role key).
// The Supabase anon key is designed to be public; Row Level Security protects the data.
window.SITE_CONFIG = {
  API_URL: "",            // e.g. "https://sabbir-api.YOUR-SUBDOMAIN.workers.dev"  (leave empty until the Worker is deployed)
  SUPABASE_URL: "",       // e.g. "https://abcdxyz.supabase.co"
  SUPABASE_ANON_KEY: "",  // Supabase > Project Settings > API > anon public key
  TURNSTILE_SITE_KEY: "", // optional Cloudflare Turnstile site key
  WHATSAPP: "8801620302210",
  GA_MEASUREMENT_ID: ""   // optional, e.g. "G-XXXXXXXXXX"
};
