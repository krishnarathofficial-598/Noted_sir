/* Noted_sir PDF Analyzer — client-side checks only. */
const analyzerInput = document.querySelector('#assignment-file');
const analyzerOutput = document.querySelector('#pdf-analysis');
const analyzerStatus = document.querySelector('#pdf-analysis-status');
const analyzerSummary = document.querySelector('#pdf-analysis-summary');
const analyzerPages = document.querySelector('#pdf-analysis-pages');

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const wordCount = text => (text.trim().match(/\S+/g) || []).length;
const setStatus = (message, tone = '') => {
  analyzerStatus.textContent = message;
  analyzerStatus.dataset.tone = tone;
};
const savePdfForOrder = file => new Promise((resolve, reject) => {
  const request = indexedDB.open('notedSirOrders', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('files');
  request.onerror = () => reject(request.error);
  request.onsuccess = () => { const transaction = request.result.transaction('files', 'readwrite'); transaction.objectStore('files').put(file, 'latest'); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); };
});

const renderResult = (file, result) => {
  const failed = result.pagesOverLimit.length || result.invalidPages.length || result.suspicious;
  analyzerOutput.hidden = false;
  analyzerOutput.classList.toggle('analysis-failed', Boolean(failed));
  analyzerSummary.innerHTML = `
    <div><b>${result.pageCount}</b><span>PDF pages</span></div>
    <div><b>${result.totalWords.toLocaleString()}</b><span>total words</span></div>
    <div><b>${result.maxWords}</b><span>max words/page</span></div>
    <div><b>${failed ? 'Review' : 'Pass'}</b><span>screening result</span></div>`;
  analyzerPages.innerHTML = result.pageResults.map(page => {
    const pageFailed = page.words > 350 || page.unreadable;
    return `<li class="${pageFailed ? 'page-fail' : 'page-pass'}"><span>Page ${page.number}</span><b>${page.words} words</b><small>${page.unreadable ? 'Unreadable or image-only' : page.words > 350 ? 'Over 350-word limit' : 'Within limit'}</small></li>`;
  }).join('');
  const warnings = [];
  if (result.pagesOverLimit.length) warnings.push(`Declined: pages ${result.pagesOverLimit.join(', ')} exceed 350 words.`);
  if (result.invalidPages.length) warnings.push(`Review required: pages ${result.invalidPages.join(', ')} contain no readable text.`);
  if (result.suspicious) warnings.push('Safety warning: the PDF contains active JavaScript or automatic actions. Do not open it outside a trusted viewer.');
  if (!warnings.length) warnings.push(`${file.name} passed the local screening checks.`);
  setStatus(warnings.join(' '), failed ? 'warning' : 'success');
  if (!failed) {
    sessionStorage.setItem('notedSirPdfBilling', JSON.stringify({ fileName: file.name, pages: result.pageCount }));
    savePdfForOrder(file).finally(() => setTimeout(() => { window.location.href = 'billing.html'; }, 900));
  }
};

const analyzePdf = async file => {
  setStatus('Reading and analyzing every page…');
  analyzerOutput.hidden = true;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('This file is not a PDF.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  if (header !== '%PDF-') throw new Error('The file does not have a valid PDF signature and may be fake or corrupted.');
  const rawText = new TextDecoder('latin1').decode(bytes);
  const suspicious = /\/JavaScript|\/JS\b|\/OpenAction|\/AA\b|\/Launch\b/i.test(rawText);
  const pdf = await pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const pageResults = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
    const words = wordCount(text);
    pageResults.push({ number, words, unreadable: !text });
  }
  const pagesOverLimit = pageResults.filter(page => page.words > 350).map(page => page.number);
  const invalidPages = pageResults.filter(page => page.unreadable).map(page => page.number);
  renderResult(file, { pageCount: pdf.numPages, totalWords: pageResults.reduce((sum, page) => sum + page.words, 0), maxWords: Math.max(0, ...pageResults.map(page => page.words)), pageResults, pagesOverLimit, invalidPages, suspicious });
};

if (analyzerInput) analyzerInput.addEventListener('change', async () => {
  const [file] = analyzerInput.files;
  if (!file) return;
  try { await analyzePdf(file); } catch (error) { analyzerOutput.hidden = false; analyzerOutput.classList.add('analysis-failed'); analyzerSummary.innerHTML = ''; analyzerPages.innerHTML = ''; setStatus(error.message || 'This PDF could not be analyzed.', 'error'); }
});
