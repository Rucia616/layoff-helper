/* ============================================================
   职场降落伞 · 裁员风险体检 H5
   纯前端 + localStorage，数据不上传
   ============================================================ */

const RESULT_KEY = 'layoff_last_result_v2';
const VAULT_KEY = 'layoff_vault_v1';

const DIMENSIONS = {
  A: { name: '公司经营信号', weight: 0.25 },
  B: { name: '个人处境信号', weight: 0.35 },
  C: { name: '业务与行业信号', weight: 0.15 },
  D: { name: '正式流程信号', weight: 0.25 },
};

const SITUATIONS = [
  { id:'talk', title:'已经被 HR / 领导约谈', desc:'聊到组织调整、岗位变化、协商离职', score:14, signal:'已进入约谈场景' },
  { id:'personal', title:'最近明显被针对', desc:'项目、权限、绩效或汇报关系突然变了', score:10, signal:'个人处境已变被动' },
  { id:'company', title:'公司有裁员风声', desc:'停招、降本、合并团队，身边有人离开', score:7, signal:'公司层面已有风向' },
  { id:'check', title:'只是想提前自查', desc:'暂时没有大事，但想看看安全垫够不够', score:0, signal:'提前体检' },
];

const QUESTIONS = [
  { dim:'A', level:'中证据', title:'公司层面有没有开始组织调整、停招降本或业务合并？', signal:'公司已出现组织调整/降本信号', proof:'裁员前常见的公司侧前置信号',
    options:[['没有，招聘和预算正常',0],['只听到传闻，还没影响业务',1],['停招、控预算或福利奖金被动过',3],['已经裁撤团队、合并业务或强制降本',4]] },
  { dim:'D', level:'高证据', title:'最近 30 天，HR 或领导有没有单独约你谈岗位变化？', signal:'出现单独约谈/岗位变化话术', proof:'正式沟通通常比传闻更接近实际动作',
    options:[['没有单独谈过',0],['只是普通 1:1，没有异常表述',1],['提到组织调整、岗位变化或“先聊聊”',3],['已经谈到协商离职、补偿或最后工作日',4]] },
  { dim:'B', level:'高证据', title:'有没有被要求交接工作、整理文档或带接手的人？', signal:'出现交接或替代安排', proof:'交接、接手人和权限迁移，比主观感受更能说明风险',
    options:[['没有，工作还由我正常推进',0],['只是常规文档沉淀',1],['开始要求我整理关键文档或交接事项',3],['已经有人接手我的项目/客户/权限',4]] },
  { dim:'B', level:'高证据', title:'绩效沟通有没有突然变正式：书面记录、PIP、不胜任提醒？', signal:'绩效沟通进入正式留痕', proof:'书面绩效和 PIP 往往会影响后续谈判口径',
    options:[['没有，绩效反馈正常',0],['口头提醒过，但没有留痕',1],['出现书面反馈、改进要求或正式邮件',3],['已经进入 PIP / 不胜任 / 调岗流程',4]] },
  { dim:'C', level:'中证据', title:'你所在业务或行业最近是不是明显收缩？', signal:'业务或行业正在收缩', proof:'外部机会和内部资源同步变少时，风险会叠加',
    options:[['还在增长，岗位机会不少',0],['有点保守，但业务还在跑',1],['资源减少，同行裁员或冻结招聘变多',3],['业务被砍/合并，行业大面积收缩',4]] },
];

const RESULT_PROFILES = {
  green: {
    band: 'green',
    light: '绿灯',
    label: '绿灯 · 风险较低',
    color: '#2F8F63',
    softColor: '#E9F5EE',
    posterHeadline: '我是绿灯打工人',
    persona: '安全垫还在，但别空手上班型',
    desc: '目前信号整体平稳，但职场里的安全感不能只靠运气。现在用很低成本把基础证据存好，会让你以后更从容。',
    posterLine: '现在适合低成本准备',
    shareLine: '安全垫还在，但我决定先把证据存好。',
  },
  yellow: {
    band: 'yellow',
    light: '黄灯',
    label: '黄灯 · 风险升高',
    color: '#D99116',
    softColor: '#FFF3D6',
    posterHeadline: '我是黄灯打工人',
    persona: '绩效安全，但公司危险型',
    desc: '你的个人表现未必是核心问题，但公司、业务线或团队氛围已经有信号。现在是最佳备战窗口。',
    posterLine: '绩效还稳，但公司风向变了',
    shareLine: '绩效还稳，但公司信号有点危险。',
  },
  red: {
    band: 'red',
    light: '红灯',
    label: '红灯 · 高风险',
    color: '#D84A4A',
    softColor: '#FDE8E8',
    posterHeadline: '我是红灯备战型',
    persona: '信号叠满，马上备战型',
    desc: '多个高风险信号同时出现。先稳住，不要当场签任何字，优先补齐证据，再看约谈应对。',
    posterLine: '先别签，先留证据',
    shareLine: '信号有点满，我先给自己备个降落伞。',
  },
};

