# Xiaohongshu H5 Interactive Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Xiaohongshu-style H5 funnel for 职场降落伞, verify it locally, then deploy the finished static app through GitHub.

**Architecture:** Keep the product as a static single-page app with `index.html`, `style.css`, and `app.js`. Move the first screen from tool navigation to a viral risk-test funnel, keep scoring and localStorage in vanilla JavaScript, and make the result poster a real interactive section instead of a static mockup.

**Tech Stack:** HTML, CSS, vanilla JavaScript, localStorage, Node built-in test runner, local static server, Git/GitHub.

---

## File Structure

- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/index.html`
  - Owns semantic page structure, mobile app shell, H5 hero, quiz page, result/poster page, evidence checklist, emergency guide, and legal footer.
- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/style.css`
  - Owns the full visual system: Xiaohongshu red, warm paper background, compact cards, poster styling, responsive rules, focus states, and reduced-motion behavior.
- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/app.js`
  - Owns quiz data, scoring, route changes, result rendering, share copy, localStorage persistence, evidence checklist, emergency guide, and compensation calculation.
- Create: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/tests/xhs-model.test.mjs`
  - Uses Node's built-in test runner to guard risk-band mapping, share-copy generation, signal truncation, and compensation math.
- Modify: `/Users/linsen/Desktop/职场降落伞/裁员大礼包/layoff-helper/.gitignore`
  - Keeps visual companion runtime files out of commits.

---

### Task 1: Add Logic Tests And Repository Guard

**Files:**
- Create: `tests/xhs-model.test.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing model test**

Create `tests/xhs-model.test.mjs` with this content:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadApp() {
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const classList = {
    add() {},
    remove() {},
    toggle() {},
    contains() { return false; },
  };
  const element = {
    classList,
    style: {},
    dataset: {},
    disabled: false,
    value: '',
    innerHTML: '',
    textContent: '',
    setAttribute() {},
    getAttribute() { return ''; },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  const document = {
    addEventListener() {},
    querySelector() { return element; },
    querySelectorAll() { return []; },
    getElementById() { return element; },
  };
  const storage = new Map();
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  };
  const window = {
    addEventListener() {},
    scrollTo() {},
    matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; },
  };
  const sandbox = {
    console,
    document,
    window,
    localStorage,
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout,
    clearTimeout,
    requestAnimationFrame(callback) { callback(); },
  };
  vm.runInNewContext(`${source}\n;globalThis.__APP_TEST__ = { getRiskBand, getResultProfile, getTopSignals, getShareCopy, getCompensationNumbers, QUESTIONS };`, sandbox);
  return sandbox.__APP_TEST__;
}

test('risk band boundaries map to green, yellow, and red', () => {
  const app = loadApp();
  assert.equal(app.getRiskBand(39), 'green');
  assert.equal(app.getRiskBand(40), 'yellow');
  assert.equal(app.getRiskBand(69), 'yellow');
  assert.equal(app.getRiskBand(70), 'red');
});

test('yellow result uses the approved shareable persona', () => {
  const app = loadApp();
  const profile = app.getResultProfile(64);
  assert.equal(profile.light, '黄灯');
  assert.equal(profile.persona, '绩效安全，但公司危险型');
  assert.match(app.getShareCopy(profile), /黄灯/);
  assert.match(app.getShareCopy(profile), /降落伞/);
});

test('share result only exposes three featured signals', () => {
  const app = loadApp();
  assert.deepEqual(app.getTopSignals(['A', 'B', 'C', 'D'], 3), ['A', 'B', 'C']);
});

test('h5 quiz stays lightweight', () => {
  const app = loadApp();
  assert.ok(app.QUESTIONS.length >= 8);
  assert.ok(app.QUESTIONS.length <= 9);
});

test('compensation helper rounds years according to labor compensation rules', () => {
  const app = loadApp();
  assert.deepEqual(app.getCompensationNumbers(2.3, 10000), {
    nMonths: 2.5,
    n: 25000,
    n1: 35000,
    n2: 50000,
  });
  assert.deepEqual(app.getCompensationNumbers(2.5, 10000), {
    nMonths: 3,
    n: 30000,
    n1: 40000,
    n2: 60000,
  });
  assert.equal(app.getCompensationNumbers(0, 10000), null);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node --test tests/xhs-model.test.mjs
```

