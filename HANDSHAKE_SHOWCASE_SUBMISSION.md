# Handshake AI Showcase Submission Draft

Use this draft when you submit the project in Handshake AI Showcase.

## Project title

Inbox Operator

## Project link

Replace this with your public deployed URL.

Example:

`https://your-domain.example`

## Short description

Inbox Operator is an AI-assisted email workflow app that drafts replies automatically while keeping the user in control. It supports a manual review mode, a smart autopilot mode for lower-risk messages, and a full autopilot mode for users who want approval-free sending. The app includes a setup wizard, Gmail and Outlook OAuth, editable drafts, approval queues, and AI drafting with either OpenAI or built-in fallback templates.

## Problem

Email automation tools often force a tradeoff between speed and trust. Fully manual inbox work is slow, but fully automatic replies can feel risky. This project was built to close that gap by letting users choose when they want approval and when they want safe automation.

## How it works

- The app connects to Gmail, Outlook, or a demo inbox.
- Incoming messages are classified by risk.
- A reply draft is generated with OpenAI or fallback logic.
- The user’s selected policy decides whether the message waits for approval or can send automatically.
- The user can edit, approve, reject, regenerate, or auto-send drafts.

## Who it helps

- Students building AI workflow tools
- Solo operators managing high-volume email
- Teams that want faster response times without giving up oversight
- Anyone who wants to test a human-in-the-loop approach to AI email automation

## AI tools used

- OpenAI API for reply drafting
- Rule-based risk classification and workflow policy logic
- Gmail API and Microsoft Graph for inbox and send actions

## What I built personally

- Full-stack Node app
- OAuth connection flow for Gmail and Outlook
- Human approval queue and draft editor
- Setup wizard for provider configuration and first sync
- Policy-based send logic for review, smart autopilot, and full autopilot

## Suggested showcase summary

I built an AI email workflow app that drafts replies automatically but still gives users control over what gets sent. Users can require approval for every message, allow lower-risk replies to auto-send, or run fully on autopilot. The app includes Gmail and Outlook OAuth, a setup wizard, editable drafts, and a review queue so automation feels useful without feeling reckless.
