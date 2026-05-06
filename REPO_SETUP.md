# GitHub Repo Setup

Use this guide to turn the local project into a public GitHub repo that is ready for Render deployment and Handshake submission.

## Suggested repo name

`inbox-operator`

## Suggested GitHub description

`AI-assisted email automation with approval queues, smart autopilot, and Gmail/Outlook OAuth.`

## Suggested topics

- `ai`
- `email-automation`
- `gmail`
- `outlook`
- `oauth`
- `workflow`
- `nodejs`

## Local git commands

Run these from the project folder:

```bash
git init
git branch -M main
git add .
git commit -m "Initial launch-ready version of Inbox Operator"
```

## If you use GitHub CLI

```bash
gh repo create inbox-operator --public --source=. --remote=origin --push --description "AI-assisted email automation with approval queues, smart autopilot, and Gmail/Outlook OAuth."
```

## If you use GitHub website instead

1. Create a new public repo named `inbox-operator`
2. Do not add a README, license, or `.gitignore` in the GitHub UI
3. Then run:

```bash
git remote add origin https://github.com/YOUR-USERNAME/inbox-operator.git
git push -u origin main
```

## After push

1. Add the suggested topics in the GitHub repo settings
2. Confirm these files are visible:
   - `README.md`
   - `render.yaml`
   - `Dockerfile`
   - `PUBLISHING.md`
   - `HANDSHAKE_SHOWCASE_SUBMISSION.md`
3. Connect the repo to Render
4. Set production env vars in Render
5. Update Google and Microsoft redirect URIs to match the deployed domain
6. Test the public app URL and `/healthz`
7. Submit the deployed URL to Handshake AI Showcase
