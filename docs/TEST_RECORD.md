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
| User's own Windows browser and final GitHub version | **Not tested in this record** | PASS — verified on Windows, 2026-11-15 |

The Chromium harness loaded the same static HTML/CSS/JS files in-memory because navigation to localhost was blocked in this sandbox. It does not establish deployed-site operation or usability effectiveness.


## Independent Windows verification — 2026-11-15

Environment: Windows, VS Code PowerShell, Node.js, npm 11.20.0, local browser and Python HTTP server.

| Test | Observed result |
|---|---|
| Unit tests | PASS — 8 passed, 0 failed |
| EC-02 without viewing explanation | PASS — Not viewed recorded |
| EC-02 incorrect user decision | PASS — review required |
| EC-03 with explanation viewed | PASS — viewed flag recorded |
| EC-03 correction to Billing | PASS — user correct, AI incorrect |
| Feedback storage | PASS — both records saved |
| Session summary | PASS — two cases, one correct decision, one avoided AI error |
| CSV export | PASS — two rows, exposure flags and raw scores verified |

I independently ran the application and inspected its output on Windows. These checks confirm prototype behaviour, not effectiveness in a real user study.