Expected: FAIL with `getRiskBand is not defined` or another missing helper error.

- [ ] **Step 3: Update `.gitignore`**

Set `.gitignore` to:

```gitignore
Product-Spec.md
.superpowers/
```

- [ ] **Step 4: Verify repository guard**

Run:

```bash
git status --short
```

Expected: `.superpowers/` no longer appears in the status output.

- [ ] **Step 5: Do not commit this task yet**

Keep the failing test uncommitted until Task 2 implements the helpers and the test passes.

---

### Task 2: Replace Static Product Shell With Interactive H5 Shell

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] **Step 1: Replace `index.html` with the H5 page structure**

Use these required IDs because `app.js` depends on them:

```html
<section id="page-home" class="page active">
  <div class="h5-hero">
    <p class="hero-kicker">职场热测</p>
    <h1>你的职场降落伞打开了吗？</h1>
    <p class="hero-copy">测一测：未来一段时间，你该不该提前备战裁员。</p>
    <div class="hero-trust">
      <span>不上传数据</span>
      <span>只给你自己看</span>
      <span>可生成结果卡</span>
    </div>
    <button class="btn btn-primary" onclick="startQuiz()">开始 2 分钟自测</button>
    <button class="link-button" onclick="openEmergency()">已经被约谈？直接看应对</button>
  </div>

  <section class="feed-card result-teaser">
    <div>
      <span class="note-label">朋友测出来的类型</span>
      <h2>绩效安全，但公司危险型</h2>
      <p>不是制造焦虑，是提醒自己别空手上谈判桌。</p>
    </div>
    <div class="teaser-score">64</div>
  </section>

  <section class="tool-bridge">
    <h2>测完不是结束，真正有用的是准备</h2>
    <div class="bridge-grid">
      <button class="mini-card" onclick="startQuiz()">
        <span>01</span>
        <strong>裁员可能性自测</strong>
        <small>先判断现在是不是备战窗口</small>
      </button>
      <button class="mini-card" onclick="openVault()">
        <span>02</span>
        <strong>我的降落伞清单</strong>
        <small>合同、流水、绩效沟通先存好</small>
      </button>
      <button class="mini-card urgent" onclick="openEmergency()">
        <span>03</span>
        <strong>被约谈了，先别签</strong>
        <small>按步骤稳住，别当场交底牌</small>
      </button>
    </div>
  </section>
</section>
```

The final file must also include these pages:

```html
<section id="page-quiz" class="page">...</section>
<section id="page-vault" class="page">...</section>
<section id="page-battle" class="page">...</section>
<footer class="disclaimer">本工具提供参考信息，不构成法律意见。所有数据仅存于本机，不上传。</footer>
```

Inside `page-quiz`, include a result area with these IDs:

```html
<div id="quiz-result" class="hidden">
  <article class="result-note">
    <p id="resultKicker" class="note-label">我的结果</p>
    <div class="result-scoreline">
      <strong id="resultScore">0</strong>
      <span id="resultLight">黄灯</span>
    </div>
    <h2 id="resultPersona"></h2>
    <p id="resultDesc"></p>
    <div id="resultSignals" class="signal-list"></div>
    <div class="result-actions">
      <button class="btn btn-primary" onclick="scrollToPoster()">生成我的结果卡</button>
      <button class="btn btn-secondary" onclick="openVaultFromResult()">开始存证据</button>
    </div>
  </article>

  <article id="sharePoster" class="share-poster">
    <p class="poster-kicker">职场降落伞测试</p>
    <h2 id="posterPersona">绩效安全，但公司危险型</h2>
    <div class="poster-score"><span id="posterLight">黄灯</span><strong id="posterScore">64</strong></div>
    <p id="posterLine">现在是最佳备战窗口。</p>
    <div class="poster-footer">
      <span>职场降落伞</span>
      <span class="qr-box">链接</span>
    </div>
  </article>
  <button class="btn btn-primary" onclick="copyShareText()">复制分享文案</button>
  <button class="btn btn-secondary" onclick="savePosterGuide()">怎么保存结果卡</button>
  <p id="shareStatus" class="share-status" aria-live="polite"></p>
</div>
```

