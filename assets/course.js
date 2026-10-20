// CSC4801 course details and the footer credit. Loaded before app.js on every page.

const COURSE = {
  code: "CSC4801",
  name: "AI-assisted Software Engineering",
  short: "AI-assisted SE",
  instructor: "Jinsheng Ba",
  official: "https://sra-research.github.io/CSC4801/",
  checked: "Built from the lecture slides; every program here has been run.",
  practice: "try each step with a coding agent of your own",
};

// The course comes first; the supporting credit is one small line at the very bottom.
function renderFooter(root = "") {
  const f = document.querySelector("footer");
  if (!f) return;
  f.innerHTML = `<div class="wrap">
    <p>${COURSE.code} ${COURSE.name} · The Chinese University of Hong Kong, Shenzhen ·
      Instructor: ${COURSE.instructor} · <a href="${COURSE.official}" target="_blank" rel="noopener">Official course site ↗</a></p>
    <p class="credit">
      <img class="logo-light" src="${root}assets/peiyu-logo.svg" alt="" width="18" height="18">
      <img class="logo-dark" src="${root}assets/peiyu-logo-white.svg" alt="" width="18" height="18">
      <span>Interactive notes and videos powered by <b>培玉智能</b> · Co-designed with Boxi Yu</span>
    </p>
    <p class="fine">Slides and course content © the course instructor. For students of the course.</p>
  </div>`;
}
