const billingData = JSON.parse(sessionStorage.getItem('notedSirPdfBilling') || 'null');
const pageCount = billingData?.pages || 0;
const pageLabel = document.querySelector('#bill-page-count');
const fileLabel = document.querySelector('#bill-file-name');
const total = document.querySelector('#bill-total');
const breakdown = document.querySelector('#bill-breakdown');
const form = document.querySelector('#billing-form');
const receipt = document.querySelector('.bill-receipt');

const rates = { turbo: 7, allNighter: 6, chill: 5 };
const modeNames = { turbo: 'Turbo mode', allNighter: 'All-nighter pace', chill: "Procrastinator's chill" };
const deliveryFees = { file: 70, notebook: 30, handover: 15, a4: 10 };
const deliveryNames = { file: 'Question file', notebook: 'Notebook', handover: "I'll give it to you", a4: 'A4 white pages' };

window.notedSession?.().then(session => {
  if (!session) return;
  document.querySelector('#bill-customer-name').value = session.user.user_metadata?.full_name || '';
  document.querySelector('#bill-customer-email').value = session.user.email || '';
});

pageLabel.textContent = pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'No PDF session found';
fileLabel.textContent = billingData?.fileName || 'Upload a PDF first';

const calculateBill = () => {
  const mode = form.elements.mode.value;
  const deliveries = [form.querySelector('input[name="delivery"]:checked')?.value].filter(Boolean);
  const base = pageCount * rates[mode];
  const extra = deliveries.reduce((sum, delivery) => sum + deliveryFees[delivery], 0);
  const amount = base + extra;
  total.textContent = `₹${amount}`;
  breakdown.innerHTML = `<span>${pageCount} pages × ₹${rates[mode]} (${modeNames[mode]}) <b>₹${base}</b></span><span>${deliveryNames[deliveries[0]]} <b>+₹${extra}</b></span>`;
  sessionStorage.setItem('notedSirOrder', JSON.stringify({ ...billingData, mode, modeName: modeNames[mode], rate: rates[mode], deliveries, deliveryName: deliveryNames[deliveries[0]], deliveryNames: deliveries.map(delivery => deliveryNames[delivery]), deliveryFee: extra, total: amount }));
};

form.addEventListener('change', calculateBill);
form.addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#bill-confirmation').hidden = false;
  document.querySelector('#bill-confirmation').textContent = `Bill prepared for ${billingData?.fileName || 'your PDF'}: ${total.textContent}.`;
});
const codLink = document.createElement('a');
codLink.className = 'primary-btn cod-button';
codLink.href = 'order.html';
codLink.innerHTML = 'Cash on delivery <span>↗</span>';
receipt.appendChild(codLink);
calculateBill();
