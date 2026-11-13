(function () {
  "use strict";

  const courses = {
    ENGSE300: {
      code: "ENGSE300", tone: "gold", symbol: "◇", credits: 1, sections: 1,
      th: {
        title: "การเตรียมสหกิจศึกษาและฝึกงานด้านวิศวกรรมซอฟต์แวร์",
        short: "เตรียมความพร้อมก่อนเข้าสู่สถานประกอบการ ทั้งทักษะวิชาชีพ การสื่อสาร และแผนการเรียนรู้จากงานจริง",
        delivery: "เตรียมความพร้อม · C3-404",
        overview: "รายวิชาสำหรับวางรากฐานก่อนออกปฏิบัติงาน นักศึกษาจะสำรวจบทบาทวิศวกรซอฟต์แวร์ เตรียมเอกสารและการสื่อสารทางวิชาชีพ ตลอดจนวางเป้าหมายการเรียนรู้ที่ติดตามผลได้",
        learning: ["ประเมินความพร้อมและกำหนดเป้าหมายการพัฒนาตนเอง", "เตรียมการสื่อสาร เอกสาร และมารยาทวิชาชีพ", "วางแผนการเรียนรู้และหลักฐานที่จะเก็บจากสถานประกอบการ"],
        resource: "ไปยังพอร์ทัล SE-COOP"
      },
      en: {
        title: "Co-operative Education Preparation in Software Engineering",
        short: "Prepare professional skills, communication, and a purposeful workplace-learning plan before placement.",
        delivery: "Preparation course · C3-404",
        overview: "A foundation course before workplace placement. Students explore software engineering roles, prepare professional communication and documents, and define measurable workplace-learning goals.",
        learning: ["Assess readiness and set personal development goals", "Prepare professional communication, documents, and conduct", "Plan workplace learning and the evidence to be collected"],
        resource: "Open the SE-COOP portal"
      },
      resourceUrl: "../se-coop/"
    },
    ENGSE301: {
      code: "ENGSE301", tone: "green", symbol: "↗", credits: 6, sections: 1,
      th: {
        title: "สหกิจศึกษาด้านวิศวกรรมซอฟต์แวร์",
        short: "บูรณาการความรู้กับการปฏิบัติงานจริง พัฒนาความเป็นมืออาชีพ และสะท้อนผลลัพธ์จากสถานประกอบการ",
        delivery: "ปฏิบัติงานในสถานประกอบการ",
        overview: "ประสบการณ์วิชาชีพแบบเต็มเวลาที่เชื่อมการเรียนกับงานจริง นักศึกษาปฏิบัติงานภายใต้การดูแลของสถานประกอบการและอาจารย์นิเทศ พร้อมบันทึกหลักฐานและสะท้อนการเติบโตทางวิชาชีพ",
        learning: ["ประยุกต์กระบวนการและเครื่องมือวิศวกรรมซอฟต์แวร์ในบริบทจริง", "ทำงานร่วมกับทีมและผู้มีส่วนได้ส่วนเสียอย่างมืออาชีพ", "สังเคราะห์หลักฐานจากการทำงานและสะท้อนสมรรถนะของตนเอง"],
        resource: "ไปยังพอร์ทัล SE-COOP"
      },
      en: {
        title: "Co-operative Education in Software Engineering",
        short: "Integrate academic knowledge with real work, strengthen professional practice, and reflect on workplace outcomes.",
        delivery: "Full-time workplace placement",
        overview: "A full-time professional experience connecting academic learning with real work. Students work under workplace and faculty supervision, document evidence, and reflect on professional growth.",
        learning: ["Apply software engineering processes and tools in a real context", "Collaborate professionally with teams and stakeholders", "Synthesize workplace evidence and reflect on personal competency"],
        resource: "Open the SE-COOP portal"
      },
      resourceUrl: "../se-coop/"
    },
    ENGSE304: {
      code: "ENGSE304", tone: "plum", symbol: "◆", credits: 3, sections: 1,
      th: {
        title: "ปัญหาพิเศษจากสถานประกอบการ",
        short: "เปลี่ยนโจทย์จริงในองค์กรให้เป็นโครงงานที่มีขอบเขต หลักฐานการตัดสินใจ และผลลัพธ์ที่ตรวจสอบได้",
        delivery: "โครงงานจากสถานประกอบการ",
        overview: "นักศึกษาเลือกปัญหาจริงจากสถานประกอบการ วิเคราะห์บริบทและความต้องการ ออกแบบแนวทางแก้ และสร้างผลงานที่แสดงคุณค่าต่อผู้ใช้หรือองค์กรอย่างมีหลักฐาน",
        learning: ["นิยามปัญหาและขอบเขตจากหลักฐานในสถานประกอบการ", "ออกแบบและพัฒนาแนวทางแก้ด้วยกระบวนการวิศวกรรมซอฟต์แวร์", "สาธิต ประเมิน และสื่อสารคุณค่าของผลงานต่อผู้เกี่ยวข้อง"],
        resource: "ไปยังพอร์ทัล SE-WIL"
      },
      en: {
        title: "Workplace Special Problem",
        short: "Turn an authentic organizational challenge into a scoped project with traceable decisions and verifiable outcomes.",
        delivery: "Workplace-based project",
        overview: "Students select an authentic workplace problem, analyze its context and requirements, design a solution, and produce an evidence-based outcome that creates value for users or the organization.",
        learning: ["Frame the problem and scope from workplace evidence", "Design and develop a solution using software engineering practice", "Demonstrate, evaluate, and communicate the value of the outcome"],
        resource: "Open the SE-WIL portal"
      },
      resourceUrl: "../se-wil/"
    },
    ENGSE305: {
      code: "ENGSE305", tone: "red", symbol: "◎", credits: 3, sections: 1,
      th: {
        title: "การฝึกเฉพาะตำแหน่ง",
        short: "เรียนรู้บทบาทเฉพาะทางผ่านงานจริง ฝึกความรับผิดชอบ การทำงานเป็นทีม และสมรรถนะตามสายอาชีพ",
        delivery: "ฝึกปฏิบัติในสถานประกอบการ",
        overview: "การฝึกปฏิบัติที่เน้นสมรรถนะเฉพาะตำแหน่ง นักศึกษารับผิดชอบงานตามบทบาทจริง บันทึกความก้าวหน้า รับข้อเสนอแนะจากผู้นิเทศงาน และพัฒนาการทำงานอย่างต่อเนื่อง",
        learning: ["ปฏิบัติงานตามบทบาทด้วยมาตรฐานและความรับผิดชอบ", "ใช้ข้อเสนอแนะเพื่อปรับปรุงสมรรถนะและคุณภาพงาน", "รวบรวมแฟ้มหลักฐานและสื่อสารพัฒนาการทางวิชาชีพ"],
        resource: "ไปยังพอร์ทัล SE-WIL"
      },
      en: {
        title: "Practicum",
        short: "Develop role-specific capability through authentic work, professional responsibility, teamwork, and continuous feedback.",
        delivery: "Workplace practicum",
        overview: "A practicum centered on role-specific competency. Students take responsibility for authentic tasks, record progress, receive supervisor feedback, and continually improve their professional performance.",
        learning: ["Perform role responsibilities to professional standards", "Use feedback to improve competency and work quality", "Curate evidence and communicate professional development"],
        resource: "Open the SE-WIL portal"
      },
      resourceUrl: "../se-wil/"
    },
    ENGSE206: {
      code: "ENGSE206", tone: "teal", symbol: "⌁", credits: 3, sections: 1,
      th: {
        title: "การกำหนดความต้องการและการออกแบบทางซอฟต์แวร์",
        short: "ค้นหาปัญหาที่แท้จริง เปลี่ยนหลักฐานเป็นความต้องการ และส่งต่อแบบออกแบบที่ทีมพัฒนาใช้งานได้",
        delivery: "บรรยายและปฏิบัติ · C3-405",
        overview: "รายวิชาที่เชื่อมการค้นหาปัญหาเข้ากับการออกแบบ นักศึกษาฝึกทำงานกับผู้มีส่วนได้ส่วนเสีย สร้างข้อกำหนดที่ตรวจสอบได้ และแปลงความต้องการเป็นการตัดสินใจออกแบบอย่างมีเหตุผล",
        learning: ["เก็บและวิเคราะห์หลักฐานจากผู้มีส่วนได้ส่วนเสีย", "เขียนและตรวจคุณภาพความต้องการซอฟต์แวร์ที่ติดตามย้อนกลับได้", "ออกแบบภาพรวมระบบและส่งมอบงานให้ทีมพัฒนาได้อย่างชัดเจน"],
        resource: "เปิดคลังบทเรียน ENGSE206"
      },
      en: {
        title: "Software Requirements Specification and Design",
        short: "Discover the real problem, turn evidence into requirements, and hand off design work that a development team can use.",
        delivery: "Lecture and lab · C3-405",
        overview: "A course connecting problem discovery to software design. Students work with stakeholders, create verifiable specifications, and translate requirements into reasoned design decisions.",
        learning: ["Elicit and analyze evidence from stakeholders", "Specify and quality-check traceable software requirements", "Design the system concept and communicate a clear developer handoff"],
        resource: "Open the ENGSE206 learning library"
      },
      resourceUrl: "../resources/engse206/"
    },
    ENGSE207: {
      code: "ENGSE207", tone: "blue", symbol: "⬡", credits: 3, sections: 3,
      th: {
        title: "สถาปัตยกรรมซอฟต์แวร์",
        short: "ออกแบบโครงสร้างระบบจากคุณลักษณะคุณภาพ เปรียบเทียบทางเลือก และสื่อสารสถาปัตยกรรมให้ทีมเห็นภาพเดียวกัน",
        delivery: "บรรยายและปฏิบัติ · C3-405",
        overview: "ศึกษาแนวคิดและรูปแบบสถาปัตยกรรมผ่านโจทย์เชิงระบบ นักศึกษาวิเคราะห์ architectural drivers ออกแบบมุมมองด้วย C4 และฝึกตัดสินใจบน trade-off ของคุณภาพ ความซับซ้อน และการส่งมอบ",
        learning: ["วิเคราะห์ architectural drivers และคุณลักษณะคุณภาพ", "ออกแบบและเปรียบเทียบรูปแบบสถาปัตยกรรมที่เหมาะกับบริบท", "สื่อสารโครงสร้าง การตัดสินใจ และ trade-off ด้วยแบบจำลองที่ชัดเจน"],
        resource: "เปิดคลังบทเรียน ENGSE207"
      },
      en: {
        title: "Software Architecture",
        short: "Shape system structure from quality attributes, compare alternatives, and communicate an architecture the whole team can share.",
        delivery: "Lecture and lab · C3-405",
        overview: "Explore architectural concepts and patterns through system-level challenges. Students analyze architectural drivers, model views with C4, and make trade-offs across quality, complexity, and delivery.",
        learning: ["Analyze architectural drivers and quality attributes", "Design and compare architectural styles appropriate to context", "Communicate structure, decisions, and trade-offs with clear models"],
        resource: "Open the ENGSE207 learning library"
      },
      resourceUrl: "../resources/engse207/"
    },
    ENGSE601: {
      code: "ENGSE601", tone: "orange", symbol: "✓", credits: 3, sections: 1,
      th: {
        title: "การตรวจสอบความสมเหตุสมผลและการทวนสอบซอฟต์แวร์",
        short: "วางแผนหลักฐานคุณภาพ ออกแบบการทดสอบ วิเคราะห์ผล และตัดสินความพร้อมของซอฟต์แวร์อย่างมีเหตุผล",
        delivery: "บรรยายและปฏิบัติ · C3-404",
        overview: "รายวิชาด้านคุณภาพซอฟต์แวร์ที่เชื่อมข้อกำหนดกับหลักฐานการตรวจสอบ นักศึกษาวางแผนการทดสอบ ออกแบบกรณีทดสอบ ดำเนินการและรายงานผล เพื่อสนับสนุนการตัดสินใจส่งมอบ",
        learning: ["วางแผน V&V ให้สอดคล้องกับความเสี่ยงและข้อกำหนด", "ออกแบบและดำเนินการทดสอบที่ให้หลักฐานเชื่อถือได้", "วิเคราะห์ข้อบกพร่อง รายงานผล และตัดสินความพร้อมในการส่งมอบ"],
        resource: "เปิดคลังบทเรียน ENGSE601"
      },
      en: {
        title: "Software Validation and Verification",
        short: "Plan quality evidence, design tests, analyze results, and make reasoned software-release decisions.",
        delivery: "Lecture and lab · C3-404",
        overview: "A software quality course connecting specifications with verification evidence. Students plan testing, design cases, execute and report results, and support release-readiness decisions.",
        learning: ["Plan V&V around requirements and risk", "Design and execute tests that produce dependable evidence", "Analyze defects, report results, and judge release readiness"],
        resource: "Open the ENGSE601 learning library"
      },
      resourceUrl: "../resources/engse601/"
    }
  };

  const ui = {
    th: {
      brand: "วิศวกรรมซอฟต์แวร์ · มทร.ล้านนา", brandSub: "Class Portal · ภาค 2/2569",
      navOverview: "ภาพรวม", navCourses: "รายวิชา", navPath: "เส้นทางการเรียนรู้", navContact: "ติดต่อ",
      skip: "ข้ามไปยังเนื้อหาหลัก", back: "กลับหน้ารวมรายวิชา", credits: "หน่วยกิต", section: "กลุ่มเรียน", sections: "กลุ่มเรียน",
      courseLabel: "รายวิชา", resources: "พื้นที่รายวิชา", resourcesTitle: "เริ่มต้นจากที่นี่", resourcesBody: "หน้าแนะนำนี้เป็นจุดเริ่มต้นก่อนเพิ่มแผนการสอน งาน และสื่อของแต่ละสัปดาห์",
      overview: "ภาพรวมรายวิชา", learn: "สิ่งที่จะได้ฝึก", draft: "สถานะการเตรียมสอน", draftText: "โครงสร้างหน้าและทางเข้าพร้อมใช้งานแล้ว รายละเอียดรายสัปดาห์จะทยอยเพิ่มในพื้นที่นี้",
      footer: "Class Portal · ภาคการศึกษาที่ 2/2569", update: "เตรียมสำหรับปีการศึกษา 2569–2570"
    },
    en: {
      brand: "Software Engineering · RMUTL", brandSub: "Class Portal · Semester 2/2026",
      navOverview: "Overview", navCourses: "Courses", navPath: "Learning paths", navContact: "Contact",
      skip: "Skip to main content", back: "Back to all courses", credits: "credits", section: "section", sections: "sections",
      courseLabel: "Course", resources: "Course space", resourcesTitle: "Start here", resourcesBody: "This overview is the starting point for the weekly plan, assignments, and learning materials that will be added next.",
      overview: "Course overview", learn: "What you will practise", draft: "Teaching readiness", draftText: "The course entry point and page structure are ready. Weekly details will be added to this space progressively.",
      footer: "Class Portal · Semester 2/2026", update: "Prepared for academic year 2026–2027"
    }
  };

  const rootCopy = {
    th: {
      heroEyebrow: "ภาคการศึกษาที่ 2 · ปีการศึกษา 2569", heroTitle1: "จากโจทย์จริง", heroTitle2: "สู่ซอฟต์แวร์ที่", heroTitle3: "เชื่อถือได้",
      heroLead: "Class Portal สำหรับนักศึกษาวิศวกรรมซอฟต์แวร์ รวมรายวิชา เส้นทางการเรียนรู้ และทางเข้าสู่สื่อการสอนของภาคเรียนนี้ไว้ในที่เดียว",
      explore: "สำรวจรายวิชา", contact: "ติดต่อผู้สอน", academic: "Academic term", term: "2 / 2569", coursesStat: "รายวิชา", sectionsStat: "กลุ่มเรียน", creditsStat: "หน่วยกิตรวม", ready: "พร้อมสำหรับภาคเรียนใหม่",
      coursesKicker: "Course directory", coursesTitle: "7 รายวิชา · หนึ่งเส้นทางการเรียนรู้", coursesIntro: "ตั้งแต่การค้นหาความต้องการ ออกแบบสถาปัตยกรรม ตรวจสอบคุณภาพ ไปจนถึงการเรียนรู้จากสถานประกอบการ",
      open: "เข้าสู่รายวิชา", creditUnit: "หน่วยกิต", secUnit: "กลุ่ม",
      pathKicker: "Learning journeys", pathTitle: "มองเห็นความเชื่อมโยง ก่อนลงมือเรียน", pathIntro: "แต่ละวิชาเสริมกันเป็นสามเส้นทาง เพื่อพัฒนาทั้งความคิดเชิงระบบ คุณภาพงาน และความเป็นมืออาชีพ",
      path1: "ค้นหา · ออกแบบ · พิสูจน์", path1body: "เปลี่ยนหลักฐานเป็นความต้องการ ออกแบบโครงสร้าง และตรวจสอบว่าสิ่งที่สร้างตอบโจทย์จริง",
      path2: "เตรียมพร้อม · ปฏิบัติงาน", path2body: "พัฒนาทักษะวิชาชีพก่อนออกฝึก และเรียนรู้จากความรับผิดชอบในสถานประกอบการจริง",
      path3: "ฝึกเฉพาะทาง · แก้ปัญหาจริง", path3body: "สร้างสมรรถนะตามตำแหน่ง พร้อมทำโครงงานที่สร้างคุณค่าให้ผู้ใช้หรือองค์กร",
      contactKicker: "Software Engineering @ RMUTL", contactTitle: "เรียนรู้ร่วมกันอย่างเป็นระบบ", program: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา (พื้นที่ดอยสะเก็ด)",
      address: "ตึก C3 ชั้น 4 มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา เชียงใหม่ (ดอยสะเก็ด) 98 หมู่ 8 ตำบลป่าป้อง อำเภอดอยสะเก็ด จังหวัดเชียงใหม่ 50220", emailLabel: "อีเมลผู้สอน"
    },
    en: {
      heroEyebrow: "Semester 2 · Academic year 2026", heroTitle1: "From real needs", heroTitle2: "to software we", heroTitle3: "can trust",
      heroLead: "A single Class Portal for Software Engineering students—bringing together this semester’s courses, learning journeys, and teaching resources.",
      explore: "Explore courses", contact: "Contact instructor", academic: "Academic term", term: "2 / 2026", coursesStat: "courses", sectionsStat: "sections", creditsStat: "total credits", ready: "Ready for the new semester",
      coursesKicker: "Course directory", coursesTitle: "7 courses · one connected journey", coursesIntro: "Move from discovering requirements and shaping architecture to verifying quality and learning through authentic workplace practice.",
      open: "Enter course", creditUnit: "credits", secUnit: "sections",
      pathKicker: "Learning journeys", pathTitle: "See the connections before class begins", pathIntro: "The courses form three complementary journeys that develop systems thinking, product quality, and professional capability.",
      path1: "Discover · design · verify", path1body: "Turn evidence into requirements, shape system structure, and verify that the delivered software solves the right problem.",
      path2: "Prepare · practise", path2body: "Build professional readiness before placement, then learn from authentic responsibilities in a real organization.",
      path3: "Specialize · solve", path3body: "Develop role-specific capability while delivering a project that creates value for users or the organization.",
      contactKicker: "Software Engineering @ RMUTL", contactTitle: "Learn deeply. Build responsibly.", program: "Bachelor of Engineering Program in Software Engineering, Faculty of Engineering, Rajamangala University of Technology Lanna (Doi Saket Campus)",
      address: "C3 Building, 4th Floor, RMUTL Chiang Mai (Doi Saket), 98 Moo 8, Pa Pong, Doi Saket, Chiang Mai 50220, Thailand", emailLabel: "Instructor email"
    }
  };

  function getLanguage() {
    try { return localStorage.getItem("se-portal-lang") || "th"; } catch (_) { return "th"; }
  }

  function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    try { localStorage.setItem("se-portal-lang", lang); } catch (_) {}
    document.querySelectorAll("[data-lang-btn]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.langBtn === lang));
    });
    document.querySelectorAll("[data-ui]").forEach((node) => {
      const key = node.dataset.ui;
      if (ui[lang][key]) node.textContent = ui[lang][key];
    });
    document.querySelectorAll("[data-root-copy]").forEach((node) => {
      const key = node.dataset.rootCopy;
      if (rootCopy[lang][key]) node.textContent = rootCopy[lang][key];
    });
    window.dispatchEvent(new CustomEvent("portal:language", { detail: { lang } }));
  }

  function bindLanguageButtons() {
    document.querySelectorAll("[data-lang-btn]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.langBtn));
    });
  }

  window.ClassPortal = { courses, ui, rootCopy, getLanguage, setLanguage, bindLanguageButtons };
})();
