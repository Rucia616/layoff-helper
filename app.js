/* ============================================================
   裁员大礼包 · 赔偿谈判助手 MVP
   纯前端 + localStorage，数据不上传
   ============================================================ */

/* ---------- 路由 ---------- */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}
function goHome() { showPage('page-home'); }
function goEntry(el) {
  const target = el.getAttribute('data-go');
  showPage(target);
  if (target === 'page-quiz') initQuiz();
  if (target === 'page-vault') renderVault();
  if (target === 'page-battle') renderBattle();
}

/* ============================================================
   模块一：裁员风险自测
   ============================================================ */
const DIMENSIONS = {
  A: { name: '公司经营信号', weight: 0.35 },
  B: { name: '个人处境信号', weight: 0.30 },
  C: { name: '行业与赛道',   weight: 0.20 },
  D: { name: '主观感受与近期变化', weight: 0.15 }
};

const QUESTIONS = [
  { dim:'A', title:'公司最近半年是否有过裁员 / 裁撤部门？',
    options:[['没听说',0],['有传闻但没实锤',2],['其他部门已经裁了',3],['我部门已经在裁',4]] },
  { dim:'A', title:'公司近期业绩 / 营收情况？',
    options:[['增长良好',0],['基本持平',1],['明显下滑',3],['亏损 / 融资困难',4]] },
  { dim:'A', title:'公司近期是否有这些动作？（停招、砍福利、降薪、缓发工资）',
    options:[['都没有',0],['停止招聘',1],['砍福利 / 降薪',3],['缓发或欠薪',4]] },
  { dim:'A', title:'你所在的业务线 / 项目状态？',
    options:[['核心业务、在扩张',0],['稳定',1],['被边缘化 / 缩编',3],['传出要砍掉',4]] },
  { dim:'B', title:'你最近一次绩效结果？',
    options:[['优秀',0],['正常',1],['偏低 / 被警告',3],['已被约谈绩效改进(PIP)',4]] },
  { dim:'B', title:'最近是否被调岗 / 降薪 / 边缘化？',
    options:[['没有',0],['有调整但合理',1],['被调到边缘岗',3],['明显被架空',4]] },
  { dim:'B', title:'你的岗位可替代性？',
    options:[['核心稀缺岗',0],['较难替代',1],['普通岗',3],['易被替代 / 有重叠',4]] },
  { dim:'B', title:'你和直属领导 / 公司的关系近期变化？',
    options:[['良好',0],['正常',1],['变冷淡',3],['明显被针对',4]] },
  { dim:'C', title:'你所在行业整体景气度？',
    options:[['上升期',0],['平稳',1],['遇冷',3],['大规模收缩',4]] },
  { dim:'C', title:'同行业近期裁员消息多吗？',
    options:[['几乎没有',0],['偶有',1],['不少',3],['频繁 / 大厂带头裁',4]] },
  { dim:'C', title:'你的技能在市场上的再就业难度？',
    options:[['很抢手',0],['正常',1],['偏难',3],['很难找对口',4]] },
  { dim:'D', title:'你对“自己可能被裁”的直觉强烈吗？',
    options:[['完全不担心',0],['偶尔想想',1],['比较担心',3],['强烈预感',4]] },
  { dim:'D', title:'近期是否出现这些异常？（被移出群、权限被收、会议不带你）',
    options:[['没有',0],['个别',2],['有几项',3],['多项同时出现',4]] },
  { dim:'D', title:'公司氛围近期变化？',
    options:[['正常',0],['略紧张',1],['人心惶惶',3],['已有人陆续离开',4]] },
];

let qIndex = 0;
let qAnswers = [];

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
  document.getElementById('progressFill').style.width = (qIndex / total * 100) + '%';
  document.getElementById('progressText').textContent = `第 ${qIndex + 1} / ${total} 题`;

  let html = `<div class="question">
    <div class="q-dim">${DIMENSIONS[q.dim].name}</div>
    <div class="q-title">${q.title}</div>
    <div class="options">`;
  q.options.forEach((opt, i) => {
    const sel = qAnswers[qIndex] === i ? 'selected' : '';
    html += `<div class="option ${sel}" onclick="selectOption(${i})"><span class="dot"></span><span>${opt[0]}</span></div>`;
  });
  html += `</div></div>`;
  document.getElementById('questionContainer').innerHTML = html;

  document.getElementById('nextBtn').disabled = qAnswers[qIndex] === null;
  document.getElementById('nextBtn').textContent = (qIndex === total - 1) ? '查看结果' : '下一题';
  document.getElementById('prevBtn').style.display = qIndex === 0 ? 'none' : 'block';
}

