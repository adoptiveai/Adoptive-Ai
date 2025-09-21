# Adoptive AI Frontend

Adoptive AI's web client is built with Create React App and now showcases a Material UI powered chat assistant that streams responses from a local agent service. Use this repository as the foundation for building richer product experiences.

## Quick Start
1. Install dependencies with `npm install` (pulls in MUI v5 and supporting emotion packages).
2. Start the development server with `npm start` and open `http://localhost:3000`.
3. Run the interactive test watcher via `npm test`.
4. Create a production build with `npm run build`.

## Features
- Chat interface with local storage persistence for threads and message history.
- Streaming response handling with tool-call grouping visualisation.
- Model picker and quick actions (retry, clear thread) for faster iteration.

## Project Guide
- See `docs/project-overview.md` for a high-level look at the tech stack, project layout, and next steps.
- Cursor users: review `.cursor/rules` for coding conventions enforced by the AI assistant.

## Testing
- Jest and React Testing Library power the default test setup (`src/setupTests.js`).
- Extend `@testing-library/jest-dom` matchers for semantic assertions.
- Place new tests next to the code they cover or under `src/__tests__` when grouping suites.

## Additional CRA Resources
This project still uses Create React App under the hood. Refer to the official documentation for advanced topics such as deployment or custom configuration: <https://create-react-app.dev/>
