const state = {
  app: null,
  selectedId: null,
  saving: false,
  wizardStep: 1
};

const statDrafts = document.getElementById("draft-count");
const statApproval = document.getElementById("approval-count");
const statSent = document.getElementById("sent-count");
const policyBadge = document.getElementById("active-policy-badge");
const emailList = document.getElementById("email-list");
const activityList = document.getElementById("activity-list");
const detailEmpty = document.getElementById("detail-empty");
const detailContent = document.getElementById("detail-content");
const riskBadge = document.getElementById("risk-badge");
const emailFrom = document.getElementById("email-from");
const emailSubject = document.getElementById("email-subject");
const emailBody = document.getElementById("email-body");
const emailMeta = document.getElementById("email-meta");
const draftBody = document.getElementById("draft-body");
const draftNotes = document.getElementById("draft-notes");
const draftStatus = document.getElementById("draft-status");
const policyInputs = document.querySelectorAll('input[name="policy"]');
const syncButton = document.getElementById("sync-button");
const saveSettingsButton = document.getElementById("save-settings-button");
const saveDraftButton = document.getElementById("save-draft-button");
const approveButton = document.getElementById("approve-button");
const autoButton = document.getElementById("auto-button");
const reviseButton = document.getElementById("revise-button");
const regenerateButton = document.getElementById("regenerate-button");
const flash = document.getElementById("flash");
const providerSelect = document.getElementById("provider-type");
const providerHint = document.getElementById("provider-hint");
const gmailStatus = document.getElementById("gmail-status");
const gmailConnectButton = document.getElementById("gmail-connect-button");
const gmailDisconnectButton = document.getElementById("gmail-disconnect-button");
const outlookStatus = document.getElementById("outlook-status");
const outlookConnectButton = document.getElementById("outlook-connect-button");
const outlookDisconnectButton = document.getElementById("outlook-disconnect-button");
const wizardStepLabel = document.getElementById("wizard-step-label");
const wizardTitle = document.getElementById("wizard-title");
const wizardKicker = document.getElementById("wizard-kicker");
const wizardDescription = document.getElementById("wizard-description");
const wizardEnvEditor = document.getElementById("wizard-env-editor");
const wizardEnvStatus = document.getElementById("wizard-env-status");
const wizardChecklist = document.getElementById("wizard-checklist");
const wizardNote = document.getElementById("wizard-note");
const wizardBackButton = document.getElementById("wizard-back-button");
const wizardHelperButton = document.getElementById("wizard-helper-button");
const wizardActionButton = document.getElementById("wizard-action-button");
const wizardNextButton = document.getElementById("wizard-next-button");
const providerCards = document.querySelectorAll(".provider-card");
const wizardSteps = document.querySelectorAll(".wizard-step");
const envGoogleClientId = document.getElementById("env-google-client-id");
const envGoogleClientSecret = document.getElementById("env-google-client-secret");
const envMicrosoftClientId = document.getElementById("env-microsoft-client-id");
const envMicrosoftClientSecret = document.getElementById("env-microsoft-client-secret");
const envMicrosoftTenantId = document.getElementById("env-microsoft-tenant-id");
const envApiBaseUrl = document.getElementById("env-api-base-url");
const envFieldGmail = document.querySelectorAll(".env-field-gmail");
const envFieldOutlook = document.querySelectorAll(".env-field-outlook");

const fieldIds = [
  "provider-type",
  "user-display-name",
  "user-email",
  "openai-key",
  "openai-model"
];

function selectedEmail() {
  return state.app?.messages.find((message) => message.id === state.selectedId) ?? null;
}

function selectedProvider() {
  return providerSelect.value;
}

function formatPolicy(policy) {
  return {
    manual: "Manual review",
    smart: "Smart autopilot",
    full: "Full autopilot"
  }[policy] ?? "Manual review";
}

