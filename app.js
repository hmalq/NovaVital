// منطق التطبيق: تسجيل القراءات وعرضها محليًا في هذا المتصفح
const STORAGE_KEY = "novavital-checkins-v1";
const form = document.querySelector("#checkinForm");
const dateInput = document.querySelector("#entryDate");
const sleepInput = document.querySelector("#sleepHours");
const fatigueInput = document.querySelector("#fatigue");
const moodInput = document.querySelector("#mood");
const fatigueValue = document.querySelector("#fatigueValue");
const moodValue = document.querySelector("#moodValue");
const message = document.querySelector("#formMessage");
const rows = document.querySelector("#historyRows");
const chart = document.querySelector("#trendChart");
const insight = document.querySelector("#trendInsight");
const demoButton = document.querySelector("#demoButton");
const dailySummary = document.querySelector("#dailySummary");
const summaryStatus = document.querySelector("#summaryStatus");
const summaryReason = document.querySelector("#summaryReason");
const summaryAdvice = document.querySelector("#summaryAdvice");
const summaryDataNote = document.querySelector("#summaryDataNote");

function localDateString(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
dateInput.value = localDateString();

function readEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => item && item.date) : [];
  } catch (error) { return []; }
}
let entries = readEntries();

function saveEntries() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); return true; }
  catch (error) { message.textContent = "تعذّر الحفظ في هذا المتصفح."; return false; }
}
function formatDate(value) {
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(new Date(value + "T12:00:00"));
}
function updateRangeLabels() {
  fatigueValue.value = fatigueInput.value + " / 5";
  moodValue.value = moodInput.value + " / 5";
  fatigueValue.textContent = fatigueValue.value;
  moodValue.textContent = moodValue.value;
}
fatigueInput.addEventListener("input", updateRangeLabels);
moodInput.addEventListener("input", updateRangeLabels);