function selectOption(i) { qAnswers[qIndex] = i; renderQuestion(); }
function nextQuestion() {
  if (qAnswers[qIndex] === null) return;
  if (qIndex === QUESTIONS.length - 1) showQuizResult();
  else { qIndex++; renderQuestion(); }
}
function prevQuestion() { if (qIndex > 0) { qIndex--; renderQuestion(); } }

/* 核心算分 */
function calcScore() {
  const dimScore = {}, dimMax = {}, triggered = [];
  for (const k in DIMENSIONS) { dimScore[k] = 0; dimMax[k] = 0; }
  QUESTIONS.forEach((q, idx) => {
    const val = q.options[qAnswers[idx]][1];
    const maxVal = Math.max(...q.options.map(o => o[1]));
    dimScore[q.dim] += val;
    dimMax[q.dim] += maxVal;
    if (val >= 3) {
      const shortTitle = q.title.split('？')[0] + '？';
      triggered.push(q.options[qAnswers[idx]][0] + '（' + shortTitle + '）');
    }
  });
  const dimNorm = {};
  for (const k in DIMENSIONS) dimNorm[k] = dimMax[k] > 0 ? (dimScore[k] / dimMax[k] * 100) : 0;
  let final = 0;
  for (const k in DIMENSIONS) final += dimNorm[k] * DIMENSIONS[k].weight;
  return { final: Math.round(final), dimNorm, triggered };
}

function showQuizResult() {
  document.getElementById('quiz-running').classList.add('hidden');
  document.getElementById('quiz-result').classList.remove('hidden');
  document.getElementById('progressFill').style.width = '100%';

  const { final, dimNorm, triggered } = calcScore();

  let light, color, title, desc, ctaTitle, ctaDesc, ctaBtn, ctaGo;
  if (final <= 39) {
    light = '🟢 绿灯 · 风险较低'; color = '#28A745';
    title = '目前信号平稳';
    desc = '你当前的裁员风险较低，属于正常波动。但职场无常，建议先把基础证据存好，做到有备无患。';
    ctaTitle = '花 5 分钟，存好你的“保险箱”';
    ctaDesc = '劳动合同、工资流水这些，在职时好拿，离职后往往就拿不到了。现在存好，以防万一。';
    ctaBtn = '去存证据 →'; ctaGo = 'page-vault';
  } else if (final <= 69) {
    light = '🟡 黄灯 · 风险升高'; color = '#FF9F0A';
    title = '出现了一些值得警惕的信号';
    desc = '你的处境出现了若干风险信号，现在正是最佳备战时机——趁还在职，把筹码攒满。别慌，你完全来得及准备。';
    ctaTitle = '现在是备战的黄金窗口';
    ctaDesc = '建议立即开始证据预存，把谈判筹码攒满。趁还在职，把该留的都留好。';
    ctaBtn = '立即开始备战 →'; ctaGo = 'page-vault';
  } else {
    light = '🔴 红灯 · 高风险'; color = '#D70015';
    title = '多个高风险信号同时出现';
    desc = '你的情况触发了多个高危信号。别慌——现在行动起来，准备越充分，真到谈判桌上越有底气。你能做的事还有很多。';
    ctaTitle = '马上行动，别等约谈才准备';
    ctaDesc = '第一优先：立即完成证据预存。一旦被约谈，可直接进入“实战谈判指引”，一步步把赔偿谈到最高。';
    ctaBtn = '马上存证据 →'; ctaGo = 'page-vault';
  }

  const circ = 596.9;
  const arc = document.getElementById('gaugeArc');
  arc.style.stroke = color;
  arc.style.strokeDashoffset = circ * (1 - final / 100);
  const scoreEl = document.getElementById('gaugeScore');
  scoreEl.textContent = final;
  scoreEl.setAttribute('fill', color);
  const lbl = document.getElementById('lightLabel');
  lbl.textContent = light; lbl.style.color = color;

  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultDesc').textContent = desc;

  const dimColors = { A:'#D70015', B:'#FF9F0A', C:'#0071E3', D:'#6E6E73' };
  let dimHtml = `<h3>风险来源拆解</h3>`;
  for (const k in DIMENSIONS) {
    const v = Math.round(dimNorm[k]);
    dimHtml += `<div class="dim-row">
      <div class="dim-head"><span>${DIMENSIONS[k].name}（权重${Math.round(DIMENSIONS[k].weight*100)}%）</span><span>${v}</span></div>
      <div class="dim-track"><div class="dim-fill" style="width:${v}%;background:${dimColors[k]};"></div></div>
    </div>`;
  }
  document.getElementById('dimBreakdown').innerHTML = dimHtml;

  const sb = document.getElementById('signalsBox');
  if (triggered.length) {
    let s = `<div class="signal-head">你触发了 ${triggered.length} 个高危信号：</div>`;
    triggered.forEach(t => { s += `<div class="signal-item"><span class="warn">⚠</span><span>${t}</span></div>`; });
    sb.innerHTML = s;
  } else {
    sb.innerHTML = `<div class="signal-item"><span class="ok">✓</span><span>未触发明显高危信号，继续保持关注即可。</span></div>`;
  }

  document.getElementById('ctaBox').innerHTML =
    `<h3>${ctaTitle}</h3><p>${ctaDesc}</p>
     <button class="btn btn-sm" onclick="showPage('${ctaGo}'); renderVault();">${ctaBtn}</button>`;
}

