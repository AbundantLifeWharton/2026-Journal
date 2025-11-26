let readingPlan = [];
let currentDay = null;

const views = {
  home: document.getElementById("home-view"),
  weeks: document.getElementById("weeks-view"),
  days: document.getElementById("days-view"),
  dayDetail: document.getElementById("day-detail-view")
};

const todayInfo = document.getElementById("today-info");
const openTodayBtn = document.getElementById("open-today");
const weeksList = document.getElementById("weeks-list");
const daysList = document.getElementById("days-list");
const daysWeekTitle = document.getElementById("days-week-title");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

const dayTitle = document.getElementById("day-title");
const dayReadings = document.getElementById("day-readings");
const daySummary = document.getElementById("day-summary");
const dayKeyRef = document.getElementById("day-keyref");
const dayKeyText = document.getElementById("day-keytext");

const journalStoodOut = document.getElementById("journal-stoodout");
const journalSawJesus = document.getElementById("journal-sawjesus");
const journalDiscussion = document.getElementById("journal-discussion");
const journalCompleted = document.getElementById("journal-completed");
const saveJournalBtn = document.getElementById("save-journal");
const saveStatus = document.getElementById("save-status");

document.getElementById("view-weeks").addEventListener("click", () => {
  showView("weeks");
});

document.querySelectorAll(".btn-back").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-back");
    const name = target.replace("-view", "");
    showView(name);
  });
});

openTodayBtn.addEventListener("click", () => {
  if (!readingPlan.length) return;
  const firstWeek = readingPlan[0];
  const firstDay = firstWeek.days[0];
  openDay(firstWeek, firstDay);
});

saveJournalBtn.addEventListener("click", () => {
  if (!currentDay) return;
  const key = `journal-${currentDay.id}`;
  const data = {
    stoodOut: journalStoodOut.value || "",
    sawJesus: journalSawJesus.value || "",
    discussion: journalDiscussion.value || "",
    completed: journalCompleted.checked
  };
  localStorage.setItem(key, JSON.stringify(data));
  saveStatus.textContent = "Saved!";
  setTimeout(() => (saveStatus.textContent = ""), 2000);
  updateProgress();
});

function showView(name) {
  Object.keys(views).forEach(v => views[v].classList.remove("active"));
  if (views[name]) {
    views[name].classList.add("active");
  }
}

async function loadPlan() {
  try {
    const res = await fetch("data/reading-plan.json");
    readingPlan = await res.json();
    renderWeeks();
    renderToday();
    updateProgress();
  } catch (e) {
    console.error("Error loading reading plan", e);
    todayInfo.textContent = "Error loading reading plan.";
  }
}

function renderToday() {
  if (!readingPlan.length) return;
  const firstWeek = readingPlan[0];
  const firstDay = firstWeek.days[0];
  const completed = getJournalData(firstDay.id).completed;
  todayInfo.innerHTML = `
    <p><strong>${firstDay.dayOfWeek}</strong> — ${firstDay.dateLabel}</p>
    <p class="muted">${firstDay.readings}</p>
    <p>${firstDay.summary}</p>
    <p><em>${firstDay.keyVerseRef}</em></p>
    <p class="key-verse">${firstDay.keyVerseText}</p>
    <p>${completed ? "✅ Marked complete" : ""}</p>
  `;
}

function renderWeeks() {
  weeksList.innerHTML = "";
  readingPlan.forEach(week => {
    const div = document.createElement("div");
    div.className = "week-item";
    div.innerHTML = `
      <div class="week-title">Week ${week.weekNumber}</div>
      <div class="week-sub">${week.weekLabel}</div>
    `;
    div.addEventListener("click", () => openWeek(week));
    weeksList.appendChild(div);
  });
}

function openWeek(week) {
  daysWeekTitle.textContent = `Week ${week.weekNumber} — ${week.weekLabel}`;
  daysList.innerHTML = "";
  week.days.forEach(day => {
    const j = getJournalData(day.id);
    const div = document.createElement("div");
    div.className = "day-item";
    div.innerHTML = `
      <div class="day-title">${day.dayOfWeek} — ${day.dateLabel}</div>
      <div class="day-sub">${day.readings}</div>
      <div class="day-sub">${j.completed ? "✅ Completed" : ""}</div>
    `;
    div.addEventListener("click", () => openDay(week, day));
    daysList.appendChild(div);
  });
  showView("days");
}

function openDay(week, day) {
  currentDay = day;
  dayTitle.textContent = `${day.dayOfWeek} — ${day.dateLabel}`;
  dayReadings.textContent = day.readings;
  daySummary.textContent = day.summary || "";
  dayKeyRef.textContent = day.keyVerseRef ? `(${day.keyVerseRef})` : "";
  dayKeyText.textContent = day.keyVerseText || "";

  const j = getJournalData(day.id);
  journalStoodOut.value = j.stoodOut || "";
  journalSawJesus.value = j.sawJesus || "";
  journalDiscussion.value = j.discussion || "";
  journalCompleted.checked = !!j.completed;

  showView("dayDetail");
}

function getJournalData(dayId) {
  const key = `journal-${dayId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return { stoodOut: "", sawJesus: "", discussion: "", completed: false };
  try {
    return JSON.parse(stored);
  } catch {
    return { stoodOut: "", sawJesus: "", discussion: "", completed: false };
  }
}

function updateProgress() {
  if (!readingPlan.length) return;
  let totalDays = 0;
  let completedDays = 0;
  readingPlan.forEach(week => {
    week.days.forEach(day => {
      totalDays += 1;
      if (getJournalData(day.id).completed) completedDays += 1;
    });
  });
  if (totalDays === 0) return;
  const pct = Math.round((completedDays / totalDays) * 100);
  progressFill.style.width = pct + "%";
  progressText.textContent = `${completedDays} of ${totalDays} days completed (${pct}%)`;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(err => {
      console.warn("Service worker registration failed", err);
    });
  });
}

loadPlan();
