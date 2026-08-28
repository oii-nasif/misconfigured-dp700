/* Behavioural checks. Runs after stub.js + the extracted inline script in one
   shared eval scope, so it sees the app's real state (FAULTS, exam, store…). */
let failures = 0;
function ok(cond, name) {
  if (cond) console.log("  pass  " + name);
  else { failures++; console.log("  FAIL  " + name); }
}

console.log("— bank —");
ok(FAULTS.length === 32, "32 faults validated (got " + FAULTS.length + ")");
ok(CHECK.problems.length === 0, "no validation problems");

console.log("— seeded draw —");
startExam({ seed: "aabc12", score: null });
const draw1 = exam.deck.map(f => f.id).join(",");
ok(exam.deck.length === 20, "exam draws 20 (got " + exam.deck.length + ")");
const perDom = {};
exam.deck.forEach(f => { perDom[f.domain] = (perDom[f.domain] || 0) + 1; });
ok(perDom.implement === 6 && perDom.ingest === 7 && perDom.monitor === 7,
   "draw is 6/7/7 (got " + JSON.stringify(perDom) + ")");
ok(new Set(exam.deck.map(f => f.id)).size === 20, "no duplicate questions");
startExam({ seed: "aabc12", score: null });
ok(exam.deck.map(f => f.id).join(",") === draw1, "same seed → identical paper");
startExam({ seed: "azzz99", score: null });
ok(exam.deck.map(f => f.id).join(",") !== draw1, "different seed → different paper");
startExam({ seed: "zabc12", score: 850 });   // wrong version prefix
ok(exam.seed !== "zabc12" && exam.seed[0] === SEED_VER, "old-version seed rejected, fresh paper drawn");
ok(exam.stale === true && exam.challenge === null, "stale link flagged, rider dropped");
ok(stage.innerHTML.indexOf("challenge link expired") !== -1, "expired-link notice rendered");
ok(parseExamSpec("aabc12~850").seed === "aabc12" && parseExamSpec("aabc12~850").score === 850,
   "challenge spec parses seed and score");
ok(parseExamSpec("aabc12~9999").score === null, "out-of-range rider score dropped");
ok(parseExamSpec("aabc12~").score === null && parseExamSpec("aabc12~ ").score === null,
   "empty rider is not a phantom challenge of 0");
ok(parseExamSpec("aabc12~0").score === 0, "a genuine challenge of 0 survives");
ok(parseExamSpec("AABC12~850").seed === "aabc12", "case-mangled seeds are forgiven");
ok(parseExamSpec("<bad>") === null && parseExamSpec("") === null, "malformed specs rejected");

console.log("— exam: confidence flow —");
mode = "exam";
startExam({ seed: "aabc12", score: null });
const q0 = exam.deck[0];
examAnswer(q0.fault);
ok(exam.pending === q0.fault && exam.answers.length === 0, "pick sets pending, records nothing yet");
examAnswer(q0.fault === 1 ? 2 : 1);
ok(exam.pending === q0.fault, "second pick ignored while confidence is pending");
examConfidence(true);
ok(exam.answers.length === 1 && exam.answers[0].right === true && exam.answers[0].sure === true,
   "confidence tap records {right, sure} and advances");
ok(exam.at === 1, "next question served");

console.log("— exam: abandon and resume —");
const run0 = exam;
examAnswer(exam.deck[1].fault);              // pick, no confidence yet
nav("drill");
ok(mode === "drill", "left exam mid-confidence");
nav("exam");
ok(exam === run0 && exam.at === 1 && exam.answers.length === 1, "in-flight exam resumed, not redrawn");
ok(exam.pending === null, "unconfirmed pick dropped on resume — question re-served");
// Back-button path: the hash always carries the seed, so a spec naming the
// live paper must resume it (and adopt a counter-challenge), never redraw.
nav("drill");
mode = "exam"; paintTabs();
resumeOrStartExam({ seed: run0.seed, score: 900 });
ok(exam === run0 && exam.at === 1 && exam.answers.length === 1,
   "spec naming the live paper resumes it (browser Back)");
ok(exam.challenge === 900, "counter-challenge score adopted on the live paper");
resumeOrStartExam({ seed: "aaaaaa", score: null });
ok(exam !== run0 && exam.seed === "aaaaaa" && exam.at === 0, "a different seed really is a new paper");

console.log("— exam: perfect run (challenge) —");
startExam({ seed: "aabc12", score: 850 });
ok(exam.challenge === 850, "challenger score carried");
while (exam.at < exam.deck.length) { examAnswer(exam.deck[exam.at].fault); examConfidence(true); }
ok(stage.innerHTML.indexOf("1000 / 1000 — pass") !== -1, "perfect run scores 1000, pass");
ok(stage.innerHTML.indexOf("you take it by 150") !== -1, "head-to-head verdict rendered");
ok(stage.innerHTML.indexOf("#exam=aabc12~1000") !== -1, "result carries the challenge link with own score");
ok((stage.innerHTML.match(/\u{1F7E9}/gu) || []).length >= 20, "trace: 20 sure-right greens");
ok(exam.done === true, "finished paper marked done");
ok(store.examBest === 1000 && store.examRuns === 1, "examBest/examRuns recorded");
ok(Object.keys(store.items).length === 0, "exam never touches drill mastery");