function setFlash(message, tone = "neutral") {
  flash.textContent = message;
  flash.dataset.tone = tone;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fieldValues() {
  return {
    policy: document.querySelector('input[name="policy"]:checked').value,
    provider: {
      type: providerSelect.value,
      userDisplayName: document.getElementById("user-display-name").value.trim(),
      userEmail: document.getElementById("user-email").value.trim()
    },
    ai: {
      apiKey: document.getElementById("openai-key").value.trim(),
      model: document.getElementById("openai-model").value.trim()
    }
  };
}

function envFieldValues() {
  return {
    GOOGLE_CLIENT_ID: envGoogleClientId.value.trim(),
    GOOGLE_CLIENT_SECRET: envGoogleClientSecret.value.trim(),
    MICROSOFT_CLIENT_ID: envMicrosoftClientId.value.trim(),
    MICROSOFT_CLIENT_SECRET: envMicrosoftClientSecret.value.trim(),
    MICROSOFT_TENANT_ID: envMicrosoftTenantId.value.trim() || "common"
  };
}

function providerHelpText(provider) {
  if (provider === "gmail") {
    return "Gmail mode uses Google OAuth. Connect your inbox once, then sync and send replies in-thread.";
  }

  if (provider === "outlook") {
    return "Outlook mode uses Microsoft OAuth. Connect once, then sync and send replies through Microsoft Graph.";
  }

  return "Demo mode ships with sample inbox messages so you can test the approval flow without live credentials.";
}

function providerMeta(provider) {
  return {
    demo: {
      title: "Demo inbox",
      configured: true,
      connected: true,
      redirectUri: "Not needed",
      envVars: [],
      scopes: []
    },
    gmail: {
      title: "Gmail",
      configured: Boolean(state.app?.oauth.gmail.configured),
      connected: Boolean(state.app?.oauth.gmail.connected),
      redirectUri: state.app?.oauth.gmail.redirectUri || "Configure Google OAuth first",
      envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send"
      ]
    },
    outlook: {
      title: "Outlook",
      configured: Boolean(state.app?.oauth.outlook.configured),
      connected: Boolean(state.app?.oauth.outlook.connected),
      redirectUri: state.app?.oauth.outlook.redirectUri || "Configure Microsoft OAuth first",
      envVars: [
        "MICROSOFT_CLIENT_ID",
        "MICROSOFT_CLIENT_SECRET",
        "MICROSOFT_TENANT_ID",
        "MICROSOFT_REDIRECT_URI"
      ],
      scopes: [
        "offline_access",
        "openid",
        "profile",
        "email",
        "User.Read",
        "Mail.Read",
        "Mail.Send"
      ]
    }
  }[provider];
}

function applySettingsToForm(settings) {
  policyInputs.forEach((input) => {
    input.checked = input.value === settings.policy;
  });

  providerSelect.value = settings.provider.type;
  document.getElementById("user-display-name").value = settings.provider.userDisplayName;
  document.getElementById("user-email").value = settings.provider.userEmail;
  document.getElementById("openai-key").value = settings.ai.apiKey;
  document.getElementById("openai-model").value = settings.ai.model;
  providerHint.textContent = providerHelpText(settings.provider.type);
  renderProviderCards();
  renderGmailStatus();
  renderOutlookStatus();
  renderWizard();
}

function applyEnvToForm(env) {
  envGoogleClientId.value = env.editable.GOOGLE_CLIENT_ID || "";
  envGoogleClientSecret.value = env.editable.GOOGLE_CLIENT_SECRET || "";
  envMicrosoftClientId.value = env.editable.MICROSOFT_CLIENT_ID || "";
  envMicrosoftClientSecret.value = env.editable.MICROSOFT_CLIENT_SECRET || "";
  envMicrosoftTenantId.value = env.editable.MICROSOFT_TENANT_ID || "common";
  envApiBaseUrl.value = env.apiBaseUrl || "";
}

function renderGmailStatus() {
  if (!state.app) {
    return;
  }

  const gmail = state.app.oauth.gmail;
  if (!gmail.configured) {
    gmailStatus.textContent = "OAuth is not configured yet. Add Google client credentials in .env first.";
    gmailDisconnectButton.disabled = true;
    gmailConnectButton.disabled = true;
    return;
  }

  gmailConnectButton.disabled = false;
  gmailDisconnectButton.disabled = !gmail.connected;
  gmailStatus.textContent = gmail.connected
    ? `Connected as ${gmail.connectedEmail}. Redirect URI: ${gmail.redirectUri}`
    : `Not connected yet. Redirect URI: ${gmail.redirectUri}`;
}

function renderOutlookStatus() {
  if (!state.app) {
    return;
  }

  const outlook = state.app.oauth.outlook;
  if (!outlook.configured) {
    outlookStatus.textContent = "OAuth is not configured yet. Add Microsoft client credentials in .env first.";
    outlookDisconnectButton.disabled = true;
    outlookConnectButton.disabled = true;
    return;
  }

  outlookConnectButton.disabled = false;
  outlookDisconnectButton.disabled = !outlook.connected;
  outlookStatus.textContent = outlook.connected
    ? `Connected as ${outlook.connectedEmail}. Redirect URI: ${outlook.redirectUri}`
    : `Not connected yet. Redirect URI: ${outlook.redirectUri}`;
}

