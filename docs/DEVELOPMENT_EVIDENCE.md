# Development decisions and evidence

This document describes **actual design changes** between the first standalone ExplainCheck prototype and version 2. It is not a claim of seven independent coding stages or a recreated Git history. The user previously reviewed version 1 in their browser and provided screenshots of the EC-03 outcome, feedback and local session table. 

| Decision / observed issue in v1 | v2 change | Rationale / trade-off | Where to inspect |
|---|---|---|---|
| AI recommendation preselected a user choice | All three radio options start blank; no selection means no submission | Prioritise active human choice over one-click speed | `app/src/app.js` `renderDecisionOptions`, `handleDecisionSubmit`; tests |
| 55–92 mapped rule score resembled AI confidence | Show raw keyword points for all three queues; remove percentage-like bar | Explain the true calculation; less visual simplicity than one number | `app/src/predictor.js`, `app/src/app.js`; EC-03 is Billing 6, Account 7, Technical 0 |
| Explanation could be rated without opening it | Track whether explanation was opened **before** decision | Avoid collecting a misleading usefulness rating | `app/src/app.js` `explanationViewedBeforeDecision`, `renderFeedback` |
| Feedback rating falsely implied all users saw cues | Unviewed path records `not-viewed` without a rating scale | Separates exposure from subjective perception | `app/src/logic.js` `normaliseFeedbackRating`; browser screenshot 04 |
| Original record omitted exposure and raw points | Include both in browser record, summary and CSV | Keeps the demonstration inspectable; not research-grade measurement | CSV header in `app/src/app.js`, screenshot 05 |
| Broad architecture and report wording | Revised figures, storyboards, explicit non-implemented list | Keep project explanation consistent with submitted source | `docs/figures/*`, updated report |

## Technical checks already run during preparation

- `npm test`: **8 passed, 0 failed** on Node.js v22, using the built-in `node:test` runner.
- Chromium interaction check: **passed in an isolated in-memory HTML/JS browser harness**, including no-preselection, invalid-submission warning, EC-03 correction, explanation-viewed feedback, EC-01 not-viewed feedback, session summary, CSV contents and storage values. No page-level JavaScript errors observed.
- The sandbox browser could not navigate to a local HTTP URL, so the automated browser harness used the same standalone HTML, stylesheet and JavaScript loaded in memory. This is **not evidence that a deployed server or the author's own PC was tested**.
- Screenshots in `docs/screenshots/` come from that scripted inspection; they are not photographs of participant behaviour.

## Author verification before final submission

- [√] Run the actual project locally with a Python HTTP server and check the browser layout.
- [√] Run `npm test` in the final checkout; keep a screenshot or record the outcome.
- [√] Test EC-03: no default selection, open explanation, choose Billing, rate usefulness and confirm local record.
- [√] Test EC-01 without opening explanation: confirm `Not viewed` rather than a rating scale.
- [√] Export CSV and verify `explanation_viewed_before_decision` and raw-point columns.
- [√] Ensure README, project files and report refer to the final repository URL and selected commit.

