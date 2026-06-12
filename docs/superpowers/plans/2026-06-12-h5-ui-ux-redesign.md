# H5 UI UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current promotional-feeling H5 with a cleaner, trustier “职场体检报告” experience and redeploy it to `Rucia616`.

**Architecture:** Keep the existing static single-page app. Update HTML structure, vanilla JS render functions, and CSS tokens/components without changing scoring rules or localStorage behavior.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node built-in test runner, Playwright via bundled Codex runtime, GitHub Pages.

---

## File Structure

- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/index.html`
  - Rebuild home, quiz, result, vault, and emergency page shell for the report-style UX.
- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/app.js`
  - Update result rendering, share poster rendering, prioritized evidence actions, and emergency step UI.
- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/style.css`
  - Replace promotional gradient system with paper/report visual system.
- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/tests/xhs-model.test.mjs`
  - Keep existing model tests passing; add no new framework.

---

### Task 1: Rebuild Page Shell

- [ ] Replace home hero with brand row, report preview, concise value prop, `开始体检`, and emergency text link.
- [ ] Replace result markup with one report module, an action-priority block, and one separate poster module.
- [ ] Keep required IDs: `page-home`, `page-quiz`, `quiz-running`, `quiz-result`, `questionContainer`, `progressFill`, `progressText`, `nextBtn`, `prevBtn`, `resultScore`, `resultLight`, `resultPersona`, `resultDesc`, `resultSignals`, `sharePoster`, `vaultList`, `battleContainer`.
- [ ] Run `node --check app.js`.

### Task 2: Update Rendering UX

- [ ] Update home state copy to match report-style tone.
- [ ] Render quiz as lightweight report intake with fixed bottom actions.
- [ ] Render result report with score, light, persona, desc, top 3 signals, and top 3 actions.
- [ ] Render share poster as compact 小红书 cover, not a duplicate report.
- [ ] Render vault with priority actions first and subdued notes.
- [ ] Render emergency mode as step-by-step calm cards.
- [ ] Run `node --check app.js` and `node --test tests/xhs-model.test.mjs`.

### Task 3: Apply Visual System

- [ ] Replace full-screen purple/orange gradient with paper-white report system.
- [ ] Use red only for CTA/status emphasis, not as whole-page atmosphere.
- [ ] Make 375x812 home show full primary CTA.
- [ ] Make result report and share card visually distinct.
- [ ] Make vault first screen communicate “先存这 3 项”.
- [ ] Run `rg -n "report-hero|result-report|priority-actions|share-poster|sticky-actions" style.css`.

### Task 4: Verify And Deploy

- [ ] Start local static server.
- [ ] Use Playwright to verify home, 9-question quiz, result report, share action, priority vault, emergency mode, localStorage persistence, and no horizontal overflow on 375/390/430/1280 widths.
- [ ] Commit implementation.
- [ ] Push `main` to `Rucia616/layoff-helper`.
- [ ] Wait for GitHub Pages build.
- [ ] Verify `https://rucia616.github.io/layoff-helper/` with Playwright.

---

## Self-Review

- Spec coverage: Home, quiz, result report, share card, priority evidence, emergency mode, local verification, and `Rucia616` deployment are covered.
- Incomplete-marker scan: no unresolved work markers.
- Type consistency: existing test helper names remain unchanged.
