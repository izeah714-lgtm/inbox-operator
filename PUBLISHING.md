# Publish Checklist

This app is close to showcase-ready, but a real public launch still needs a few concrete steps.

## Minimum publish path

1. Deploy the app to a public HTTPS URL.
2. Confirm the deployed app loads in demo mode first, then set production env vars in your hosting dashboard for:
   - `HOST`
   - `PORT`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_TENANT_ID`
   - `MICROSOFT_REDIRECT_URI`
3. Update Google OAuth and Microsoft OAuth apps so the redirect URIs match production exactly.
4. Replace placeholder contact text in:
   - [privacy.html](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/privacy.html)
   - [terms.html](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/terms.html)
5. Confirm the following public URLs work:
   - `/`
   - `/privacy.html`
   - `/terms.html`
   - `/healthz`
6. Record a short demo video or GIF showing:
   - setup wizard
   - Gmail or Outlook connect
   - approval flow
   - auto-send mode

## Recommended polish before public release

- Add a real logo and favicon
- Replace placeholder sender defaults
- Add a public support email
- Add analytics or error tracking
- Move secret storage out of local files for production
- Add a hosted database if multiple users will use the app

## Hosting notes

This repo now includes:

- [Dockerfile](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/Dockerfile)
- [render.yaml](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/render.yaml)

That makes Render the lowest-friction publish target for this version.

Important:

- The in-app `.env` editor is intended for local setup only.
- Hosted deployments should set secrets in the platform dashboard, not through the app UI.

## Quick smoke test

Run these after deploy:

```bash
curl https://your-domain.example/healthz
curl https://your-domain.example/api/state
```

## Public launch assets

- Product title: `Inbox Operator`
- One-line pitch: `AI-drafted email replies with human approval when it matters and autopilot when it does not.`
- Core differentiator: `It automates inbox work without taking away user control.`
