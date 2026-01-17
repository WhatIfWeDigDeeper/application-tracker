# Application Tracker

A modern web application to help job seekers track their applications, interview progress, and job offers. Built with Next.js, React, and TypeScript. This was built in the initial stage with [GitHub Spec Kit](https://github.com/github/spec-kit) using Claude Code for the first two specs. See the initial specify prompts in [user-prompt-history](./user-prompt-history.md). After this stage, I used Copilot to make mostly UI improvements, see [commits](https://github.com/WhatIfWeDigDeeper/application-tracker/commits/main/) starting with [PR #3](https://github.com/WhatIfWeDigDeeper/application-tracker/pull/3)

- [Features](#features)
- [Project Description](#project-description)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [Usage Guide](#usage-guide)
  - [Adding a New Job Application](#adding-a-new-job-application)
  - [Viewing \& Filtering Applications](#viewing--filtering-applications)
  - [Tracking Interview Progress](#tracking-interview-progress)
  - [Managing Offers](#managing-offers)
  - [Archiving \& Organizing](#archiving--organizing)
  - [Theme Preferences](#theme-preferences)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
  - [Development](#development)
  - [Testing](#testing)
- [Data Storage](#data-storage)
- [Contributing](#contributing)
  - [Development Workflow](#development-workflow)
  - [Code Style](#code-style)
- [License](#license)
- [Support](#support)


## Features

- **Add & Manage Applications**: Create detailed job application records with company info, position, salary ranges, and more
- **Track Interview Stages**: Monitor multiple rounds of interviews and record feedback from each stage
- **Manage Offers**: Track job offers with due dates and compare opportunities
- **Filter & Sort**: Quickly find applications by status, company category, skills match, job source, and more
- **Archive & Delete**: Organize your tracker by archiving completed applications or removing entries
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Responsive Design**: Seamlessly works on desktop and mobile devices
- **Local Storage**: All data is stored locally in your browser - no cloud sync required

## Project Description

The Application Tracker is a productivity tool designed specifically for job seekers managing multiple applications simultaneously. It provides a centralized hub to:

- Record detailed information about each job application
- Track interview progress through multiple rounds
- Manage job offers with decision deadlines
- Filter and sort applications to gain insights into your job search progress
- Maintain organized records with archival and deletion capabilities

Whether you're early in your job search or juggling multiple offers, this tracker helps you stay organized and on top of every opportunity.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) 14.2+ - React framework with server-side rendering
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: Custom React components with accessibility in mind
- **Testing**:
  - [Jest](https://jestjs.io/) - Unit and integration tests
  - [Playwright](https://playwright.dev/) - End-to-end testing
  - [React Testing Library](https://testing-library.com/react) - Component testing
- **Package Manager**: npm
- **Runtime**: Node.js

## Installation

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/WhatIfWeDigDeeper/application-tracker.git
cd application-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### Adding a New Job Application

1. Click the **"Add Application"** button
2. Fill in the required fields:
   - **Company Name**: Name of the hiring company
   - **Position**: Job title or role
   - **Date Applied**: When you submitted the application
3. Optionally add:
   - Company URL and job posting links
   - Company category (AI, Finance, Education, etc.)
   - Skills match rating (1-5 scale)
   - Salary range
   - Job source (LinkedIn, Recruiter, etc.)
   - Special requirements or notes
4. Click **Save** to add the application to your tracker

### Viewing & Filtering Applications

- **View All**: See all active applications in the main list
- **Filter by Status**: Click the filter icon to show applications by status (Applied, Interviewing, Offered, Rejected, etc.)
- **Filter by Category**: Filter applications by company category
- **Filter by Skills Match**: Show only applications matching your skill level threshold
- **Filter by Source**: Find applications from specific sources
- **Sort**: Click the sort icon to organize by date applied, company name, or other criteria

### Tracking Interview Progress

1. Open an application detail view
2. Expand the **Interviews** section
3. Add each interview round with:
   - Interview type (Phone, Video, In-Person, etc.)
   - Date conducted
   - Interviewer details
   - Notes and feedback
4. Update status as you progress through rounds

### Managing Offers

1. Update application status to **Offered**
2. In the offer details section, set:
   - Offer acceptance deadline
   - Salary and compensation details
   - Additional benefits or special terms
3. Track multiple offers side-by-side for comparison

### Archiving & Organizing

- **Archive**: Move completed applications to archive without deleting them
- **Restore**: Bring archived applications back to active list
- **Delete**: Permanently remove applications from your tracker

### Theme Preferences

- Click the **Theme Toggle** button in the top right to switch between light and dark modes
- Your preference is automatically saved

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── assets/                # Static assets
│   └── icons/             # Custom SVG icons
├── components/            # React components
│   ├── ThemeProvider.tsx  # Dark mode provider
│   ├── ThemeToggle.tsx    # Theme switcher
│   ├── applications/      # Application-related components
│   ├── interviews/        # Interview tracking components
│   ├── common/            # Shared components
│   └── ui/                # UI component library
├── hooks/                 # Custom React hooks
│   ├── useApplications.ts # Application state management
│   ├── useFilters.ts      # Filter logic
│   ├── useSorting.ts      # Sort logic
│   ├── useLocalStorage.ts # Local storage persistence
│   └── useTheme.ts        # Theme management
├── lib/                   # Utility functions and constants
│   ├── constants.ts       # App constants
│   ├── theme.ts           # Theme configuration
│   └── utils.ts           # Helper functions
├── services/              # Business logic
│   ├── storage.ts         # Local storage service
│   └── validation.ts      # Input validation
└── types/                 # TypeScript type definitions
    ├── application.ts     # Application type definitions
    └── theme.ts           # Theme types

tests/                     # Test files
├── e2e/                   # End-to-end tests (Playwright)
├── integration/           # Integration tests
└── unit/                  # Unit tests

specs/                     # Project specifications
├── 001-job-application-tracker/  # Core features spec
└── 002-dark-mode/                # Dark mode spec
```

## Available Scripts

### Development

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
```

### Testing

```bash
npm test                # Run unit and integration tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run test:e2e       # Run end-to-end tests
npm run test:e2e:ui    # Run E2E tests with UI
npm run test:e2e:debug # Debug E2E tests
```

## Data Storage

All application data is stored in your browser's **local storage**. This means:
- ✅ Your data stays private and never leaves your device
- ✅ No account setup or login required
- ⚠️ Data is tied to your browser (clearing browser storage will delete data)
- ⚠️ Use browser export features or manual backups for data persistence across devices

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue describing the problem and steps to reproduce
2. **Suggest Features**: Create an issue with your feature request and use case
3. **Submit Code**:
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/your-feature`)
   - Make your changes with clear commit messages
   - Add or update tests as needed
   - Submit a pull request with a description of changes

### Development Workflow

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Make your changes
4. Run tests: `npm test`
5. Test in browser: Visit `http://localhost:3000`
6. Ensure all tests pass before submitting PR

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns and naming conventions
- Write meaningful commit messages
- Add tests for new features
- Run `npm run lint` to check code quality

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Check the [Issues](https://github.com/WhatIfWeDigDeeper/application-tracker/issues) page
- Review the project specification in `specs/` directory
- Open a new issue with detailed information about your problem

---

Built with ❤️ to help job seekers stay organized
