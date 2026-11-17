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
const deliveryFees = { file: 0, notebook: 30, handover: 15 };
const deliveryNames = { file: 'Question file', notebook: 'Notebook', handover: "I'll give it to you" };

pageLabel.textContent = pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'No PDF session found';
fileLabel.textContent = billingData?.fileName || 'Upload a PDF first';

const calculateBill = () => {
  const mode = form.elements.mode.value;
  const deliveries = [...form.querySelectorAll('input[name="delivery"]:checked')].map(input => input.value);
  const base = pageCount * rates[mode];
  const extra = deliveries.reduce((sum, delivery) => sum + deliveryFees[delivery], 0);
  const amount = base + extra + (deliveries.includes('file') ? 70 : 0);
  total.textContent = `₹${amount}`;
  breakdown.innerHTML = `<span>${pageCount} pages × ₹${rates[mode]} (${modeNames[mode]}) <b>₹${base}</b></span><span>${deliveries.map(delivery => deliveryNames[delivery]).join(', ')} <b>+₹${extra + (deliveries.includes('file') ? 70 : 0)}</b></span>`;
  sessionStorage.setItem('notedSirOrder', JSON.stringify({ ...billingData, mode, modeName: modeNames[mode], rate: rates[mode], deliveries, deliveryNames: deliveries.map(delivery => deliveryNames[delivery]), deliveryFee: extra + (deliveries.includes('file') ? 70 : 0), total: amount }));
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