function renderProviderCards() {
  const provider = selectedProvider();
  providerCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.provider === provider);
  });
}

function renderWizard() {
  if (!state.app) {
    return;
  }

  const step = state.wizardStep;
  const provider = selectedProvider();
  const meta = providerMeta(provider);
  const currentPolicy = document.querySelector('input[name="policy"]:checked').value;

  wizardStepLabel.textContent = `Step ${step} of 4`;
  wizardSteps.forEach((button) => {
    const buttonStep = Number(button.dataset.step);
    button.classList.toggle("active", buttonStep === step);
    button.classList.toggle("complete", buttonStep < step);
  });

  let kicker = "";
  let title = "";
  let description = "";
  let checklist = [];
  let note = "";
  let helperText = "Copy details";
  let actionText = "Continue";
  let actionDisabled = false;

  if (step === 1) {
    kicker = "Choose your starting point";
    title = `Start with ${meta.title}`;
    description = provider === "demo"
      ? "Use the demo inbox to validate the approval queue immediately, then switch to a live provider later."
      : `${meta.title} connects a real inbox and keeps draft review inside a live mailbox workflow.`;
    checklist = provider === "demo"
      ? [
          "No OAuth setup required.",
          "Best for validating approval, edits, and autopilot quickly.",
          "Safe way to see the product before using a real inbox."
        ]
      : [
          `${meta.title} uses OAuth instead of pasted raw tokens.`,
          "The next step shows the exact redirect URI and env vars you need.",
          "Once connected, sync will pull real inbox messages into the queue."
        ];
    note = provider === "demo"
      ? "Recommended if you want to start testing in under a minute."
      : `Recommended if you are ready to connect a live ${meta.title} inbox.`;
    helperText = "Copy provider summary";
    actionText = `Use ${meta.title}`;
  }

  if (step === 2) {
    kicker = "Configure OAuth";
    title = provider === "demo" ? "Demo inbox skips OAuth setup" : `${meta.title} credential checklist`;
    description = provider === "demo"
      ? "Demo mode has no provider app or redirect URI requirements, so this step is already done."
      : "Create or open your provider app, add these env vars locally, and make sure the redirect URI matches exactly.";
    checklist = provider === "demo"
      ? [
          "No redirect URI required.",
          "No cloud app registration required.",
          "No provider scopes required."
        ]
      : [
          `Env vars: ${meta.envVars.join(", ")}`,
          `Redirect URI: ${meta.redirectUri}`,
          `Scopes: ${meta.scopes.join(", ")}`
        ];
    note = provider === "demo"
      ? "Move on whenever you are ready."
      : meta.configured
        ? `${meta.title} OAuth looks configured in this local environment.`
        : `${meta.title} OAuth is not configured yet. Add those env vars to .env and restart the app.`;
    helperText = provider === "demo" ? "Copy demo notes" : "Copy redirect and scopes";
    actionText = provider === "demo" ? "Skip OAuth setup" : meta.configured ? `${meta.title} is configured` : `Finish ${meta.title} env setup`;
    actionDisabled = provider !== "demo" && !meta.configured;
  }

  if (step === 3) {
    kicker = "Set reply identity";
    title = "Choose the sender and drafting behavior";
    description = "These settings control who the drafts sound like, which policy gates sending, and whether OpenAI is used or the built-in fallback drafter stays active.";
    checklist = [
      "Choose the sender name recipients should see.",
      "Set the reply-from email address.",
      `Current policy: ${formatPolicy(currentPolicy)}.`,
      document.getElementById("openai-key").value.trim()
        ? "OpenAI drafting is configured."
        : "OpenAI is optional. If blank, fallback drafts stay active."
    ];
    note = "Use the settings panel below this wizard, then save here before you connect.";
    helperText = "Copy setup checklist";
    actionText = "Save setup details";
  }

  if (step === 4) {
    kicker = "Connect and sync";
    title = provider === "demo" ? "Load the demo inbox" : `Connect ${meta.title} and sync`;
    description = provider === "demo"
      ? "This will load sample messages and generate the first review queue."
      : meta.connected
        ? `${meta.title} is already connected. The last step is syncing the first batch of inbox messages.`
        : `Authorize ${meta.title}, then sync the first batch of inbox messages into the approval queue.`;
    checklist = provider === "demo"
      ? [
          "Save settings if you changed sender name or policy.",
          "Sync the demo inbox to generate sample drafts.",
          "Open the approval queue and test approve vs auto-send."
        ]
      : [
          meta.connected ? `${meta.title} is connected.` : `${meta.title} is not connected yet.`,
          "Save settings before starting OAuth so sender details are current.",
          "After connect, sync to generate live drafts from real inbox messages."
        ];
    note = provider === "demo"
      ? "You can be reviewing drafts immediately after sync."
      : meta.connected
        ? `${meta.title} is ready. Sync whenever you want the first live queue.`
        : meta.configured
          ? `${meta.title} OAuth is configured. The action button will hand off to sign-in.`
          : `${meta.title} still needs env setup before connect can work.`;
    helperText = "Copy launch steps";
    actionText = provider === "demo"
      ? "Sync demo inbox"
      : meta.connected
        ? `Sync ${meta.title}`
        : `Connect ${meta.title}`;
    actionDisabled = provider !== "demo" && !meta.connected && !meta.configured;
  }

  wizardKicker.textContent = kicker;
  wizardTitle.textContent = title;
  wizardDescription.textContent = description;
  renderWizardEnvEditor();
  wizardChecklist.innerHTML = checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  wizardNote.textContent = note;
  wizardBackButton.disabled = step === 1;
  wizardNextButton.disabled = step === 4;
  wizardHelperButton.textContent = helperText;
  wizardActionButton.textContent = actionText;
  wizardActionButton.disabled = actionDisabled;
}