const EVIDENCE_ITEMS = [
  { id:'contract', name:'劳动合同', why:'确认劳动关系、岗位、薪资和期限，是谈判底牌。' },
  { id:'payroll', name:'近 12 个月工资流水', why:'计算补偿基数时，比口头月薪更有说服力。' },
  { id:'perf', name:'绩效、调岗、沟通记录', why:'反驳“不胜任”或变相逼离职说法。' },
  { id:'bonus', name:'奖金、提成、补贴记录', why:'避免公司只按基本工资计算补偿。' },
  { id:'overtime', name:'加班和考勤记录', why:'涉及加班费、调休和实际工作强度。' },
  { id:'social', name:'社保、公积金缴纳记录', why:'核对是否足额缴纳，必要时作为谈判筹码。' },
  { id:'work', name:'工作成果和邮件往来', why:'证明贡献和项目角色，补足事实链。' },
];

let qIndex = 0;
let qAnswers = [];
let quizStage = 'situation';
let selectedSituation = null;
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

function getEvidenceSummary(triggered = [], situation = getSituation('check')) {
  const highCount = triggered.filter(item => item.level === '高证据').length;
  const mediumCount = triggered.filter(item => item.level === '中证据').length;
  let confidence = '判断依据弱';
  let note = '目前更多是基础自查，未出现足够多的明确事件信号。';

  if (highCount >= 2 || (situation.id === 'talk' && highCount >= 1)) {
    confidence = '判断依据强';
    note = '你触发了接近裁员流程的高证据事件，建议按约谈前准备处理。';
  } else if (highCount + mediumCount >= 2 || situation.score >= 10) {
    confidence = '判断依据中';
    note = '已经有多个信号叠加，适合先补齐证据和备选方案。';
  }

  return {
    confidence,
    note,
    highCount,
    mediumCount,
    situationTitle: situation.title,
    situationSignal: situation.signal,
  };
}

function getShareCopy(profile, shareUrl = 'https://rucia616.github.io/layoff-helper/') {
  return `我在职场降落伞测出来是${profile.light}：${profile.shareLine} 不暴露具体答案。你也测一下自己的职场红黄绿灯，看看该不该先存证据：${shareUrl}`;
}

function getVaultPriorityIds() {
  return ['contract', 'payroll', 'perf'];
}

function getPriorityActions() {
  return [
    { id:'contract', title:'存劳动合同', desc:'确认劳动关系、岗位、薪资和期限。' },
    { id:'payroll', title:'导出近 12 个月工资流水', desc:'补偿基数别只按基本工资算。' },
    { id:'perf', title:'备份绩效和沟通记录', desc:'反驳“不胜任”和变相逼离职。' },
  ];
}

function getSituation(id) {
  return SITUATIONS.find(item => item.id === id) || SITUATIONS[SITUATIONS.length - 1];
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
    hint.textContent = `上次报告：${lastResult.profile.light}。你已经完成 ${doneCount} 项准备。`;
  } else if (lastResult) {
    hint.textContent = `上次报告：${lastResult.profile.light}。建议先补齐最关键的 3 项证据。`;
  } else {
    hint.textContent = '测完生成一张不暴露具体答案的红黄绿灯卡，可以发给朋友互测。';
  }
}

function initQuiz() {
  qIndex = 0;
  quizStage = 'situation';
  selectedSituation = null;
  qAnswers = new Array(QUESTIONS.length).fill(null);
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-running').classList.remove('hidden');
  renderSituationStep();
}

