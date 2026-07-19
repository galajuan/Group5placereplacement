let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('themeBtn').textContent = isDark ? '🌙' : '☀️';
}


function selectHeroAlgo(algo) {
  document.getElementById('hero-fifo').classList.toggle('active', algo === 'FIFO');
  document.getElementById('hero-lru').classList.toggle('active',  algo === 'LRU');
  document.getElementById(algo === 'FIFO' ? 'r-fifo' : 'r-lru').checked = true;
}

/* ══ INPUT MODE DETECTION ═══════════════════════════════════════ */
function detectMode(raw) {
  const cleaned = raw.replace(/[\s,]+/g, '');
  if (!cleaned) return 'none';
  const hasNum    = /[0-9]/.test(cleaned);
  const hasLetter = /[a-zA-Z]/.test(cleaned);
  if (hasNum && hasLetter) return 'mixed';
  if (hasNum)    return 'num';
  if (hasLetter) return 'char';
  return 'none';
}

function updateModeBadge(mode) {
  const badge = document.getElementById('modeBadge');
  if (!badge) return;
  badge.className = 'mode-badge';
  if (mode === 'num') {
    badge.classList.add('mode-num');
    badge.textContent = '# Numbers mode';
  } else if (mode === 'char') {
    badge.classList.add('mode-char');
    badge.textContent = 'A Letters mode';
  } else {
    badge.classList.add('mode-none');
    badge.textContent = 'Enter a reference string';
  }
}

function autoSpaceFormat(input) {
  const cursorPos = input.selectionStart;
  const rawBefore = input.value.slice(0, cursorPos);
  const tokensBeforeCursor = rawBefore.replace(/[\s,]+/g, '').length;

  const raw  = input.value;
  const mode = detectMode(raw);
  updateModeBadge(mode);

  if (mode === 'mixed') {
    showError('Mixed input detected — use only numbers OR only letters, not both.');
    return;
  }
  clearError();

  let cleaned = raw.replace(/[\s,]+/g, '');
  if (mode === 'num')  cleaned = cleaned.replace(/[^0-9]/g, '');
  if (mode === 'char') cleaned = cleaned.replace(/[^a-zA-Z]/g, '');

  const formatted = cleaned.split('').join(' ');
  input.value = formatted;

  // Restore the caret to roughly where the user was still typing
  let newPos = tokensBeforeCursor === 0 ? 0 : (tokensBeforeCursor * 2) - 1;
  newPos = Math.max(0, Math.min(newPos, formatted.length));
  input.setSelectionRange(newPos, newPos);
}

/* ══ REFERENCE STRING INPUT HANDLER ════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const refInput = document.getElementById('refstr');

  refInput.addEventListener('input', function () {
    autoSpaceFormat(this);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.target.id === 'refstr' || e.target.id === 'frames')) onBuild();
  });

  // Restore previous session
  const savedRef    = localStorage.getItem("reference");
  const savedFrames = localStorage.getItem("frames");
  const savedAlgo    = localStorage.getItem("algorithm");

  if (savedRef) {
    document.getElementById("refstr").value = savedRef;
    document.getElementById("frames").value = savedFrames || 3;

    if (savedAlgo === "LRU") {
      document.getElementById("r-lru").checked = true;
      selectHeroAlgo("LRU");
    } else {
      document.getElementById("r-fifo").checked = true;
      selectHeroAlgo("FIFO");
    }

    updateModeBadge(detectMode(savedRef));

    // Automatically rebuild the schedule
    onBuild();
  }

});

/* ══ PARSE REFERENCE STRING ═════════════════════════════════════ */
function parseRefString(raw) {
  return raw.trim().split(/[\s,]+/).filter(Boolean);
}

/* ══ TABLE CELL SELECTION / HOVER HIGHLIGHT ═════════════════════ */
let selectedPage = null;

