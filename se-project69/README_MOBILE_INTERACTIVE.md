# Project Topic Catalog 1/2569 — Mobile + Image Zoom Update

## สิ่งที่ปรับปรุง

- เปลี่ยนภาพ mockup P1–P6 ให้กด/แตะเพื่อเปิดเป็นภาพขนาดใหญ่ใน modal viewer
- รองรับการปิดด้วยปุ่ม `×`, การแตะบริเวณพื้นหลัง, หรือกดปุ่ม `Esc`
- ปุ่มภาพเป็น `<button>` จึงเปิดด้วยคีย์บอร์ด Enter/Space ได้ และกลับ focus ไปยังภาพเดิมหลังปิด
- ปรับ CSS เป็น **mobile-first**: base layout สำหรับมือถือเป็นหนึ่งคอลัมน์ ก่อนขยายเป็น 2, 3 และหลายคอลัมน์ตาม breakpoint `600px`, `780px`, `1024px`
- ภาพใน modal ใช้ `object-fit: contain` และจำกัดความสูงตาม `100dvh` เพื่อให้ดูรายละเอียดได้ทั้งมือถือและเดสก์ท็อป

## โครงสร้างที่ต้องคงไว้

```text
Project_Topic_Catalog_1_2569_Web_Mobile_Interactive/
├── Project_Topic_Catalog_1_2569.html
└── assets/
    ├── p1-dashboard.png
    ├── p2-dashboard.png
    ├── p3-dashboard.png
    ├── p4-dashboard.png
    ├── p5-dashboard.png
    └── p6-dashboard.png
```

หน้า HTML อ้างอิงภาพแบบ relative path เช่น `assets/p1-dashboard.png` ดังนั้นต้องรักษาโครงสร้างนี้เมื่อนำขึ้นเว็บหรือเปิดจากเครื่อง.