- [ ] **Step 2: Add navigation wrappers to `app.js`**

Add these functions near the existing routing functions:

```js
function startQuiz() {
  showPage('page-quiz');
  initQuiz();
}

function openVault() {
  showPage('page-vault');
  renderVault();
}

function openVaultFromResult() {
  showPage('page-vault');
  renderVault(getVaultPriorityIds());
}

function openEmergency() {
  showPage('page-battle');
  renderBattle();
}

function scrollToPoster() {
  const poster = document.getElementById('sharePoster');
  if (poster) poster.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

- [ ] **Step 3: Run syntax check**

Run:

```bash
node --check app.js
```

Expected: no output and exit code 0.

---

### Task 3: Implement H5 Quiz Model, Result Profiles, And Share Copy

**Files:**
- Modify: `app.js`
- Test: `tests/xhs-model.test.mjs`

- [ ] **Step 1: Replace the quiz question set with 9 H5 questions**

Use this array for `QUESTIONS`:

```js
const QUESTIONS = [
  { dim:'A', title:'公司最近半年有没有裁员、撤部门或悄悄缩编？',
    options:[['没听说，整体稳定',0],['有传闻，但还没落到身边',2],['其他团队已经有人走了',3],['我所在团队已经开始动了',4]] },
  { dim:'A', title:'最近公司有没有这些风向：停招、砍福利、降薪、缓发工资？',
    options:[['都没有',0],['开始停招或控预算',1],['福利、奖金或薪资被动过',3],['已经缓发、欠薪或强制降本',4]] },
  { dim:'A', title:'你所在业务线现在像什么状态？',
    options:[['核心业务，还在加人',0],['稳定运行',1],['资源减少，存在感变低',3],['传出要合并或砍掉',4]] },
  { dim:'B', title:'你的最近一次绩效或反馈怎么样？',
    options:[['优秀或明确被认可',0],['正常，没有异常',1],['被提醒过表现问题',3],['已经被约谈或进入 PIP',4]] },
  { dim:'B', title:'你最近有没有被边缘化的感觉？',
    options:[['没有，工作节奏正常',0],['有一点，但还能解释',1],['重要事情不太带我了',3],['权限、项目或汇报线明显被收走',4]] },
  { dim:'B', title:'你的岗位在公司里好替代吗？',
    options:[['很稀缺，离不开我',0],['有门槛，不算容易替代',1],['普通岗位，替代成本不高',3],['职责重叠，已经有人能接',4]] },
  { dim:'C', title:'你所在行业最近的裁员和收缩消息多吗？',
    options:[['不多，机会还挺多',0],['偶尔看到',1],['明显变多',3],['同行、大厂都在收缩',4]] },
  { dim:'D', title:'最近有没有出现异常信号：移出群、权限被收、会议不带你？',
    options:[['没有',0],['有一两件小事',2],['出现了好几项',3],['多项同时发生，而且解释不清',4]] },
  { dim:'D', title:'你的直属领导或团队气氛最近有什么变化？',
    options:[['沟通正常',0],['略紧张，但还稳定',1],['明显变冷淡或回避关键问题',3],['已经有人陆续离开或被单独约谈',4]] },
];
```

- [ ] **Step 2: Add the result profile helpers**

Add these helpers before `showQuizResult()`:

```js
const RESULT_PROFILES = {
  green: {
    band: 'green',
    light: '绿灯',
    label: '绿灯 · 风险较低',
    color: '#2FA66A',
    persona: '安全垫还在，但别空手上班型',
    desc: '目前信号整体平稳，但职场里的安全感不能只靠运气。现在用很低成本把基础证据存好，会让你以后更从容。',
    posterLine: '现在适合低成本准备，把合同、流水和关键沟通先收好。',
    shareLine: '安全垫还在，但我决定先把证据存好。',
  },
  yellow: {
    band: 'yellow',
    light: '黄灯',
    label: '黄灯 · 风险升高',
    color: '#F5A524',
    persona: '绩效安全，但公司危险型',
    desc: '你的个人表现未必是核心问题，但公司、业务线或团队氛围已经有信号。现在是最佳备战窗口。',
    posterLine: '别慌，现在开始存证据，还来得及把主动权拿回来。',
    shareLine: '绩效还稳，但公司信号有点危险。',
  },
  red: {
    band: 'red',
    light: '红灯',
    label: '红灯 · 高风险',
    color: '#E5484D',
    persona: '信号叠满，马上备战型',
    desc: '多个高风险信号同时出现。先稳住，不要当场签任何字，优先补齐证据，再看约谈应对。',
    posterLine: '先别签，先留证据，谈判桌上不要空手上场。',
    shareLine: '信号有点满，我先给自己备个降落伞。',
  },
};

