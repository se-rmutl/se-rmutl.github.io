(() => {
  "use strict";

  const portal = window.ClassPortal;
  const groups = {
    engineering: ["ENGSE206", "ENGSE207", "ENGSE601"],
    workplace: ["ENGSE300", "ENGSE301", "ENGSE304", "ENGSE305"],
  };
  const skills = {
    ENGSE206: {
      th: ["จับโจทย์ให้ชัดก่อนลงมือสร้าง", "สัมภาษณ์ผู้ใช้ เขียน SRS ที่ตรวจได้ แล้วใช้ข้อกำหนดเดิมออกแบบและทำต้นแบบที่ทีมพัฒนารับต่อได้", "เก็บความต้องการ · SRS · ออกแบบ"],
      en: ["Get the problem clear before building", "Interview users and write a testable SRS, then use it to produce a design and prototype a development team can pick up.", "Requirements · SRS · Design"],
    },
    ENGSE207: {
      th: ["เลือกโครงสร้างระบบให้เหมาะกับโจทย์", "วาดภาพรวมระบบ เปรียบเทียบรูปแบบสถาปัตยกรรม แล้วอธิบายข้อแลกเปลี่ยน เช่น ความเร็วกับความง่ายในการดูแล", "สถาปัตยกรรม · คุณลักษณะคุณภาพ"],
      en: ["Choose a system structure that fits the problem", "Model a system, compare architecture styles, and explain trade-offs such as speed versus maintainability.", "Architecture · Quality attributes"],
    },
    ENGSE601: {
      th: ["ตัดสินความพร้อมของซอฟต์แวร์จากหลักฐาน", "วางแผนตรวจสอบ ออกแบบกรณีทดสอบจากข้อกำหนด และวิเคราะห์ข้อบกพร่องเพื่อดูว่าซอฟต์แวร์ทำงานได้ตามที่ตกลงและตอบโจทย์ผู้ใช้หรือไม่", "V&V · ออกแบบการทดสอบ"],
      en: ["Judge software readiness with evidence", "Plan verification, design tests from requirements, and analyse defects to judge whether the software meets its specification and users’ needs.", "V&V · Test design"],
    },
    ENGSE300: {
      th: ["พร้อมคุยกับทีมที่จะไปฝึกงานด้วย", "เลือกสถานประกอบการให้ตรงสาย เตรียมเอกสารสมัคร และซ้อมสัมภาษณ์ให้เล่าทักษะจากผลงานของตัวเองได้", "สมัครงาน · สัมภาษณ์ · เป้าหมายการฝึก"],
      en: ["Get ready to meet your placement team", "Choose a workplace that fits your interests, prepare an application, and practise explaining your skills through examples from your own work.", "Applications · Interviews · Placement goals"],
    },
    ENGSE301: {
      th: ["ทำงานเต็มเวลากับทีมซอฟต์แวร์จริง", "รับผิดชอบงานในสถานประกอบการภายใต้การนิเทศ ฝึกส่งมอบงานตามข้อตกลงและบันทึกหลักฐานการทำงาน", "สหกิจศึกษา · ทำงานเป็นทีม"],
      en: ["Work full-time with a real software team", "Take on supervised workplace responsibilities, practise delivering agreed work, and document what you accomplished.", "Co-operative education · Team delivery"],
    },
    ENGSE304: {
      th: ["เปลี่ยนปัญหาในที่ทำงานให้เป็นโครงงาน", "คุยกับผู้เกี่ยวข้องเพื่อหาสาเหตุ กำหนดขอบเขต และพัฒนาแนวทางแก้ที่อธิบายผลต่อผู้ใช้หรือองค์กรได้", "วิเคราะห์ปัญหา · โครงงาน"],
      en: ["Turn a workplace problem into a project", "Talk to the people affected, define the scope, and develop a solution you can evaluate for users or the organization.", "Problem analysis · Project work"],
    },
    ENGSE305: {
      th: ["ฝึกทักษะเฉพาะบทบาทจากงานจริง", "ลงมือทำงานตามตำแหน่งที่ได้รับ ใช้ข้อเสนอแนะจากผู้นิเทศปรับคุณภาพงาน และเก็บหลักฐานพัฒนาการของตัวเอง", "ทักษะตามบทบาท · การรับข้อเสนอแนะ"],
      en: ["Build skills for a specific role", "Work in your assigned role, use supervisor feedback to improve the quality of your work, and collect evidence of your progress.", "Role-based practice · Feedback"],
    },
  };

  function renderCourses(lang) {
    const copy = portal.rootCopy[lang];
    Object.entries(groups).forEach(([name, codes]) => {
      const grid = document.getElementById(`${name}-grid`);
      grid.innerHTML = codes.map((code) => {
        const course = portal.courses[code];
        const slug = code.toLowerCase();
        const [hook, practice, domain] = skills[code][lang];
        const groupLinks = course.sections > 1
          ? `<nav class="catalog-sec" aria-label="${copy.chooseSection} ${code}"><span>${copy.chooseSection}</span><div>
              ${Array.from({ length: course.sections }, (_, index) => {
                const section = index + 1;
                return `<a href="./${slug}/#sec-${section}" aria-label="${code} SEC ${section}">SEC ${section}</a>`;
              }).join("")}</div></nav>`
          : `<span class="catalog-single-section">SEC 1</span>`;

        return `<article class="catalog-card" id="course-${slug}" data-tone="${course.tone}">
          <div class="catalog-photo"><img src="./assets/course-art/${slug}.webp" alt="" width="960" height="640" loading="lazy" decoding="async"></div>
          <div class="catalog-card-content">
            <div class="catalog-meta"><span class="catalog-code">${code}</span><span>${course.credits} ${course.credits === 1 ? copy.oneCredit : copy.creditUnit}${course.sections === 1 ? " · " + groupLinks : ""}</span></div>
            <h4>${course[lang].title}</h4>
            <p class="catalog-hook">${hook}</p>
            <p class="catalog-practice">${practice}</p>
            <p class="catalog-domain">${domain}</p>
            <div class="catalog-entry">
              ${course.sections > 1 ? groupLinks : ""}
              <a class="catalog-open" href="./${course.portalUrl || slug + "/"}" aria-label="${copy.open} ${code}"><span>${copy.open}</span><span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </article>`;
      }).join("");
    });
  }

  portal.bindLanguageButtons();
  window.addEventListener("portal:language", (event) => renderCourses(event.detail.lang));
  portal.setLanguage(portal.getLanguage());
})();
