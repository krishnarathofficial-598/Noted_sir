module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Use POST for PDF solving.' });
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ error: 'The AI solver is not configured yet. Add OPENAI_API_KEY to the deployment environment.' });
  try {
    const { fileName = 'study.pdf', pdfBase64, question = '' } = request.body || {};
    if (typeof pdfBase64 !== 'string' || !pdfBase64) return response.status(400).json({ error: 'A PDF is required.' });
    const pdf = Buffer.from(pdfBase64, 'base64');
    if (pdf.length > 8 * 1024 * 1024 || pdf.subarray(0, 5).toString() !== '%PDF-') return response.status(400).json({ error: 'Upload a valid PDF smaller than 8 MB.' });
    const form = new FormData(); form.append('purpose', 'user_data'); form.append('file', new Blob([pdf], { type: 'application/pdf' }), String(fileName).replace(/[^a-z0-9._-]/gi, '_'));
    const upload = await fetch('https://api.openai.com/v1/files', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form }); const uploaded = await upload.json();
    if (!upload.ok) return response.status(502).json({ error: uploaded.error?.message || 'The PDF could not be uploaded for analysis.' });
    const prompt = question || 'Read the PDF, identify the questions it contains, and solve the questions in order. Explain the method, show important steps, and clearly label any answer that depends on an unclear image or missing information.';
    const completion = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5-mini', instructions: 'You are a careful study tutor. Help the learner understand and verify the work. Give concise step-by-step explanations, do not claim certainty when the PDF is unreadable, and do not invent missing facts. Encourage the learner to use the explanation to produce their own work.', input: [{ role: 'user', content: [{ type: 'input_file', file_id: uploaded.id }, { type: 'input_text', text: prompt }] }] }) });
    const result = await completion.json(); if (!completion.ok) return response.status(502).json({ error: result.error?.message || 'The AI model could not analyze this PDF.' }); return response.status(200).json({ answer: result.output_text || 'The model returned no readable answer.' });
  } catch (error) { return response.status(500).json({ error: error.message || 'Unexpected solver error.' }); }
};
