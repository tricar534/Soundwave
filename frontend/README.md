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

## Testing

Frontend tests use Vitest and Testing Library.

Run tests from the `frontend` directory:

```bash
npm test
```

The current test suite covers:

- Shared component rendering
- MediaCard interaction behavior
- Sidebar navigation behavior
- PlaybackBar controls
- Home page rendering
- Search page filtering
- Library empty-state rendering

To verify both automated tests and the production build:

```bash
npm test
npm run build
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

## Public Frontend Configuration (SW-223)

Vite exposes `VITE_` variables to browser-side code. Soundwave currently approves only
`VITE_API_URL` and `VITE_BACKEND_URL` as public settings; both must be HTTP(S)
URLs without embedded credentials, query strings, or fragments.

Copy `frontend/.env.example` to a local untracked `frontend/.env` if you need
to override the default backend URLs. **Never place credentials or secrets**
in frontend environment files or `VITE_` variables.

From `frontend/`, run `npm run validate:config`. The same safeguard runs
automatically before `npm run dev` and `npm run build`, including the
production build executed by GitHub Actions. It checks frontend `.env*`
files and inherited `VITE_` environment variables and returns a nonzero exit
code if it finds prohibited configuration. It never prints configuration values.

Validation uses synthetic inputs only; do not test with real secrets.
This safeguard addresses frontend configuration exposure, not every possible
way credentials could be hard-coded in application source files.

## Optional Local Pre-Commit Configuration Check (SW-223)

A repository-managed Git hook at `.githooks/pre-commit` runs the **existing**
`npm run validate:config` safeguard automatically before local commits. This
helps catch prohibited frontend configuration earlier; it does not replace
frontend build checks or GitHub Actions validation.

Enable the hook **once per local clone**, from the Soundwave repository root:

```bash
chmod +x .githooks/pre-commit
git config --local core.hooksPath .githooks
```

Confirm which hooks directory your clone uses:

```bash
git config --local --get core.hooksPath
```

Before changing `core.hooksPath`, coordinate with teammates if your clone
already uses another hooks manager: this setting replaces that hooks directory.
Other clones will not enable this hook automatically.

You can run the hook directly to verify its behavior (from the repository root):

```bash
.githooks/pre-commit
```

Expected output for approved public configuration includes `PASS` and a zero
exit status. For a **synthetic** prohibited variable, use:

```bash
VITE_DATABASE_PASSWORD=SYNTHETIC_TEST_ONLY .githooks/pre-commit
echo "Exit code: $?"
```

This must report `FAIL` with a nonzero exit code without printing the marker's
value. The pre-commit hook uses the current working-tree frontend `.env*` files
and inherited `VITE_` variables; it does **not** inspect every staged source
file or guarantee that the staged snapshot matches the working tree. It can
also be bypassed with `git commit --no-verify`, so it is an extra local check,
not the sole enforcement mechanism.

The Vitest security suite includes a **false-positive test** confirming that
harmless comments mentioning password/token names and approved public URL
paths are not rejected:

```bash
cd frontend
npx vitest run scripts/validate-config.test.js
```
