/* ============================================================
   职场降落伞 · 小红书 H5 引流版
   纯前端 + localStorage，数据不上传
   ============================================================ */

const RESULT_KEY = 'layoff_last_result_v2';
const VAULT_KEY = 'layoff_vault_v1';

const DIMENSIONS = {
  A: { name: '公司经营信号', weight: 0.35 },
  B: { name: '个人处境信号', weight: 0.30 },
  C: { name: '行业与赛道', weight: 0.20 },
  D: { name: '近期异常变化', weight: 0.15 },
};

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

const EVIDENCE_ITEMS = [
  { id:'contract', name:'劳动合同', why:'确认劳动关系、岗位、薪资和期限，是谈判底牌。' },
  { id:'payroll', name:'近 12 个月工资流水', why:'计算补偿基数时，比口头月薪更有说服力。' },
  { id:'bonus', name:'奖金、提成、补贴记录', why:'避免公司只按基本工资计算补偿。' },
  { id:'overtime', name:'加班和考勤记录', why:'涉及加班费、调休和实际工作强度。' },
  { id:'social', name:'社保、公积金缴纳记录', why:'核对是否足额缴纳，必要时作为谈判筹码。' },
  { id:'perf', name:'绩效、调岗、沟通记录', why:'反驳“不胜任”或变相逼离职说法。' },
  { id:'work', name:'工作成果和邮件往来', why:'证明贡献和项目角色，补足事实链。' },
];

let qIndex = 0;
let qAnswers = [];
let battleStep = 0;
let lastResult = loadLastResult();

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

