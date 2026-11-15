# ExplainCheck v2 — human-centred recommendation and feedback prototype

README prose word count: **644** (includes headings; excludes code blocks and commands).

## Status and scope

ExplainCheck is a **standalone, AI-assisted coursework prototype** of a support-agent decision task. A person reviews six fictional tickets and chooses Billing, Account or Technical support. It does **not** use real customers or a trained AI model.

- **Implemented:** ticket selection, active queue choice, explanation toggle, matched-cue rationale, reference reveal after commitment, local feedback, per-case reset, session summary and CSV export.
- **Simulated:** the AI-like recommendation is a local weighted-keyword rule engine; all scenarios, reference answers, difficulty labels and limitation text are authored examples. Raw points are **not** probabilities, accuracy or calibrated confidence.
- **Not implemented / planned only:** trained model, real support integration, server/database, feedback-based retraining, validated difficulty, participant evaluation or causal claims about usefulness.

## Technology and intelligent behaviour

HTML and CSS render the interface; browser JavaScript ES modules separate scenario data (`cases.js`), weighted keyword rules (`predictor.js`), evaluation (`logic.js`) and interactions (`app.js`). The winner has the highest raw keyword score; ties use a fixed category order. In EC-03 the counts are Billing 6, Account 7 and Technical 0, while the authored reference is Billing. Local `localStorage` saves only this browser's records; CSV export does not upload data.

No API key, external AI provider, framework or runtime dependency is required. Node.js is needed only for the built-in test runner. **ChatGPT assisted creation and revision; it is not an AI service used by the running app.**

## Run and inspect

From the repository root:

```powershell
py -m http.server 8000 --directory app
```

If `py` is unavailable, use `python`. Open `http://localhost:8000`; do not double-click `index.html` because ES modules normally require an HTTP origin. Test EC-03 with its explanation open, then EC-01 without opening it. Submit a queue, give feedback, inspect Session summary and export CSV. Use fictional data only; `Ctrl+C` stops the server.

```powershell
npm test
```

Requires Node.js 18+ (22 recommended). **Eight** unit tests cover prediction, valid choices, rating gating, scenario integrity, summaries and CSV escaping. GitHub Actions runs the same command after a push. See [test record](docs/TEST_RECORD.md) for what was and was not checked.

## Development record and author evidence

See the [decision-by-decision development record](docs/DEVELOPMENT_EVIDENCE.md), the [technical notes](docs/TECHNICAL_NOTES.md) and the [operation guide](docs/RUN_AND_SUBMIT.md). The main change from v1 was correcting three mismatches between the design goal and the UI: no default AI-selected answer, no confidence-like 55–92 number, and no rating of an explanation that was never opened. The new interface instead requires explicit choice, displays all raw scores, and records `explanationViewedBeforeDecision` in the local record and CSV.

The author previously inspected the v1 EC-03 interaction in a browser and shared screenshots of the decision, feedback and summary. Version 2's eight unit tests and a scripted Chromium inspection passed **in the assistant's preparation environment**, not yet on the author's computer. Author-specific test results should be added to the development record only after they are actually observed.

## AI assistance, originality and checks

ChatGPT generated initial HTML/CSS/JavaScript, fictional examples, test drafts, diagrams. The earlier open-source HEAR-UI code was **not copied**. Concrete AI-assisted changes and what their tests checked are listed in [development evidence](docs/DEVELOPMENT_EVIDENCE.md). The author selected this research direction, reviewed v1's live interface and must inspect, adapt and take responsibility for the final submission. 

## Files and submission

- `app/` — runnable prototype; `tests/` — unit tests; `.github/workflows/tests.yml` — CI check.
- `docs/figures/` — editable SVG and PNG architecture diagram and three storyboards.
- `docs/screenshots/` — scripted Chromium inspection images, **not participant observations**.
- `docs/DEVELOPMENT_EVIDENCE.md` — decisions, traceability and author checklist.
- Final Word **project report is submitted separately on Canvas** and links back to this public repository and its selected commit. A separate ZIP/video is unnecessary when all inspectable project files are in the repo.