function renderSituationStep() {
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressText').textContent = '先选处境';

  const options = SITUATIONS.map(item => {
    const selected = selectedSituation && selectedSituation.id === item.id ? ' selected' : '';
    return `<button class="situation-card${selected}" onclick="selectSituation('${item.id}')">
      <span>${item.title}</span>
      <small>${item.desc}</small>
    </button>`;
  }).join('');

  document.getElementById('questionContainer').innerHTML = `
    <article class="question-card">
      <p class="section-label">先把你的处境放进去</p>
      <h2>你现在最接近哪种情况？</h2>
      <p class="question-proof">这一步会影响风险基线，后面 5 题只问已经发生过的具体事件。</p>
      <div class="situation-options">${options}</div>
    </article>`;

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.disabled = !selectedSituation;
  nextBtn.textContent = '进入 5 题';
  document.getElementById('prevBtn').style.visibility = 'hidden';
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
      <span class="option-index">${index + 1}</span>
      <span>${option[0]}</span>
    </button>`;
  }).join('');

  document.getElementById('questionContainer').innerHTML = `
    <article class="question-card">
      <p class="section-label">${q.level} · ${DIMENSIONS[q.dim].name}</p>
      <h2>${q.title}</h2>
      <p class="question-proof">${q.proof}</p>
      <div class="options">${options}</div>
    </article>`;

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.disabled = qAnswers[qIndex] === null;
  nextBtn.textContent = qIndex === total - 1 ? '查看报告' : '下一题';
  document.getElementById('prevBtn').style.visibility = qIndex === 0 ? 'hidden' : 'visible';
}

function selectSituation(id) {
  selectedSituation = getSituation(id);
  renderSituationStep();
}

function selectOption(index) {
  qAnswers[qIndex] = index;
  renderQuestion();
}

function nextQuestion() {
  if (quizStage === 'situation') {
    if (!selectedSituation) return;
    quizStage = 'questions';
    qIndex = 0;
    renderQuestion();
    return;
  }
  if (qAnswers[qIndex] === null) return;
  if (qIndex === QUESTIONS.length - 1) showQuizResult();
  else {
    qIndex += 1;
    renderQuestion();
  }
}

function prevQuestion() {
  if (quizStage === 'situation') return;
  if (qIndex === 0) {
    quizStage = 'situation';
    renderSituationStep();
    return;
  }
  qIndex -= 1;
  renderQuestion();
}

function calcScore() {
  const dimScore = {};
  const dimMax = {};
  const triggered = [];
  const situation = selectedSituation || getSituation('check');
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
      triggered.push({
        label: q.options[answerIndex][0],
        signal: q.signal,
        level: q.level,
        proof: q.proof,
        value,
      });
    }
  });

  const dimNorm = {};
  Object.keys(DIMENSIONS).forEach(key => {
    dimNorm[key] = dimMax[key] > 0 ? (dimScore[key] / dimMax[key]) * 100 : 0;
  });

  let final = situation.score;
  Object.keys(DIMENSIONS).forEach(key => {
    final += dimNorm[key] * DIMENSIONS[key].weight;
  });

  final = Math.min(100, Math.round(final));
  return { final, dimNorm, triggered, situation, basis: getEvidenceSummary(triggered, situation) };
}

function showQuizResult() {
  document.getElementById('quiz-running').classList.add('hidden');
  document.getElementById('quiz-result').classList.remove('hidden');
  document.getElementById('progressFill').style.width = '100%';

  const { final, dimNorm, triggered, situation, basis } = calcScore();
  const profile = getResultProfile(final);
  const topSignals = getTopSignals(triggered, 3);
  saveLastResult({ final, profile, topSignals, dimNorm, situation, basis });

  const report = document.querySelector('.result-report');
  const poster = document.getElementById('sharePoster');
  [report, poster].forEach(el => {
    if (!el) return;
    el.style.setProperty('--result-color', profile.color);
    el.style.setProperty('--result-soft', profile.softColor);
  });

  document.getElementById('resultKicker').textContent = profile.label;
  document.getElementById('resultScore').textContent = final;
  document.getElementById('resultLight').textContent = profile.light;
  document.getElementById('resultPersona').textContent = profile.persona;
  document.getElementById('resultDesc').textContent = profile.desc;

  renderEvidenceBasis(basis);
  document.getElementById('resultSignals').innerHTML = topSignals.length
    ? topSignals.map(renderSignalRow).join('')
    : '<div class="signal-row"><span>1</span><p>未触发明显高危信号，继续保持关注即可。</p></div>';

  renderPriorityActions();
  renderDimensionBreakdown(dimNorm);
  renderPoster(final, profile);
  document.getElementById('shareStatus').textContent = '互测卡已生成。它不会展示你的具体答案，适合发给朋友一起自查。';
}

function renderEvidenceBasis(basis) {
  document.getElementById('resultBasis').innerHTML = `
    <div class="basis-card is-main">
      <span>${basis.confidence}</span>
      <strong>${basis.note}</strong>
    </div>
    <div class="basis-card">
      <span>你的处境</span>
      <strong>${basis.situationTitle}</strong>
      <small>${basis.situationSignal}</small>
    </div>
    <div class="basis-card">
      <span>高证据事件</span>
      <strong>${basis.highCount} 项</strong>
      <small>约谈、交接、PIP 等具体动作</small>
    </div>
    <div class="basis-card">
      <span>中证据信号</span>
      <strong>${basis.mediumCount} 项</strong>
      <small>公司、业务或行业侧变化</small>
    </div>`;
}

function renderSignalRow(item, index) {
  if (typeof item === 'string') {
    return `<div class="signal-row"><span>${index + 1}</span><p>${item}</p></div>`;
  }
  return `<div class="signal-row">
    <span>${index + 1}</span>
    <p><strong>${item.signal}</strong><small>${item.label}｜${item.level}</small></p>
  </div>`;
}

function renderPriorityActions() {
  const actions = getPriorityActions();
  document.getElementById('priorityActions').innerHTML = actions.map((item, index) => `
    <button class="priority-action" onclick="openVaultFromResult()">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <div>
        <strong>${item.title}</strong>
        <small>${item.desc}</small>
      </div>
    </button>`).join('');
}

function renderDimensionBreakdown(dimNorm) {
  document.getElementById('dimBreakdown').innerHTML = `
    <p class="section-label">信号来源</p>
    ${Object.keys(DIMENSIONS).map(key => {
      const value = Math.round(dimNorm[key]);
      return `<div class="dim-row">
        <div class="dim-head"><span>${DIMENSIONS[key].name}</span><strong>${value}</strong></div>
        <div class="dim-track"><div class="dim-fill" style="width:${value}%"></div></div>
      </div>`;
    }).join('')}`;
}

function renderPoster(final, profile) {
  document.getElementById('posterScore').textContent = final;
  document.getElementById('posterLight').textContent = profile.light;
  document.getElementById('posterHeadline').textContent = profile.posterHeadline;
  document.getElementById('posterPersona').textContent = profile.persona;
  document.getElementById('posterLine').textContent = profile.posterLine;
}

function copyShareText() {
  const status = document.getElementById('shareStatus');
  const shareUrl = window.location ? window.location.origin + window.location.pathname : undefined;
  const text = lastResult ? getShareCopy(lastResult.profile, shareUrl) : `测一下你的职场红黄绿灯，看看该不该先存证据：${shareUrl || 'https://rucia616.github.io/layoff-helper/'}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      if (status) status.textContent = '互测文案已复制。它不包含你的具体答案，可以发给朋友一起测。';
    }).catch(() => {
      if (status) status.textContent = text;
    });
    return;
  }
  if (status) status.textContent = text;
}

