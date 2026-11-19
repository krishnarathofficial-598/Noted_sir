# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private security advisory/reporting flow, or contact the repository owner privately through the verified GitHub account.

Include the affected file or URL, a clear reproduction, impact, and any suggested mitigation. Do not include real customer data, API keys, passwords, or uploaded PDFs.

## Project rules

- Never commit `.env` files, Brevo keys, Supabase service-role keys, private keys, customer data, or uploaded PDFs.
- Keep the Supabase publishable key limited to browser code; keep Brevo credentials in Vercel environment variables only.
- Review every dependency and GitHub Action before accepting an update.
- Treat uploaded PDFs and email/order data as untrusted input.
