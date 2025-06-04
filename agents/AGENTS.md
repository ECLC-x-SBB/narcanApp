# AGENTS.md

> This document declares the AI “agents” (powered by OpenAI’s Codex/ChatGPT) that will assist in developing and maintaining the Narcan App. Each agent has a specific role, set of responsibilities, and guidelines for interacting with the codebase, tests, and documentation.

---

## 1. Purpose

We want to automate common development tasks—code generation, refactoring, bug fixing, styling, tests, documentation—by delegating to Codex agents. This file explains:

1. **Which agents exist**  
2. **What each agent’s responsibilities are**  
3. **How to invoke them (in prompts, CLI scripts, or GitHub Actions)**  
4. **Examples of inputs/outputs**

---

## 2. Agent Definitions

### 2.1. `DevAgent`

- **Role**:  
  - The primary “developer” assistant.  
  - Writes new features, refactors existing code, and responds to code‐specific questions.  
- **Capabilities**:  
  - Understands the entire Narcan App codebase (HTML, CSS, JS, Google Apps Script).  
  - Can propose and apply code changes, generate new files, update routing logic, and wire up forms to backend.  
  - Follows the project’s coding conventions:  
    - Uses Modern JavaScript (ES6+).  
    - Tailwind/utility‐first CSS (if applicable), otherwise plain CSS with the existing variable themes.  
    - Adheres to existing file/folder structure (e.g. `index.html`, `styles.css`, `app.js`, `Code.gs`).  
  - Generates unit tests or end‐to‐end tests when requested.  
- **When to use**:  
  - Adding a new page (e.g. “Volunteer” form).  
  - Refactoring service worker or manifest logic.  
  - Fixing merge conflicts or Git issues.  
  - Any time you’d ask “how do I implement X feature?” or “write me a JavaScript function that…”.

---

### 2.2. `UIStylingAgent`

- **Role**:  
  - The “designer” assistant.  
  - Adjusts look & feel: colors, typography, layout, responsiveness, PWA styling (install button, splash screens).  
- **Capabilities**:  
  - Works within existing CSS variables (`--mint-green`, `--teal`, etc.) and font‐face setup (`Inter Variable`, `Inter Text`, `Inter Display`).  
  - Can write or modify CSS/HTML so that design stays consistent and modern (glassmorphism, 2xl rounded corners, soft shadows, etc.).  
  - Knows how to tune animations (ripple effects, fade‐ins) and should reference design system specs if provided.  
- **When to use**:  
  - “Make the volunteer form match the glass‐card style used elsewhere.”  
  - “Adjust the dropdown arrow color to #002B56 and center aligned.”  
  - “Create a light/dark mode toggle.”  
  - “Refine the CSS to remove unwanted borders/outlines on focus.”

---

### 2.3. `BackendAgent`

- **Role**:  
  - The “server” assistant for Apps Script and Google Sheets integrations.  
  - Makes sure form submissions arrive in the correct sheet, that `MailApp.sendEmail` works, and that read/write permissions are correct.  
- **Capabilities**:  
  - Understands Google Apps Script (JavaScript flavor with `SpreadsheetApp`, `MailApp`, `ContentService`).  
  - Can create new sheets, update `doPost(e)` logic, write custom error handling, and debug server‐side logging.  
  - Knows to redeploy the “Web App” whenever server code changes.  
- **When to use**:  
  - “Add volunteer signup handling to `doPost(e)`.”  
  - “Fix the `resetTestData()` function to preserve headers.”  
  - “Send an email to `emeraldcoastlifecenter@gmail.com` with formatted volunteer data.”  
  - “How do I enable `no-cors` mode?” or “Explain why my `fetch()` call returns a CORS error.”

---

### 2.4. `TestAgent`

- **Role**:  
  - The “quality assurance” assistant.  
  - Generates unit tests or integration tests (e.g. for AppScript logic or front‐end validation).  
- **Capabilities**:  
  - Can write Jasmine/Mocha style JS tests for client‐side code.  
  - Can write Google Apps Script “fake” objects or use the `google-apps-script` NPM emulator to test `doPost(e)` logic.  
  - Can suggest manual testing checklists: cross‐browser, mobile device, PWA install flows, iOS “Add to Home Screen” prompts, offline caching.  
- **When to use**:  
  - “Write a test for `resetTestData()` that ensures only rows 3+ are cleared.”  
  - “Validate that `handleVolunteer()` always sets the correct headers.”  
  - “List steps to verify the ‘Install’ button appears on iOS Safari.”

---

## 3. How to Invoke These Agents

You typically speak to Codex in one of two ways:

1. **GitHub Copilot (in-IDE prompts)**  
   - Comment in your code:  
     ```js
     // ASSIST: DevAgent → Add volunteer signup endpoint here
     function handleVolunteer(params) {
       // …
     }
     ```
   - Copilot (GPT-powered) will fill in the implementation.

2. **OpenAI CLI / Playground / ChatGPT**  
   - Copy‐paste relevant file snippets + **“AGENTS.md → DevAgent”** instructions at top.  
   - Then ask:  
     > “DevAgent: Please extend `doPost(e)` so that `formType=volunteer` writes to the existing ‘Volunteers’ sheet and sends an email to emeraldcoastlifecenter@gmail.com.”

