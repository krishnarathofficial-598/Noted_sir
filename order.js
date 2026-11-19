const order = JSON.parse(sessionStorage.getItem('notedSirOrder') || 'null');
const summary = document.querySelector('#order-summary');
const total = document.querySelector('#order-total');
const form = document.querySelector('#order-form');
const status = document.querySelector('#order-status');

window.notedSession?.().then(session => {
  if (!session) return;
  document.querySelector('#customer-name').value = session.user.user_metadata?.full_name || '';
  document.querySelector('#customer-email').value = session.user.email || '';
});

if (!order?.pages) {
  summary.textContent = 'No PDF order found. Please analyze a PDF first.';
  form.querySelector('button').disabled = true;
} else {
  summary.replaceChildren();
  const file = document.createElement('b'); file.textContent = order.fileName;
  const details = document.createElement('span'); details.textContent = `${order.pages} pages · ${order.modeName} · ${order.deliveryName}`;
  summary.append(file, details);
  total.textContent = `₹${order.total}`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!order?.pages) return;
  const submit = document.querySelector('button[type=submit]');
  const details = Object.fromEntries(new FormData(form));
  submit.disabled = true;
  status.textContent = 'Sending order details…';
  const request = indexedDB.open('notedSirOrders', 1);
  request.onsuccess = () => {
    const transaction = request.result.transaction('files', 'readonly');
    const fileRequest = transaction.objectStore('files').get('latest');
    fileRequest.onsuccess = async () => {
      try {
        if (!fileRequest.result) throw new Error('The PDF attachment is no longer available. Please upload it again.');
        const bytes = new Uint8Array(await fileRequest.result.arrayBuffer());
        let binary = '';
        bytes.forEach(byte => { binary += String.fromCharCode(byte); });
        const payload = { ...order, ...details, payment: 'Cash on delivery', pdfBase64: btoa(binary) };
        const response = await fetch('/api/send-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'The order email could not be sent.');
        sessionStorage.setItem('notedSirOrderDetails', JSON.stringify({ ...payload, pdfBase64: undefined })); const session = await window.notedSession?.(); if (session) { const key = 'notedSirOrders:' + session.user.id; const saved = JSON.parse(localStorage.getItem(key) || '[]'); saved.unshift({ ...payload, pdfBase64: undefined, status: 'Order received', createdAt: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(saved)); }
        status.textContent = 'Order placed. Confirmation sent to your email and the order details were sent to Noted_sir.';
        status.dataset.tone = 'success';
      } catch (error) { status.textContent = error.message; status.dataset.tone = 'error'; submit.disabled = false; }
    };
  };
  request.onerror = () => { status.textContent = 'The saved PDF could not be opened. Please upload it again.'; status.dataset.tone = 'error'; submit.disabled = false; };
});
