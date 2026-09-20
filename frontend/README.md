# Soundwave Frontend

Frontend client for the Soundwave music streaming application.

## Current Stack

- React
- JavaScript / JSX
- Vite

## Prerequisites

Install Node.js and npm before running the frontend.

Verify installation:

```bash
node -v
npm -v
```

Install Dependencies

From the project root:

```bash
cd frontend
npm install
```

## Run the Frontend

Start the Vite development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

The default URL is typically:

```text
http://localhost:5173/
```

Open the URL in a web browser.

## Build for Production

To verify that the frontend builds successfully:

```bash
npm run build
```

The generated production files will be placed in:

```text
frontend/dist/
```

## Preview Production Build

After building:

```bash
npm run preview
```

## Current Pages

- Home
- Search
- Library

## Current Limitations

- Search on the Search page uses local mock data.
- Home search is currently UI-only.
- Library currently displays an empty state.
- Playback controls are UI-only and do not yet play audio.
- Settings is currently a placeholder.
- Media artwork references a placeholder image that has not yet been added to the project.