function renderWizardEnvEditor() {
  if (!state.app) {
    return;
  }

  const provider = selectedProvider();
  const meta = providerMeta(provider);
  const show = state.wizardStep === 2;
  const canEdit = Boolean(state.app.env.editableInApp);
  wizardEnvEditor.hidden = !show || !canEdit;

  if (!show) {
    return;
  }

  const isDemo = provider === "demo";
  envFieldGmail.forEach((field) => {
    field.hidden = provider !== "gmail";
  });
  envFieldOutlook.forEach((field) => {
    field.hidden = provider !== "outlook";
  });

  envApiBaseUrl.value = state.app.env.apiBaseUrl;

  if (isDemo) {
    wizardEnvStatus.textContent = canEdit
      ? "Demo mode does not require OAuth credentials or redirect URI setup."
      : "Demo mode does not require OAuth credentials. In-app env editing is disabled in this environment.";
    return;
  }

  const validation = provider === "gmail" ? state.app.env.validation.gmail : state.app.env.validation.outlook;
  const redirectUri = provider === "gmail" ? state.app.env.derived.GOOGLE_REDIRECT_URI : state.app.env.derived.MICROSOFT_REDIRECT_URI;
  if (!canEdit) {
    wizardEnvStatus.textContent = `${meta.title} env editing is disabled here. Set env vars in your hosting dashboard. Redirect URI: ${redirectUri}`;
    return;
  }

  wizardEnvStatus.textContent = validation.configured
    ? `${meta.title} OAuth is configured. Redirect URI: ${redirectUri}`
    : `${meta.title} OAuth is missing: ${validation.missing.join(", ")}. Redirect URI: ${redirectUri}`;
}

function renderStats() {
  statDrafts.textContent = String(state.app.stats.totalMessages);
  statApproval.textContent = String(state.app.stats.pendingApproval);
  statSent.textContent = String(state.app.stats.sent);
  policyBadge.textContent = formatPolicy(state.app.settings.policy);
}

function renderEmailList() {
  emailList.innerHTML = "";

  if (!state.app.messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-card";
    empty.textContent = "No inbox items yet. Save settings and run a sync to pull in messages.";
    emailList.appendChild(empty);
    return;
  }

  state.app.messages.forEach((message) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `email-item${message.id === state.selectedId ? " active" : ""}`;
    button.innerHTML = `
      <header>
        <span>${message.from.name || message.from.email}</span>
        <span class="pill ${message.statusTone}">${message.statusLabel}</span>
      </header>
      <strong>${message.subject}</strong>
      <p>${message.preview}</p>
    `;
    button.addEventListener("click", () => {
      state.selectedId = message.id;
      renderDetail();
      renderEmailList();
    });
    emailList.appendChild(button);
  });
}