function renderHistory() {
  const newest = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  if (!newest.length) {
    rows.innerHTML = '<tr class="empty-row"><td colspan="4">لا توجد تسجيلات بعد.</td></tr>';
    return;
  }
  rows.innerHTML = newest.slice(0, 14).map((item) => {
    const demoTag = item.demo ? ' <span class="demo-tag">تجريبي</span>' : "";
    return '<tr><td>' + formatDate(item.date) + demoTag + '</td><td>' + Number(item.sleep).toLocaleString("ar-SA") + ' ساعة</td><td>' + item.fatigue + ' / 5</td><td>' + item.mood + ' / 5</td></tr>';
  }).join("");
}
function renderChart() {
  const recent = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  if (!recent.length) {
    chart.innerHTML = '<p style="color:#9aadc3;text-align:center;padding-top:50px">أضف تسجيلًا لتظهر المؤشرات.</p>';
    insight.innerHTML = '<span class="insight-icon" aria-hidden="true">✧</span><p>أضف تسجيلك الأول لتظهر لك المؤشرات هنا.</p>';
    return;
  }
  const series = [
    { key: "sleep", label: "النوم · ساعة", max: 12, color: "#61dfd0" },
    { key: "fatigue", label: "التعب · من 5", max: 5, color: "#ffc978" },
    { key: "mood", label: "المزاج · من 5", max: 5, color: "#b9a7ff" }
  ];
  let content = '<div style="display:grid;gap:10px;padding:8px 0">';
  series.forEach((item) => {
    let bars = "";
    recent.forEach((entry) => {
      const value = Number(entry[item.key]);
      const height = Math.max(8, Math.min(100, (value / item.max) * 100));
      bars += '<div title="' + formatDate(entry.date) + ': ' + value + '" style="flex:1;min-width:8px;text-align:center"><i style="display:block;height:' + height + '%;min-height:7px;background:' + item.color + ';border-radius:5px 5px 2px 2px"></i><small style="display:block;color:#9aadc3;font-size:9px;margin-top:4px">' + formatDate(entry.date) + '</small></div>';
    });
    const lastValue = Number(recent[recent.length - 1][item.key]);
    content += '<div><div style="display:flex;justify-content:space-between;color:#dce8f5;font-size:11px;margin-bottom:4px"><span>' + item.label + '</span><strong style="color:' + item.color + '">' + lastValue + '</strong></div><div style="height:43px;display:flex;align-items:end;gap:6px;border-bottom:1px solid #2a3d52;padding:0 3px">' + bars + '</div></div>';
  });
  chart.innerHTML = content + '</div>';
  insight.innerHTML = '<span class="insight-icon" aria-hidden="true">✧</span><p>هذه متابعة للقراءات المسجّلة فقط؛ لاحظ التغيّر واتبع بروتوكول المهمة عند الحاجة.</p>';
}
function renderDailySummary(focusEntry) {
  const newest = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const current = focusEntry || newest[0];
  if (!current) {
    dailySummary.hidden = true;
    return;
  }

  dailySummary.hidden = false;
  const previous = entries
    .filter((item) => item.date < current.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const simulated = Boolean(current.demo || (previous && previous.demo));
  summaryDataNote.hidden = !simulated;

  if (!previous) {
    summaryStatus.textContent = "بانتظار قراءات سابقة";
    summaryStatus.className = "summary-status summary-status-pending";
    summaryReason.textContent = "هذا أول تسجيل متاح للمقارنة، لذلك لا يمكن وصف التغيّر بعد. ستظهر المقارنة عند إضافة تسجيل سابق.";
    summaryAdvice.textContent = "واصل تسجيل النوم والمزاج والتعب بانتظام، واطلب الدعم عبر بروتوكول المهمة إذا كان لديك قلق.";
    return;
  }

  const changes = [];
  const sleepDelta = Number(current.sleep) - Number(previous.sleep);
  const fatigueDelta = Number(current.fatigue) - Number(previous.fatigue);
  const moodDelta = Number(current.mood) - Number(previous.mood);
  if (sleepDelta < 0) changes.push("انخفض النوم بمقدار " + Math.abs(sleepDelta).toLocaleString("ar-SA") + " ساعة");
  if (fatigueDelta > 0) changes.push("ارتفع التعب بمقدار " + fatigueDelta.toLocaleString("ar-SA") + " من ٥");
  if (moodDelta < 0) changes.push("انخفض المزاج بمقدار " + Math.abs(moodDelta).toLocaleString("ar-SA") + " من ٥");

  if (changes.length) {
    summaryStatus.textContent = "يحتاج متابعة";
    summaryStatus.className = "summary-status summary-status-followup";
    summaryReason.textContent = changes.join("، و") + " مقارنة بآخر تسجيل سابق (" + formatDate(previous.date) + "). هذه ملاحظة للتغيّر وليست تقييمًا طبيًا.";
    summaryAdvice.textContent = "واصل التسجيل، واهتم بروتين النوم والراحة. إذا استمر التغيّر أو أقلقك، تواصل مع المسؤول الطبي واتبع بروتوكول المهمة.";
  } else {
    summaryStatus.textContent = "مستقر مقارنة بالتسجيل السابق";
    summaryStatus.className = "summary-status summary-status-stable";
    summaryReason.textContent = "لم يظهر تراجع في النوم أو المزاج، ولا ارتفاع في التعب مقارنة بآخر تسجيل سابق (" + formatDate(previous.date) + "). هذه مقارنة وصفية فقط وليست تقييمًا طبيًا.";
    summaryAdvice.textContent = "استمر في تسجيل المؤشرات وملاحظة نمطها مع الوقت، واتبع بروتوكول المهمة إذا ظهر ما يقلقك.";
  }
}
function render(focusEntry) { renderHistory(); renderChart(); renderDailySummary(focusEntry); }

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = { date: dateInput.value, sleep: Number(sleepInput.value), fatigue: Number(fatigueInput.value), mood: Number(moodInput.value), demo: false };
  if (!entry.date || !Number.isFinite(entry.sleep) || entry.sleep < 0 || entry.sleep > 24) {
    message.textContent = "تحقّق من التاريخ وعدد ساعات النوم (من 0 إلى 24).";
    return;
  }
  const index = entries.findIndex((item) => item.date === entry.date);
  if (index >= 0) entries[index] = entry; else entries.push(entry);
  if (!saveEntries()) return;
  message.textContent = index >= 0 ? "تم تحديث تسجيل هذا اليوم." : "تم حفظ تسجيل اليوم.";
  render(entry);
});