3. **GitHub Actions Workflow (Automated code checks)**  
   - You can set up a workflow that runs a script like:  
     ```yaml
     name: “Run DevAgent Tests”

     on: [push, pull_request]
     jobs:
       codex-lint:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v2
           - name: “Invoke TestAgent for doPost(e) tests”
             run: |
               # Pseudocode: run a script that calls ChatGPT with `AGENTS.md + doPost` 
               # and expects certain unit tests to pass
     ```
   - (This requires custom tooling to wrap around OpenAI’s API.)

---

## 4. Directory Structure & Conventions

The Narcan App repo looks roughly like this:

/ (root)
├─ index.html
├─ styles.css
├─ app.js
├─ sw.js
├─ manifest.json
├─ assets/
│ ├─ fonts/
│ ├─ icons/
│ └─ images/
├─ agents/ ← you could place individual agent prompt snippets here
│ └─ AGENTS.md ← this file
├─ Code.gs ← Google Apps Script server code
├─ tests/ ← unit/integration tests (Mocha, Jasmine, or clasp‐emulator)
│ ├─ client/
│ └─ server/
└─ README.md

### Conventions

- **All `.form-container` HTML lives in `index.html`**, under different `<div id="…-page" class="page">` sections.  
- **Styles in `styles.css`** rely on CSS variables and “utility” classes. Agents must not overwrite variables (e.g. `--mint-green`), only reference them.  
- **JavaScript in `app.js`** handles client‐side routing (`showPage(pageId)`), PWA prompt logic, ripple animations, and `fetch()` calls.  
- **Server code in `Code.gs`** is compiled & deployed as a single “Web App.” Agents should treat it like one file, editing `doPost(e)` in place.  
- **Tests live in `tests/`**—when writing new tests, follow the existing naming (`*.test.js` or `*.test.gs`).

---

## 5. Examples of Usage

### 5.1. “Add a volunteer field to `doPost(e)`”

**Prompt to DevAgent**:  
> DevAgent: The `doPost(e)` function currently handles `formType=pickup` and `formType=report`. Please add a `formType=volunteer` branch that writes `[Timestamp, name, email, phone, experience]` to the existing “Volunteers” sheet. Also send an email to `emeraldcoastlifecenter@gmail.com` containing a summary of the volunteer data. Assume the volunteer form has fields `name`, `email`, `phone`, and `experience` (optional). Keep all other logic unchanged.

**Expected Result**:  
Codex edits `Code.gs` so `doPost(e)` becomes exactly as shown in Section 2. It appends to the “Volunteers” sheet and calls `MailApp.sendEmail()`.

### 5.2. “Fix the disappearing ripple effect”

**Prompt to UIStylingAgent**:  
> UIStylingAgent: The ripple `<span>` is being appended but not visible during navigation because the `showPage()` function hides the container too quickly. Please adjust the JavaScript so that the new page fades in over 1s, and delay the container’s `display: none` until after the ripple’s animation ends. Keep the existing ripple CSS intact.

**Expected Result**:  
Codex edits `showPage(pageId)` in `app.js` to:

```js
function showPage(pageId) {
  const current = document.querySelector('.page.active');
  if (current) {
    current.classList.remove('active');
  }
  const next = document.getElementById(pageId);
  next.classList.add('active', 'fade-in');
  next.addEventListener(
    'animationend',
    () => next.classList.remove('fade-in'),
    { once: true }
  );
}
```
And the CSS uses @keyframes fadeIn = 1000ms. The ripple is now visible before the page content switches.

5.3. “Generate unit tests for resetTestData()”
Prompt to TestAgent:

TestAgent: Write a unit test in Google Apps Script (GS) that ensures resetTestData() clears only rows 3 and below (i.e., leaves rows 1–2 untouched) for the “Pick Up” sheet. Use SpreadsheetApp.openById() pointing to a mock/fake test spreadsheet or demonstrate how to stub the sheet for testing.

Expected Result:
Codex produces tests/server/resetTestData.test.gs with a test like:
```js
function testResetTestDataLeavesHeadersIntact() {
  // 1) Create a temporary spreadsheet with 5 rows
  const ss = SpreadsheetApp.create('ResetTest');
  const sheet = ss.insertSheet('Pick Up');
  sheet.appendRow(['Header1','Header2','Header3']); // row1
  sheet.appendRow(['A','B','C']);                   // row2
  sheet.appendRow([1,2,3]);                          // row3
  sheet.appendRow([4,5,6]);                          // row4
  sheet.appendRow([7,8,9]);                          // row5

  // 2) Run the function
  resetTestData();

  // 3) Assert that `getLastRow()` is now 2
  if (sheet.getLastRow() !== 2) {
    throw new Error('resetTestData failed—rows not cleared correctly');
  }
}
```
## 6. Adding or Updating Agents
To create a brand‐new agent, give it a name (e.g. SecurityAgent) and add a new section under “## 2. Agent Definitions” describing its role, capabilities, and when to use it.

To modify an existing agent (e.g. UIStylingAgent), update that section in AGENTS.md. Agents communicate best when you keep instructions concise, list specific responsibilities, and point out coding conventions to follow.

Always include at least one concrete example of “Prompt → Expected result” so Codex can calibrate its output.

## 7. Best Practices & Tips
Be as specific as possible when assigning tasks: mention file paths, function names, and variable names.

Preserve existing styles (colors, fonts, and layout) unless asked otherwise.

If a task might break something, ask follow‐up questions: e.g. “Do you want me to run a Lighthouse audit after changes?”

Version control your Agents file: whenever you learn an agent doesn’t follow instructions exactly, update this file so future calls produce better results.

Use !important sparingly in CSS instructions—only if you truly need to override something deeply inherited.

