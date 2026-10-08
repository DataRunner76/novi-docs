// POST /api/lead — validates the lead and forwards it to the CRM webhook
// set in the GHL_WEBHOOK_URL environment variable (e.g. a GoHighLevel inbound webhook).
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let lead = req.body;
  if (typeof lead === 'string') { try { lead = JSON.parse(lead); } catch (e) { lead = null; } }
  if (!lead || typeof lead !== 'object') return res.status(400).json({ ok: false, error: 'Invalid body' });

  // Honeypot: bots fill the hidden "company" field. Pretend success, drop the lead.
  if (lead.company) return res.status(200).json({ ok: true });

  const digits = String(lead.phone || '').replace(/\D/g, '');
  if (!lead.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email || '') || digits.length < 10) {
    return res.status(400).json({ ok: false, error: 'Missing name, email or phone' });
  }

  const clean = {};
  for (const [k, v] of Object.entries(lead)) {
    if (k === 'company') continue;
    if (v == null || typeof v === 'object') continue;
    clean[k] = String(v).slice(0, 2000);
  }
  clean.phone_e164 = '+1' + digits.slice(-10);
  clean.ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  clean.received_at = new Date().toISOString();

  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) {
    // No CRM connected yet (preview): accept the lead so the funnel can be tested end to end.
    console.log('[lead] GHL_WEBHOOK_URL not set — lead not forwarded', { event_id: clean.event_id });
    return res.status(200).json({ ok: true, forwarded: false });
  }

  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clean) });
    if (!r.ok) throw new Error('Webhook responded ' + r.status);
    return res.status(200).json({ ok: true, forwarded: true });
  } catch (err) {
    console.error('[lead] forward failed', err.message, { event_id: clean.event_id });
    return res.status(502).json({ ok: false, error: 'Could not deliver lead' });
  }
};