function savePosterGuide() {
  const status = document.getElementById('shareStatus');
  if (status) status.textContent = '截图保存上方互测卡。它不会展示你的具体答案，适合发小红书、朋友圈或朋友群。';
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

function renderVault(priorityIds = getVaultPriorityIds()) {
  const data = loadVault();
  const prioritySet = new Set(priorityIds);
  const items = [...EVIDENCE_ITEMS].sort((a, b) => {
    const ai = priorityIds.indexOf(a.id);
    const bi = priorityIds.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return 0;
  });

  document.getElementById('vaultList').innerHTML = items.map(item => {
    const rec = data[item.id] || { done:false, note:'' };
    const priority = prioritySet.has(item.id);
    return `<article class="vault-item ${rec.done ? 'done' : ''} ${priority ? 'priority' : ''}" id="vault-${item.id}">
      <button class="vault-item-top" onclick="toggleVault('${item.id}')">
        <span class="vault-check">${rec.done ? '✓' : ''}</span>
        <span class="vault-copy">
          <strong>${item.name}</strong>
          <small>${item.why}</small>
        </span>
        ${priority ? '<em>优先</em>' : ''}
      </button>
      <label class="vault-note-wrap">
        <span>存放位置</span>
        <textarea class="vault-note" rows="1" placeholder="例如：手机相册 / 网盘 / 邮箱备份"
          onchange="updateNote('${item.id}', this.value)">${rec.note || ''}</textarea>
      </label>
    </article>`;
  }).join('');
  updateVaultProgress();
}

function toggleVault(id) {
  const data = loadVault();
  if (!data[id]) data[id] = { done:false, note:'' };
  data[id].done = !data[id].done;
  saveVault(data);
  renderVault();
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
  const circ = 238.8;
  const arc = document.getElementById('vaultArc');
  const pctEl = document.getElementById('vaultPct');
  const tip = document.getElementById('vaultTip');
  if (arc) arc.style.strokeDashoffset = circ * (1 - pct / 100);
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (!tip) return;
  if (pct === 0) tip.textContent = '这些最影响补偿基数和谈判筹码。';
  else if (pct < 100) tip.textContent = `已完成 ${doneCount} / ${total} 项。先保证优先项齐全。`;
  else tip.textContent = '清单已满格。真遇到约谈，你会更有底气。';
}

function renderBattle() {
  battleStep = 0;
  renderBattleStep();
}

function renderBattleStep() {
  const container = document.getElementById('battleContainer');
  if (!container) return;

  const steps = [
    {
      title: '不要当场签任何字',
      desc: '你可以要求把方案带回去看。先拿到书面解除方案和补偿明细，再决定怎么谈。',
      quote: '这个方案我需要带回去仔细看一下，麻烦给我一份书面的解除方案和补偿明细。我考虑后再答复。',
    },
    {
      title: '立刻留存关键证据',
      desc: '优先保存劳动合同、工资流水、奖金记录和 HR 沟通记录。离职后很多材料就不好拿了。',
      quote: '我需要先核对合同、工资流水和补偿明细，再回复这个方案。',
    },
    {
      title: '先算清补偿区间',
      desc: '填两个数，估算 N、N+1 和 2N 的基础范围。金额越清楚，谈判越不慌。',
      quote: '',
    },
    {
      title: '签字前核对红线',
      desc: '如果协议里出现主动离职、无争议、款项已结清、竞业但无补偿，先别签。',
      quote: '这几条我需要确认清楚后再决定是否签署。',
    },
  ];

  const intro = `<section class="battle-progress">
    <p class="section-label">HR 约谈应急</p>
    <h2>第 ${battleStep + 1} 步 / 共 4 步</h2>
    <div class="battle-dots">${steps.map((_, index) => `<span class="${index <= battleStep ? 'active' : ''}"></span>`).join('')}</div>
  </section>`;

  if (battleStep === 2) {
    container.innerHTML = `${intro}
      <article class="battle-card">
        <h2>${steps[2].title}</h2>
        <p>${steps[2].desc}</p>
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
      <div class="battle-nav">
        <button class="text-action muted" onclick="battlePrev()">上一步</button>
        <button class="btn btn-primary" onclick="battleNext()">下一步</button>
      </div>`;
    return;
  }

  const step = steps[battleStep];
  const redlines = battleStep === 3 ? `
    <div class="redline-list">
      <div><span>不签</span><p>写着“个人原因主动离职”。</p></div>
      <div><span>不签</span><p>写着“双方无任何劳动争议”但款项没结清。</p></div>
      <div><span>不签</span><p>要求当场签、不给带走看。</p></div>
    </div>` : '';
  container.innerHTML = `${intro}
    <article class="battle-card">
      <h2>${step.title}</h2>
      <p>${step.desc}</p>
      ${step.quote ? `<div class="quote-card"><p>${step.quote}</p><button onclick="copyBattleLine('${step.quote}')">复制话术</button></div>` : ''}
      ${redlines}
    </article>
    <div class="battle-nav">
      ${battleStep > 0 ? '<button class="text-action muted" onclick="battlePrev()">上一步</button>' : '<span></span>'}
      ${battleStep < 3 ? '<button class="btn btn-primary" onclick="battleNext()">下一步</button>' : '<button class="btn btn-secondary" onclick="goHome()">返回首页</button>'}
    </div>`;
}

function copyBattleLine(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
}

function battleNext() {
  if (battleStep < 3) battleStep += 1;
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
      <div class="calc-row"><span>补偿月数 N</span><strong>${result.nMonths} 个月</strong></div>
      <div class="calc-row"><span>法定底线 N</span><strong>${fmt(result.n)}</strong></div>
      <div class="calc-row"><span>未提前通知 N+1</span><strong>${fmt(result.n1)}</strong></div>
      <div class="calc-row"><span>违法解除争取 2N</span><strong>${fmt(result.n2)}</strong></div>
    </div>
    <p class="calc-note">月薪超当地社平工资 3 倍的，补偿基数通常按 3 倍封顶，具体认定请咨询专业律师。</p>`;
}

window.addEventListener('DOMContentLoaded', () => {
  updateHomeState();
});
