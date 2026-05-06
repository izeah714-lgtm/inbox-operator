import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "state.json");
const envFile = path.join(__dirname, ".env");
loadEnvFile();

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const demoMessages = [
  {
    providerMessageId: "demo-1",
    threadId: "demo-thread-1",
    messageIdHeader: "<demo-1@inbox-operator.local>",
    provider: "demo",
    from: {
      name: "Nina Patel",
      email: "nina@greenlinelogistics.com"
    },
    subject: "Can we move tomorrow's vendor call by 30 minutes?",
    body: "Hi team, our operations lead is stuck in another client meeting. Could we move tomorrow's 11:00 AM call to 11:30 AM instead? Thanks for being flexible.",
    receivedAt: "2026-05-06T09:04:00.000Z"
  },
  {
    providerMessageId: "demo-2",
    threadId: "demo-thread-2",
    messageIdHeader: "<demo-2@inbox-operator.local>",
    provider: "demo",
    from: {
      name: "Jordan Smith",
      email: "jordan@clearpeakcustomer.com"
    },
    subject: "I was charged twice on my subscription",
    body: "I just noticed two charges from your company on my card statement. Please explain what happened and refund the extra payment today.",
    receivedAt: "2026-05-06T09:08:00.000Z"
  },
  {
    providerMessageId: "demo-3",
    threadId: "demo-thread-3",
    messageIdHeader: "<demo-3@inbox-operator.local>",
    provider: "demo",
    from: {
      name: "Maya Chen",
      email: "maya@studionorth.co"
    },
    subject: "Could you send over the latest proposal deck?",
    body: "Hi there, before our Friday review can you resend the latest proposal deck? I want to make sure I'm looking at the newest version.",
    receivedAt: "2026-05-06T09:11:00.000Z"
  }
];

function defaultState() {
  return {
    settings: {
      policy: "manual",
      provider: {
        type: "demo",
        userDisplayName: "Avery",
        userEmail: "avery@example.com",
        gmailAccessToken: "",
        gmailRefreshToken: "",
        gmailTokenExpiresAt: "",
        gmailConnectedEmail: "",
        gmailOAuthState: "",
        outlookAccessToken: "",
        outlookRefreshToken: "",
        outlookTokenExpiresAt: "",
        outlookConnectedEmail: "",
        outlookOAuthState: ""
      },
      ai: {
        apiKey: "",
        model: ""
      }
    },
    messages: [],
    activity: [
      {
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        text: "Inbox Operator is ready."
      }
    ]
  };
}

function loadEnvFile() {
  try {
    applyEnvMapToProcess(parseEnvText(readFileSync(envFile, "utf8")));
  } catch {
    // Local .env is optional in this starter app.
  }
}

function parseEnvText(text) {
  const envMap = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    envMap[key] = value;
  }

  return envMap;
}

function readEnvMap() {
  try {
    return parseEnvText(readFileSync(envFile, "utf8"));
  } catch {
    return {};
  }
}

function serializeEnvMap(envMap) {
  const preferredOrder = [
    "HOST",
    "PORT",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_REDIRECT_URI"
  ];

  const orderedKeys = [...new Set([...preferredOrder, ...Object.keys(envMap).sort()])]
    .filter((key) => envMap[key] !== undefined);

  return `${orderedKeys.map((key) => `${key}=${envMap[key] ?? ""}`).join("\n")}\n`;
}

function applyEnvMapToProcess(envMap) {
  const managedKeys = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_REDIRECT_URI"
  ];

  for (const key of managedKeys) {
    if (key in envMap) {
      process.env[key] = envMap[key];
    }
  }
}

