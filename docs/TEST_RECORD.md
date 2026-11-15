# Test record — version 2

Date: 2026-11-15. Environment: prepared project in the assistant's sandbox, Node.js 22 and headless Chromium.

| Check | Method | Result |
|---|---|---|
| Eight logic/validation tests | `npm test` with `node:test` | PASS (8/8) |
| Start with no preselected decision | Chromium in-memory harness | PASS |
| Submit without choice shows warning | Chromium in-memory harness | PASS |
| EC-03 explanation, correction and result | Chromium in-memory harness | PASS |
| Seen-before-decision rating branch | Chromium in-memory harness | PASS |
| EC-01 unseen-explanation branch | Chromium in-memory harness | PASS (`not-viewed`) |
| Local record and 2-row session summary | Chromium in-memory harness | PASS |
| CSV download contains exposure and raw-score fields | Chromium in-memory harness | PASS |
| Page JavaScript errors | Event listener in Chromium harness | None observed |
| User's own Windows browser and final GitHub version | **Not tested in this record** | TO CHECK BY AUTHOR |

The Chromium harness loaded the same static HTML/CSS/JS files in-memory because navigation to localhost was blocked in this sandbox. It does not establish deployed-site operation or usability effectiveness.
