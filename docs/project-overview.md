# Adoptive AI Frontend Overview

## Purpose
`adoptive-ai-frontend` delivers the web UI for Adoptive AI. The current implementation features a Material UI chat assistant that streams responses from a local agent endpoint and persists conversation history locally.

## Tech Stack
- **Runtime & Framework:** React 19 with Create React App (CRA 5)
- **Language:** JavaScript (ES2020) with JSX and React Hooks
- **Component Library:** MUI (Material UI v5) with Emotion for styling primitives
- **Styling:** Global CSS for page-level theming (`App.css`, `index.css`) plus MUI's `sx` prop for component-level tweaks
- **Tooling:** `react-scripts` for build/test tooling, Jest + React Testing Library for unit tests

## Project Structure
```
root
├── public/                # Static assets served as-is by CRA
├── src/
│   ├── App.js             # Root application shell
│   ├── App.css            # Layout styling for the app container
│   ├── components/
│   │   └── Chat.js        # Streaming chat interface with tool call support
│   ├── index.js           # Application entry point
│   ├── index.css          # Global styles applied on boot
│   ├── reportWebVitals.js # Optional CRA performance hook
│   └── setupTests.js      # Jest/Testing Library configuration
├── package.json           # Dependencies and npm scripts
└── README.md              # Getting started guide and feature summary
```

## Development Workflow
1. Install dependencies with `npm install` (pulls MUI v5 and Emotion peer packages).
2. Run `npm start` to launch the dev server on `http://localhost:3000`.
3. Use `npm test` to run the Jest watcher (powered by React Testing Library).
4. Build production assets with `npm run build`.

## Testing Expectations
- Write component-level tests alongside components or in `src/__tests__`.
- Use Jest DOM matchers provided by `@testing-library/jest-dom` (see `setupTests.js`).
- Keep tests deterministic; mock APIs with Testing Library helpers.

## Next Steps
- Wire the chat component to the real backend/auth flow and externalise the token management.
- Expand component coverage (routing, layouts) once additional product surfaces are defined.
- Introduce shared state management (context or dedicated store) when multiple views need agent data.
