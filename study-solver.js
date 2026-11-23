const solverForm = document.querySelector('#study-solver-form');
const solverStatus = document.querySelector('#study-solver-status');
const solverAnswer = document.querySelector('#study-solver-answer');
const MAX_SOLVER_BYTES = 8 * 1024 * 1024;
const setSolverStatus = (message, tone = '') => { solverStatus.textContent = message; solverStatus.dataset.tone = tone; };
const fileToBase64 = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('The PDF could not be read.')); reader.readAsDataURL(file); });
solverForm?.addEventListener('submit', async event => {
  event.preventDefault(); const file = document.querySelector('#study-pdf').files[0]; const question = document.querySelector('#study-question').value.trim(); if (!file) return;
  if (file.size > MAX_SOLVER_BYTES) return setSolverStatus('Please choose a PDF smaller than 8 MB.', 'error');
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setSolverStatus('Please choose a valid PDF file.', 'error');
  const button = solverForm.querySelector('button'); button.disabled = true; solverAnswer.hidden = true; setSolverStatus('Reading the PDF and preparing an explanation…');
  try { const pdfBase64 = await fileToBase64(file); const response = await fetch('/api/solve-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, pdfBase64, question }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'The solver could not process this PDF.'); solverAnswer.textContent = data.answer; solverAnswer.hidden = false; setSolverStatus('Answer ready. Review the explanation below.', 'success'); } catch (error) { setSolverStatus(error.message || 'The solver could not process this PDF.', 'error'); } finally { button.disabled = false; }
});