function attachHoverHighlight(tableEl) {
  tableEl.addEventListener("click", e => {
    const td = e.target.closest("td[data-page]");
    if (!td) return;

    const value = td.dataset.page;

    if (selectedPage === value) {
      selectedPage = null;
      clearSelection();
      return;
    }

    selectedPage = value;
    applySelection(value);
  });
}

function applySelection(value) {
  document.querySelectorAll("td[data-page]").forEach(td => {
    if (td.dataset.page === value) {
      td.classList.add("cell-selected");
      td.classList.remove("cell-dim");
    } else {
      td.classList.remove("cell-selected");
      td.classList.add("cell-dim");
    }
  });
}

function clearSelection() {
  document.querySelectorAll("td[data-page]").forEach(td => {
    td.classList.remove("cell-selected");
    td.classList.remove("cell-dim");
  });
}

/* ══ RENDER — SCHEDULE TABLE ════════════════════════════════════ */
function renderSchedule(pages, steps) {
  const nF = steps[0].frames.length;
  const th = isDark ? '#0a0318' : '#efe9ff';
  const tr = isDark ? '#120a24' : '#f8f5ff';

  let h = `<table class="data-table" id="schedTable"><thead><tr><th class="col-lbl">REF</th>`;
  for (let i = 0; i < pages.length; i++)
    h += `<th style="color:#a78bfa;background:${th}">${i + 1}</th>`;
  h += `</tr></thead><tbody>`;

  // Page row
  h += `<tr><td class="col-lbl">Page</td>`;
  for (const p of pages)
    h += `<td class="tbl-page-cell" data-page="${p}"
            style="background:${tr};color:${isDark ? '#fff' : '#1e1338'};font-weight:700;font-size:.85rem">${p}</td>`;
  h += `</tr>`;

  // Frame rows
  for (let f = 0; f < nF; f++) {
    h += `<tr><td class="col-lbl">Frame ${f + 1}</td>`;
    for (let t = 0; t < steps.length; t++) {
      const s   = steps[t];
      const val = s.frames[f];
      let sty;
      if (val === null) {
        sty = `color:${isDark ? '#241a45' : '#c9bdf0'}`;
        h += `<td style="${sty}">—</td>`;
        continue;
      } else if (!s.hit && s.replaced === f) {
        sty = 'background:rgba(239,68,68,.1);color:#f87171;font-weight:700;border-top:1px solid rgba(239,68,68,.15);border-bottom:1px solid rgba(239,68,68,.15)';
      } else if (s.hit && val === pages[t]) {
        sty = 'background:rgba(16,185,129,.08);color:#34d399;font-weight:700';
      } else {
        sty = `color:${isDark ? '#a89fc4' : '#382a5c'}`;
      }
      h += `<td class="tbl-page-cell" data-page="${val}" style="${sty}">${val}</td>`;
    }
    h += `</tr>`;
  }

  // Status row
  h += `<tr class="row-status"><td class="col-lbl">Status</td>`;
  for (const s of steps)
    h += s.hit
      ? `<td class="glow-green" style="color:#10b981;font-weight:800;font-size:.65rem;letter-spacing:.1em">HIT</td>`
      : `<td class="glow-red"   style="color:#ef4444;font-weight:800;font-size:.65rem;letter-spacing:.1em">FAULT</td>`;

  h += `</tr></tbody></table>`;
  return h;
}