function loadLastResult() {
  try {
    return JSON.parse(localStorage.getItem(RESULT_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function saveLastResult(result) {
  lastResult = result;
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch (e) {
    lastResult = result;
  }
}

function playReveal(scope) {
  const root = scope || document;
  root.querySelectorAll('.reveal:not(.in)').forEach((el, index) => {
    setTimeout(() => el.classList.add('in'), 40 + index * 55);
  });
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  showPage('page-home');
  updateHomeState();
}

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

function updateHomeState() {
  const hint = document.getElementById('homeStateHint');
  if (!hint) return;
  const vault = loadVault();
  const doneCount = EVIDENCE_ITEMS.filter(item => vault[item.id] && vault[item.id].done).length;
  if (lastResult && doneCount > 0) {
    hint.textContent = `上次测出${lastResult.profile.light}，你的清单已完成 ${doneCount} 项。`;
  } else if (lastResult) {
    hint.textContent = `上次测出${lastResult.profile.light}，可以继续补齐你的降落伞清单。`;
  } else {
    hint.textContent = '测完会生成一张适合截图分享的结果卡。';
  }
}

function initQuiz() {
  qIndex = 0;
  qAnswers = new Array(QUESTIONS.length).fill(null);
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-running').classList.remove('hidden');
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[qIndex];
  const total = QUESTIONS.length;
  const pct = Math.round((qIndex / total) * 100);
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressText').textContent = `第 ${qIndex + 1} / ${total} 题`;

  const options = q.options.map((option, index) => {
    const selected = qAnswers[qIndex] === index ? ' selected' : '';
    return `<button class="option-button${selected}" onclick="selectOption(${index})">
      <span class="option-dot"></span>
      <span>${option[0]}</span>
    </button>`;
  }).join('');

  document.getElementById('questionContainer').innerHTML = `
    <article class="question-card reveal">
      <p class="q-dim">${String(qIndex + 1).padStart(2, '0')} · ${DIMENSIONS[q.dim].name}</p>
      <h2>${q.title}</h2>
      <div class="options">${options}</div>
    </article>`;
  requestAnimationFrame(() => playReveal(document.getElementById('questionContainer')));

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.disabled = qAnswers[qIndex] === null;
  nextBtn.textContent = qIndex === total - 1 ? '查看我的结果' : '下一题';
  document.getElementById('prevBtn').style.visibility = qIndex === 0 ? 'hidden' : 'visible';
}

function selectOption(index) {
  qAnswers[qIndex] = index;
  renderQuestion();
}

function nextQuestion() {
  if (qAnswers[qIndex] === null) return;
  if (qIndex === QUESTIONS.length - 1) showQuizResult();
  else {
    qIndex += 1;
    renderQuestion();
  }
}

function prevQuestion() {
  if (qIndex === 0) return;
  qIndex -= 1;
  renderQuestion();
}

function calcScore() {
  const dimScore = {};
  const dimMax = {};
  const triggered = [];
  Object.keys(DIMENSIONS).forEach(key => {
    dimScore[key] = 0;
    dimMax[key] = 0;
  });

  QUESTIONS.forEach((q, index) => {
    const answerIndex = qAnswers[index] ?? 0;
    const value = q.options[answerIndex][1];
    const maxValue = Math.max(...q.options.map(option => option[1]));
    dimScore[q.dim] += value;
    dimMax[q.dim] += maxValue;
    if (value >= 3) {
      triggered.push(`${q.options[answerIndex][0]}｜${q.title.replace('？', '')}`);
    }
  });

  const dimNorm = {};
  Object.keys(DIMENSIONS).forEach(key => {
    dimNorm[key] = dimMax[key] > 0 ? (dimScore[key] / dimMax[key]) * 100 : 0;
  });

  let final = 0;
  Object.keys(DIMENSIONS).forEach(key => {
    final += dimNorm[key] * DIMENSIONS[key].weight;
  });

  return { final: Math.round(final), dimNorm, triggered };
}

function showQuizResult() {
  document.getElementById('quiz-running').classList.add('hidden');
  document.getElementById('quiz-result').classList.remove('hidden');
  document.getElementById('progressFill').style.width = '100%';

  const { final, dimNorm, triggered } = calcScore();
  const profile = getResultProfile(final);
  const topSignals = getTopSignals(triggered, 3);
  saveLastResult({ final, profile, topSignals, dimNorm });

  const resultNote = document.querySelector('.result-note');
  if (resultNote) resultNote.style.setProperty('--result-color', profile.color);
  document.getElementById('resultKicker').textContent = profile.label;
  document.getElementById('resultScore').textContent = final;
  document.getElementById('resultLight').textContent = profile.light;
  document.getElementById('resultPersona').textContent = profile.persona;
  document.getElementById('resultDesc').textContent = profile.desc;

  const signalBox = document.getElementById('resultSignals');
  signalBox.innerHTML = topSignals.length
    ? topSignals.map((item, index) => `<div class="signal-pill"><span>${index + 1}</span>${item}</div>`).join('')
    : '<div class="signal-pill"><span>1</span>未触发明显高危信号，继续保持关注即可。</div>';

  renderDimensionBreakdown(dimNorm);
  renderPoster(final, profile);
  document.getElementById('shareStatus').textContent = '结果卡已生成。它不会展示你的具体答案。';
}

function renderDimensionBreakdown(dimNorm) {
  const colors = { A:'#E5484D', B:'#F5A524', C:'#557A95', D:'#6F6A66' };
  document.getElementById('dimBreakdown').innerHTML = Object.keys(DIMENSIONS).map(key => {
    const value = Math.round(dimNorm[key]);
    return `<div class="dim-row">
      <div class="dim-head"><span>${DIMENSIONS[key].name}</span><strong>${value}</strong></div>
      <div class="dim-track"><div class="dim-fill" style="width:${value}%;background:${colors[key]}"></div></div>
    </div>`;
  }).join('');
}

function renderPoster(final, profile) {
  const poster = document.getElementById('sharePoster');
  poster.style.setProperty('--result-color', profile.color);
  document.getElementById('posterScore').textContent = final;
  document.getElementById('posterLight').textContent = profile.light;
  document.getElementById('posterPersona').textContent = profile.persona;
  document.getElementById('posterLine').textContent = profile.posterLine;
}

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

function restartQuiz() {
  startQuiz();
}

function loadVault() {
  try {
    return JSON.parse(localStorage.getItem(VAULT_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveVault(data) {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(data));
  } catch (e) {
    return data;
  }
  return data;
}

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

function toggleVault(id) {
  const data = loadVault();
  if (!data[id]) data[id] = { done:false, note:'' };
  data[id].done = !data[id].done;
  saveVault(data);
  const item = document.getElementById(`vault-${id}`);
  if (item) item.classList.toggle('done', data[id].done);
  const check = document.querySelector(`#vault-${id} .vault-check`);
  if (check) check.textContent = data[id].done ? '✓' : '';
  updateVaultProgress();
  updateHomeState();
}

function updateNote(id, value) {
  const data = loadVault();
  if (!data[id]) data[id] = { done:false, note:'' };
  data[id].note = value;
  saveVault(data);
}

function updateVaultProgress() {
  const data = loadVault();
  const doneCount = EVIDENCE_ITEMS.filter(item => data[item.id] && data[item.id].done).length;
  const total = EVIDENCE_ITEMS.length;
  const pct = Math.round((doneCount / total) * 100);
  const circ = 326.7;
  const arc = document.getElementById('vaultArc');
  const pctEl = document.getElementById('vaultPct');
  const tip = document.getElementById('vaultTip');
  if (arc) arc.style.strokeDashoffset = circ * (1 - pct / 100);
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (!tip) return;
  if (pct === 0) tip.textContent = '先存最关键的三样：劳动合同、工资流水、绩效和沟通记录。';
  else if (pct < 100) tip.textContent = `你的降落伞已经打开 ${pct}%。每多存一项，谈判桌上就少一点慌。`;
  else tip.textContent = '降落伞清单已满格。真遇到约谈，你会比大多数人更有底气。';
}

function renderBattle() {
  battleStep = 0;
  renderBattleStep();
}

function renderBattleStep() {
  const container = document.getElementById('battleContainer');
  if (!container) return;

  if (battleStep === 0) {
    container.innerHTML = `
      <article class="battle-intro">
        <span class="note-label">HR 约谈应急</span>
        <h2>先别签，先把节奏拿回来</h2>
        <p>被通知裁员时，最容易吃亏的不是不懂法，而是太慌、太快签。下面四步先帮你稳住。</p>
      </article>
      <button class="btn btn-primary" onclick="battleNext()">开始第一步</button>`;
    return;
  }

  if (battleStep === 1) {
    container.innerHTML = `
      <article class="step-card">
        <span class="step-num">第 1 步 / 共 4 步</span>
        <h2>不要当场签任何字</h2>
        <p>你可以要求把方案带回去看。先拿到书面解除方案和补偿明细，再决定怎么谈。</p>
        <div class="quote-box">这个方案我需要带回去仔细看一下，麻烦给我一份书面的解除方案和补偿明细。我考虑后再答复。</div>
      </article>
      <button class="btn btn-primary" onclick="battleNext()">我记住了，下一步</button>
      <button class="btn btn-secondary" onclick="battlePrev()">上一步</button>`;
    return;
  }

  if (battleStep === 2) {
    const vault = loadVault();
    const doneCount = EVIDENCE_ITEMS.filter(item => vault[item.id] && vault[item.id].done).length;
    const hint = doneCount > 0
      ? `你已经存了 ${doneCount} 项证据。现在重点再核对劳动合同、工资流水和 HR 沟通记录。`
      : '现在先补最关键的三类证据：劳动合同、工资流水、HR 沟通记录。';
    container.innerHTML = `
      <article class="step-card">
        <span class="step-num">第 2 步 / 共 4 步</span>
        <h2>立刻留存关键证据</h2>
        <p>${hint}</p>
        <div class="signal-list compact">
          <div class="signal-pill"><span>1</span>劳动合同、近 12 个月工资流水</div>
          <div class="signal-pill"><span>2</span>奖金、提成、补贴记录</div>
          <div class="signal-pill"><span>3</span>解除通知、聊天记录、会议邀请</div>
        </div>
        <button class="btn btn-secondary" onclick="openVaultFromResult()">打开降落伞清单</button>
      </article>
      <button class="btn btn-primary" onclick="battleNext()">证据齐了，算赔偿</button>
      <button class="btn btn-secondary" onclick="battlePrev()">上一步</button>`;
    return;
  }

  if (battleStep === 3) {
    container.innerHTML = `
      <article class="step-card">
        <span class="step-num">第 3 步 / 共 4 步</span>
        <h2>先算清你大概该拿多少</h2>
        <p>补偿基数尽量按税前月均工资算，奖金、提成、补贴记录都可能影响谈判空间。</p>
        <div class="field">
          <label for="workYears">在这家公司工作年限</label>
          <input type="number" id="workYears" placeholder="例如 2.5" step="0.5" min="0" />
        </div>
        <div class="field">
          <label for="monthSalary">离职前 12 个月平均月薪</label>
          <input type="number" id="monthSalary" placeholder="例如 20000" min="0" />
        </div>
        <button class="btn btn-primary" onclick="calcCompensation()">计算赔偿区间</button>
        <div id="calcResult"></div>
      </article>
      <button class="btn btn-primary" onclick="battleNext()">看签字红线</button>
      <button class="btn btn-secondary" onclick="battlePrev()">上一步</button>`;
    return;
  }

  container.innerHTML = `
    <article class="step-card">
      <span class="step-num">第 4 步 / 共 4 步</span>
      <h2>签字前，核对这 5 条红线</h2>
      <div class="redline-item"><span>不签</span><p>写着“个人原因主动离职”。</p></div>
      <div class="redline-item"><span>不签</span><p>写着“双方无任何劳动争议”但款项没结清。</p></div>
      <div class="redline-item"><span>不签</span><p>补偿金额低于法定 N，且没有合理解释。</p></div>
      <div class="redline-item"><span>不签</span><p>含竞业限制，却没有竞业补偿。</p></div>
      <div class="redline-item"><span>不签</span><p>要求当场签、不给带走看。</p></div>
    </article>
    <article class="feed-card closing-card">
      <h2>你已经比大多数人更稳</h2>
      <p>不当场签、留好证据、算清数字、避开红线。方案谈不拢时，劳动仲裁通常免费，时效一般为一年。</p>
    </article>
    <button class="btn btn-secondary" onclick="goHome()">返回首页</button>`;
}

function battleNext() {
  battleStep += 1;
  renderBattleStep();
}

function battlePrev() {
  if (battleStep > 0) battleStep -= 1;
  renderBattleStep();
}

function calcCompensation() {
  const years = parseFloat(document.getElementById('workYears').value);
  const salary = parseFloat(document.getElementById('monthSalary').value);
  const box = document.getElementById('calcResult');
  const result = getCompensationNumbers(years, salary);
  if (!result) {
    box.innerHTML = '<p class="form-error">请填写有效的年限和月薪。</p>';
    return;
  }
  const fmt = value => `¥${Math.round(value).toLocaleString()}`;
  box.innerHTML = `
    <div class="calc-result">
      <div class="calc-row"><span class="label">补偿月数 N</span><span class="val">${result.nMonths} 个月</span></div>
      <div class="calc-row highlight"><span class="label">法定底线 N</span><span class="val">${fmt(result.n)}</span></div>
      <div class="calc-row"><span class="label">未提前通知 N+1</span><span class="val">${fmt(result.n1)}</span></div>
      <div class="calc-row highlight"><span class="label">违法解除争取 2N</span><span class="val">${fmt(result.n2)}</span></div>
    </div>
    <p class="calc-note">月薪超当地社平工资 3 倍的，补偿基数通常按 3 倍封顶，具体认定请咨询专业律师。</p>`;
}

window.addEventListener('DOMContentLoaded', () => {
  updateHomeState();
  playReveal(document);
});
