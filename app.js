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
function render() { renderHistory(); renderChart(); }

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
  render();
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