function getRiskBand(score) {
  if (score <= 39) return 'green';
  if (score <= 69) return 'yellow';
  return 'red';
}

function getResultProfile(score) {
  return RESULT_PROFILES[getRiskBand(score)];
}

function getTopSignals(triggered, limit = 3) {
  return triggered.slice(0, limit);
}

function getShareCopy(profile) {
  return `我测出来是${profile.light}：${profile.shareLine} 不是制造焦虑，是提醒自己别空手上谈判桌。测测你的职场降落伞打开了吗？`;
}

function getVaultPriorityIds() {
  return ['contract', 'payroll', 'perf'];
}

function getCompensationNumbers(years, salary) {
  if (!years || !salary || years <= 0 || salary <= 0) return null;
  const fullYears = Math.floor(years);
  const remainder = years - fullYears;
  let nMonths = fullYears;
  if (remainder >= 0.5) nMonths += 1;
  else if (remainder > 0) nMonths += 0.5;
  const n = Math.round(nMonths * salary);
  return {
    nMonths,
    n,
    n1: Math.round(n + salary),
    n2: Math.round(n * 2),
  };
}
```

- [ ] **Step 3: Refactor `showQuizResult()`**

The function must:

```js
const { final, dimNorm, triggered } = calcScore();
const profile = getResultProfile(final);
const topSignals = getTopSignals(triggered, 3);
lastResult = { final, profile, topSignals, dimNorm };
localStorage.setItem(RESULT_KEY, JSON.stringify(lastResult));
```

Then render:

```js
document.getElementById('resultScore').textContent = final;
document.getElementById('resultLight').textContent = profile.light;
document.getElementById('resultPersona').textContent = profile.persona;
document.getElementById('resultDesc').textContent = profile.desc;
document.getElementById('posterScore').textContent = final;
document.getElementById('posterLight').textContent = profile.light;
document.getElementById('posterPersona').textContent = profile.persona;
document.getElementById('posterLine').textContent = profile.posterLine;
```

Render signals with:

```js
const signalBox = document.getElementById('resultSignals');
signalBox.innerHTML = topSignals.length
  ? topSignals.map((item, index) => `<div class="signal-pill"><span>${index + 1}</span>${item}</div>`).join('')
  : '<div class="signal-pill"><span>1</span>未触发明显高危信号，继续保持关注即可。</div>';
```

- [ ] **Step 4: Add share actions**

Add:

```js
function copyShareText() {
  const status = document.getElementById('shareStatus');
  const text = lastResult ? getShareCopy(lastResult.profile) : '测测你的职场降落伞打开了吗？';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      if (status) status.textContent = '分享文案已复制，可以发给朋友或贴到小红书。';
    }).catch(() => {
      if (status) status.textContent = text;
    });
    return;
  }
  if (status) status.textContent = text;
}