demoButton.addEventListener("click", () => {
  const samples = [[6.5,3,4],[7,2,4],[6,3,3],[7.5,2,4],[6,4,3],[5.5,4,2],[6.5,3,3]];
  const today = new Date();
  samples.forEach(([sleep, fatigue, mood], index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (samples.length - 1 - index));
    const key = localDateString(date);
    if (!entries.some((item) => item.date === key)) entries.push({ date: key, sleep, fatigue, mood, demo: true });
  });
  if (!saveEntries()) return;
  message.textContent = "أُضيفت قراءات تجريبية خيالية للعرض.";
  render();
});
updateRangeLabels();
render();

// ===== قسم بيانات ناسا (Inspiration4) =====
(function () {
  const D = window.I4_DATA, tabs = document.querySelector("#markerTabs");
  const box = document.querySelector("#nasaChart"), legend = document.querySelector("#nasaLegend"), sum = document.querySelector("#nasaSummary");
  if (!tabs) return;
  if (!D) { box.innerHTML = '<p style="color:#9aadc3">تعذّر تحميل بيانات ناسا.</p>'; return; }
  const colors = { C001: "#61dfd0", C002: "#b9a7ff", C003: "#ffc978", C004: "#ff9d9d" };
  const avg = (a) => { const v = a.filter((x) => x !== null); return v.reduce((s, x) => s + x, 0) / v.length; };
  function draw(key) {
    const m = D.markers[key], tp = D.timepoints, W = 640, H = 300, L = 42, R = 14, T = 16, B = 36;
    const all = Object.values(m.crew).flat().filter((x) => x !== null);
    const lo = Math.min(...all) - 0.3, hi = Math.max(...all) + 0.3;
    const x = (i) => L + (i * (W - L - R)) / (tp.length - 1), y = (v) => T + ((hi - v) * (H - T - B)) / (hi - lo);
    let s = '<svg viewBox="0 0 ' + W + " " + H + '">';
    for (let g = 0; g <= 4; g++) { const v = lo + ((hi - lo) * g) / 4; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#2a3d52" stroke-dasharray="4 5"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v.toFixed(1) + "</text>"; }
    const dx = (x(2) + x(3)) / 2;
    s += '<line x1="' + dx + '" x2="' + dx + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#ffc978" stroke-dasharray="6 4"/><text x="' + (dx - 6) + '" y="' + (T + 10) + '" text-anchor="end">Pre-flight</text><text x="' + (dx + 6) + '" y="' + (T + 10) + '">Post-flight</text>';
    tp.forEach((t, i) => { s += '<text x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="middle">' + t + "</text>"; });
    Object.entries(m.crew).forEach(([c, vals]) => {
      const pts = vals.map((v, i) => (v === null ? null : [x(i), y(v)])).filter(Boolean);
      s += '<polyline fill="none" stroke="' + colors[c] + '" stroke-width="2.5" stroke-linejoin="round" points="' + pts.map((p) => p.join(",")).join(" ") + '"/>';
      pts.forEach((p) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + colors[c] + '"/>'; });
    });
    box.innerHTML = s + "</svg>";
    legend.innerHTML = Object.keys(colors).map((c) => '<span><i class="legend-dot" style="background:' + colors[c] + '"></i> رائد ' + c.slice(-1) + "</span>").join("") + "<span>الوحدة: " + D.unit + "</span>";
    const pre = avg(Object.values(m.crew).flatMap((a) => a.slice(0, 3))), post = avg(Object.values(m.crew).flatMap((a) => a.slice(3, 4)));
    sum.textContent = m.label + ": متوسط الطاقم قبل الرحلة " + pre.toFixed(2) + "، وبعد يوم من العودة (R+1) " + post.toFixed(2) + ". مقارنة وصفية فقط.";
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.k === key));
  }
  tabs.innerHTML = Object.entries(D.markers).map(([k, v]) => '<button type="button" data-k="' + k + '">' + v.label + "</button>").join("");
  tabs.addEventListener("click", (e) => { if (e.target.dataset.k) draw(e.target.dataset.k); });
  draw("il6");
})();