async function writeEnvValues(values) {
  const envMap = readEnvMap();
  const next = {
    ...envMap,
    GOOGLE_CLIENT_ID: values.GOOGLE_CLIENT_ID ?? envMap.GOOGLE_CLIENT_ID ?? "",
    GOOGLE_CLIENT_SECRET: values.GOOGLE_CLIENT_SECRET ?? envMap.GOOGLE_CLIENT_SECRET ?? "",
    GOOGLE_REDIRECT_URI: values.GOOGLE_REDIRECT_URI ?? envMap.GOOGLE_REDIRECT_URI ?? `http://${host}:${port}/oauth/google/callback`,
    MICROSOFT_CLIENT_ID: values.MICROSOFT_CLIENT_ID ?? envMap.MICROSOFT_CLIENT_ID ?? "",
    MICROSOFT_CLIENT_SECRET: values.MICROSOFT_CLIENT_SECRET ?? envMap.MICROSOFT_CLIENT_SECRET ?? "",
    MICROSOFT_TENANT_ID: values.MICROSOFT_TENANT_ID ?? envMap.MICROSOFT_TENANT_ID ?? "common",
    MICROSOFT_REDIRECT_URI: values.MICROSOFT_REDIRECT_URI ?? envMap.MICROSOFT_REDIRECT_URI ?? `http://${host}:${port}/oauth/microsoft/callback`
  };

  await writeFile(envFile, serializeEnvMap(next));
  applyEnvMapToProcess(next);
}

function normalizeState(state) {
  return {
    settings: {
      policy: state.settings?.policy || "manual",
      provider: {
        type: state.settings?.provider?.type || "demo",
        userDisplayName: state.settings?.provider?.userDisplayName || "Avery",
        userEmail: state.settings?.provider?.userEmail || "avery@example.com",
        gmailAccessToken: state.settings?.provider?.gmailAccessToken || "",
        gmailRefreshToken: state.settings?.provider?.gmailRefreshToken || "",
        gmailTokenExpiresAt: state.settings?.provider?.gmailTokenExpiresAt || "",
        gmailConnectedEmail: state.settings?.provider?.gmailConnectedEmail || "",
        gmailOAuthState: state.settings?.provider?.gmailOAuthState || "",
        outlookAccessToken: state.settings?.provider?.outlookAccessToken || "",
        outlookRefreshToken: state.settings?.provider?.outlookRefreshToken || "",
        outlookTokenExpiresAt: state.settings?.provider?.outlookTokenExpiresAt || "",
        outlookConnectedEmail: state.settings?.provider?.outlookConnectedEmail || "",
        outlookOAuthState: state.settings?.provider?.outlookOAuthState || ""
      },
      ai: {
        apiKey: state.settings?.ai?.apiKey || "",
        model: state.settings?.ai?.model || ""
      }
    },
    messages: state.messages || [],
    activity: state.activity || []
  };
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    await access(dataFile);
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultState(), null, 2));
  }
}

async function readState() {
  await ensureStore();
  const raw = await readFile(dataFile, "utf8");
  return normalizeState(JSON.parse(raw));
}

async function writeState(state) {
  await writeFile(dataFile, JSON.stringify(state, null, 2));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, payload, type = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": type });
  response.end(payload);
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

async function parseBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function mergeSettings(current, incoming) {
  return {
    ...current,
    policy: incoming.policy ?? current.policy,
    provider: {
      ...current.provider,
      ...(incoming.provider || {})
    },
    ai: {
      ...current.ai,
      ...(incoming.ai || {})
    }
  };
}

function googleOauthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://${host}:${port}/oauth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret)
  };
}

function canEditEnvInApp() {
  if (process.env.ALLOW_ENV_EDITOR === "true") {
    return true;
  }

  if (process.env.RENDER === "true" || process.env.NODE_ENV === "production") {
    return false;
  }

  return host === "127.0.0.1" || host === "localhost";
}

function microsoftOauthConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `http://${host}:${port}/oauth/microsoft/callback`;

  return {
    clientId,
    clientSecret,
    tenant,
    redirectUri,
    authorizeEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    configured: Boolean(clientId && clientSecret)
  };
}

function envSnapshot() {
  const oauth = googleOauthConfig();
  const microsoftOauth = microsoftOauthConfig();

  return {
    editable: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
      MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || "",
      MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || "",
      MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || "common"
    },
    derived: {
      GOOGLE_REDIRECT_URI: oauth.redirectUri,
      MICROSOFT_REDIRECT_URI: microsoftOauth.redirectUri,
      HOST: host,
      PORT: String(port)
    },
    validation: {
      gmail: {
        configured: oauth.configured,
        missing: [
          !process.env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_ID" : "",
          !process.env.GOOGLE_CLIENT_SECRET ? "GOOGLE_CLIENT_SECRET" : ""
        ].filter(Boolean)
      },
      outlook: {
        configured: microsoftOauth.configured,
        missing: [
          !process.env.MICROSOFT_CLIENT_ID ? "MICROSOFT_CLIENT_ID" : "",
          !process.env.MICROSOFT_CLIENT_SECRET ? "MICROSOFT_CLIENT_SECRET" : ""
        ].filter(Boolean)
      }
    },
    editableInApp: canEditEnvInApp(),
    apiBaseUrl: `http://${host}:${port}`,
    filePath: envFile
  };
}

