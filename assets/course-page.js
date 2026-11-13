(function () {
  "use strict";
  const portal = window.ClassPortal;
  const code = document.body.dataset.course;
  const course = portal.courses[code];
  if (!course) return;

  document.body.dataset.tone = course.tone;

  function text(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function render(lang) {
    const content = course[lang];
    const common = portal.ui[lang];
    document.title = `${code} ${content.title} | SE RMUTL Class Portal`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = content.short;
    text("course-code", code);
    text("course-title", content.title);
    text("course-en", lang === "th" ? course.en.title : course.th.title);
    text("course-summary", content.summary || content.short);
    text("fact-credits", `${course.credits} ${common.credits}`);
    text("fact-sections", `${course.sections} ${course.sections === 1 ? common.section : common.sections}`);
    text("fact-delivery", content.delivery);
    text("overview-copy", content.overview);
    const artwork = document.getElementById("course-art");
    if (artwork) {
      artwork.src = `../assets/course-art/${code.toLowerCase()}.svg`;
      artwork.alt = "";
    }
    const list = document.getElementById("learning-list");
    if (list) list.innerHTML = content.learning.map((item, index) => `<li><b>${String(index + 1).padStart(2, "0")}</b><span>${item}</span></li>`).join("");
    const resource = document.getElementById("primary-resource");
    if (resource) {
      resource.textContent = content.resource;
      resource.href = course.resourceUrl;
    }
  }

  portal.bindLanguageButtons();
  window.addEventListener("portal:language", (event) => render(event.detail.lang));
  const lang = portal.getLanguage();
  render(lang);
  portal.setLanguage(lang);
})();