console.log("— exam: zero run, mixed confidence —");
nav("drill"); nav("exam");   // finished paper → fresh draw
ok(exam.at === 0 && exam.answers.length === 0, "re-entry after a result draws fresh");
let flip = true;
while (exam.at < exam.deck.length) {
  const f = exam.deck[exam.at];
  examAnswer(f.fault === 1 ? 2 : 1);   // always wrong
  examConfidence(flip); flip = !flip;  // alternate sure / not sure
}
ok(stage.innerHTML.indexOf("0 / 1000 — not yet") !== -1, "all-wrong run scores 0, not yet");
ok((stage.innerHTML.match(/review-item/g) || []).length === 20, "all 20 misses reviewed");
ok((stage.innerHTML.match(/\u{1F7E5}/gu) || []).length >= 10 &&
   (stage.innerHTML.match(/\u{1F7E7}/gu) || []).length >= 10,
   "trace splits sure-wrong red from unsure-wrong orange");
ok((stage.innerHTML.match(/you were sure/g) || []).length === 10, "confident misses badged in review");
ok(stage.innerHTML.indexOf("10 confident misses") !== -1, "calibration counts confident misses");
ok(store.examBest === 1000 && store.examRuns === 2, "best kept, runs incremented");
const doneExam = exam;
nav("exam");
ok(exam !== doneExam && exam.at === 0, "Mock exam tab deals fresh from a finished result");

const __final = (async () => {

  console.log("— daily fault —");
  nav("daily");
  const day = dailyState().day;
  const df = dailyEntry(day);
  ok(!!df, "daily entry resolves");
  ok(dailyEntry(day) === df, "daily entry is deterministic for the day");
  ok(stage.innerHTML.indexOf("daily #" + (day + 1)) !== -1, "daily card shows day number");
  dailyAnswer(df.fault === 1 ? 2 : 1);       // one wrong pick
  ok(dailyState().tries === 1 && !dailyState().done, "wrong pick counted, day still open");
  dailyAnswer(df.fault === 1 ? 2 : 1);       // same wrong line again
  ok(dailyState().tries === 1, "repeat pick of the same wrong line not double-counted");
  dailyAnswer(df.fault);
  ok(dailyState().done && dailyState().tries === 2, "found in 2");
  ok(store.dailyStreak === 1 && store.dailyLastDay === day, "streak starts at 1");
  ok(stage.innerHTML.indexOf("Found in 2 tries") !== -1, "solved card shows verdict with units");
  dailyAnswer(df.fault);
  ok(dailyState().tries === 2, "solved day is closed to further picks");
  // Midnight-rollover guard: a click against a stale rendered day must redraw, never score.
  dailyShown = day - 1;
  store.daily = null; store.dailyLastDay = -1; store.dailyStreak = 0;
  dailyAnswer(df.fault);
  ok(dailyState().tries === 0 && !dailyState().done && store.dailyStreak === 0,
     "stale-day click redraws instead of scoring");
  ok(dailyShown === day, "redraw re-anchors the rendered day");
  // consecutive-day streak: rewind the clock artifacts
  store.daily = null; store.dailyLastDay = day - 1; store.dailyStreak = 3;
  dailyAnswer(df.fault);
  ok(store.dailyStreak === 4 && store.dailyBest === 4, "consecutive day extends the streak");

  console.log("— drill: full mastery —");
  nav("drill");
  let guard = 0;
  while (current && guard++ < 200) { answer(current.fault); advance(); }
  ok(current === null, "deck exhausts to summary");
  ok(FAULTS.every(f => rec(f.id).c === 1), "all 32 mastered");
  ok(FAULTS.every(f => rec(f.id).f === 1), "all first-try");

  console.log("— share card —");
  const card = drillShareText();
  ok(card.split("\n").length === 7, "card is 7 lines (got " + card.split("\n").length + ")");
  ok((card.match(/\u{1F7E9}/gu) || []).length === 32, "32 green squares");
  ok(card.indexOf("32/32 found") !== -1, "totals line present");
  ok(card.indexOf("Mock exam best: 1000/1000") !== -1, "exam best included");
  ok(card.indexOf(SITE) !== -1, "link included");

  console.log("— field guide —");
  nav("guide");
  const list = document.getElementById("guidelist");
  ok((list.innerHTML.match(/class="rule"/g) || []).length === 32, "guide lists all 32 rules");
  guideQuery = "watermark"; renderGuideList();
  const wm = (list.innerHTML.match(/class="rule"/g) || []).length;
  ok(wm >= 3 && wm < 32, "search narrows ('watermark' → " + wm + ")");
  guideQuery = "zzzznope"; renderGuideList();
  ok(list.innerHTML.indexOf("Nothing matches") !== -1, "empty search handled");
  guideQuery = ""; setFilter("monitor");
  ok((list.innerHTML.match(/class="rule"/g) || []).length === 10, "domain filter → 10 monitor rules");
  setFilter(null);

  console.log("— routing —");
  location.hash = "#exam=aabc12~850";
  const h1 = parseHash();
  ok(h1.m === "exam" && h1.spec && h1.spec.seed === "aabc12" && h1.spec.score === 850,
     "challenge hash parses");
  location.hash = "#exam=<junk>";
  const h2 = parseHash();
  ok(h2.m === "exam" && h2.spec === null, "junk challenge hash degrades to a fresh paper");
  location.hash = "#daily";
  ok(parseHash().m === "daily", "daily hash routes");
  location.hash = "#constructor";
  ok(parseHash().m === "drill" && parseHash().f === null, "prototype keys are not domain filters");
  location.hash = "";

  console.log("— drill-one from guide —");
  drillOne("vacuum-retain-zero");
  ok(mode === "drill" && current && current.id === "vacuum-retain-zero",
     "guide row jumps into its drill");

  console.log(failures ? "\n" + failures + " FAILURES" : "\nALL CHECKS PASSED");
  return failures;
})();
__final
