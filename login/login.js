const form=document.querySelector('#login-form'),message=document.querySelector('#login-message'),password=document.querySelector('#password'),signinView=document.querySelector('#signin-view'),signupView=document.querySelector('#signup-view');
const toggle=document.querySelector('#toggle-password');
toggle.addEventListener('click',()=>{const visible=password.type==='text';password.type=visible?'password':'text';toggle.textContent=visible?'Show':'Hide'});
form.addEventListener('submit',event=>{event.preventDefault();message.textContent='Authentication will be connected here next.'});
document.querySelector('#forgot-link').addEventListener('click',event=>{event.preventDefault();message.textContent='Password reset will be connected with the authentication provider.'});
document.querySelector('#signup-link').addEventListener('click',event=>{event.preventDefault();signinView.classList.add('is-hidden');signupView.classList.remove('is-hidden');document.querySelector('#signup-name').focus()});
document.querySelector('#signin-link').addEventListener('click',event=>{event.preventDefault();signupView.classList.add('is-hidden');signinView.classList.remove('is-hidden')});
document.querySelector('#signup-form').addEventListener('submit',event=>{event.preventDefault();const output=document.querySelector('#signup-message');if(document.querySelector('#signup-password').value!==document.querySelector('#signup-confirm').value){output.textContent='Passwords do not match.';return}output.textContent='Account creation will be connected with the authentication provider.'});