function restartQuiz() { initQuiz(); }

/* ============================================================
   模块二：证据保险箱（localStorage）
   ============================================================ */
const EVIDENCE_ITEMS = [
  { id:'contract', name:'劳动合同（原件 / 照片）', why:'确认合同关系、薪资约定' },
  { id:'payroll',  name:'工资流水（近 12 个月）', why:'算补偿基数的关键' },
  { id:'bonus',    name:'奖金 / 提成 / 补贴记录', why:'把补偿基数撑高，别只按基本工资算' },
  { id:'overtime', name:'加班记录（打卡 / 审批）', why:'主张加班费' },
  { id:'social',   name:'社保 / 公积金缴纳记录', why:'主张未足额缴纳' },
  { id:'perf',     name:'绩效沟通 / 调岗降薪记录', why:'证明变相逼离职' },
  { id:'work',     name:'工作成果 / 邮件往来', why:'反驳“不胜任”的解除理由' },
];
const VAULT_KEY = 'layoff_vault_v1';

function loadVault() {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveVault(data) { localStorage.setItem(VAULT_KEY, JSON.stringify(data)); }

function renderVault() {
  const data = loadVault();
  let html = '';
  EVIDENCE_ITEMS.forEach(item => {
    const rec = data[item.id] || { done:false, note:'' };
    html += `<div class="vault-item ${rec.done ? 'done' : ''}" id="vault-${item.id}">
      <div class="vault-item-top" onclick="toggleVault('${item.id}')">
        <div class="vault-check">${rec.done ? '✓' : ''}</div>
        <div class="vault-item-text">
          <h4>${item.name}</h4>
          <p>${item.why}</p>
        </div>
      </div>
      <textarea class="vault-note" rows="1" placeholder="备注：存在哪了？（如：已拍照存手机相册 / 已下载到网盘）"
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
  document.getElementById('vault-' + id).classList.toggle('done', data[id].done);
  document.querySelector('#vault-' + id + ' .vault-check').textContent = data[id].done ? '✓' : '';
  updateVaultProgress();
}
function updateNote(id, val) {
  const data = loadVault();
  if (!data[id]) data[id] = { done:false, note:'' };
  data[id].note = val;
  saveVault(data);
}

function updateVaultProgress() {
  const data = loadVault();
  const doneCount = EVIDENCE_ITEMS.filter(it => data[it.id] && data[it.id].done).length;
  const total = EVIDENCE_ITEMS.length;
  const pct = Math.round(doneCount / total * 100);
  const circ = 314.2;
  document.getElementById('vaultArc').style.strokeDashoffset = circ * (1 - pct / 100);
  document.getElementById('vaultPct').textContent = pct + '%';
  const tip = document.getElementById('vaultTip');
  if (pct === 0) tip.textContent = '趁还在职，把这些证据存好。离职后很多东西就拿不到了。';
  else if (pct < 100) tip.textContent = `已 ${pct}% 满仓，继续加油。每存一项，你的谈判筹码就多一分。`;
  else tip.textContent = '🎉 筹码已满仓！真出事时，这些就是你谈判桌上的底气。';
}

/* ============================================================
   模块三：实战谈判指引（傻瓜式单步）
   ============================================================ */
let battleStep = 0;
const battleData = {};

function renderBattle() {
  battleStep = 0;
  renderBattleStep();
}

function renderBattleStep() {
  const c = document.getElementById('battleContainer');
  if (battleStep === 0) {
    c.innerHTML = `
      <div class="battle-intro">
        <h2>先别急，深呼吸</h2>
        <p>被通知裁员那一刻，最忌慌乱签字。我们花几分钟，一步步把它处理好。你能拿到的，远比你以为的多。</p>
      </div>
      <button class="btn" onclick="battleNext()">开始，第一步 →</button>`;
    return;
  }
  if (battleStep === 1) {
    c.innerHTML = `
      <div class="step-card">
        <span class="step-num">第 1 步 / 共 4 步</span>
        <h3>千万别当场签任何字</h3>
        <p>HR 最常用的招就是制造紧迫感，让你当场签字走人。记住：你有权把方案带回去看。照下面这样回复：</p>
        <div class="quote-box">“这个方案我需要带回去仔细看一下，麻烦给我一份书面的解除方案和补偿明细。我考虑后再答复。”</div>
        <p>拿到书面材料、不当场签，你就已经赢了第一回合。</p>
      </div>
      <button class="btn" onclick="battleNext()">我记住了，下一步 →</button>
      <button class="btn btn-ghost" onclick="battlePrev()">上一步</button>`;
    return;
  }
  if (battleStep === 2) {
    const vault = loadVault();
    const doneCount = EVIDENCE_ITEMS.filter(it => vault[it.id] && vault[it.id].done).length;
    let vaultHint = doneCount > 0
      ? `<p>你之前在“证据保险箱”已经存好了 <b style="color:var(--accent)">${doneCount}</b> 项证据，这些现在就是你的筹码。再确认下这几样关键的有没有：</p>`
      : `<p>现在马上把这几样关键证据拍照留存（离职后很多就拿不到了）：</p>`;
    c.innerHTML = `
      <div class="step-card">
        <span class="step-num">第 2 步 / 共 4 步</span>
        <h3>立刻留存关键证据</h3>
        ${vaultHint}
        <div class="signals">
          <div class="signal-item"><span class="warn">•</span><span>劳动合同、近 12 个月工资流水</span></div>
          <div class="signal-item"><span class="warn">•</span><span>奖金 / 提成记录（撑高补偿基数）</span></div>
          <div class="signal-item"><span class="warn">•</span><span>解除通知、与 HR 的聊天记录</span></div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="showPage('page-vault'); renderVault();" style="margin-top:14px;">打开证据保险箱 →</button>
      </div>
      <button class="btn" onclick="battleNext()">证据齐了，算赔偿 →</button>
      <button class="btn btn-ghost" onclick="battlePrev()">上一步</button>`;
    return;
  }
  if (battleStep === 3) {
    c.innerHTML = `
      <div class="step-card">
        <span class="step-num">第 3 步 / 共 4 步</span>
        <h3>算清你该拿多少</h3>
        <p>填两个数，帮你估算赔偿区间。补偿基数要按<b>税前月均工资（含奖金提成）</b>算，别被“基本工资”忽悠。</p>
        <div class="field">
          <label>你在这家公司的工作年限（年，可填小数，如 2.5）</label>
          <input type="number" id="workYears" placeholder="例如 3" step="0.5" min="0" />
        </div>
        <div class="field">
          <label>离职前 12 个月平均月薪（元，税前，含奖金提成）</label>
          <input type="number" id="monthSalary" placeholder="例如 20000" min="0" />
        </div>
        <button class="btn btn-sm" onclick="calcCompensation()">计算我的赔偿区间</button>
        <div id="calcResult"></div>
      </div>
      <button class="btn" onclick="battleNext()">了解了，看签字红线 →</button>
      <button class="btn btn-ghost" onclick="battlePrev()">上一步</button>`;
    return;
  }
  if (battleStep === 4) {
    c.innerHTML = `
      <div class="step-card">
        <span class="step-num">第 4 步 / 共 4 步</span>
        <h3>签字前，核对这 5 条红线</h3>
        <p>下面任何一条出现在协议里，先别签，要么改，要么咨询律师：</p>
        <div class="redline-item"><span class="no">✕</span><span>写着“个人原因主动离职” → 直接放弃所有赔偿，绝对不签</span></div>
        <div class="redline-item"><span class="no">✕</span><span>写着“双方无任何劳动争议 / 已结清所有款项” → 堵死社保、加班费、年终奖后路</span></div>
        <div class="redline-item"><span class="no">✕</span><span>补偿金额低于法定 N → 说明没谈到底线</span></div>
        <div class="redline-item"><span class="no">✕</span><span>含竞业限制却无补偿 → 限制你再就业</span></div>
        <div class="redline-item"><span class="no">✕</span><span>要求当场签、不给带走看 → 典型施压套路</span></div>
      </div>
      <div class="cta">
        <h3>你已经走完关键四步</h3>
        <p>不当场签、留好证据、算清数字、避开红线——你已经比 90% 的人更有准备。如果方案谈不拢，记得：劳动仲裁是免费的，时效一年。</p>
      </div>
      <button class="btn btn-ghost" onclick="goHome()">返回首页</button>`;
    return;
  }
}

function battleNext() { battleStep++; renderBattleStep(); }
function battlePrev() { if (battleStep > 0) { battleStep--; renderBattleStep(); } }

function calcCompensation() {
  const years = parseFloat(document.getElementById('workYears').value);
  const salary = parseFloat(document.getElementById('monthSalary').value);
  const box = document.getElementById('calcResult');
  if (!years || !salary || years <= 0 || salary <= 0) {
    box.innerHTML = `<p style="color:var(--red);font-size:13px;margin-top:10px;">请填写有效的年限和月薪。</p>`;
    return;
  }
  // N 计算：每满 1 年 1 个月；满半年不满 1 年算 1 个月；不满半年算 0.5 个月
  const fullYears = Math.floor(years);
  const remainder = years - fullYears;
  let nMonths = fullYears;
  if (remainder >= 0.5) nMonths += 1;
  else if (remainder > 0) nMonths += 0.5;

  const N = nMonths * salary;
  const N1 = N + salary;
  const N2 = N * 2;
  const fmt = v => '¥' + Math.round(v).toLocaleString();

  box.innerHTML = `
    <div class="calc-result">
      <div class="calc-row"><span class="label">补偿月数 N</span><span class="val">${nMonths} 个月</span></div>
      <div class="calc-row highlight"><span class="label">法定底线 (N)</span><span class="val">${fmt(N)}</span></div>
      <div class="calc-row"><span class="label">未提前通知 (N+1)</span><span class="val">${fmt(N1)}</span></div>
      <div class="calc-row highlight"><span class="label">违法解除争取 (2N)</span><span class="val">${fmt(N2)}</span></div>
      <div class="calc-row"><span class="label">建议谈判区间</span><span class="val">${fmt(N1)} ~ ${fmt(N2)}</span></div>
    </div>
    <p style="font-size:12px;color:var(--sub);margin-top:10px;line-height:1.7;">
      注：月薪超当地社平工资 3 倍的，补偿基数按 3 倍封顶、最多补 12 年。具体认定请以律师意见为准。
    </p>`;
}
