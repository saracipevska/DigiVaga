/* ============================================================
   ДигиВага — логика
   Сите пресметки се прават локално во прелистувачот.
   Ништо не се испраќа или складира на сервер.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 0. Поим за вага (ротација) ---------- */
  function setTilt(el, degrees) {
    el.style.transform = "rotate(" + degrees + "deg)";
  }

  // Hero: благ илустративен накос кон „онлајн" страната,
  // отсликува дека HBSC бележи раст на проблематично користење (11% / 2022).
  var heroBeam = document.getElementById("beamGroup");
  if (heroBeam) setTilt(heroBeam, -9);

  /* ---------- 1. Помошни функции ---------- */
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function scoreFromRange(value, idealMin, idealMax, fullRangeMin, fullRangeMax) {
    // 100 во идеалниот опсег, линеарно опаѓа кон 0 на крајните точки
    if (value >= idealMin && value <= idealMax) return 100;
    var dist = value < idealMin ? idealMin - value : value - idealMax;
    var span = value < idealMin ? idealMin - fullRangeMin : fullRangeMax - idealMax;
    if (span <= 0) return 0;
    return clamp(100 - (dist / span) * 100, 0, 100);
  }

  /* ---------- 2. Quiz: live одчитувања ---------- */
  var screenTime = document.getElementById("screenTime");
  var screenTimeOut = document.getElementById("screenTimeOut");
  screenTime.addEventListener("input", function () {
    screenTimeOut.textContent = screenTime.value + " ч";
  });

  var activityDays = document.getElementById("activityDays");
  var activityDaysOut = document.getElementById("activityDaysOut");
  activityDays.addEventListener("input", function () {
    activityDaysOut.textContent = activityDays.value + " дена";
  });

  var sleepHours = document.getElementById("sleepHours");
  var sleepHoursOut = document.getElementById("sleepHoursOut");
  sleepHours.addEventListener("input", function () {
    sleepHoursOut.textContent = sleepHours.value + " ч";
  });

  var fomo = document.getElementById("fomo");
  var fomoOut = document.getElementById("fomoOut");
  fomo.addEventListener("input", function () {
    fomoOut.textContent = fomo.value + " / 5";
  });

  /* ---------- 3. Rule-based "AI" модел за резултат ---------- */
  // Тежини (изведени од HBSC-инспирирани прагови, не од машинско учење —
  // ова е транспарентен, објаснив систем со правила).
  var WEIGHTS = {
    screenTime: 0.25,
    activity: 0.20,
    sleep: 0.20,
    screenBeforeSleep: 0.15,
    fomo: 0.10,
    offlineSocial: 0.10
  };

  function computeResult(input) {
    var sScreenTime = scoreFromRange(input.screenTime, 0, 2, 0, 9);
    var sActivity = clamp((input.activityDays / 5) * 100, 0, 100);
    var sSleep = scoreFromRange(input.sleepHours, 8, 10, 4, 11);
    var sScreenBeforeSleep = { 0: 100, 1: 60, 2: 20 }[input.screenBeforeSleep];
    var sFomo = ((5 - input.fomo) / 4) * 100;
    var sOfflineSocial = { 0: 30, 1: 70, 2: 100 }[input.offlineSocial];

    var parts = {
      screenTime: sScreenTime,
      activity: sActivity,
      sleep: sSleep,
      screenBeforeSleep: sScreenBeforeSleep,
      fomo: sFomo,
      offlineSocial: sOfflineSocial
    };

    var total = 0;
    Object.keys(WEIGHTS).forEach(function (key) {
      total += parts[key] * WEIGHTS[key];
    });
    total = Math.round(total);

    return { total: total, parts: parts };
  }

  var TIPS = {
    screenTime: "Пробај да го намалиш рекреативното екранско време постепено — HBSC препорачува до 2 часа дневно. Почни со 30 минути помалку и следи како се чувствуваш.",
    activity: "Само 20–30 минути движење (шетање, велосипед, спорт) неколку пати неделно значително го подобрува расположението и сонот.",
    sleep: "Адолесцентите имаат потреба од 8–10 часа сон. Ако спиеш помалку, пробај фиксно време за легнување, дури и викенд.",
    screenBeforeSleep: "Светлината од екран пред спиење го одложува заспивањето. Пробај „екран-слободна“ последна половина час пред да легнеш.",
    fomo: "Чувството на пропуштање е нормално, но не мора да значи дека треба веднаш да реагираш. Пробај кратки „дигитални паузи“ од по 1 час.",
    offlineSocial: "Лично дружење со пријатели — дури и кратко — е поврзано со подобро расположение отколку слично време поминато онлајн."
  };

  var LABELS = {
    screenTime: "екранско време",
    activity: "физичка активност",
    sleep: "сон",
    screenBeforeSleep: "екран пред спиење",
    fomo: "FOMO / зависност од врска",
    offlineSocial: "офлајн дружење"
  };

  function recommendationsFor(parts) {
    var sorted = Object.keys(parts).sort(function (a, b) {
      return parts[a] - parts[b];
    });
    return sorted.slice(0, 3).map(function (key) {
      return { label: LABELS[key], tip: TIPS[key] };
    });
  }

  function labelFor(score) {
    if (score >= 75) return { label: "Здрав баланс", desc: "Твоите навики се прилично урамнотежени помеѓу онлајн и офлајн светот. Продолжи така!" };
    if (score >= 50) return { label: "Благ нерамнотежа", desc: "Има простор за подобрување во неколку области — погледни ги препораките подолу." };
    return { label: "Зголемен ризик", desc: "Неколку фактори укажуваат на нерамнотежа кон екранот. Малите промени можат да направат голема разлика." };
  }

  /* ---------- 4. Поднесување на анкетата ---------- */
  var quizForm = document.getElementById("quizForm");
  var resultSection = document.getElementById("rezultat");
  var compareBlock = document.getElementById("compareBlock");

  quizForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var input = {
      screenTime: Number(screenTime.value),
      activityDays: Number(activityDays.value),
      sleepHours: Number(sleepHours.value),
      screenBeforeSleep: Number(document.querySelector('input[name="screenBeforeSleep"]:checked').value),
      fomo: Number(fomo.value),
      offlineSocial: Number(document.querySelector('input[name="offlineSocial"]:checked').value)
    };

    var result = computeResult(input);
    var meta = labelFor(result.total);

    document.getElementById("scoreNumber").textContent = result.total;
    document.getElementById("scoreLabel").textContent = meta.label;
    document.getElementById("scoreDesc").textContent = meta.desc;

    var recsList = document.getElementById("recsList");
    recsList.innerHTML = "";
    recommendationsFor(result.parts).forEach(function (rec) {
      var li = document.createElement("li");
      li.innerHTML = "<strong>" + rec.label + ".</strong> " + rec.tip;
      recsList.appendChild(li);
    });

    // тилт пропорционален на резултатот: 100 -> 0deg (рамна), 0 -> -24deg (накосена кон онлајн)
    var angle = -((100 - result.total) / 100) * 24;
    var resultBeam = document.getElementById("beamGroupResult");
    setTilt(resultBeam, angle);

    // компарација со препораката од 2ч
    var fillPct = clamp((input.screenTime / 9) * 100, 0, 100);
    document.getElementById("compareFill").style.width = fillPct + "%";
    compareBlock.hidden = false;

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- 5. Дневник: лесна анализа на тон (rule-based) ---------- */
  // Едноставен лексикон на македонски клучни зборови — намерно лесен и
  // објаснив (bag-of-words), без надворешен AI сервис.
  var POSITIVE_WORDS = [
    "среќен", "среќна", "добро", "одлично", "супер", "опуштен", "опуштена",
    "спокоен", "спокојна", "горд", "горда", "весел", "весела", "задоволен",
    "задоволна", "мотивиран", "мотивирана", "среќно", "убаво", "смеа", "среден"
  ];
  var NEGATIVE_WORDS = [
    "тажен", "тажна", "лут", "лута", "стрес", "стресиран", "стресирана",
    "уморен", "уморна", "анксиозен", "анксиозна", "осамен", "осамена",
    "исцрпен", "исцрпена", "лошо", "фрустриран", "фрустрирана", "нервозен",
    "нервозна", "вознемирен", "вознемирена", "плачам", "плаче"
  ];

  function analyzeSentiment(text) {
    var t = text.toLowerCase();
    var pos = 0, neg = 0;
    POSITIVE_WORDS.forEach(function (w) { if (t.indexOf(w) !== -1) pos++; });
    NEGATIVE_WORDS.forEach(function (w) { if (t.indexOf(w) !== -1) neg++; });
    if (pos === 0 && neg === 0) return "neutral";
    return pos > neg ? "positive" : (neg > pos ? "negative" : "neutral");
  }

  var SENTIMENT_LABEL = { positive: "Позитивно", neutral: "Неутрално", negative: "Негативно" };
  var SENTIMENT_DOT = { positive: "dot--pos", neutral: "dot--neu", negative: "dot--neg" };

  var journalForm = document.getElementById("journalForm");
  var journalInput = document.getElementById("journalInput");
  var journalList = document.getElementById("journalList");
  var journalSummary = document.getElementById("journalSummary");

  // Записите живеат само во меморија на сесијата — не се чуваат по затворање.
  var entries = [];

  function renderSummary() {
    var total = entries.length;
    if (total === 0) { journalSummary.hidden = true; return; }
    journalSummary.hidden = false;
    var counts = { positive: 0, neutral: 0, negative: 0 };
    entries.forEach(function (en) { counts[en.sentiment]++; });
    document.getElementById("barPos").style.width = (counts.positive / total) * 100 + "%";
    document.getElementById("barNeu").style.width = (counts.neutral / total) * 100 + "%";
    document.getElementById("barNeg").style.width = (counts.negative / total) * 100 + "%";
  }

  journalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = journalInput.value.trim();
    if (!text) return;

    var sentiment = analyzeSentiment(text);
    entries.unshift({ text: text, sentiment: sentiment });

    var li = document.createElement("li");
    li.className = "journal__entry";
    li.innerHTML =
      '<i class="dot ' + SENTIMENT_DOT[sentiment] + '"></i><span><strong>' +
      SENTIMENT_LABEL[sentiment] + ":</strong> " +
      text.replace(/</g, "&lt;") + "</span>";
    journalList.prepend(li);

    journalInput.value = "";
    renderSummary();
  });
})();
