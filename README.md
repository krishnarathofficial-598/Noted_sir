# Noted_sir

Noted_sir is a student workspace for assignment services, E-notes, handwritten references, and authenticated order tracking.

## Run locally

Serve the repository with a local web server; do not open HTML files directly because ES modules, IndexedDB, and the serverless API need an HTTP origin.

```bash
npx serve .
```

## Main flows

- `index.html`: home page, theme switcher, assignment and notes navigation.
- `login/index.html`: Supabase sign-in, sign-up, and password reset.
- `assignment-workspace.html`: pace selection and local PDF screening.
- `billing.html`: page-based pricing and delivery options.
- `order.html`: customer details and cash-on-delivery submission.
- `api/send-order.js`: Vercel function that validates orders and sends Brevo emails.

## Configuration

Set `BREVO_API_KEY`, `SENDER_EMAIL`, `ADMIN_EMAIL`, and `ALLOWED_ORIGIN` in Vercel. The browser uses one shared Supabase project in `login/login.js`, `auth.js`, and `supabaseClient.js`; never expose the Brevo key in frontend code.

## Safety

PDF checks are local screening only. The server validates the PDF signature, page count, mode, delivery values, and recalculated total before sending email, and escapes customer data in HTML email content.
