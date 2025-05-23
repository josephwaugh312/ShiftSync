# 📆 ShiftSync - Modern Shift Scheduling App

ShiftSync is a modern, responsive shift scheduling web application designed to simplify employee shift management for small businesses like cafes, gyms, and retail stores. With an intuitive interface and powerful features, ShiftSync helps managers create, edit, and organize shifts with ease.

## ✨ Features

- **📅 Interactive Calendar View**: Weekly, color-coded schedule grid that displays shifts for each employee
- **🎴 Intuitive Shift Cards**: Interactive shift blocks that represent work hours, roles, and status
- **➕ Quick Add Shift**: Easily create new shifts with an intelligent form interface
- **🌓 Dark/Light Theme Support**: Toggle between light and dark themes for comfortable viewing in any environment
- **🏷️ Role Badges**: Each shift card displays role badges for quick identification
- **📱 Responsive Design**: Mobile-first approach, scaling beautifully across tablet and desktop screens
- **🔄 Recurring Shifts**: Create patterns for repeating shifts - daily, weekly, or monthly
- **💾 Shift Templates**: Save time by creating reusable shift templates for common schedules
- **📊 Insights Dashboard**: View analytics about scheduling patterns and staffing levels
- **🧭 Interactive Tutorial**: Guided onboarding experience for new users with step-by-step instructions

## 🛠️ Tech Stack

- **⚛️ React**: Functional Components with Hooks for UI development
- **🔷 TypeScript**: For type safety and enhanced developer experience
- **🔄 Redux Toolkit**: For centralized state management
- **🎨 TailwindCSS**: For utility-first styling with consistent design language
- **🎞️ Framer Motion**: For smooth animations and transitions
- **🧭 React Router**: For seamless navigation between views
- **🔊 Web Audio API**: For subtle UI sound effects that enhance user experience

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or above)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/josephwaugh312/ShiftSync.git
cd ShiftSync
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm start
```

4. Open your browser and visit `http://localhost:3000`

## 📱 Usage

### Viewing Shifts

The main calendar view displays all shifts for the current week. Click on a day to see shifts for that specific day. Use the navigation controls to move between weeks or switch to different views.

### Adding a Shift

Click the "Add Shift" button to open the shift form. Fill in the details including employee, role, time, and any notes. Click "Add" to create a new shift.

### Editing a Shift

Click on any shift card to open the edit form. Make your changes to the shift details and click "Update" to save.

### Creating Templates

Save frequently used shift patterns as templates. Access them from the Templates button in the header to quickly apply common shifts without re-entering details.

### Interactive Tutorial

New users will benefit from our step-by-step interactive tutorial that highlights key features of ShiftSync. The tutorial can be toggled on/off using the Shift+T keyboard shortcut.

### Theme Preferences

Toggle between light and dark mode using the sun/moon icon in the header. Your preference will be remembered across sessions.

## 📱 Responsive Design

- **📱 Mobile (375px - 600px)**: Scrollable list of shift cards with swipe interactions
- **📱💻 Tablet (600px - 1024px)**: Two-column layout with calendar grid and details pane
- **💻 Desktop (1024px+)**: Full dashboard layout with sidebar navigation, calendar grid, and detailed shift view

## ⌨️ Keyboard Shortcuts

ShiftSync supports various keyboard shortcuts for power users:
- `Shift+T` - Toggle tutorial
- `Shift+N` - Add new shift
- `Shift+E` - Go to employees
- `Shift+H` - Go to home/calendar
- `Shift+I` - View insights dashboard
- `Shift+M` - Open templates
- `Shift+P` - Publish schedule
- `Shift+/` or `?` - Show keyboard shortcuts
- `Esc` - Close modals

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [React](https://reactjs.org/)
- [Redux](https://redux.js.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Router](https://reactrouter.com/) 