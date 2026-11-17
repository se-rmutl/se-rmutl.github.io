(() => {
  "use strict";

  const storageKey = "se-portal-lang";
  const languageControls = document.querySelector("[data-languages]");
  const languageButtons = [...languageControls.querySelectorAll("[data-language]")];
  const copy = [...document.querySelectorAll("[data-copy]")];
  const ariaLabels = [...document.querySelectorAll("[data-label-en]")].map((element) => ({
    element,
    th: element.getAttribute("aria-label"),
    en: element.dataset.labelEn,
  }));
  const photo = document.querySelector("[data-alt-en]");
  const photoAlt = { th: photo.alt, en: photo.dataset.altEn };
  const stageControls = document.querySelector("[data-stage-controls]");
  const stageButtons = [...stageControls.querySelectorAll("[data-stage]")];
  const stagePanels = [...document.querySelectorAll("[data-stage-panel]")];
  const filterBar = document.querySelector("[data-filters]");
  const filters = [...filterBar.querySelectorAll("[data-filter]")];
  const weeks = [...document.querySelectorAll(".week")];
  const materials = window.engse206Materials || {};
  const materialLists = [...document.querySelectorAll("[data-materials]")];
  const materialLabels = [
    ["slides", { th: "สไลด์", en: "Slides" }],
    ["lab", { th: "Lab", en: "Lab" }],
    ["notes", { th: "เอกสาร", en: "Notes" }],
  ];

  function resourceUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ["https:", "http:", "file:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function renderMaterials(language) {
    materialLists.forEach((list) => {
      const available = materials[list.dataset.materials] || {};
      const links = materialLabels.flatMap(([key, label]) => {
        const href = resourceUrl(available[key]);
        if (!href) return [];
        const link = document.createElement("a");
        link.className = "material-link";
        link.href = href;
        link.textContent = label[language];
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "↗";
        link.append(arrow);
        return [link];
      });
      if (links.length) {
        list.replaceChildren(...links);
      }
    });
  }

  function setLanguage(language) {
    document.documentElement.lang = language;
    document.title = language === "en"
      ? "ENGSE206 · Software Requirements Specification and Design"
      : "ENGSE206 · การกำหนดความต้องการและการออกแบบทางซอฟต์แวร์";
    copy.forEach((element) => { element.hidden = element.dataset.copy !== language; });
    languageButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    ariaLabels.forEach(({ element, th, en }) => {
      element.setAttribute("aria-label", language === "en" ? en : th);
    });
    photo.alt = photoAlt[language];
    renderMaterials(language);
  }

  let language = "th";
  try {
    if (localStorage.getItem(storageKey) === "en") language = "en";
  } catch {
    // The page still works when storage is unavailable.
  }
  setLanguage(language);
  languageControls.hidden = false;
  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.language);
      try {
        localStorage.setItem(storageKey, button.dataset.language);
      } catch {
        // A new visit will use the default language.
      }
    });
  });

  function selectStage(stage) {
    stagePanels.forEach((panel) => { panel.hidden = panel.dataset.stagePanel !== stage; });
    stageButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.stage === stage));
    });
  }

  function openLinkedStage() {
    const panel = stagePanels.find(({ id }) => location.hash === "#" + id);
    if (!panel) return false;
    selectStage(panel.dataset.stagePanel);
    stageControls.scrollIntoView({ block: "start" });
    return true;
  }

  function filterWeeks(phase) {
    weeks.forEach((week) => { week.hidden = phase !== "all" && week.dataset.phase !== phase; });
    filters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === phase));
    });
  }

  function openLinkedWeek() {
    if (!/^#week-\d{2}$/.test(location.hash)) return;
    const week = document.getElementById(location.hash.slice(1));
    if (!week) return;
    if (week.hidden) filterWeeks("all");
    week.open = true;
    week.scrollIntoView({ block: "start" });
  }

  filterBar.hidden = false;
  filters.forEach((button) => {
    button.addEventListener("click", () => filterWeeks(button.dataset.filter));
  });

  stageControls.hidden = false;
  stageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectStage(button.dataset.stage);
      if (location.hash.startsWith("#stage-")) {
        history.replaceState(null, "", "#" + button.getAttribute("aria-controls"));
      }
    });
  });
  document.querySelectorAll('.sdlc-flow a[href^="#stage-"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (link.hash === location.hash) openLinkedStage();
    });
  });

  function openLinkedContent() {
    if (!openLinkedStage()) openLinkedWeek();
  }

  window.addEventListener("hashchange", openLinkedContent);
  selectStage(stageButtons[0].dataset.stage);
  openLinkedContent();
})();
