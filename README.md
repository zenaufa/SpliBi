
# SpliBi — Split Bills with Friends 🧾💸

A bill-splitting app to share expenses with friends. All data is processed & stored locally on your device — no data is sent to any servers.

![SpliBi](https://img.shields.io/badge/Version-1.0.0-10b981?style=flat-square) ![Language](https://img.shields.io/badge/Language-English-blue?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## ✨ Features

| Feature | Description |
|-------|-----------|
| 📸 **3 Receipt Input Methods** | Camera photo, gallery upload, or manual input |
| ➗ **3 Split Modes** | Split equally, per item (Go Dutch), or proportionally |
| 🧮 **Tip Calculator** | Calculate the tip & divide it according to each person's percentage |
| 💰 **Tax & Service** | Automatically divide tax and service charges (PB1) |
| 👥 **Groups** | Create & manage groups of people you frequently split bills with |
| 📋 **Receipt History** | Save all your receipts, search, and view details anytime |
| 📄 **Share PDF** | Send a PDF summary per person or for the entire bill |
| 🔒 **100% Local** | All data is stored in your browser — no servers involved |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- npm (included with Node.js)

### Installation & Run

# 1. Clone the repository
git clone [https://github.com/zenaufa/SpliBi.git](https://github.com/zenaufa/SpliBi.git)
cd SpliBi

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
Open your browser to http://localhost:5173 — you're all set! 🎉

# Build for Production
npm run build
The build output will be in the dist/ folder, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

# Preview Build
npm run preview

### 🛠️ Tech Stack
Technology	Purpose
Vite	Build tool & dev server
Vanilla JS	Application logic (framework-less)
CSS Custom Properties	Design system & theming
IndexedDB (via idb)	Local data storage
Tesseract.js	Local OCR for receipt scanning
jsPDF	PDF generation

### 📁 Project Structure
SpliBi/
├── index.html              # App shell
├── package.json
├── vite.config.js
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
│   └── settings.js     # Settings
└── utils/
├── calculator.js   # Split calculation functions
├── ocr.js          # Receipt OCR processing
├── pdf-generator.js# PDF generation
└── ui.js           # Toast, modal, and avatar helpers

### 📱 How to Use
1. Add a Receipt — Tap the + button in the bottom navigation, select your input method (camera, gallery, or manual), and enter the items along with their prices
2. Set Tax & Tip — On the Split Bill page, set the percentages for tax (PB1), service charge, and tip
3. Add Participants — Add people's names manually or select them from an existing group
4. Choose Split Mode — Select between Split Equally, Per Item, or Proportionally
5. Calculate & Share — Tap "Calculate Split", then download the PDF or share it directly