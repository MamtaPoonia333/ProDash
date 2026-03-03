// ══════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');

function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function load(key, def) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
  catch { return def; }
}

// ══════════════════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════════════════
const themeToggle = $('themeToggle');
let darkMode = load('darkMode', false);

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  themeToggle.classList.toggle('dark', darkMode);
}
applyTheme();
themeToggle.addEventListener('click', () => {
  darkMode = !darkMode;
  save('darkMode', darkMode);
  applyTheme();
});

// ══════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════
const navTabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.section');

function switchSection(id) {
  sections.forEach(s => s.classList.toggle('active', s.id === id));
  navTabs.forEach(t => t.classList.toggle('active', t.dataset.section === id));
  save('activeSection', id);
}

navTabs.forEach(t => t.addEventListener('click', () => switchSection(t.dataset.section)));

const savedSection = load('activeSection', 'todo');
switchSection(savedSection);

// ══════════════════════════════════════════════════════
//  1. TO-DO LIST
// ══════════════════════════════════════════════════════
let todos = load('todos', []);
let todoFilter = 'all';

function saveTodos() { save('todos', todos); }

function renderTodos() {
  const list = $('todoList');
  const stats = $('todoStats');
  const filtered = todos.filter(t => {
    if (todoFilter === 'active') return !t.done;
    if (todoFilter === 'done')   return  t.done;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="todo-empty">${
      todoFilter === 'done'   ? 'No completed tasks yet.' :
      todoFilter === 'active' ? 'All tasks done! 🎉' :
                                'Add your first task above.'
    }</div>`;
  } else {
    list.innerHTML = filtered.map(t => `
      <li class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <button class="todo-check" data-action="toggle" title="Toggle complete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <div style="flex:1;min-width:0;">
          <div class="todo-text">${escHtml(t.text)}</div>
          <div class="todo-meta">${formatDate(t.created)}</div>
        </div>
        <button class="btn-icon" data-action="delete" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </li>`).join('');
  }

  const done  = todos.filter(t => t.done).length;
  const total = todos.length;
  stats.textContent = total ? `${done} of ${total} completed` : '';
}

function addTodo() {
  const input = $('todoInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  todos.unshift({ id: Date.now(), text, done: false, created: Date.now() });
  saveTodos();
  renderTodos();
  input.value = '';
  input.focus();
}

$('todoAddBtn').addEventListener('click', addTodo);
$('todoInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

$('todoList').addEventListener('click', e => {
  const li  = e.target.closest('[data-id]');
  const btn = e.target.closest('[data-action]');
  if (!li || !btn) return;
  const id = Number(li.dataset.id);
  if (btn.dataset.action === 'toggle') {
    const t = todos.find(t => t.id === id);
    if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
  }
  if (btn.dataset.action === 'delete') {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    todoFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderTodos();
  });
});

renderTodos();

// ══════════════════════════════════════════════════════
//  2. TASK PLANNER
// ══════════════════════════════════════════════════════
let tasks = load('tasks', []);
function saveTasks() { save('tasks', tasks); }

function renderTasks() {
  const list  = $('plannerList');
  const empty = $('plannerEmpty');
  const sort  = $('plannerSort').value;

  let sorted = [...tasks];
  if (sort === 'date') {
    sorted.sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1);
  } else {
    const p = { high: 0, medium: 1, low: 2 };
    sorted.sort((a, b) => p[a.priority] - p[b.priority]);
  }

  empty.style.display = sorted.length ? 'none' : 'block';
  list.innerHTML = sorted.map(t => `
    <div class="task-item ${t.priority} ${t.done ? 'done-task' : ''}" data-id="${t.id}">
      <div class="task-item-header">
        <div>
          <div class="task-name">${escHtml(t.name)}</div>
          ${t.date ? `<div class="task-date">📅 ${formatDueDate(t.date)}</div>` : ''}
          ${t.desc ? `<div class="task-desc">${escHtml(t.desc)}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <span class="priority-badge priority-${t.priority}">${t.priority}</span>
          <div class="task-actions">
            <button class="btn-done" data-action="toggle-task" title="Mark done">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <button class="btn-icon" data-action="del-task" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`).join('');
}

$('plannerAddBtn').addEventListener('click', () => {
  const name = $('plannerName').value.trim();
  if (!name) { $('plannerName').focus(); return; }
  tasks.unshift({
    id: Date.now(),
    name,
    desc: $('plannerDesc').value.trim(),
    date: $('plannerDate').value,
    priority: $('plannerPriority').value,
    done: false
  });
  saveTasks();
  renderTasks();
  $('plannerName').value = '';
  $('plannerDesc').value = '';
  $('plannerDate').value = '';
  $('plannerPriority').value = 'medium';
});

$('plannerList').addEventListener('click', e => {
  const el  = e.target.closest('[data-id]');
  const btn = e.target.closest('[data-action]');
  if (!el || !btn) return;
  const id = Number(el.dataset.id);
  if (btn.dataset.action === 'toggle-task') {
    const t = tasks.find(t => t.id === id);
    if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
  }
  if (btn.dataset.action === 'del-task') {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
});

$('plannerSort').addEventListener('change', renderTasks);

// Set today's date as default
$('plannerDate').value = new Date().toISOString().split('T')[0];
renderTasks();

// ══════════════════════════════════════════════════════
//  3. COUNTDOWN TIMER
// ══════════════════════════════════════════════════════
const CIRC = 2 * Math.PI * 88; // circumference

let cdTotal    = 0;
let cdRemain   = 0;
let cdRunning  = false;
let cdInterval = null;
let cdLastTick = null;

function cdUpdateDisplay() {
  const h = Math.floor(cdRemain / 3600);
  const m = Math.floor((cdRemain % 3600) / 60);
  const s = cdRemain % 60;
  $('timerDisplay').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  const pct    = cdTotal > 0 ? cdRemain / cdTotal : 1;
  const offset = CIRC * (1 - pct);
  $('progressFill').style.strokeDashoffset = offset;
}

function cdStart() {
  if (cdRunning) return;
  if (cdRemain === 0) {
    const h = parseInt($('timerHours').value)   || 0;
    const m = parseInt($('timerMinutes').value)  || 0;
    const s = parseInt($('timerSeconds').value)  || 0;
    cdTotal  = h * 3600 + m * 60 + s;
    cdRemain = cdTotal;
    if (cdTotal === 0) { $('timerStatus').textContent = 'Please set a time first.'; return; }
  }
  cdRunning  = true;
  cdLastTick = Date.now();
  $('timerDisplay').classList.add('running');
  $('timerDisplay').classList.remove('finished');
  $('timerStartBtn').style.display = 'none';
  $('timerPauseBtn').style.display = '';
  $('timerStatus').textContent = $('timerLabel').value || 'Timer running…';

  cdInterval = setInterval(() => {
    const now     = Date.now();
    const elapsed = Math.round((now - cdLastTick) / 1000);
    cdLastTick    = now;
    cdRemain      = Math.max(0, cdRemain - elapsed);
    cdUpdateDisplay();
    if (cdRemain === 0) cdFinish();
  }, 500);
}

function cdPause() {
  if (!cdRunning) return;
  clearInterval(cdInterval);
  cdRunning = false;
  $('timerDisplay').classList.remove('running');
  $('timerStartBtn').style.display = '';
  $('timerPauseBtn').style.display = 'none';
  $('timerStatus').textContent = 'Paused';
}

function cdReset() {
  clearInterval(cdInterval);
  cdRunning = false; cdRemain = 0; cdTotal = 0;
  $('timerDisplay').textContent = '00:00:00';
  $('timerDisplay').classList.remove('running', 'finished');
  $('timerStartBtn').style.display = '';
  $('timerPauseBtn').style.display = 'none';
  $('timerStatus').textContent = '';
  $('progressFill').style.strokeDashoffset = 0;
}

function cdFinish() {
  clearInterval(cdInterval);
  cdRunning = false;
  $('timerDisplay').classList.remove('running');
  $('timerDisplay').classList.add('finished');
  $('timerStartBtn').style.display = '';
  $('timerPauseBtn').style.display = 'none';
  $('timerStatus').textContent = "🎉 Time's up!";
  // Beep
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    g.gain.setValueAtTime(.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.2);
    osc.start(); osc.stop(ctx.currentTime + 1.2);
  } catch (e) {}
}

$('timerStartBtn').addEventListener('click', cdStart);
$('timerPauseBtn').addEventListener('click', cdPause);
$('timerResetBtn').addEventListener('click', cdReset);

// ══════════════════════════════════════════════════════
//  4. STOPWATCH
// ══════════════════════════════════════════════════════
let swRunning = false;
let swElapsed = 0;      // ms
let swStart   = null;
let swOffset  = 0;      // ms accumulated before pause
let swRaf     = null;
let laps      = [];
let lastLapMs = 0;

function swFormat(ms) {
  const cs = Math.floor((ms % 1000) / 10);
  const s  = Math.floor(ms / 1000) % 60;
  const m  = Math.floor(ms / 60000) % 60;
  const h  = Math.floor(ms / 3600000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function swTick() {
  swElapsed = swOffset + (Date.now() - swStart);
  $('swDisplay').textContent = swFormat(swElapsed);
  swRaf = requestAnimationFrame(swTick);
}

function swStartStop() {
  if (swRunning) return;
  swRunning = true;
  swStart   = Date.now();
  $('swDisplay').classList.add('running');
  $('swStartBtn').style.display = 'none';
  $('swPauseBtn').style.display = '';
  $('swLapBtn').style.display   = '';
  swRaf = requestAnimationFrame(swTick);
}

function swPause() {
  if (!swRunning) return;
  cancelAnimationFrame(swRaf);
  swOffset  = swElapsed;
  swRunning = false;
  $('swDisplay').classList.remove('running');
  $('swStartBtn').style.display = '';
  $('swPauseBtn').style.display = 'none';
  $('swLapBtn').style.display   = '';
}

function swReset() {
  cancelAnimationFrame(swRaf);
  swRunning = false; swElapsed = 0; swOffset = 0; swStart = null; lastLapMs = 0;
  laps = [];
  $('swDisplay').textContent = '00:00:00.00';
  $('swDisplay').classList.remove('running');
  $('swStartBtn').style.display = '';
  $('swPauseBtn').style.display = 'none';
  $('swLapBtn').style.display   = 'none';
  $('lapContainer').style.display = 'none';
  $('lapList').innerHTML = '';
}

function swLap() {
  if (!swRunning) return;
  const split = swElapsed - lastLapMs;
  laps.unshift({ num: laps.length + 1, total: swElapsed, split });
  lastLapMs = swElapsed;

  $('lapContainer').style.display = 'block';

  const splits = laps.map(l => l.split);
  const minS   = Math.min(...splits);
  const maxS   = Math.max(...splits);

  $('lapList').innerHTML = laps.map(l => {
    let cls = '';
    if (laps.length > 1) {
      if (l.split === minS) cls = 'lap-fastest';
      if (l.split === maxS) cls = 'lap-slowest';
    }
    return `<div class="lap-item">
      <span class="lap-num">Lap ${l.num}</span>
      <span class="lap-split ${cls}">${swFormat(l.split)}</span>
      <span class="lap-time">${swFormat(l.total)}</span>
    </div>`;
  }).join('');
}

$('swStartBtn').addEventListener('click', swStartStop);
$('swPauseBtn').addEventListener('click', swPause);
$('swResetBtn').addEventListener('click', swReset);
$('swLapBtn').addEventListener('click',   swLap);

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const [y, mo, d] = dateStr.split('-').map(Number);
  const due   = new Date(y, mo - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.round((due - today) / 86400000);
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (diff === 0)  return `${label} (Today)`;
  if (diff === 1)  return `${label} (Tomorrow)`;
  if (diff === -1) return `${label} (Yesterday)`;
  if (diff < 0)   return `${label} (${Math.abs(diff)}d overdue)`;
  return `${label} (in ${diff}d)`;
}