/* ══ RENDER — QUEUE STATE ═══════════════════════════════════════ */
function renderQueue(pages, steps, algo, n) {
  const th = isDark ? '#0a0318' : '#efe9ff';

  let h = `<table class="data-table" id="queueTable"><thead><tr><th class="col-lbl">RANK</th>`;
  for (let i = 0; i < steps.length; i++)
    h += `<th style="color:#a78bfa;background:${th}">${i + 1}</th>`;
  h += `</tr></thead><tbody>`;

  for (let r = 0; r < n; r++) {
    let label;
    if (algo === 'FIFO') {
      label = r === 0 ? `Rank ${r+1} (Newest)` : r === n-1 ? `Rank ${r+1} (Oldest)` : `Rank ${r+1}`;
    } else {
      label = r === 0 ? `Rank ${r+1} (MRU)` : r === n-1 ? `Rank ${r+1} (LRU)` : `Rank ${r+1}`;
    }
    h += `<tr><td class="col-lbl">${label}</td>`;
    for (const s of steps) {
      const idx = s.queue.length - 1 - r;
      const val = (idx >= 0 && s.queue[idx] !== undefined) ? s.queue[idx] : null;
      if (val === null) {
        h += `<td style="color:${isDark ? '#241a45' : '#c9bdf0'}">—</td>`;
      } else {
        h += `<td class="tbl-page-cell" data-page="${val}"
               style="color:${isDark ? '#e4defa' : '#1e1338'};font-weight:600">${val}</td>`;
      }
    }
    h += `</tr>`;
  }

  return h + `</tbody></table>`;
}

/* ══ RENDER — SUMMARY ═══════════════════════════════════════════ */
function renderSummary(pages, steps, algo, nFrames) {
  const total    = pages.length;
  const unique   = new Set(pages).size;
  const hits     = steps.filter(s => s.hit).length;
  const faults   = total - hits;
  const hitPct   = (hits   / total * 100).toFixed(2);
  const faultPct = (faults / total * 100).toFixed(2);

  function card({ label, value, color, sub, bdr, bg, barPct, barClr }) {
    const bar = barPct !== undefined
      ? `<div class="mt-3 rounded-full overflow-hidden" style="height:2px;background:${isDark ? '#180b30' : '#e4d9ff'}">
           <div class="bar-fill h-full rounded-full" style="width:${barPct}%;background:${barClr}"></div>
         </div>` : '';
    return `
      <div class="rounded-2xl border p-5 flex flex-col gap-1 transition-all duration-200"
           style="background:${bg||(isDark?'#0f0620':'#faf8ff')};border-color:${bdr||(isDark?'rgba(124,58,237,.3)':'rgba(139,92,246,.15)')}">
        <div style="font-size:.57rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${isDark?'#4c4270':'#8b81a8'};font-family:'JetBrains Mono',monospace">${label}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-weight:900;font-size:clamp(1.6rem,3vw,2.1rem);color:${color||'#fff'};line-height:1">${value}</div>
        ${sub?`<div style="font-family:'JetBrains Mono',monospace;font-size:.68rem;color:${color};opacity:.7;margin-top:2px">${sub}</div>`:''}
        ${bar}
      </div>`;
  }

  return [
    card({ label:'References',  value:total,    color:'#a78bfa' }),
    card({ label:'Unique Pages', value:unique,  color:isDark?'#fff':'#1e1338' }),
    card({ label:'Algorithm',   value:algo,     color:'#a78bfa' }),
    card({ label:'Frames',      value:nFrames,  color:isDark?'#fff':'#1e1338' }),
    card({ label:'Hits',   value:hits,   color:'#34d399', sub:`${hitPct}% hit rate`,
           bdr:'rgba(16,185,129,.2)', bg:isDark?'rgba(16,185,129,.05)':'rgba(16,185,129,.04)',
           barPct:+hitPct, barClr:'#10b981' }),
    card({ label:'Faults', value:faults, color:'#f87171', sub:`${faultPct}% miss rate`,
           bdr:'rgba(239,68,68,.2)', bg:isDark?'rgba(239,68,68,.05)':'rgba(239,68,68,.04)',
           barPct:+faultPct, barClr:'#ef4444' }),
  ].join('');
}