function gmailConnected(settings) {
  return Boolean(settings.provider.gmailRefreshToken || settings.provider.gmailAccessToken);
}

function outlookConnected(settings) {
  return Boolean(settings.provider.outlookRefreshToken || settings.provider.outlookAccessToken);
}

function classifyRisk(message) {
  const content = `${message.subject} ${message.body}`.toLowerCase();

  if (/(refund|charged twice|legal|lawyer|angry|cancel|complaint|billing dispute|breach)/.test(content)) {
    return "high";
  }

  if (/(proposal|deck|invoice|pricing|contract|attachment|latest version)/.test(content)) {
    return "medium";
  }

  return "low";
}

function riskLabel(risk) {
  return `${risk.slice(0, 1).toUpperCase()}${risk.slice(1)} risk`;
}

function shouldAutoSend(policy, risk) {
  if (policy === "full") {
    return true;
  }

  return policy === "smart" && risk === "low";
}

function deriveNotes(message, risk, usedAi) {
  const reasons = {
    low: "Low-risk request detected. This is usually safe for smart autopilot.",
    medium: "Moderate-risk request detected. Content may reference files, pricing, or handoff details.",
    high: "High-risk request detected. Manual approval is strongly recommended."
  };

  return `${usedAi ? "AI draft generated." : "Fallback draft generated."} ${reasons[risk]}`;
}

