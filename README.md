# Inbox Operator

Inbox Operator is a local email automation app that drafts replies, routes them through an approval policy, and can auto-send lower-risk messages when the user allows it.

## Pitch

Inbox Operator automates inbox work without taking control away from the user. It can draft every reply automatically, route higher-risk messages into an approval queue, and still support approval-free sending when the user wants full autopilot.

## What this version does

- Connects to `Demo`, `Gmail`, or `Outlook`
- Includes a built-in setup wizard for provider choice, OAuth setup, identity, and first sync
- The setup wizard can save Google and Microsoft OAuth env values directly into `.env`
- Stores messages, settings, drafts, and activity locally in `data/state.json`
- Generates drafts with either:
  - OpenAI if you provide an API key and model
  - a built-in fallback drafting engine if you leave AI settings blank
- Supports three policies:
  - `Manual review`
  - `Smart autopilot`
  - `Full autopilot`
- Lets the user save draft edits, regenerate drafts, approve and send, or send without approval when policy allows

## Why it stands out

- Human-in-the-loop by default instead of reckless auto-send
- Three operating modes: review, smart autopilot, and full autopilot
- Gmail and Outlook OAuth in the same workflow
- Built-in setup wizard for first-time users
- Works with OpenAI drafting or a built-in fallback drafter

## Files

- [server.js](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/server.js): local HTTP server and JSON API
- [index.html](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/index.html): UI shell
- [styles.css](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/styles.css): UI styles
- [app.js](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/app.js): client-side behavior
- [data/state.json](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/data/state.json): local app state
- [.env.example](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/.env.example): optional environment variable examples

## Run it

```bash
npm start
```

Then open `http://localhost:3000`.

Important: the live app experience requires the local server URL. Opening `index.html` directly with `file://` will not support the API-backed wizard, OAuth, or sync actions.

## Deploy

This repo includes a [Dockerfile](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/Dockerfile) and [render.yaml](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/render.yaml) for deployment.

## Render Quick Start

1. Push this project to GitHub.
2. In Render, create a new Web Service from the repo.
3. Let Render use the included `render.yaml`.
4. Set the secret env vars in Render:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_REDIRECT_URI`
5. Update Google and Microsoft OAuth apps so the redirect URIs match the Render URL exactly.
6. Verify:
   - `/`
   - `/healthz`
   - `/privacy.html`
   - `/terms.html`

## GitHub Ready

- MIT license included
- Docker deploy config included
- Render deploy config included
- Local secrets ignored with `.gitignore`
- Container junk ignored with `.dockerignore`
- Basic GitHub Actions syntax check included

## Demo mode

`Demo` is the default provider. It creates sample inbox messages so you can test the approval and autopilot flow immediately.

## Live Gmail and Outlook mode

This app keeps the live provider integration intentionally simple for the first pass:

- `Gmail` uses Google OAuth and can refresh its own Gmail access token after you connect
- `Outlook` uses Microsoft OAuth and can refresh its own Microsoft Graph access token after you connect

For Gmail:

1. Add your Google OAuth app credentials in `.env`
2. Make sure the redirect URI in Google Cloud matches the one shown in the UI
3. Start the app and click `Connect Gmail`
4. Save settings and sync

For Outlook:

1. Add your Microsoft OAuth app credentials in `.env`
2. Make sure the redirect URI in Azure matches the one shown in the UI
3. Start the app and click `Connect Outlook`
4. Save settings and sync

## AI drafting

If you set an OpenAI API key and model in the UI:

- sync will generate drafts with the API
- regenerate will request a fresh draft for the selected message

If those fields are blank, the app uses its built-in fallback drafter.

## Notes

- This is a local MVP, not a production-secure credential vault
- Tokens and settings are stored in `data/state.json` for convenience during prototyping
- High-risk messages are still blocked from smart autopilot and remain queued for approval
- Gmail OAuth needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Outlook OAuth needs `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`
- A publish checklist is in [PUBLISHING.md](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/PUBLISHING.md)
- A ready-to-edit Handshake submission draft is in [HANDSHAKE_SHOWCASE_SUBMISSION.md](/Users/izeahgagnon/Documents/Codex/2026-05-06-i-want-to-build-an-app/HANDSHAKE_SHOWCASE_SUBMISSION.md)
