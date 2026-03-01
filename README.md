
# SpliBi — Split Bills with Friends 🧾💸

A bill-splitting app to share expenses with friends. Scan receipts with AI-powered OCR for accurate extraction. All data is stored locally on your device.

![SpliBi](https://img.shields.io/badge/Version-1.1.0-10b981?style=flat-square) ![Language](https://img.shields.io/badge/Language-Indonesian-blue?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## ✨ Features

| Feature | Description |
|-------|-----------|
| 🤖 **AI Receipt Scanner** | Scan receipts using Gemini AI for accurate item & price extraction |
| 📸 **3 Input Methods** | Camera photo, gallery upload, or manual input |
| ➗ **3 Split Modes** | Split equally, per item (Go Dutch), or proportionally |
| 🧮 **Tip Calculator** | Calculate the tip & divide it per person |
| 💰 **Tax & Service** | Automatically divide tax and service charges (PB1) |
| 👥 **Groups** | Create & manage groups of people you frequently split bills with |
| 📋 **Receipt History** | Save all your receipts, search, and view details anytime |
| 📄 **Share PDF** | Send a PDF summary per person or for the entire bill |
| 🔒 **100% Local Storage** | All data is stored in your browser — no servers involved |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- npm (included with Node.js)
- (Optional) [Gemini API Key](https://aistudio.google.com/apikey) — free, for AI-powered receipt scanning

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/zenaufa/SpliBi.git
cd SpliBi

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

Open your browser to http://localhost:5173 — you're all set! 🎉

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

```bash
# Preview the production build
npm run preview
```

---

## 🤖 Setting Up AI Receipt Scanner

SpliBi uses **Google Gemini AI** for accurate receipt scanning. Without it, the app falls back to Tesseract.js (less accurate).

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key
2. Open SpliBi → **⚙️ Pengaturan** (Settings)
3. Paste your API key in the **Gemini API Key** field
4. Hit **Simpan Pengaturan** — done!

> **Free tier:** 15 requests/min, 1M tokens/day — more than enough for personal use.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| Vanilla JS | Application logic (framework-less) |
| CSS Custom Properties | Design system & theming |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via idb) | Local data storage |
| [Gemini API](https://ai.google.dev/) | AI-powered receipt OCR (primary) |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | Local OCR fallback (offline) |
| [jsPDF](https://github.com/parallax/jsPDF) | PDF generation |

---

## 📁 Project Structure

```
SpliBi/
├── index.html              # App shell
├── package.json
└── src/
    ├── main.js             # Entry point & routing
    ├── index.css           # Design system
    ├── router.js           # SPA hash router
    ├── db.js               # IndexedDB wrapper
    ├── pages/
    │   ├── home.js         # Home
    │   ├── add-receipt.js  # Add receipt (camera/gallery/manual)
    │   ├── split-bill.js   # Calculate & split bill
    │   ├── history.js      # Receipt history
    │   ├── groups.js       # Manage groups
    │   └── settings.js     # Settings & API key config
    └── utils/
        ├── calculator.js   # Split calculation functions
        ├── ocr.js          # Receipt OCR (Gemini AI + Tesseract fallback)
        ├── pdf-generator.js# PDF generation
        └── ui.js           # Toast, modal, and avatar helpers
```

---

## 📱 How to Use

1. **Add a Receipt** — Tap the ➕ button, select your input method (camera, gallery, or manual), and enter items with prices
2. **Set Tax & Tip** — On the Split Bill page, set percentages for tax (PB1), service charge, and tip
3. **Add Participants** — Add names manually or select from an existing group
4. **Choose Split Mode** — Split Equally, Per Item, or Proportionally
5. **Calculate & Share** — Tap "Calculate Split", then download or share the PDF