function renderDetail() {
  const message = selectedEmail();

  if (!message) {
    detailEmpty.hidden = false;
    detailContent.hidden = true;
    return;
  }

  detailEmpty.hidden = true;
  detailContent.hidden = false;

  emailFrom.textContent = `${message.from.name || "Unknown"} <${message.from.email || "unknown"}>`;
  emailSubject.textContent = message.subject;
  emailBody.textContent = message.body;
  emailMeta.textContent = `${message.providerLabel} • ${message.receivedAtLabel}`;
  draftBody.value = message.draft;
  draftNotes.textContent = message.notes;
  draftStatus.textContent = message.statusLabel;
  draftStatus.className = `pill ${message.statusTone}`;
  riskBadge.textContent = message.riskLabel;
  riskBadge.className = `risk-badge ${message.risk}`;

  const isSent = message.status === "sent";
  saveDraftButton.disabled = isSent;
  approveButton.disabled = isSent;
  reviseButton.disabled = isSent;
  regenerateButton.disabled = false;
  autoButton.disabled = isSent || !message.canSendWithoutApproval;
  autoButton.textContent = message.canSendWithoutApproval ? "Send without approval" : "Approval required";
}

function renderActivity() {
  activityList.innerHTML = "";

  state.app.activity.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `<time>${entry.timeLabel}</time>${entry.text}`;
    activityList.appendChild(item);
  });
}

function render() {
  if (!state.app) {
    return;
  }

  renderStats();
  renderProviderCards();
  renderWizard();
  renderEmailList();
  renderDetail();
  renderActivity();
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Something went wrong");
  }

  return payload;
}

async function refreshState() {
  const payload = await request("/api/state");
  state.app = payload;
  if (!state.selectedId && payload.messages[0]) {
    state.selectedId = payload.messages[0].id;
  }

  if (state.selectedId && !payload.messages.some((message) => message.id === state.selectedId)) {
    state.selectedId = payload.messages[0]?.id ?? null;
  }

  applySettingsToForm(payload.settings);
  applyEnvToForm(payload.env);
  render();
}

async function saveSettings() {
  const values = fieldValues();
  setFlash("Saving settings...", "neutral");
  const payload = await request("/api/settings", {
    method: "POST",
    body: JSON.stringify(values)
  });
  state.app = payload;
  providerHint.textContent = providerHelpText(values.provider.type);
  render();
  setFlash("Settings saved locally.", "success");
}

async function syncInbox() {
  setFlash("Syncing inbox and generating drafts...", "neutral");
  const payload = await request("/api/sync", {
    method: "POST"
  });
  state.app = payload;
  if (!state.selectedId && payload.messages[0]) {
    state.selectedId = payload.messages[0].id;
  }
  render();
  setFlash("Sync complete.", "success");
}

async function saveEnvSettings() {
  setFlash("Saving OAuth environment settings...", "neutral");
  const payload = await request("/api/env", {
    method: "POST",
    body: JSON.stringify({
      values: envFieldValues()
    })
  });
  state.app = payload;
  applyEnvToForm(payload.env);
  render();
  setFlash("Local .env updated.", "success");
}

async function saveDraft() {
  const message = selectedEmail();

  if (!message) {
    return;
  }

  setFlash("Saving draft changes...", "neutral");
  const payload = await request(`/api/messages/${message.id}/draft`, {
    method: "PATCH",
    body: JSON.stringify({ draft: draftBody.value })
  });
  state.app = payload;
  render();
  setFlash("Draft saved.", "success");
}

