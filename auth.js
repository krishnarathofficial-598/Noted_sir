const SUPABASE_URL = 'https://qwtykbifeijesiaierun.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GENcXNQgbJQbInbXA5SDMQ_AsEKoCNJ';
const notedAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const isHome = location.pathname.endsWith('/') || location.pathname.endsWith('/index.html');
const isLogin = location.pathname.includes('/login/');
const protectedPages = ['assignment-workspace.html','billing.html','order.html','first-year.html','second-year.html','lecture-notes.html','essential-notes.html','topper-notes.html'];

async function notedSession() { return (await notedAuth.auth.getSession()).data.session; }
async function requireNotedLogin() {
  const session = await notedSession();
  if (!session && !isHome && !isLogin && protectedPages.some(page => location.pathname.endsWith(page))) {
    location.href = 'login/index.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.hash);
    return null;
  }
  return session;
}
function initials(session) {
  const name = session?.user?.user_metadata?.full_name || session?.user?.email || 'Account';
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}
function ordersFor(session) { try { return JSON.parse(localStorage.getItem(`notedSirOrders:${session?.user?.id}`) || '[]'); } catch { return []; } }
function renderAccount(session) {
  const avatar = document.querySelector('.avatar');
  const menu = document.querySelector('#account-menu');
  if (!avatar || !menu) return;
  avatar.textContent = session ? initials(session) : '??';
  avatar.title = session ? (session.user.email || 'Account') : 'Sign in';
  menu.replaceChildren();
  if (session) {
    const email = document.createElement('div'); email.className = 'account-email'; email.textContent = session.user.email || '';
    menu.append(email);
    [['history','History'],['purchases','Purchase'],['progress','Track progress']].forEach(([action, label]) => { const link = document.createElement('a'); link.href = `#account-${action}`; link.dataset.accountAction = action; link.textContent = label; menu.append(link); });
    const signout = document.createElement('button'); signout.dataset.accountAction = 'signout'; signout.textContent = 'Sign out'; menu.append(signout);
  } else { const link = document.createElement('a'); link.href = 'login/index.html'; link.textContent = 'Sign in'; menu.append(link); }
  menu.querySelector('[data-account-action="signout"]')?.addEventListener('click', async () => { await notedAuth.auth.signOut(); location.reload(); });
  menu.querySelectorAll('[data-account-action]').forEach(item => item.addEventListener('click', event => { if (item.dataset.accountAction !== 'signout') { event.preventDefault(); showAccountPanel(item.dataset.accountAction); } }));
}
function showAccountPanel(type) {
  let panel = document.querySelector('#account-panel');
  if (!panel) { panel = document.createElement('div'); panel.id='account-panel'; panel.className='account-panel'; document.body.appendChild(panel); }
  notedSession().then(session => { const orders=ordersFor(session); const title={history:'History',purchases:'Purchase',progress:'Track progress'}[type]; panel.replaceChildren(); const close=document.createElement('button'); close.className='account-panel-close'; close.textContent='×'; const eyebrow=document.createElement('span'); eyebrow.className='eyebrow'; eyebrow.textContent='Your account'; const heading=document.createElement('h2'); heading.textContent=title; const content=document.createElement('div'); if (!orders.length) { const empty=document.createElement('p'); empty.textContent='No activity yet. Start an assignment to see it here.'; content.append(empty); } else orders.forEach(order => { const article=document.createElement('article'); const file=document.createElement('b'); file.textContent=order.fileName || 'Assignment'; const mode=document.createElement('span'); mode.textContent=`${order.modeName || 'Assignment'} · ₹${Number(order.total) || 0}`; const meta=document.createElement('small'); meta.textContent=type==='progress' ? (order.status || 'Order received') : new Date(order.createdAt || Date.now()).toLocaleDateString(); article.append(file, mode, meta); content.append(article); }); panel.append(close, eyebrow, heading, content); panel.classList.add('open'); close.onclick=()=>panel.classList.remove('open'); });
}
(async () => { const session = await requireNotedLogin(); renderAccount(session); document.querySelector('.avatar')?.addEventListener('click', () => document.querySelector('#account-menu')?.classList.toggle('open')); })();
window.notedAuth = notedAuth; window.notedSession = notedSession; window.ordersFor = ordersFor;
