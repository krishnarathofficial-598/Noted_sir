// 1) Replace these two values with your Supabase project values.
const SUPABASE_URL = 'https://qwtykbifeijesiaierun.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GENcXNQgbJQbInbXA5SDMQ_AsEKoCNJ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');
const password = document.querySelector('#password');
const signinView = document.querySelector('#signin-view');
const signupView = document.querySelector('#signup-view');
const toggle = document.querySelector('#toggle-password');

const setMessage = (element, text, isError = false) => {
  element.textContent = text;
  element.classList.toggle('error', isError);
};

const showView = (view) => {
  const showSignup = view === 'signup';
  signinView.classList.toggle('is-hidden', showSignup);
  signupView.classList.toggle('is-hidden', !showSignup);
};

toggle.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  toggle.textContent = visible ? 'Show' : 'Hide';
  toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(message, 'Signing in…');
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: document.querySelector('#email').value.trim(),
    password: password.value
  });
  if (error) return setMessage(message, error.message, true);
  setMessage(message, 'Signed in successfully.');
  const next = new URLSearchParams(window.location.search).get('next');
  window.location.href = next ? `../${next}` : '../index.html';
});

document.querySelector('#forgot-link').addEventListener('click', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  if (!email) return setMessage(message, 'Enter your email address first.', true);
  setMessage(message, 'Sending reset email…');
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}`
  });
  setMessage(message, error ? error.message : 'Check your inbox for the password reset link.', !!error);
});

document.querySelector('#signup-link').addEventListener('click', (event) => { event.preventDefault(); showView('signup'); document.querySelector('#signup-name').focus(); });
document.querySelector('#signin-link').addEventListener('click', (event) => { event.preventDefault(); showView('signin'); });

document.querySelector('#signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const output = document.querySelector('#signup-message');
  const passwordValue = document.querySelector('#signup-password').value;
  if (passwordValue !== document.querySelector('#signup-confirm').value) return setMessage(output, 'Passwords do not match.', true);
  setMessage(output, 'Creating your account…');
  const { data, error } = await supabaseClient.auth.signUp({
    email: document.querySelector('#signup-email').value.trim(),
    password: passwordValue,
    options: { data: { full_name: document.querySelector('#signup-name').value.trim() } }
  });
  if (error) return setMessage(output, error.message, true);
  setMessage(output, data.session ? 'Account created. Redirecting…' : 'Account created. Check your email to confirm it.');
  if (data.session) { const next = new URLSearchParams(window.location.search).get('next'); window.location.href = next ? `../${next}` : '../index.html'; }
});
