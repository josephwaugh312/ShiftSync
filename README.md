# ShiftSync - Modern Shift Scheduling App

ShiftSync is a modern, responsive shift scheduling web application designed to simplify employee shift management for small businesses like cafes, gyms, and retail stores.

## Features

- **Calendar View**: Weekly, color-coded schedule grid that displays shifts for each employee
- **Shift Cards**: Interactive shift blocks that represent work hours, roles, and status
- **Add Shift Button**: Quickly create new shifts with an intuitive form
- **Dark Mode Support**: Toggle between light and dark themes
- **Role Badges**: Each shift card displays role badges for quick identification
- **Responsive Design**: Mobile-first approach, scaling beautifully across tablet and desktop screens

## Tech Stack

- **React**: Functional Components with Hooks
- **TypeScript**: For type safety
- **Redux Toolkit**: For state management
- **TailwindCSS**: For styling
- **Framer Motion**: For animations
- **React Router**: For navigation

## Getting Started

### Prerequisites

- Node.js (version 14 or above)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/shiftsync.git
cd shiftsync
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

## Usage

### Viewing Shifts

The main calendar view displays all shifts for the current week. Click on a day to see shifts for that specific day.

### Adding a Shift

Click the "Add Shift" button to open the shift form. Fill in the details and click "Add" to create a new shift.

### Editing a Shift

Click on any shift card to open the edit form. Make your changes and click "Update" to save.

### Dark Mode

Toggle between light and dark mode using the sun/moon icon in the header.

## Responsive Design

- **Mobile (375px - 600px)**: Scrollable list of shift cards with swipe interactions
- **Tablet (600px - 1024px)**: Two-column layout with calendar grid and details pane
- **Desktop (1024px+)**: Full dashboard layout with sidebar navigation, calendar grid, and detailed shift view

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Redux](https://redux.js.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Router](https://reactrouter.com/) 