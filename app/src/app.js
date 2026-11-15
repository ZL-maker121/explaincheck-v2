import { CASES, CATEGORIES } from "./cases.js";
import { evaluateDecision, summariseRecords, escapeCsv, isValidUserChoice, normaliseFeedbackRating } from "./logic.js";
import { predictTicket, getRuleDescription } from "./predictor.js";

const STORAGE_KEY = "explaincheck-session-v2";
const viewRoot = document.querySelector("#view-root");
const navCount = document.querySelector("#nav-count");
const appState = {
  view: "case",
  activeCaseId: CASES[0].id,
  explanationOpen: {},
  explanationViewedBeforeDecision: {},
  pendingChoices: {}
};

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Could not read saved demo session; starting fresh.", error);
    return {};
  }
}
let records = loadRecords();

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Could not save the local demo session.", error);
    showToast("Your browser could not save this session. You can still use the demo, but the record may not persist.", "warning");
  }
}

function activeCase() {
  return CASES.find((item) => item.id === appState.activeCaseId) ?? CASES[0];
}
function recordFor(caseId) { return records[caseId] ?? null; }
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
function difficultyClass(value) { return value.toLowerCase(); }
function resultPill(correct, trueLabel, falseLabel) {
  return `<span class="pill ${correct ? "easy" : "hard"}">${correct ? trueLabel : falseLabel}</span>`;
}
function showToast(message, tone = "success") {
  const existing = document.querySelector("#toast-message");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "toast-message";
  toast.className = `toast ${tone}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function renderNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === appState.view);
    if (button.dataset.view === appState.view) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const summary = summariseRecords(records, CASES);
  navCount.textContent = String(summary.completed);
}

function renderCaseList() {
  return CASES.map((item) => {
    const record = recordFor(item.id);
    const status = record?.decisionSubmitted ? "Decision saved" : "Not reviewed";
    const selected = item.id === appState.activeCaseId;
    return `<button type="button" class="case-button ${selected ? "active" : ""}" data-case="${item.id}" ${selected ? 'aria-current="true"' : ""}>
      <span class="case-id">${item.id}</span><span class="case-status">${record?.feedbackSubmitted ? "Feedback saved" : status}</span>
      <span class="case-subject">${escapeHtml(item.subject)}</span>
      <span class="case-bottom"><span class="pill ${difficultyClass(item.difficulty)}">${item.difficulty} case</span>${record?.decisionSubmitted ? resultPill(record.userCorrect, "Correct", "Review") : ""}</span>
    </button>`;
  }).join("");
}

function renderDecisionOptions(item, record) {
  const prediction = predictTicket(item.text);
  const currentChoice = record?.decisionSubmitted ? record.userLabel : (appState.pendingChoices[item.id] ?? null);
  return `<fieldset class="decision-fieldset" ${record?.decisionSubmitted ? "disabled" : ""}>
    <legend class="sr-only">Choose a support queue for ${item.id}</legend>
    <div class="choice-list">${CATEGORIES.map((category) => `
      <label class="choice-option">
        <input type="radio" name="user-decision" value="${category}" ${currentChoice === category ? "checked" : ""}>
        <span class="choice-label">${category}</span>
        <span class="choice-hint">${category === prediction.label ? "AI suggestion" : "Your assessment"}</span>
      </label>`).join("")}</div>
  </fieldset>`;
}

function renderResult(item, record) {
  if (!record?.decisionSubmitted) return "";
  const correct = record.userCorrect;
  return `<section class="result-box ${correct ? "good" : "review"}" aria-labelledby="result-title">
    <h3 id="result-title">${correct ? "Your routing decision matches the reference answer" : "Your routing decision differs from the reference answer"}</h3>
    <p>The reference queue for this fictional case is <strong>${item.truth}</strong>. The rule-based AI suggestion was <strong>${record.aiLabel}</strong> and was ${record.aiCorrect ? "consistent" : "inconsistent"} with that reference.</p>
    <p><strong>Explanation opened before decision:</strong> ${record.explanationViewedBeforeDecision ? "Yes" : "No"}.</p>
    <p>${record.avoidedAiError ? "You identified a case where the simulated AI suggestion was incorrect." : record.followedWrongAi ? "You followed an AI suggestion that differs from the reference answer. Review the cues and limitation above." : "Compare the ticket wording, the explanation cues and the reference queue; this is a learning example, not a real support outcome."}</p>
    <div class="result-grid">
      <div class="result-metric"><span>Your decision</span><strong>${item.truth === record.userLabel ? "Correct" : "Needs review"}</strong></div>
      <div class="result-metric"><span>AI suggestion</span><strong>${record.aiCorrect ? "Matches reference" : "Does not match"}</strong></div>
      <div class="result-metric"><span>Case difficulty</span><strong>${item.difficulty}</strong></div>
    </div>
  </section>`;
}

function renderFeedback(item, record) {
  if (!record?.decisionSubmitted) return "";
  if (record.feedbackSubmitted) {
    return `<section class="feedback-panel panel" aria-labelledby="feedback-heading">
      <div class="section-heading"><h2 id="feedback-heading">Feedback recorded</h2><p>Saved in this browser only. Explanation viewed before decision: <strong>${record.explanationViewedBeforeDecision ? "Yes" : "No"}</strong>.</p></div>
      <div class="success-note"><span aria-hidden="true">✓</span><div><strong>Review saved for ${item.id}.</strong><p>Feedback is logged for inspection; it does not update a model or modify the rule engine.</p></div></div>
      <div class="button-row" style="margin-top:14px"><button class="secondary-button" data-action="reset-case" type="button">Try this case again</button><button class="text-button" data-view="summary" type="button">View session summary →</button></div>
    </section>`;
  }
  const viewed = Boolean(record.explanationViewedBeforeDecision);
  return `<section class="feedback-panel panel" aria-labelledby="feedback-heading">
    <div class="section-heading"><h2 id="feedback-heading">Feedback on your review</h2><p>Explanation viewed <strong>before your decision: ${viewed ? "Yes" : "No"}</strong>. These local responses are not a user study.</p></div>
    <form id="feedback-form" data-case-id="${item.id}">
      ${viewed ? `<div class="feedback-grid">
        <div><span class="field-label">How useful was the explanation you saw? <span aria-hidden="true">*</span></span>
          <div class="radio-row">
            <label class="radio-chip"><input type="radio" name="rating" value="helpful" required> Helpful</label>
            <label class="radio-chip"><input type="radio" name="rating" value="partly" required> Partly</label>
            <label class="radio-chip"><input type="radio" name="rating" value="not-helpful" required> Not helpful</label>
          </div>
        </div><div><span class="field-label">Main issue (optional)</span><div class="check-grid">
          <label class="check-row"><input type="checkbox" name="issue" value="missing-context"> Important context was missing</label>
          <label class="check-row"><input type="checkbox" name="issue" value="misleading-cue"> A cue was misleading</label>
          <label class="check-row"><input type="checkbox" name="issue" value="detail"> Too much or too little detail</label>
          <label class="check-row"><input type="checkbox" name="issue" value="unclear-limit"> The limitation was unclear</label>
        </div></div></div>` : `<p class="notice-muted">You decided without opening the explanation. We record <strong>Not viewed</strong> instead of asking you to rate an explanation you did not read.</p>`}
      <div style="margin-top:16px"><label class="field-label" for="feedback-comment">Comment (optional)</label><textarea id="feedback-comment" name="comment" maxlength="500" placeholder="Why did you trust or question the recommendation? (max 500 characters)"></textarea><p class="textarea-help">Use fictional data only; do not enter personal or sensitive information.</p></div>
      <div class="feedback-submit button-row"><button class="primary-button" type="submit">Save feedback</button><span class="helper">Stored in this browser only; never used for retraining.</span></div>
    </form>
  </section>`;
}

function renderCaseView() {
  const item = activeCase();
  const prediction = predictTicket(item.text);
  const record = recordFor(item.id);
  const isExplanationOpen = Boolean(appState.explanationOpen[item.id]);
  const otherCase = CASES[(CASES.findIndex((x) => x.id === item.id) + 1) % CASES.length];
  return `<div class="content-wrap">
    <div class="workspace">
      <aside class="panel queue-panel" aria-labelledby="queue-heading">
        <div class="panel-heading"><span class="queue-count">${CASES.length} examples</span><h2 id="queue-heading">Sample case queue</h2><p>Choose one fictional support ticket to review.</p></div>
        <div class="case-list">${renderCaseList()}</div>
        <p class="queue-note">All tickets are invented. Difficulty labels are illustrative and have not been validated in a user study. The recommendation uses a transparent keyword-scoring rule engine, not a trained model.</p>
      </aside>
      <div class="ticket-main">
        <section class="panel ticket-panel" aria-labelledby="ticket-heading">
          <div class="ticket-topline"><div><p class="ticket-kicker">SUPPORT TICKET · ${item.id}</p><h2 class="ticket-title" id="ticket-heading">${escapeHtml(item.subject)}</h2></div><span class="pill ${difficultyClass(item.difficulty)}">Illustrative difficulty: ${item.difficulty}</span></div>
          <p class="ticket-text">“${escapeHtml(item.text)}”</p>
          <div class="ticket-meta"><span class="pill neutral">Task: route a support ticket</span><span class="pill neutral">Reference answer revealed after decision</span></div>
          <div class="ai-rec" style="margin-top:18px">
            <div><p class="ai-rec-label">SIMULATED KEYWORD-BASED RECOMMENDATION</p><h3>${prediction.label}</h3></div>
            <p class="raw-score-note">Raw keyword points by queue (not probabilities or confidence)</p>
            <div class="score-grid" aria-label="Weighted keyword points">${CATEGORIES.map((category) => `<div class="score-tile ${prediction.label === category ? "top-score" : ""}"><span>${category}</span><strong>${prediction.categoryScores[category]}</strong></div>`).join("")}</div>
            <p class="score-footnote">The highest total wins; ties use a fixed category order. The rules do not learn from feedback.</p>
          </div>
          <div style="margin-top:13px">
            <button class="explain-toggle" type="button" data-action="toggle-explanation" aria-expanded="${isExplanationOpen}" aria-controls="explanation-panel"><span>${isExplanationOpen ? "Hide explanation" : "Reveal explanation"}</span><span aria-hidden="true">${isExplanationOpen ? "−" : "+"}</span></button>
            ${isExplanationOpen ? `<div class="explanation" id="explanation-panel"><h4>Signals matched by the rule engine</h4><ul class="signals">${prediction.signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}</ul><h4>Why this label?</h4><p style="font-size:12px;color:#47636b;margin:0 0 13px">${escapeHtml(prediction.explanation)}</p><p class="limitation"><strong>Known limitation:</strong> ${escapeHtml(item.limitation)}</p><p class="helper">${escapeHtml(prediction.explanationNote)}</p></div>` : ""}
          </div>
        </section>
        <section class="panel decision-panel" aria-labelledby="decision-heading">
          <div class="section-heading"><h2 id="decision-heading">What should happen next?</h2><p>No queue is pre-selected. Make your own choice; you can disagree with the rule-based suggestion.</p></div>
          <form id="decision-form" data-case-id="${item.id}">
            ${renderDecisionOptions(item, record)}
            <div class="button-row"><button class="primary-button" type="submit" ${record?.decisionSubmitted ? "disabled" : ""}>${record?.decisionSubmitted ? "Decision submitted" : "Submit my decision"}</button>${record?.decisionSubmitted ? `<button class="secondary-button" data-action="reset-case" type="button">Try again</button>` : ""}<span class="helper">The reference queue stays hidden until you submit.</span></div>
          </form>
          ${renderResult(item, record)}
        </section>
        ${renderFeedback(item, record)}
        <div class="button-row next-row"><span class="helper">${record?.decisionSubmitted ? "Continue with another example to compare cases." : "No score is assigned to you; this is an interaction demo."}</span><button class="secondary-button" data-case="${otherCase.id}" type="button">Next case →</button></div>
      </div>
    </div>
  </div>`;
}

function renderSummaryView() {
  const summary = summariseRecords(records, CASES);
  const rows = CASES.filter((item) => recordFor(item.id)?.decisionSubmitted).map((item) => {
    const record = recordFor(item.id);
    return `<tr><td><strong>${item.id}</strong><br><span style="color:#70868c;font-size:10px">${escapeHtml(item.subject)}</span></td><td>${record.aiLabel}</td><td>${record.userLabel}</td><td>${item.truth}</td><td>${record.explanationViewedBeforeDecision ? "Yes" : "No"}</td><td>${record.userCorrect ? '<span class="pill easy">Correct</span>' : '<span class="pill hard">Review</span>'}</td><td>${record.feedbackSubmitted ? '<span class="pill easy">Saved</span>' : '<span class="pill neutral">Not yet</span>'}</td></tr>`;
  }).join("");
  return `<div class="content-wrap">
    <div class="section-heading" style="margin:8px 0 20px"><p class="eyebrow">LOCAL SESSION OVERVIEW</p><h2 style="font-size:26px;letter-spacing:-.04em">Your decisions, made visible.</h2><p>Only decisions made in this browser are included. These counts describe this demo session, not validated user performance.</p></div>
    <div class="summary-grid">
      <div class="stat-card"><span>Cases reviewed</span><strong>${summary.completed}<small> / ${summary.totalCases}</small></strong><small>Decision submitted</small></div>
      <div class="stat-card"><span>Your decisions matching reference</span><strong>${summary.userCorrect}</strong><small>Across reviewed examples</small></div>
      <div class="stat-card"><span>AI suggestions not matching reference</span><strong>${summary.aiErrors}</strong><small>Among reviewed examples</small></div>
      <div class="stat-card"><span>AI errors you avoided</span><strong>${summary.avoidedErrors}</strong><small>Your choice differed and matched the reference</small></div>
    </div>
    <section class="panel" aria-labelledby="history-heading"><div class="panel-heading"><h2 id="history-heading">Decision history</h2><p>Export records for analysis or clear them when finished.</p></div>
      ${rows ? `<div class="table-wrap"><table class="summary-table"><thead><tr><th>Case</th><th>AI suggestion</th><th>Your choice</th><th>Reference</th><th>Expl. viewed?</th><th>Decision</th><th>Feedback</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state"><strong>No decisions yet</strong>Choose a sample case, make a decision and submit it to create a session record.</div>`}
      <div class="panel-heading" style="border-top:1px solid #edf1f1;border-bottom:0;display:flex;gap:10px;flex-wrap:wrap"><button class="primary-button" data-action="export" type="button" ${summary.completed ? "" : "disabled"}>Export CSV</button><button class="secondary-button" data-action="clear-session" type="button" ${summary.completed ? "" : "disabled"}>Clear local session</button><span class="helper">CSV export includes only local demo records. No server upload occurs.</span></div>
    </section>
  </div>`;
}

function renderAboutView() {
  return `<div class="content-wrap"><div class="about-grid">
    <section class="panel about-card"><p class="eyebrow">PROJECT SCOPE</p><h2>What this prototype does</h2><p>ExplainCheck is a standalone, AI-assisted browser prototype for studying how people assess AI-assisted support-ticket routing. It displays a recommendation with raw keyword points, matched-cue explanation, a reference answer after a decision, and a feedback form.</p><ul><li>Six fictional support tickets across Billing, Account and Technical queues.</li><li>Decision and explanation-feedback records stored locally in this browser.</li><li>CSV export to support inspection of the interaction record.</li></ul></section>
    <section class="panel about-card"><p class="eyebrow">IMPORTANT LIMITATIONS</p><h2>What it does not claim</h2><p>This is not a trained AI model, a user study or a real customer support service. ${escapeHtml(getRuleDescription())} Raw category scores are weighted keyword points, not probabilities or model confidence. Explanatory cues are matched keywords plus a manually authored limitation. Difficulty labels and reference answers are illustrative.</p><ul><li>No model training or model update occurs after feedback.</li><li>No account, API, backend or server-side storage is used.</li><li>The sample cases are not validated measures of task difficulty.</li></ul></section>
    <section class="panel about-card"><p class="eyebrow">DESIGN RATIONALE</p><h2>Interaction principles</h2><ul><li><strong>Visibility of system status:</strong> display the category, raw keyword points and completion state.</li><li><strong>User control:</strong> allow the user to choose a queue different from the suggestion.</li><li><strong>Progressive disclosure:</strong> keep explanation details behind an explicit control.</li><li><strong>Error recovery and feedback:</strong> reveal the reference answer after commitment and let the user comment on the explanation.</li></ul></section>
    <section class="panel about-card"><p class="eyebrow">DATA & PRIVACY</p><h2>Local-only records</h2><p>Decision and feedback records are saved in the browser's localStorage under <code>${STORAGE_KEY}</code>. They remain on this device unless you export them; clearing the session deletes the local records. Do not enter personal or sensitive information into the comment field.</p><button class="secondary-button" data-action="clear-session" type="button">Clear local session</button></section>
  </div></div>`;
}

function render() {
  renderNav();
  if (appState.view === "case") viewRoot.innerHTML = renderCaseView();
  else if (appState.view === "summary") viewRoot.innerHTML = renderSummaryView();
  else viewRoot.innerHTML = renderAboutView();
}

function handleDecisionSubmit(form) {
  const item = CASES.find((entry) => entry.id === form.dataset.caseId);
  const selected = form.querySelector('input[name="user-decision"]:checked');
  if (!item || !selected || !isValidUserChoice(selected.value, CATEGORIES)) {
    showToast("Choose a support queue before submitting.", "warning");
    return;
  }
  const prediction = predictTicket(item.text);
  const evaluation = evaluateDecision({ userLabel: selected.value, aiLabel: prediction.label, truthLabel: item.truth });
  records[item.id] = {
    caseId: item.id,
    userLabel: selected.value,
    aiLabel: prediction.label,
    aiKeywordPoints: prediction.score,
    aiMarginPoints: prediction.margin,
    explanationViewedBeforeDecision: Boolean(appState.explanationViewedBeforeDecision[item.id]),
    truthLabel: item.truth,
    decisionSubmitted: true,
    decisionSubmittedAt: new Date().toISOString(),
    ...evaluation,
    feedbackSubmitted: false,
    feedbackRating: "",
    feedbackIssues: [],
    feedbackComment: ""
  };
  saveRecords();
  render();
  showToast("Decision saved. The reference answer is now available.");
}

function handleFeedbackSubmit(form) {
  const item = CASES.find((entry) => entry.id === form.dataset.caseId);
  const record = item ? records[item.id] : null;
  const formData = new FormData(form);
  const rating = normaliseFeedbackRating(Boolean(record?.explanationViewedBeforeDecision), formData.get("rating"));
  if (!record?.decisionSubmitted || !rating) {
    showToast("Select a usefulness rating for the explanation you viewed.", "warning");
    return;
  }
  records[item.id] = {
    ...record,
    feedbackSubmitted: true,
    feedbackSubmittedAt: new Date().toISOString(),
    feedbackRating: String(rating),
    feedbackIssues: record.explanationViewedBeforeDecision ? formData.getAll("issue").map(String) : [],
    feedbackComment: String(formData.get("comment") ?? "").trim().slice(0, 500)
  };
  saveRecords();
  render();
  showToast("Feedback saved locally in this browser.");
}

function exportCsv() {
  const rows = Object.values(records).filter((item) => item.decisionSubmitted);
  if (!rows.length) return;
  const headers = ["case_id", "ai_suggestion", "ai_raw_keyword_points", "ai_margin_points", "user_choice", "reference_answer", "user_correct", "ai_correct", "avoided_ai_error", "difficulty", "explanation_viewed_before_decision", "feedback_submitted", "feedback_rating", "feedback_issues", "feedback_comment", "decision_submitted_at"];
  const data = rows.map((record) => {
    const item = CASES.find((entry) => entry.id === record.caseId);
    return [record.caseId, record.aiLabel, record.aiKeywordPoints, record.aiMarginPoints, record.userLabel, record.truthLabel, record.userCorrect, record.aiCorrect, record.avoidedAiError, item?.difficulty ?? "", record.explanationViewedBeforeDecision, record.feedbackSubmitted, record.feedbackRating, (record.feedbackIssues ?? []).join("; "), record.feedbackComment, record.decisionSubmittedAt].map(escapeCsv).join(",");
  });
  const blob = new Blob([[headers.map(escapeCsv).join(","), ...data].join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "explaincheck-session.csv";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resetCase() {
  delete records[appState.activeCaseId];
  delete appState.pendingChoices[appState.activeCaseId];
  delete appState.explanationViewedBeforeDecision[appState.activeCaseId];
  appState.explanationOpen[appState.activeCaseId] = false;
  saveRecords();
  render();
  showToast("This case has been reset for another try.");
}

function clearSession() {
  if (!window.confirm("Clear all ExplainCheck decisions and feedback saved in this browser? This cannot be undone.")) return;
  records = {};
  appState.pendingChoices = {};
  appState.explanationViewedBeforeDecision = {};
  appState.explanationOpen = {};
  saveRecords();
  render();
  showToast("Local session cleared.");
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    appState.view = viewButton.dataset.view;
    render();
    document.querySelector("#main-content").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const caseButton = event.target.closest("[data-case]");
  if (caseButton) {
    appState.activeCaseId = caseButton.dataset.case;
    appState.view = "case";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "toggle-explanation") {
    appState.explanationOpen[appState.activeCaseId] = !appState.explanationOpen[appState.activeCaseId];
    if (appState.explanationOpen[appState.activeCaseId] && !recordFor(appState.activeCaseId)?.decisionSubmitted) {
      appState.explanationViewedBeforeDecision[appState.activeCaseId] = true;
    }
    render();
  } else if (action === "reset-case") resetCase();
  else if (action === "export") exportCsv();
  else if (action === "clear-session") clearSession();
});

document.addEventListener("change", (event) => {
  if (event.target.matches('input[name="user-decision"]')) appState.pendingChoices[appState.activeCaseId] = event.target.value;
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "decision-form") {
    event.preventDefault();
    handleDecisionSubmit(event.target);
  } else if (event.target.id === "feedback-form") {
    event.preventDefault();
    handleFeedbackSubmit(event.target);
  }
});

render();
