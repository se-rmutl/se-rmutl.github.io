(function () {
  "use strict";
  const portal = window.ClassPortal;
  const order = ["ENGSE206", "ENGSE207", "ENGSE601", "ENGSE300", "ENGSE301", "ENGSE304", "ENGSE305"];

  function renderCourses(lang) {
    const grid = document.getElementById("course-grid");
    if (!grid) return;
    const copy = portal.rootCopy[lang];
    grid.innerHTML = order.map((code) => {
      const course = portal.courses[code];
      const text = course[lang];
      const sec = course.sections;
      return `<article class="course-card" data-tone="${course.tone}">
        <a href="./${code}/" aria-label="${copy.open}: ${code} ${text.title}">
          <div class="course-top"><span class="course-code">${code}</span><span class="course-credit">${course.credits} ${copy.creditUnit}</span></div>
          <span class="course-art" aria-hidden="true"><img src="./assets/course-art/${code.toLowerCase()}.svg" alt="" width="560" height="360" loading="lazy"></span>
          <h3>${text.title}</h3><p>${text.short}</p>
          <span class="course-go">${copy.open} · ${sec} ${copy.secUnit}</span>
        </a>
      </article>`;
    }).join("");
  }

  portal.bindLanguageButtons();
  window.addEventListener("portal:language", (event) => renderCourses(event.detail.lang));
  const lang = portal.getLanguage();
  renderCourses(lang);
  portal.setLanguage(lang);
})();
