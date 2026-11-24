// Riceve la lead dalla landing e la manda sul canale Telegram "NUOVE LEADS VIRALCLUB".
// La chiave del bot NON sta nella pagina: va messa su Netlify, in
// Site configuration → Environment variables:
//   TELEGRAM_BOT_TOKEN = la chiave del bot (da @BotFather)
//   TELEGRAM_CHAT_ID   = -1004443315871   (id del canale, ricavato dal link t.me/c/4443315871)
// Il bot deve essere amministratore del canale, con il permesso di pubblicare messaggi.

const esc = (s) =>
  String(s ?? "").slice(0, 200).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async (req) => {
  if (req.method !== "POST") return new Response("Metodo non consentito", { status: 405 });

  let d;
  try {
    d = await req.json();
  } catch {
    return new Response("Dati non validi", { status: 400 });
  }

  // Campo trappola: le persone non lo vedono, i bot di spam sì.
  if (d.sito) return new Response("ok");

  const nome = String(d.nome || "").trim();
  const email = String(d.email || "").trim();
  const tel = String(d.telefono || "").replace(/[^0-9+]/g, "");
  if (nome.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || tel.replace(/\D/g, "").length < 8) {
    return new Response("Dati mancanti", { status: 400 });
  }
  const telefono = tel.startsWith("+") ? tel : tel.startsWith("00") ? "+" + tel.slice(2) : "+39" + tel;

  const testo = [
    "🔥 <b>NUOVA LEAD VIRALCLUB</b>",
    "",
    `👤 <b>Nome:</b> ${esc(nome)}`,
    `📧 <b>Email:</b> ${esc(email)}`,
    `📞 <b>Telefono:</b> ${esc(telefono)}`,
    `🏢 <b>Azienda:</b> ${esc(d.lavoro)}`,
    `📍 <b>Città:</b> ${esc(d.citta)}`,
    `🎯 <b>Cosa gli serve:</b> ${esc(d.obiettivo)}`,
    "",
    "🌐 <i>Dalla landing page</i>",
  ].join("\n");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return new Response("Telegram non configurato", { status: 500 });

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: testo, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!r.ok) return new Response("Invio a Telegram non riuscito", { status: 502 });
  return new Response("ok");
};