/* ══ ERROR HELPERS ══════════════════════════════════════════════ */
function showError(msg) {
  const el = document.getElementById('errMsg');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function clearError() {
  const el = document.getElementById('errMsg');
  el.textContent = '';
  el.classList.add('hidden');
}

/* ══ MAIN CONTROLLER ════════════════════════════════════════════ */
function onBuild() {
  clearError();
  const raw = document.getElementById('refstr').value.trim();
  if (!raw) { showError('Reference string cannot be empty.'); return; }

  const mode = detectMode(raw);
  if (mode === 'mixed') {
    showError('Mixed input detected — use only numbers OR only letters, not both.');
    return;
  }

  const tokens = parseRefString(raw);
  if (tokens.length === 0) { showError('Reference string cannot be empty.'); return; }

  if (mode === 'num') {
    if (tokens.some(t => !/^\d+$/.test(t))) { showError('Number mode: all tokens must be non-negative integers.'); return; }
  } else if (mode === 'char') {
    if (tokens.some(t => !/^[a-zA-Z]$/.test(t))) { showError('Letter mode: each token must be a single letter (A–Z).'); return; }
  }

  const pages   = mode === 'num' ? tokens.map(Number) : tokens.map(t => t.toUpperCase());
  const nFrames = parseInt(document.getElementById('frames').value, 10);
  if (!nFrames || nFrames < 1) { showError('Number of frames must be at least 1.'); return; }

  const algo  = document.querySelector('input[name="algo"]:checked').value;
  const steps = algo === 'FIFO' ? runFIFO(pages, nFrames) : runLRU(pages, nFrames);

  // Save current session
  localStorage.setItem("reference", raw);
  localStorage.setItem("frames", nFrames);
  localStorage.setItem("algorithm", algo);

  // Render tables
  document.getElementById('schedWrap').innerHTML = renderSchedule(pages, steps);
  document.getElementById('queueSubtitle').textContent = `· ${algo} Priority`;
  document.getElementById('queueDesc').textContent =
    algo === 'FIFO'
      ? '— newest page at Rank 1 → oldest page (first to be evicted) at bottom'
      : '— Most Recently Used at Rank 1 → Least Recently Used at bottom';
  document.getElementById('queueWrap').innerHTML = renderQueue(pages, steps, algo, nFrames);
  document.getElementById('summaryGrid').innerHTML = renderSummary(pages, steps, algo, nFrames);

  // Attach hover highlight to both tables
  const schedTable = document.getElementById('schedTable');
  const queueTable = document.getElementById('queueTable');
  if (schedTable) attachHoverHighlight(schedTable);
  if (queueTable) attachHoverHighlight(queueTable);

  ['tableCard', 'queueCard', 'summaryCard'].forEach(id =>
    document.getElementById(id).classList.remove('hidden')
  );
  document.getElementById('tableCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onClear() {
  document.getElementById('refstr').value = '';
  document.getElementById('frames').value = '3';
  document.getElementById('r-fifo').checked = true;
  selectHeroAlgo('FIFO');
  updateModeBadge('none');
  clearSelection();
  selectedPage = null;

  ['tableCard', 'queueCard', 'summaryCard'].forEach(id =>
    document.getElementById(id).classList.add('hidden')
  );
  ['schedWrap', 'queueWrap', 'summaryGrid'].forEach(id =>
    document.getElementById(id).innerHTML = ''
  );
  clearError();

  localStorage.removeItem("reference");
  localStorage.removeItem("frames");
  localStorage.removeItem("algorithm");
}
//ENDOFFILE


/* ══ DEVELOPER CREDITS — FULLSCREEN PHOTO MODAL ═════════════════ */
document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("imgModal");
    const modalImg = document.getElementById("modalImage");
    const modalName = document.getElementById("modalName");
    const modalRole = document.getElementById("modalRole");

    document.querySelectorAll(".dev-hover img").forEach(img => {

        img.addEventListener("click", function (e) {

            e.stopPropagation();

            const parent = this.closest(".dev-name");

            modal.classList.add("active");
            modalImg.src = parent.dataset.img;
            modalName.textContent = parent.dataset.name;
            modalRole.textContent = parent.dataset.role;

        });

    });

    document.querySelector(".close-modal").addEventListener("click", function () {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            modal.classList.remove("active");
        }
    });

});