async function actOnMessage(messageId, action, successMessage, body = {}) {
  const payload = await request(`/api/messages/${messageId}/${action}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
  state.app = payload;
  render();
  setFlash(successMessage, "success");
}

async function disconnectGmail() {
  const payload = await request("/api/auth/gmail/disconnect", {
    method: "POST"
  });
  state.app = payload;
  render();
  setFlash("Gmail disconnected.", "success");
}

async function disconnectOutlook() {
  const payload = await request("/api/auth/outlook/disconnect", {
    method: "POST"
  });
  state.app = payload;
  render();
  setFlash("Outlook disconnected.", "success");
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    setFlash(successMessage, "success");
  } catch {
    setFlash("Clipboard access was blocked. You can still copy the details manually.", "error");
  }
}

async function copyWizardDetails() {
  const provider = selectedProvider();
  const meta = providerMeta(provider);

  if (state.wizardStep === 1) {
    await copyText(`${meta.title}\n${providerHelpText(provider)}`, `${meta.title} summary copied.`);
    return;
  }

  if (state.wizardStep === 2) {
    const text = provider === "demo"
      ? "Demo inbox does not require OAuth setup."
      : `Provider: ${meta.title}\nRedirect URI: ${meta.redirectUri}\nEnv vars: ${meta.envVars.join(", ")}\nScopes: ${meta.scopes.join(", ")}`;
    await copyText(text, "OAuth setup details copied.");
    return;
  }

  if (state.wizardStep === 3) {
    const text = [
      `Sender name: ${document.getElementById("user-display-name").value.trim() || "(blank)"}`,
      `Reply-from email: ${document.getElementById("user-email").value.trim() || "(blank)"}`,
      `Policy: ${formatPolicy(document.querySelector('input[name="policy"]:checked').value)}`,
      `OpenAI configured: ${document.getElementById("openai-key").value.trim() ? "yes" : "no"}`
    ].join("\n");
    await copyText(text, "Identity and drafting details copied.");
    return;
  }

  const text = provider === "demo"
    ? "1. Save settings\n2. Sync demo inbox\n3. Review the approval queue"
    : `1. Save settings\n2. Connect ${meta.title}\n3. Sync ${meta.title}\n4. Review the approval queue`;
  await copyText(text, "Launch steps copied.");
}

async function performWizardAction() {
  const provider = selectedProvider();
  const meta = providerMeta(provider);

  if (state.wizardStep === 1) {
    setFlash(`${meta.title} selected. Continue to the next step.`, "success");
    return;
  }

  if (state.wizardStep === 2) {
    if (provider === "demo") {
      setFlash("Demo mode does not need OAuth setup.", "success");
      return;
    }

    if (!state.app.env.editableInApp) {
      setFlash(`${meta.title} env editing is disabled here. Set those values in your hosting dashboard.`, "error");
      return;
    }

    await saveEnvSettings();
    const refreshedMeta = providerMeta(provider);
    if (!refreshedMeta.configured) {
      setFlash(`${meta.title} still needs the required OAuth values before connect can work.`, "error");
      return;
    }

    setFlash(`${meta.title} OAuth looks configured. Continue to identity setup.`, "success");
    return;
  }

  if (state.wizardStep === 3) {
    await saveSettings();
    return;
  }

  await saveSettings();

  if (provider === "demo") {
    await syncInbox();
    return;
  }

  if (!meta.connected) {
    window.location.href = provider === "gmail" ? "/api/auth/gmail/start" : "/api/auth/outlook/start";
    return;
  }

  await syncInbox();
}

function handleOauthResultFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const gmailResult = params.get("gmail_oauth");
  const outlookResult = params.get("outlook_oauth");
  if (!gmailResult && !outlookResult) {
    return;
  }

  const gmailMessageMap = {
    success: "Gmail connected successfully.",
    missing_config: "Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.",
    invalid_state: "Gmail sign-in expired or did not match this session. Please try again.",
    denied: "Gmail sign-in was canceled.",
    exchange_failed: "Google returned an error while finishing sign-in."
  };

  const outlookMessageMap = {
    success: "Outlook connected successfully.",
    missing_config: "Microsoft OAuth is not configured yet. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env.",
    invalid_state: "Outlook sign-in expired or did not match this session. Please try again.",
    denied: "Outlook sign-in was canceled.",
    exchange_failed: "Microsoft returned an error while finishing sign-in."
  };

  if (gmailResult) {
    setFlash(gmailMessageMap[gmailResult] || "Gmail sign-in could not be completed.", gmailResult === "success" ? "success" : "error");
  }

  if (outlookResult) {
    setFlash(outlookMessageMap[outlookResult] || "Outlook sign-in could not be completed.", outlookResult === "success" ? "success" : "error");
  }

  params.delete("gmail_oauth");
  params.delete("outlook_oauth");
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

saveSettingsButton.addEventListener("click", async () => {
  try {
    await saveSettings();
  } catch (error) {
    setFlash(error.message, "error");
  }
});

syncButton.addEventListener("click", async () => {
  try {
    await saveSettings();
    await syncInbox();
  } catch (error) {
    setFlash(error.message, "error");
  }
});

saveDraftButton.addEventListener("click", async () => {
  try {
    await saveDraft();
  } catch (error) {
    setFlash(error.message, "error");
  }
});

approveButton.addEventListener("click", async () => {
  const message = selectedEmail();
  if (!message) {
    return;
  }

  try {
    await actOnMessage(message.id, "approve", "Reply approved and sent.", {
      draft: draftBody.value
    });
  } catch (error) {
    setFlash(error.message, "error");
  }
});

autoButton.addEventListener("click", async () => {
  const message = selectedEmail();
  if (!message) {
    return;
  }

  try {
    await actOnMessage(message.id, "send", "Reply sent without manual approval.", {
      draft: draftBody.value
    });
  } catch (error) {
    setFlash(error.message, "error");
  }
});

reviseButton.addEventListener("click", async () => {
  const message = selectedEmail();
  if (!message) {
    return;
  }

  try {
    await actOnMessage(message.id, "revise", "Draft marked for manual changes.", {
      draft: draftBody.value
    });
  } catch (error) {
    setFlash(error.message, "error");
  }
});

regenerateButton.addEventListener("click", async () => {
  const message = selectedEmail();
  if (!message) {
    return;
  }

  try {
    setFlash("Generating a fresh draft...", "neutral");
    await actOnMessage(message.id, "regenerate", "Draft regenerated.");
  } catch (error) {
    setFlash(error.message, "error");
  }
});

gmailConnectButton.addEventListener("click", async () => {
  try {
    await saveSettings();
    window.location.href = "/api/auth/gmail/start";
  } catch (error) {
    setFlash(error.message, "error");
  }
});

gmailDisconnectButton.addEventListener("click", async () => {
  try {
    await disconnectGmail();
  } catch (error) {
    setFlash(error.message, "error");
  }
});

outlookConnectButton.addEventListener("click", async () => {
  try {
    await saveSettings();
    window.location.href = "/api/auth/outlook/start";
  } catch (error) {
    setFlash(error.message, "error");
  }
});

outlookDisconnectButton.addEventListener("click", async () => {
  try {
    await disconnectOutlook();
  } catch (error) {
    setFlash(error.message, "error");
  }
});

wizardBackButton.addEventListener("click", () => {
  state.wizardStep = Math.max(1, state.wizardStep - 1);
  renderWizard();
});

wizardNextButton.addEventListener("click", () => {
  state.wizardStep = Math.min(4, state.wizardStep + 1);
  renderWizard();
});

wizardHelperButton.addEventListener("click", async () => {
  await copyWizardDetails();
});

wizardActionButton.addEventListener("click", async () => {
  try {
    await performWizardAction();
  } catch (error) {
    setFlash(error.message, "error");
  }
});

wizardSteps.forEach((button) => {
  button.addEventListener("click", () => {
    state.wizardStep = Number(button.dataset.step);
    renderWizard();
  });
});

providerCards.forEach((card) => {
  card.addEventListener("click", () => {
    providerSelect.value = card.dataset.provider;
    providerHint.textContent = providerHelpText(providerSelect.value);
    renderProviderCards();
    renderWizard();
    setFlash(`${providerMeta(card.dataset.provider).title} selected in the wizard.`, "success");
  });
});

providerSelect.addEventListener("change", () => {
  providerHint.textContent = providerHelpText(providerSelect.value);
  renderProviderCards();
  renderWizard();
});

for (const fieldId of fieldIds) {
  const element = document.getElementById(fieldId);
  element.addEventListener("input", () => {
    setFlash("Unsaved changes in settings.", "neutral");
    renderWizard();
  });
}

policyInputs.forEach((input) => {
  input.addEventListener("change", () => {
    setFlash("Unsaved changes in settings.", "neutral");
    renderWizard();
  });
});

handleOauthResultFromUrl();

for (const envField of [
  envGoogleClientId,
  envGoogleClientSecret,
  envMicrosoftClientId,
  envMicrosoftClientSecret,
  envMicrosoftTenantId
]) {
  envField.addEventListener("input", () => {
    if (state.wizardStep === 2) {
      setFlash("Unsaved OAuth environment changes.", "neutral");
    }
  });
}

if (window.location.protocol === "file:") {
  setFlash("This file preview cannot use the live API. Start `npm start` and open http://127.0.0.1:3000 instead.", "error");
} else {
  refreshState().catch((error) => {
    setFlash(error.message, "error");
  });
}
