# Mobile Image Viewer Fix

ปรับหน้าดูภาพขยายของ `Project_Topic_Catalog_1_2569.html` แล้ว

## สิ่งที่แก้

- บนมือถือ viewer เปลี่ยนเป็นเต็มหน้าจอ (`100vw × 100dvh`) เพื่อไม่ให้ dialog ถูกตัดซ้าย/ขวา
- หัวเรื่องใช้บรรทัดได้สูงสุด 2 บรรทัด และใช้ชื่อสั้นของภาพ เช่น `P1 · Evidence Workbench Dashboard`
- ภาพใช้ `object-fit: contain` และอยู่กึ่งกลางเสมอ จึงไม่ถูก crop
- เพิ่มปุ่ม `−`, `100%`, `+` และ `×`
- แตะ 2 ครั้งเพื่อสลับ Fit / 250% และลากภาพได้หลังซูม
- ปิดได้ด้วยปุ่ม `×`, แตะพื้นหลัง หรือกด `Esc`

## Path ของภาพ

HTML อ้างภาพผ่าน relative path:

- `assets/p1-dashboard.png`
- `assets/p2-dashboard.png`
- `assets/p3-dashboard.png`
- `assets/p4-dashboard.png`
- `assets/p5-dashboard.png`
- `assets/p6-dashboard.png`

ดังนั้นเวลานำขึ้น GitHub Pages หรือเปิดในเครื่อง ต้องคงโฟลเดอร์ `assets/` ไว้ระดับเดียวกับไฟล์ HTML
