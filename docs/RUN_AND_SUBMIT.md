# Run, inspect and submit ExplainCheck v2

1. Unzip the project and open the **inner `explaincheck-v2` folder** in VS Code. `package.json`, `app/`, `docs/` and `tests/` must all be visible at its root.
2. Open a terminal in that root. On Windows use `py -m http.server 8000 --directory app`, or `python -m http.server 8000 --directory app` if `py` is unavailable.
3. Open `http://localhost:8000` in Edge/Chrome. Keep the terminal open.
4. Try EC-03. Confirm no queue is preselected. View the three raw category points, reveal the explanation, choose Billing, submit, rate the explanation, and inspect the result.
5. Try EC-01 *without* opening the explanation. Submit Billing; confirm that the usefulness scale is replaced by a `Not viewed` message.
6. Open Session summary and Export CSV. Check the column `explanation_viewed_before_decision` and that records remain after refreshing the page. Do not use real customer data.
7. In another terminal run `npm test` (requires Node 18+, preferably Node 22). Confirm eight unit tests pass. Stop the server with Ctrl+C when finished.
8. Create a **new public** GitHub repository, e.g. `explaincheck-v2`. Upload the files inside the project directory at the repository root (not a single ZIP and not an extra nested folder). Include `.github/` so GitHub Actions can run the tests. Verify that `README.md` renders and `app/`, `docs/`, `tests/`, `.gitignore`, `.github/` and `package.json` are present.
9. Copy the actual new repository URL and the final commit URL into both locations marked `REPLACE AFTER UPLOAD` in the Word report. The `README` link must point to the **new repository**.
10. Submit **one final Word project report** containing public repository and README URLs. An extra ZIP and video are unnecessary if everything can reasonably live in the repository. Follow any Canvas-specific upload-format instruction if it differs.

The README also documents AI assistance, boundaries, source status and the difference between actual checks and checks still required of the author.