function createPreview(text) {
  return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

function formatTime(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function normalizeSubject(subject) {
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

function fallbackDraft(message, settings) {
  const senderName = settings.provider.userDisplayName || "Avery";
  const content = `${message.subject} ${message.body}`.toLowerCase();

  if (/(move|resched|time|tomorrow|calendar|call)/.test(content)) {
    return `Hi ${message.from.name || "there"},\n\nAbsolutely. We can make that timing change and I will update our hold on the calendar.\n\nThanks for the heads-up,\n${senderName}`;
  }

  if (/(charged twice|refund|billing)/.test(content)) {
    return `Hi ${message.from.name || "there"},\n\nI am sorry you ran into this. I have flagged the duplicate-charge concern for review so we can confirm the payment details and follow up with the right resolution as quickly as possible.\n\nBest,\n${senderName}`;
  }

  if (/(proposal|deck|latest version|send over)/.test(content)) {
    return `Hi ${message.from.name || "there"},\n\nOf course. I can resend the latest proposal materials and make sure you have the current version ahead of the review.\n\nBest,\n${senderName}`;
  }

  return `Hi ${message.from.name || "there"},\n\nThanks for your note. I reviewed your message and drafted a reply based on the request. Let me know if you want me to adjust the tone or add more detail before sending.\n\nBest,\n${senderName}`;
}

async function aiDraft(message, settings) {
  if (!settings.ai.apiKey || !settings.ai.model) {
    return {
      draft: fallbackDraft(message, settings),
      usedAi: false
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.ai.apiKey}`
    },
    body: JSON.stringify({
      model: settings.ai.model,
      messages: [
        {
          role: "system",
          content: "You draft concise, helpful professional email replies. Be polite, specific, and avoid making commitments you cannot verify."
        },
        {
          role: "user",
          content: `Draft a reply for the following email.\n\nFrom: ${message.from.name || ""} <${message.from.email || ""}>\nSubject: ${message.subject}\nBody: ${message.body}\n\nReply as ${settings.provider.userDisplayName} from ${settings.provider.userEmail}.`
        }
      ],
      temperature: 0.5
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI draft request failed: ${text}`);
  }

  const payload = await response.json();
  const draft = payload.choices?.[0]?.message?.content?.trim();

  if (!draft) {
    throw new Error("OpenAI returned an empty draft.");
  }

  return {
    draft,
    usedAi: true
  };
}

async function buildDraftedMessage(message, settings) {
  const risk = classifyRisk(message);
  const drafted = await aiDraft(message, settings);
  return {
    id: crypto.randomUUID(),
    providerMessageId: message.providerMessageId,
    threadId: message.threadId,
    messageIdHeader: message.messageIdHeader,
    provider: message.provider,
    from: message.from,
    subject: message.subject,
    body: message.body,
    draft: drafted.draft,
    notes: deriveNotes(message, risk, drafted.usedAi),
    risk,
    status: shouldAutoSend(settings.policy, risk) ? "ready_to_send" : "pending_approval",
    createdAt: new Date().toISOString(),
    receivedAt: message.receivedAt,
    sentAt: null
  };
}

async function fetchDemoMessages() {
  return demoMessages;
}

async function ensureGmailAccessToken(state) {
  const { settings } = state;
  const token = settings.provider.gmailAccessToken;
  const expiresAt = settings.provider.gmailTokenExpiresAt ? Date.parse(settings.provider.gmailTokenExpiresAt) : null;

  if (token && (!expiresAt || expiresAt - Date.now() > 60_000)) {
    return token;
  }

  if (!settings.provider.gmailRefreshToken) {
    throw new Error("Gmail is not connected yet. Use Connect Gmail first.");
  }

  const oauth = googleOauthConfig();
  if (!oauth.configured) {
    throw new Error("Google OAuth is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      refresh_token: settings.provider.gmailRefreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Gmail token refresh failed: ${text}`);
  }

  const payload = await tokenResponse.json();
  settings.provider.gmailAccessToken = payload.access_token || "";
  settings.provider.gmailTokenExpiresAt = payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000).toISOString() : "";

  return settings.provider.gmailAccessToken;
}

async function fetchGmailProfile(accessToken) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail profile lookup failed: ${text}`);
  }

  return response.json();
}

async function fetchGmailMessages(state) {
  const token = await ensureGmailAccessToken(state);

  const listResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:inbox", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listResponse.ok) {
    const text = await listResponse.text();
    throw new Error(`Gmail sync failed: ${text}`);
  }

  const listPayload = await listResponse.json();
  const messageRefs = listPayload.messages || [];
  const results = [];

  for (const ref of messageRefs) {
    const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!messageResponse.ok) {
      continue;
    }

    const payload = await messageResponse.json();
    const headers = Object.fromEntries((payload.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value]));
    const from = parseAddress(headers.from || "");
    results.push({
      providerMessageId: payload.id,
      threadId: payload.threadId,
      messageIdHeader: headers["message-id"] || `<${payload.id}@gmail.local>`,
      provider: "gmail",
      from,
      subject: headers.subject || "(no subject)",
      body: decodeGmailBody(payload.payload) || payload.snippet || "",
      receivedAt: new Date(Number(payload.internalDate || Date.now())).toISOString()
    });
  }

  return results;
}

async function ensureOutlookAccessToken(state) {
  const { settings } = state;
  const token = settings.provider.outlookAccessToken;
  const expiresAt = settings.provider.outlookTokenExpiresAt ? Date.parse(settings.provider.outlookTokenExpiresAt) : null;

  if (token && (!expiresAt || expiresAt - Date.now() > 60_000)) {
    return token;
  }

  if (!settings.provider.outlookRefreshToken) {
    throw new Error("Outlook is not connected yet. Use Connect Outlook first.");
  }

  const oauth = microsoftOauthConfig();
  if (!oauth.configured) {
    throw new Error("Microsoft OAuth is missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET.");
  }

  const tokenResponse = await fetch(oauth.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      refresh_token: settings.provider.outlookRefreshToken,
      grant_type: "refresh_token",
      scope: [
        "offline_access",
        "openid",
        "profile",
        "email",
        "User.Read",
        "Mail.Read",
        "Mail.Send"
      ].join(" ")
    })
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Outlook token refresh failed: ${text}`);
  }

  const payload = await tokenResponse.json();
  settings.provider.outlookAccessToken = payload.access_token || "";
  settings.provider.outlookRefreshToken = payload.refresh_token || settings.provider.outlookRefreshToken;
  settings.provider.outlookTokenExpiresAt = payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000).toISOString() : "";

  return settings.provider.outlookAccessToken;
}

