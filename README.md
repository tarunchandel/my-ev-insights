# My EV Insights 🚗⚡

My EV Insights is a premium, user-friendly mobile application designed to track every aspect of your electric vehicle's performance, expenses, and charging habits. Built with a focus on visual excellence and ease of use, it provides EV owners with deep insights into their driving efficiency and ownership costs.

## ✨ Key Features

- **📊 Dynamic Dashboard**: A high-level overview of your EV's status, including current range, efficiency, and recent activity.
- **🔌 Charging Log**: Detailed tracking of charging sessions, energy added, and costs.
- **💸 Expense Tracking**: Monitor all EV-related costs beyond just charging, such as maintenance and insurance.
- **📈 Advanced Statistics**: Visualized data on energy consumption, cost per kilometer/mile, and range trends over time using interactive charts.
- **🚗 Car Profile**: Manage your vehicle's specifications and app preferences.
- **💨 Premium UI/UX**: Designed with a sleek "Glassmorphism" aesthetic, featuring smooth animations and a responsive layout.

## 🆕 Recent Updates (v1.3.0)

- **🎨 Redesigned Icon**: Symmetrical, minimalist "EV" monogram in emerald green.
- **📊 Dashboard Overhaul**: 
  - Added **Estimated Range at 100% Charge** tile.
  - Refactored summary tiles for better readability on smaller screens (auto-scaling fonts).
  - Clarified section headings (Expenses, Efficiency, Energy, Battery).
- **👋 Onboarding**: New welcoming nudge for first-time users to help them start logging data.
- **📏 Bug Fix**: Total distance now accurately reflects the latest odometer reading.
- **📱 Mobile Optimizations**:
  - Full landscape mode support with safe-area handling.
  - Native file sharing for data exports in the Settings tab.
- **⚙️ Build System**: Upgraded to support Java 17 and stable Capacitor 8 plugin ecosystem.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with modern design patterns (Glassmorphism, Flexbox, CSS Grid)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Native Bridge**: [Capacitor](https://capacitorjs.com/) (Android Support)
- **Utility**: [date-fns](https://date-fns.org/)

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/my-ev-insights.git
   cd my-ev-insights
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## 📱 Android Development

This project uses Capacitor to provide a native Android experience.

### Syncing Web Assets

After building the web project, sync the assets to the Android project:
```bash
npx cap sync
```

### Running on Android

To open the project in Android Studio:
```bash
npx cap open android
```

## 📂 Project Structure

- `/src/components`: Reusable UI components.
- `/src/pages`: Main application views (Dashboard, Charging, Stats, etc.).
- `/src/context`: React Context for state management.
- `/src/hooks`: Custom React hooks for data persistence and logic.
- `/android`: Native Android project files.

---

Developed with ❤️ for the EV community.
