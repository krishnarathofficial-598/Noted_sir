const allowedOrigin = process.env.ALLOWED_ORIGIN;
const json = (body, statusCode = 200, origin = allowedOrigin) => ({ statusCode, headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}) }, body: JSON.stringify(body) });

const required = ['name', 'email', 'mobile', 'address', 'fileName', 'pages', 'modeName', 'deliveryName', 'total', 'pdfBase64'];
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const rates = { 'Turbo mode': 7, 'All-nighter pace': 6, "Procrastinator's chill": 5 };
const deliveryFees = { file: 70, notebook: 30, handover: 15, a4: 10 };

module.exports = async (request, response) => {
  const origin = request.headers.origin;
  if (!allowedOrigin || (origin && origin !== allowedOrigin)) return response.status(403).json({ error: 'Origin is not allowed.' });
  if (request.method === 'OPTIONS') return response.status(204).setHeader('Access-Control-Allow-Origin', allowedOrigin).setHeader('Access-Control-Allow-Headers', 'Content-Type').setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS').end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Only POST requests are allowed.' });
  if (!process.env.BREVO_API_KEY || !process.env.ADMIN_EMAIL || !process.env.SENDER_EMAIL) return response.status(500).json({ error: 'Email service is not configured on the server.' });

  const order = request.body || {};
  if (JSON.stringify(order).length > 6500000) return response.status(413).json({ error: 'PDF is too large for this endpoint.' });
  const missing = required.filter(field => !order[field] && order[field] !== 0);
  if (missing.length) return response.status(400).json({ error: `Missing order fields: ${missing.join(', ')}` });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) return response.status(400).json({ error: 'Invalid customer email.' });
  if (!/^%PDF-/.test(Buffer.from(order.pdfBase64, 'base64').subarray(0, 5).toString('ascii'))) return response.status(400).json({ error: 'Attachment is not a valid PDF.' });
  if (!Number.isInteger(Number(order.pages)) || Number(order.pages) < 1 || Number(order.pages) > 1000) return response.status(400).json({ error: 'Invalid page count.' });
  if (!rates[order.modeName]) return response.status(400).json({ error: 'Invalid work mode.' });
  const deliveries = Array.isArray(order.deliveries) ? order.deliveries : [];
  if (deliveries.length !== 1 || !deliveryFees[deliveries[0]]) return response.status(400).json({ error: 'Choose exactly one delivery option.' });
  const deliveryTotal = deliveries.reduce((sum, item) => sum + (deliveryFees[item] || 0), 0);
  const expectedTotal = Number(order.pages) * rates[order.modeName] + deliveryTotal;
  if (!Number.isFinite(Number(order.total)) || Number(order.total) !== expectedTotal) return response.status(400).json({ error: 'Order total could not be verified.' });

  const attachment = { name: String(order.fileName).replace(/[^a-z0-9._-]/gi, '_'), content: order.pdfBase64 };
  const sendEmail = payload => fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { accept: 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const sender = { email: process.env.SENDER_EMAIL, name: 'Noted_sir' };
  const name = escapeHtml(order.name), fileName = escapeHtml(order.fileName), email = escapeHtml(order.email), mobile = escapeHtml(order.mobile), address = escapeHtml(order.address), mode = escapeHtml(order.modeName), delivery = escapeHtml(order.deliveryName), total = escapeHtml(order.total), pages = escapeHtml(order.pages);
  const customerMail = { sender, to: [{ email: order.email, name: order.name }], replyTo: sender, subject: `Noted_sir order received — ${order.fileName}`, htmlContent: `<h2>Order received</h2><p>Hi ${name}, your Noted_sir cash-on-delivery order has been received.</p><p><b>Pages:</b> ${pages}<br><b>Mode:</b> ${mode}<br><b>Delivery:</b> ${delivery}<br><b>Total:</b> ₹${total}<br><b>Billing address:</b> ${address}</p>` };
  const adminMail = { sender, to: [{ email: process.env.ADMIN_EMAIL, name: 'Noted_sir admin' }], replyTo: { email: order.email, name: order.name }, subject: `New Noted_sir COD order — ${order.fileName}`, htmlContent: `<h2>New COD order</h2><p><b>Customer:</b> ${name}<br><b>Email:</b> ${email}<br><b>Mobile:</b> ${mobile}<br><b>Billing address:</b> ${address}<br><b>Pages:</b> ${pages}<br><b>Mode:</b> ${mode}<br><b>Delivery:</b> ${delivery}<br><b>Total:</b> ₹${total}</p>`, attachment: [attachment] };

  try {
    const [customerResponse, adminResponse] = await Promise.all([sendEmail(customerMail), sendEmail(adminMail)]);
    if (!customerResponse.ok || !adminResponse.ok) return response.status(502).json({ error: 'Brevo rejected one or more emails.' });
    return response.status(200).json({ ok: true, message: 'Order emails sent.' });
  } catch (error) {
    return response.status(502).json({ error: 'Could not connect to Brevo.' });
  }
};
