# Aura ◈ — AI Life Intelligence System

## פריסה מהירה ל-Vercel (5 דקות)

### שלב 1: הורד Node.js
לך ל-https://nodejs.org ← הורד "LTS" ← התקן

### שלב 2: פתח Terminal / PowerShell
```bash
# Windows: לחץ Win+R → רשום "powershell" → Enter
# Mac: Command+Space → רשום "Terminal" → Enter
```

### שלב 3: הורד את הפרויקט
הורד את קובץ ZIP מהצ'אט ← פרוס לתיקייה ← נווט אליה:
```bash
cd C:\Users\שמך\Downloads\aura-deploy   # Windows
cd ~/Downloads/aura-deploy              # Mac
```

### שלב 4: התקן תלויות
```bash
npm install
```

### שלב 5: בדוק שעובד מקומית
```bash
npm run dev
# פתח http://localhost:5173
```

### שלב 6: פרוס ל-Vercel
```bash
npm install -g vercel
vercel
```
- ענה Y לכל שאלה
- בסוף תקבל קישור: https://aura-XXX.vercel.app
- שלח את הקישור בווצאפ 🎉

---

## מבנה הקובץ
```
aura-deploy/
├── src/
│   ├── App.jsx      ← כל האפליקציה
│   └── main.jsx     ← נקודת כניסה
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```