async function fetchOutlookProfile(accessToken) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Outlook profile lookup failed: ${text}`);
  }

  return response.json();
}

async function fetchOutlookMessages(state) {
  const token = await ensureOutlookAccessToken(state);

  const response = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,from,bodyPreview,receivedDateTime,conversationId,internetMessageId", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Outlook sync failed: ${text}`);
  }

  const payload = await response.json();
  return (payload.value || []).map((message) => ({
    providerMessageId: message.id,
    threadId: message.conversationId || message.id,
    messageIdHeader: message.internetMessageId || `<${message.id}@outlook.local>`,
    provider: "outlook",
    from: {
      name: message.from?.emailAddress?.name || "",
      email: message.from?.emailAddress?.address || ""
    },
    subject: message.subject || "(no subject)",
    body: message.bodyPreview || "",
    receivedAt: message.receivedDateTime || new Date().toISOString()
  }));
}

async function fetchProviderMessages(state) {
  if (state.settings.provider.type === "gmail") {
    return fetchGmailMessages(state);
  }

  if (state.settings.provider.type === "outlook") {
    return fetchOutlookMessages(state);
  }

  return fetchDemoMessages();
}

function base64UrlEncode(text) {
  return Buffer.from(text, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeGmailBody(payload) {
  if (payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }

  for (const part of payload.parts || []) {
    const nested = decodeGmailBody(part);
    if (nested) {
      return nested;
    }
  }

  return "";
}

function parseAddress(value) {
  const match = value.match(/^(.*)<([^>]+)>$/);
  if (!match) {
    return { name: "", email: value.trim() };
  }

  return {
    name: match[1].replace(/"/g, "").trim(),
    email: match[2].trim()
  };
}

async function sendViaProvider(message, state) {
  if (message.provider === "gmail") {
    const token = await ensureGmailAccessToken(state);
    const raw = [
      `To: ${message.from.email}`,
      `From: ${state.settings.provider.userDisplayName} <${state.settings.provider.userEmail}>`,
      `Subject: ${normalizeSubject(message.subject)}`,
      `In-Reply-To: ${message.messageIdHeader}`,
      `References: ${message.messageIdHeader}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      message.draft
    ].join("\r\n");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        raw: base64UrlEncode(raw),
        threadId: message.threadId
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gmail send failed: ${text}`);
    }

    return;
  }

  if (message.provider === "outlook") {
    const token = await ensureOutlookAccessToken(state);
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${message.providerMessageId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        comment: message.draft
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Outlook send failed: ${text}`);
    }

    return;
  }
}

function computeDecoratedMessages(state) {
  return state.messages
    .slice()
    .sort((left, right) => new Date(right.receivedAt) - new Date(left.receivedAt))
    .map((message) => {
      const statusMap = {
        pending_approval: {
          statusLabel: "Needs review",
          statusTone: "review"
        },
        ready_to_send: {
          statusLabel: "Auto-ready",
          statusTone: "auto"
        },
        needs_revision: {
          statusLabel: "Needs changes",
          statusTone: "blocked"
        },
        sent: {
          statusLabel: "Sent",
          statusTone: "sent"
        }
      };

      return {
        ...message,
        preview: createPreview(message.body),
        providerLabel: message.provider === "demo" ? "Demo inbox" : message.provider === "gmail" ? "Gmail" : "Outlook",
        receivedAtLabel: formatTime(message.receivedAt),
        riskLabel: riskLabel(message.risk),
        canSendWithoutApproval: shouldAutoSend(state.settings.policy, message.risk),
        ...statusMap[message.status]
      };
    });
}

function appSnapshot(state) {
  const messages = computeDecoratedMessages(state);
  const oauth = googleOauthConfig();
  const microsoftOauth = microsoftOauthConfig();
  return {
    settings: state.settings,
    oauth: {
      gmail: {
        configured: oauth.configured,
        connected: gmailConnected(state.settings),
        connectedEmail: state.settings.provider.gmailConnectedEmail || state.settings.provider.userEmail,
        redirectUri: oauth.redirectUri
      },
      outlook: {
        configured: microsoftOauth.configured,
        connected: outlookConnected(state.settings),
        connectedEmail: state.settings.provider.outlookConnectedEmail || state.settings.provider.userEmail,
        redirectUri: microsoftOauth.redirectUri
      }
    },
    env: envSnapshot(),
    stats: {
      totalMessages: messages.length,
      pendingApproval: messages.filter((message) => message.status === "pending_approval" || message.status === "needs_revision").length,
      sent: messages.filter((message) => message.status === "sent").length
    },
    messages,
    activity: state.activity
      .slice()
      .sort((left, right) => new Date(right.time) - new Date(left.time))
      .map((entry) => ({
        ...entry,
        timeLabel: new Date(entry.time).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        })
      }))
  };
}

function logActivity(state, text) {
  state.activity.push({
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    text
  });
}

function findMessage(state, id) {
  const message = state.messages.find((entry) => entry.id === id);
  if (!message) {
    throw new Error("Message not found.");
  }
  return message;
}

async function syncMessages(state) {
  const providerMessages = await fetchProviderMessages(state);
  const existingIds = new Set(state.messages.map((message) => `${message.provider}:${message.providerMessageId}`));

  for (const providerMessage of providerMessages) {
    const uniqueId = `${providerMessage.provider}:${providerMessage.providerMessageId}`;
    if (existingIds.has(uniqueId)) {
      continue;
    }

    const drafted = await buildDraftedMessage(providerMessage, state.settings);

    if (shouldAutoSend(state.settings.policy, drafted.risk) && drafted.provider !== "demo") {
      await sendViaProvider(drafted, state);
      drafted.status = "sent";
      drafted.sentAt = new Date().toISOString();
      logActivity(state, `Auto-sent a ${drafted.provider} reply for ${drafted.from.email}.`);
    } else if (shouldAutoSend(state.settings.policy, drafted.risk) && drafted.provider === "demo") {
      drafted.status = "sent";
      drafted.sentAt = new Date().toISOString();
      logActivity(state, `Auto-sent a demo reply for ${drafted.from.email}.`);
    } else {
      logActivity(state, `Queued ${drafted.provider} message from ${drafted.from.email} for approval.`);
    }

    state.messages.push(drafted);
  }
}

async function handleApprove(state, message, incomingDraft) {
  if (incomingDraft) {
    message.draft = incomingDraft;
  }

  if (message.provider !== "demo") {
    await sendViaProvider(message, state);
  }

  message.status = "sent";
  message.sentAt = new Date().toISOString();
  logActivity(state, `Approved and sent reply to ${message.from.email}.`);
}

async function handleSendWithoutApproval(state, message, incomingDraft) {
  if (!shouldAutoSend(state.settings.policy, message.risk)) {
    throw new Error("Current policy does not allow sending this message without approval.");
  }

  if (incomingDraft) {
    message.draft = incomingDraft;
  }

  if (message.provider !== "demo") {
    await sendViaProvider(message, state);
  }

  message.status = "sent";
  message.sentAt = new Date().toISOString();
  logActivity(state, `Sent reply without approval to ${message.from.email}.`);
}

async function serveStatic(requestPath, response) {
  const filePath = requestPath === "/" ? path.join(__dirname, "index.html") : path.join(__dirname, requestPath.slice(1));
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8"
  };

  try {
    const content = await readFile(filePath, "utf8");
    sendText(response, 200, content, types[ext] || "text/plain; charset=utf-8");
  } catch {
    sendText(response, 404, "Not found");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost:3000");

  try {
    if (request.method === "GET" && url.pathname === "/api/auth/gmail/start") {
      const oauth = googleOauthConfig();
      if (!oauth.configured) {
        redirect(response, "/?gmail_oauth=missing_config");
        return;
      }

      const state = await readState();
      const authState = crypto.randomUUID();
      state.settings.provider.gmailOAuthState = authState;
      await writeState(state);

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", oauth.clientId);
      authUrl.searchParams.set("redirect_uri", oauth.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("scope", [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send"
      ].join(" "));
      authUrl.searchParams.set("state", authState);
      redirect(response, authUrl.toString());
      return;
    }

    if (request.method === "GET" && url.pathname === "/oauth/google/callback") {
      const oauth = googleOauthConfig();
      const callbackError = url.searchParams.get("error");
      const callbackState = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const state = await readState();

      if (callbackError) {
        state.settings.provider.gmailOAuthState = "";
        await writeState(state);
        redirect(response, "/?gmail_oauth=denied");
        return;
      }

      if (!code || !callbackState || callbackState !== state.settings.provider.gmailOAuthState) {
        state.settings.provider.gmailOAuthState = "";
        await writeState(state);
        redirect(response, "/?gmail_oauth=invalid_state");
        return;
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: oauth.clientId,
          client_secret: oauth.clientSecret,
          redirect_uri: oauth.redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        state.settings.provider.gmailOAuthState = "";
        await writeState(state);
        redirect(response, "/?gmail_oauth=exchange_failed");
        return;
      }

      const payload = await tokenResponse.json();
      state.settings.provider.type = "gmail";
      state.settings.provider.gmailAccessToken = payload.access_token || "";
      state.settings.provider.gmailRefreshToken = payload.refresh_token || state.settings.provider.gmailRefreshToken;
      state.settings.provider.gmailTokenExpiresAt = payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000).toISOString() : "";
      state.settings.provider.gmailOAuthState = "";

      const profile = await fetchGmailProfile(state.settings.provider.gmailAccessToken);
      state.settings.provider.gmailConnectedEmail = profile.emailAddress || state.settings.provider.gmailConnectedEmail;
      if (!state.settings.provider.userEmail || state.settings.provider.userEmail === "avery@example.com") {
        state.settings.provider.userEmail = profile.emailAddress || state.settings.provider.userEmail;
      }
      logActivity(state, `Connected Gmail account ${state.settings.provider.gmailConnectedEmail || "unknown"} via OAuth.`);
      await writeState(state);
      redirect(response, "/?gmail_oauth=success");
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/outlook/start") {
      const oauth = microsoftOauthConfig();
      if (!oauth.configured) {
        redirect(response, "/?outlook_oauth=missing_config");
        return;
      }

      const state = await readState();
      const authState = crypto.randomUUID();
      state.settings.provider.outlookOAuthState = authState;
      await writeState(state);

      const authUrl = new URL(oauth.authorizeEndpoint);
      authUrl.searchParams.set("client_id", oauth.clientId);
      authUrl.searchParams.set("redirect_uri", oauth.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("response_mode", "query");
      authUrl.searchParams.set("prompt", "select_account");
      authUrl.searchParams.set("scope", [
        "offline_access",
        "openid",
        "profile",
        "email",
        "User.Read",
        "Mail.Read",
        "Mail.Send"
      ].join(" "));
      authUrl.searchParams.set("state", authState);
      redirect(response, authUrl.toString());
      return;
    }

    if (request.method === "GET" && url.pathname === "/oauth/microsoft/callback") {
      const oauth = microsoftOauthConfig();
      const callbackError = url.searchParams.get("error");
      const callbackState = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const state = await readState();

      if (callbackError) {
        state.settings.provider.outlookOAuthState = "";
        await writeState(state);
        redirect(response, "/?outlook_oauth=denied");
        return;
      }

      if (!code || !callbackState || callbackState !== state.settings.provider.outlookOAuthState) {
        state.settings.provider.outlookOAuthState = "";
        await writeState(state);
        redirect(response, "/?outlook_oauth=invalid_state");
        return;
      }

      const tokenResponse = await fetch(oauth.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: oauth.clientId,
          client_secret: oauth.clientSecret,
          redirect_uri: oauth.redirectUri,
          grant_type: "authorization_code",
          scope: [
            "offline_access",
            "openid",
            "profile",
            "email",
            "User.Read",
            "Mail.Read",
            "Mail.Send"
          ].join(" ")
        })
      });

      if (!tokenResponse.ok) {
        state.settings.provider.outlookOAuthState = "";
        await writeState(state);
        redirect(response, "/?outlook_oauth=exchange_failed");
        return;
      }

      const payload = await tokenResponse.json();
      state.settings.provider.type = "outlook";
      state.settings.provider.outlookAccessToken = payload.access_token || "";
      state.settings.provider.outlookRefreshToken = payload.refresh_token || state.settings.provider.outlookRefreshToken;
      state.settings.provider.outlookTokenExpiresAt = payload.expires_in ? new Date(Date.now() + payload.expires_in * 1000).toISOString() : "";
      state.settings.provider.outlookOAuthState = "";

      const profile = await fetchOutlookProfile(state.settings.provider.outlookAccessToken);
      const connectedEmail = profile.mail || profile.userPrincipalName || "";
      state.settings.provider.outlookConnectedEmail = connectedEmail;
      if (!state.settings.provider.userEmail || state.settings.provider.userEmail === "avery@example.com") {
        state.settings.provider.userEmail = connectedEmail || state.settings.provider.userEmail;
      }
      if ((!state.settings.provider.userDisplayName || state.settings.provider.userDisplayName === "Avery") && profile.displayName) {
        state.settings.provider.userDisplayName = profile.displayName;
      }
      logActivity(state, `Connected Outlook account ${state.settings.provider.outlookConnectedEmail || "unknown"} via OAuth.`);
      await writeState(state);
      redirect(response, "/?outlook_oauth=success");
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/state") {
      const state = await readState();
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    if (request.method === "GET" && url.pathname === "/healthz") {
      sendJson(response, 200, {
        ok: true,
        service: "inbox-operator",
        host,
        port
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/env") {
      if (!canEditEnvInApp()) {
        sendJson(response, 403, {
          error: "In-app env editing is disabled in this environment."
        });
        return;
      }

      const state = await readState();
      const body = await parseBody(request);
      await writeEnvValues(body.values || {});
      logActivity(state, "Saved local OAuth environment settings.");
      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/settings") {
      const state = await readState();
      const body = await parseBody(request);
      state.settings = mergeSettings(state.settings, body);
      logActivity(state, `Updated settings for ${state.settings.provider.type} mode with ${state.settings.policy} policy.`);
      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/gmail/disconnect") {
      const state = await readState();
      state.settings.provider.gmailAccessToken = "";
      state.settings.provider.gmailRefreshToken = "";
      state.settings.provider.gmailTokenExpiresAt = "";
      state.settings.provider.gmailConnectedEmail = "";
      state.settings.provider.gmailOAuthState = "";
      logActivity(state, "Disconnected Gmail OAuth.");
      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/outlook/disconnect") {
      const state = await readState();
      state.settings.provider.outlookAccessToken = "";
      state.settings.provider.outlookRefreshToken = "";
      state.settings.provider.outlookTokenExpiresAt = "";
      state.settings.provider.outlookConnectedEmail = "";
      state.settings.provider.outlookOAuthState = "";
      logActivity(state, "Disconnected Outlook OAuth.");
      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/sync") {
      const state = await readState();
      await syncMessages(state);
      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    const draftMatch = url.pathname.match(/^\/api\/messages\/([^/]+)\/draft$/);
    if (draftMatch && request.method === "PATCH") {
      const state = await readState();
      const body = await parseBody(request);
      const message = findMessage(state, draftMatch[1]);
      message.draft = body.draft ?? message.draft;
      if (message.status !== "sent") {
        message.status = "pending_approval";
      }
      logActivity(state, `Saved draft changes for ${message.from.email}.`);
      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    const actionMatch = url.pathname.match(/^\/api\/messages\/([^/]+)\/(approve|send|revise|regenerate)$/);
    if (actionMatch && request.method === "POST") {
      const state = await readState();
      const body = await parseBody(request);
      const message = findMessage(state, actionMatch[1]);
      const action = actionMatch[2];

      if (action === "approve") {
        await handleApprove(state, message, body.draft);
      }

      if (action === "send") {
        await handleSendWithoutApproval(state, message, body.draft);
      }

      if (action === "revise") {
        if (body.draft) {
          message.draft = body.draft;
        }
        message.status = "needs_revision";
        logActivity(state, `Marked ${message.from.email} for manual changes.`);
      }

      if (action === "regenerate") {
        const drafted = await aiDraft(message, state.settings);
        message.draft = drafted.draft;
        message.notes = deriveNotes(message, message.risk, drafted.usedAi);
        if (message.status !== "sent") {
          message.status = "pending_approval";
        }
        logActivity(state, `Regenerated draft for ${message.from.email}.`);
      }

      await writeState(state);
      sendJson(response, 200, appSnapshot(state));
      return;
    }

    if (request.method === "GET") {
      await serveStatic(url.pathname, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(port, host, () => {
  console.log(`Inbox Operator running at http://${host}:${port}`);
});
