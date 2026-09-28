# 🎨 GridSketch — Digital Drawing Assistant for Artists

> A modern, atelier-calibrated drawing assistant built with Next.js, Capacitor, and an authentic **Glacier Glassmorphism** design system. Transform any photo into a precision drawing reference with customizable grids, diagonal crosses, physical paper scaling, and one-tap export.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5-blue?style=flat-square&logo=capacitor)](https://capacitorjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-APK_Ready-3DDC84?style=flat-square&logo=android)](file:///Users/husnain/Desktop/untitled%20folder/GridSketch.apk)
[![Design](https://img.shields.io/badge/Theme-Glacier_Glassmorphism-7dd3fc?style=flat-square)]()

---

## ✨ Features

### 🧊 Glacier Glassmorphism Design
- **Layered Frosted Glass Surfaces**: Translucent dark navy panels (`rgba(15, 21, 36, 0.65)`) with high-refraction specular rims and 24–32px backdrop blur.
- **Harmonious Palette**: Deep Obsidian Navy base (`#0a0e1a`), Ice Cyan interactive highlights (`#7dd3fc`), Electric Cyan (`#38bdf8`), and soft Lavender accents (`#c8a0f0`).
- **Pure Icon-Driven Interface**: Clean, decluttered controls utilizing crisp Lucide icons, accessible tooltips, and tactile micro-animations.

### 🎬 Dynamic Animated Splash Screen
- **Seamless Native Handover**: Native splash screen on Android/iOS hands off smoothly to the client animation with zero flicker.
- **Procedural Vector Motion**: Floating 3D frosted glass slate, animated drawing of corner viewfinder brackets, 3x3 dashed laser grid tracks, expanding central crosshairs, and pulsing radar reticle.
- **Instant Skip**: Tap anywhere to dissolve immediately into the workspace.

### 📐 Precision Grid System
- **Equal Grid Mode**: Quick presets from `2×2` up to `20×20` subdivisions with independent or linked column/row controls.
- **Physical Grid Units**: Real-world measurements in millimeters (`mm`), centimeters (`cm`), or inches (`in`) matched to paper scale.
- **Proportional Diagonal Crosses**: Corner-to-corner diagonal guidelines for accurate composition transfer.
- **Customizable Overlays**: Adjustable grid line thickness, opacity, and curated color schemes (Ice Blue, Neon Cyan, White, Magenta, Yellow, Slate).
- **Coordinate Labeling**: Top/left alphanumeric cell numbering (1, 2, 3... / A, B, C...) with custom sizing and toggleable display.

### 🖼️ Image Fit & Physical Paper Alignment
- **Fit Modes**: `Fit Contain`, `Fill Cover`, `Stretch`, and exact pixel custom aspect ratios.
- **Paper Presets**: Standard paper standards (A4, A3, Letter, Legal, 1:1 Square) with Portrait and Landscape orientations.
- **Artistic Viewport Controls**: Zoom (`10%` to `500%`), pan navigation, 90° rotation, and horizontal/vertical flips.
- **Tonal Modes**: Instant full-color, grayscale, and high-contrast black-and-white conversion for value study.

### 💾 Multi-Format Export & Print
- **High-Resolution PNG**: Export with or without visible grid lines, diagonals, and cell numbering.
- **Print-Ready PDF**: Vector-scaled PDF generation with embedded calibration rulers and cell coordinates.
- **Dedicated Print Layout**: Native browser printing stylesheet formatted for clean paper output.

---

## 📱 Mobile App (Android & iOS)

GridSketch is fully packaged for mobile devices with native Capacitor integration:

- **Android Package**: Ready-to-install debug binary located at the root of the project:
  👉 **`GridSketch.apk`**
- **Hardware Integrations**:
  - Native status bar tinting (`@capacitor/status-bar`)
  - Full-screen immersive splash screen (`@capacitor/splash-screen`)
  - Native file system saving (`@capacitor/filesystem`)
  - Direct image sharing sheet (`@capacitor/share`)
- **Adaptive Launcher Icons**: Multi-density mipmap icons (`mdpi` to `xxxhdpi`) calibrated to Android adaptive icon safe zones.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Android SDK / JDK**: (Optional, only needed to build the Android APK from source)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/gridsketch.git
cd gridsketch

# Install dependencies
npm install
```

### Running Locally (Web)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js local development server |
| `npm run build` | Builds the optimized production web export |
| `npm run build:mobile` | Builds Next.js static pages and synchronizes Capacitor assets for Android & iOS |
| `node scripts/generate-assets.js` | Renders all Android mipmaps, Android splash screens, iOS AppIcon, and web favicons |
| `npm run cap:open:android` | Opens the native Android project in Android Studio |
| `npm run cap:open:ios` | Opens the native iOS project in Xcode |

---

## 🤖 Compiling the Android APK

To assemble a fresh Android APK from the command line:

```bash
# 1. Build and sync web assets
npm run build:mobile

# 2. Compile Debug APK via Gradle
cd android
./gradlew assembleDebug

# Output APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📁 Project Structure

```
├── android/                   # Native Android Studio Capacitor project
│   ├── app/src/main/res/      # Mipmap launcher icons & splash drawables
│   └── app/build/outputs/apk/ # Compiled APK output
├── assets/
│   └── svgs/                  # Source vector SVGs for icons and splash screens
├── ios/                       # Native iOS Xcode project
├── public/                    # Web / PWA static assets & favicons
├── scripts/
│   └── generate-assets.js     # Sharp asset generation pipeline
├── src/
│   ├── app/                   # Next.js App Router (layout, page, editor)
│   ├── components/
│   │   ├── brand/             # Glassmorphic BrandLogo & wordmark
│   │   ├── editor/            # Canvas, Grid Controls, Paper, Export
│   │   └── splash/            # AnimatedSplashScreen component
│   ├── lib/
│   │   ├── image/             # Paper sizing & grid math calculations
│   │   └── theme/             # Glacier color schemes & tokens
│   └── types/                 # TypeScript interfaces & definitions
├── capacitor.config.ts        # Capacitor mobile configuration
├── GridSketch.apk             # Root pre-compiled Android binary
└── README.md                  # Project documentation
```

---

## 📄 License

This project is licensed under the MIT License.