function savePosterGuide() {
  const status = document.getElementById('shareStatus');
  if (status) status.textContent = '长按或截图保存上方结果卡。结果卡不会展示你的具体答案。';
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
node --check app.js
node --test tests/xhs-model.test.mjs
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add .gitignore index.html app.js tests/xhs-model.test.mjs
git commit -m "Build interactive Xiaohongshu H5 funnel"
```

---

### Task 4: Redesign Evidence Checklist And Emergency Guide

**Files:**
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Rename visible tool surfaces**

Use:

```html
<span class="topbar-title">我的降落伞清单</span>
<span class="topbar-title">被约谈了，先别签</span>
```

- [ ] **Step 2: Update `renderVault()` signature**

Use:

```js
function renderVault(priorityIds = []) {
  const data = loadVault();
  let html = '';
  EVIDENCE_ITEMS.forEach(item => {
    const rec = data[item.id] || { done:false, note:'' };
    const priority = priorityIds.includes(item.id);
    html += `<div class="vault-item ${rec.done ? 'done' : ''} ${priority ? 'priority' : ''}" id="vault-${item.id}">
      <div class="vault-item-top" onclick="toggleVault('${item.id}')">
        <div class="vault-check">${rec.done ? '✓' : ''}</div>
        <div class="vault-item-text">
          <div class="vault-title-row">
            <h4>${item.name}</h4>
            ${priority ? '<span>优先</span>' : ''}
          </div>
          <p>${item.why}</p>
        </div>
      </div>
      <textarea class="vault-note" rows="1" placeholder="我存在哪里了？例如：手机相册 / 网盘 / 邮箱备份"
        onchange="updateNote('${item.id}', this.value)">${rec.note || ''}</textarea>
    </div>`;
  });
  document.getElementById('vaultList').innerHTML = html;
  updateVaultProgress();
}
```

- [ ] **Step 3: Update `updateVaultProgress()` copy**

Use:

```js
if (pct === 0) tip.textContent = '先存最关键的三样：劳动合同、工资流水、绩效和沟通记录。';
else if (pct < 100) tip.textContent = `你的降落伞已经打开 ${pct}%。每多存一项，谈判桌上就少一点慌。`;
else tip.textContent = '降落伞清单已满格。真遇到约谈，你会比大多数人更有底气。';
```

- [ ] **Step 4: Refactor compensation calculation to use helper**

Inside `calcCompensation()`, replace the calculation block with:

```js
const result = getCompensationNumbers(years, salary);
if (!result) {
  box.innerHTML = `<p class="form-error">请填写有效的年限和月薪。</p>`;
  return;
}
const fmt = v => '¥' + Math.round(v).toLocaleString();
box.innerHTML = `
  <div class="calc-result">
    <div class="calc-row"><span class="label">补偿月数 N</span><span class="val">${result.nMonths} 个月</span></div>
    <div class="calc-row highlight"><span class="label">法定底线 N</span><span class="val">${fmt(result.n)}</span></div>
    <div class="calc-row"><span class="label">未提前通知 N+1</span><span class="val">${fmt(result.n1)}</span></div>
    <div class="calc-row highlight"><span class="label">违法解除争取 2N</span><span class="val">${fmt(result.n2)}</span></div>
  </div>
  <p class="calc-note">月薪超当地社平工资 3 倍的，补偿基数通常按 3 倍封顶，具体认定请咨询专业律师。</p>`;
```

- [ ] **Step 5: Run tests**

Run:

```bash
node --check app.js
node --test tests/xhs-model.test.mjs
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add index.html app.js
git commit -m "Connect evidence checklist and emergency guide"
```

---

### Task 5: Apply Xiaohongshu Visual System

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Replace the old Apple-like visual system**

Use these design tokens at the top of `style.css`:

```css
:root {
  --xhs-red: #ff2442;
  --ink: #1d1d1f;
  --muted: #6f6a66;
  --paper: #faf7f2;
  --card: #ffffff;
  --line: rgba(29, 29, 31, 0.1);
  --sage: #dfe9df;
  --bluegray: #dfe7ef;
  --green: #2fa66a;
  --amber: #f5a524;
  --red: #e5484d;
  --shadow: 0 14px 34px rgba(31, 24, 20, 0.08);
  --ease: cubic-bezier(0.32, 0.72, 0, 1);
}
```

- [ ] **Step 2: Add H5 hero and feed-card styles**

Required selectors:

```css
.h5-hero {}
.hero-kicker {}
.h5-hero h1 {}
.hero-copy {}
.hero-trust {}
.feed-card {}
.result-teaser {}
.teaser-score {}
.tool-bridge {}
.bridge-grid {}
.mini-card {}
```

The hero must keep `开始 2 分钟自测` visible on a 375x812 viewport.

- [ ] **Step 3: Add result and poster styles**

Required selectors:

```css
.result-note {}
.result-scoreline {}
.signal-list {}
.signal-pill {}
.share-poster {}
.poster-kicker {}
.poster-score {}
.poster-footer {}
.qr-box {}
.share-status {}
```

The poster must be screenshot-friendly, with an aspect ratio close to 3:4 and no overflow on 390px wide screens.

- [ ] **Step 4: Add professional tool styles**

Required selectors:

```css
.vault-item.priority {}
.vault-title-row {}
.battle-intro {}
.step-card {}
.calc-result {}
.form-error {}
.calc-note {}
```

Evidence and emergency sections must look calmer than the hero and poster.

- [ ] **Step 5: Run syntax and CSS smoke checks**

Run:

```bash
node --check app.js
rg -n "xhs-red|h5-hero|share-poster|vault-item.priority" style.css
```

Expected: `node --check` passes and `rg` prints all four selector/token matches.

- [ ] **Step 6: Commit**

Run:

```bash
git add style.css
git commit -m "Apply Xiaohongshu visual system"
```

---

### Task 6: Local Interactive Self-Check

**Files:**
- Modify only if verification finds concrete UI defects.

- [ ] **Step 1: Start local server**

Run from the project root:

```bash
python3 -m http.server 61420
```

Expected: server available at `http://localhost:61420/`.

- [ ] **Step 2: Browser flow check**

Open `http://localhost:61420/` and verify:

- First screen shows `职场热测`, `你的职场降落伞打开了吗？`, and `开始 2 分钟自测`.
- Quiz can be completed by tapping options and next.
- Result page shows score, green/yellow/red light, persona, three or fewer signals, result poster, and copy-share action.
- `开始存证据` opens `我的降落伞清单` and highlights the priority evidence items.
- Evidence checkbox and note persist after refresh.
- `已经被约谈？直接看应对` opens `被约谈了，先别签`.

- [ ] **Step 3: Responsive check**

Check these viewport sizes:

```text
375x812
390x844
430x932
1280x800
```

Expected: no overlapping text, no horizontal scroll, poster fully readable, buttons at least 44px tall.

- [ ] **Step 4: Final automated checks**

Run:

```bash
node --check app.js
node --test tests/xhs-model.test.mjs
git status --short
```

Expected: syntax check passes, tests pass, and only intentional files are modified.

- [ ] **Step 5: Commit verification fixes**

If fixes were needed, commit:

```bash
git add index.html style.css app.js tests/xhs-model.test.mjs
git commit -m "Polish interactive H5 after self-check"
```

---

### Task 7: Deploy Through GitHub

**Files:**
- Modify deployment files only if the repository has no working static deployment path.

- [ ] **Step 1: Inspect GitHub remote**

Run:

```bash
git remote -v
git branch --show-current
gh auth status
```

Expected: a GitHub remote exists and `gh auth status` is authenticated.

- [ ] **Step 2: Push current branch**

Run:

```bash
git push origin main
```

Expected: push succeeds.

- [ ] **Step 3: Enable or confirm GitHub Pages**

Run:

```bash
gh api repos/:owner/:repo/pages
```

If Pages is not configured, configure static Pages from the `main` branch root:

```bash
gh api repos/:owner/:repo/pages \
  --method POST \
  -f source='{"branch":"main","path":"/"}'
```

Expected: GitHub returns Pages metadata including an `html_url`.

- [ ] **Step 4: Verify deployed URL**

Open the Pages URL returned by GitHub and verify the same flow as Task 6:

- Hero appears.
- Quiz completes.
- Result poster renders.
- Evidence checklist persists locally.
- Emergency guide opens.

- [ ] **Step 5: Report deployment**

Provide the final GitHub Pages URL and the commit hash used for deployment.

---

## Self-Review

- Spec coverage: H5 entry, lightweight quiz, result card, share copy, evidence checklist, emergency guide, privacy, and legal disclaimer are all mapped to tasks.
- Incomplete-marker scan: The plan contains no unresolved work markers.
- Type consistency: Helper names are consistent across tests and implementation snippets: `getRiskBand`, `getResultProfile`, `getTopSignals`, `getShareCopy`, `getCompensationNumbers`, and `getVaultPriorityIds`.
- Deployment path: GitHub Pages from the static repository root is the default. If the repository already has a different Pages source, keep the existing working source and verify the deployed URL.
