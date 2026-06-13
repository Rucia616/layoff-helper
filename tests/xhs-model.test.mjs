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
    scrollIntoView() {},
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
    matchMedia() {
      return { matches: false, addEventListener() {}, removeEventListener() {} };
    },
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
  vm.runInNewContext(
    `${source}\n;globalThis.__APP_TEST__ = { getRiskBand, getResultProfile, getTopSignals, getEvidenceSummary, getShareCopy, getCompensationNumbers, QUESTIONS, SITUATIONS };`,
    sandbox,
  );
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
  assert.match(app.getShareCopy(profile), /不暴露具体答案/);
  assert.match(app.getShareCopy(profile), /红黄绿灯/);
  assert.match(app.getShareCopy(profile), /你也测一下/);
});

test('share result only exposes three featured signals', () => {
  const app = loadApp();
  assert.deepEqual(app.getTopSignals(['A', 'B', 'C', 'D'], 3), ['A', 'B', 'C']);
});

test('h5 quiz stays lightweight', () => {
  const app = loadApp();
  assert.equal(app.QUESTIONS.length, 5);
  assert.deepEqual(new Set(app.QUESTIONS.map(question => question.dim)), new Set(['A', 'B', 'C', 'D']));
});

test('quiz uses concrete event signals instead of generic feelings', () => {
  const app = loadApp();
  assert.ok(app.SITUATIONS.length >= 4);
  assert.ok(app.SITUATIONS.some(item => item.id === 'talk' && item.score > 0));
  assert.ok(app.QUESTIONS.every(question => question.signal && question.proof && question.level));
  assert.ok(app.QUESTIONS.some(question => /HR|领导|单独约/.test(question.title)));
  assert.ok(app.QUESTIONS.some(question => /交接|接手/.test(question.title)));
  assert.ok(app.QUESTIONS.some(question => /PIP|书面/.test(question.title)));
});

test('evidence summary explains confidence from triggered signals', () => {
  const app = loadApp();
  const basis = app.getEvidenceSummary([
    { level: '高证据' },
    { level: '高证据' },
    { level: '中证据' },
  ], app.SITUATIONS.find(item => item.id === 'talk'));
  assert.equal(basis.confidence, '判断依据强');
  assert.equal(basis.highCount, 2);
  assert.equal(basis.mediumCount, 1);
  assert.match(basis.note, /高证据/);
});

test('compensation helper rounds years according to labor compensation rules', () => {
  const app = loadApp();
  assert.deepEqual(JSON.parse(JSON.stringify(app.getCompensationNumbers(2.3, 10000))), {
    nMonths: 2.5,
    n: 25000,
    n1: 35000,
    n2: 50000,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(app.getCompensationNumbers(2.5, 10000))), {
    nMonths: 3,
    n: 30000,
    n1: 40000,
    n2: 60000,
  });
  assert.equal(app.getCompensationNumbers(0, 10000), null);
});
