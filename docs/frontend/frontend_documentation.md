# Soundwave Frontend Documentation

## Overview

The Soundwave frontend provides the client-side user interface for the application.

The existing frontend was reviewed at the beginning of Sprint 2 before additional UI implementation was started.

The current frontend uses:

- React
- JavaScript / JSX
- Vite
- CSS

Although the original implementation plan referenced React and TypeScript, the frontend inherited at the start of Sprint 2 is currently implemented using JavaScript and JSX.

## Frontend Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── MediaCard.jsx
│   │   ├── PlaybackBar.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LibraryPage.jsx
│   │   └── SearchPage.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── app.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

## Application Entry Point

`main.jsx` starts the React application and renders the main `App` component.

`App.jsx` controls the overall frontend layout and current page.

The application currently uses React state rather than a dedicated routing library.

The current page is stored using:

```javascript
const [currentPage, setCurrentPage] = useState("home");
```

The page is selected through a switch statement in `App.jsx`.

Current pages include:

- Home
- Search
- Library

The overall application flow is currently:

```text
Sidebar Interaction
        ↓
App.jsx State Update
        ↓
Current Page Selected
        ↓
Home / Search / Library Rendered
```

## Sidebar Component

`Sidebar.jsx` provides the main application navigation.

It receives:

- `currentPage`
- `onNavigate`

When the user selects Home, Search, or Library, the Sidebar calls:

```javascript
onNavigate(item.id)
```

`App.jsx` receives the new page value and renders the corresponding page.

The active navigation item is also given a different CSS class.

### Current Sidebar Status

Working:

- Home
- Search
- Library
- Active page styling

Placeholder:

- Settings

Settings currently renders as a button but does not have an action assigned.

## MediaCard Component

`MediaCard.jsx` is a reusable frontend component used to display media information.

It accepts:

- `title`
- `subtitle`
- `image`
- `type`
- `onSelect`

Example usage:

```jsx
<MediaCard
  title={item.title}
  subtitle={item.subtitle}
  image={item.image}
  type={item.type}
  onSelect={() => console.log(`Selected ${item.title}`)}
/>
```

This allows the same component layout to display different songs, playlists, albums, or other media types.

The component itself does not determine what happens when a card is selected.

Instead, the parent page decides what `onSelect` should do.

This makes the component reusable.

## Home Page

`HomePage.jsx` currently contains local mock data for recently played items.

Current sample items include:

- Midnight Drive
- Chill Waves
- Focus Mode

The page uses `MediaCard` to display the items.

Clicking a Home page card currently executes:

```javascript
console.log(`Selected ${item.title}`)
```

Testing confirmed that the callback works and the selected item is printed in the browser console.

However, selecting a card does not currently:

- start audio
- update the playback bar
- request data from the backend

### Home Search

The Home search field is currently rendered as a UI element but does not contain search logic.

It accepts user input, but the input is not currently connected to search results or API functionality.

## Search Page

`SearchPage.jsx` currently provides functional client-side search using mock data.

The search query is stored with React state:

```javascript
const [query, setQuery] = useState("");
```

Results are filtered using:

```javascript
const results = mockSongs.filter((song) =>
  song.title
    .toLowerCase()
    .includes(query.toLowerCase())
);
```

Testing confirmed:

- `Night` displays both Nightfall and Night Drive.
- `Drive` displays only Night Drive.
- unmatched searches display no media cards.

The current search functionality is local only.

It does not currently call the backend search API.

## Library Page

`LibraryPage.jsx` currently displays an empty state.

The page tells the user that saved:

- albums
- songs
- artists
- playlists

will appear after they are added.

No persistent library functionality is implemented yet.

## Playback Bar

`PlaybackBar.jsx` provides the visible playback controls.

Current controls include:

- Previous
- Play / Pause
- Next
- Volume

The Play button uses React state:

```javascript
const [isPlaying, setIsPlaying] = useState(false);
```

Clicking Play changes the button between:

```text
Play
Pause
```

This currently changes only the frontend UI state.

The playback bar does not yet include:

- an audio element
- an audio source
- selected-track state
- previous-track behavior
- next-track behavior
- functional volume control

The current track is hardcoded as:

```text
No track selected
Soundwave
```

Therefore, the current playback bar should be considered an interactive UI prototype rather than a completed playback engine.

## API Service

`src/services/api.js` provides a centralized API request helper.

The backend base URL is determined from:

```javascript
import.meta.env.VITE_API_URL
```

If the environment variable is not present, the frontend defaults to:

```text
http://localhost:3000/api
```

Existing API helper functions include:

```javascript
getSongs()
getAlbums()
getArtists()
searchCatalog(query)
```

Expected requests are:

```text
GET /api/songs
GET /api/albums
GET /api/artists
GET /api/search?q=<query>
```

During the initial Sprint 2 frontend review, the reviewed pages were not yet using these API functions.

Browser Network inspection also did not show frontend API requests during normal Home and Search page usage.

The current frontend flow is therefore primarily:

```text
User
 ↓
React UI
 ↓
Local State / Mock Data
```

rather than the intended future flow:

```text
User
 ↓
React UI
 ↓
API Service
 ↓
Backend
 ↓
Database
```

## Media Artwork

Current media objects reference:

```text
/images/album-placeholder.jpg
```

Testing confirmed that the corresponding image asset is not currently included in the frontend project.

As a result, the cards render correctly but the media artwork appears broken.

The expected Vite public asset structure would be similar to:

```text
frontend/
└── public/
    └── images/
        └── album-placeholder.jpg
```

The missing artwork is an existing frontend limitation and is not currently a React rendering failure.

## Verification Performed

The existing frontend was reviewed and tested before Sprint 2 modifications.

Verification included:

### Dependency Installation

```bash
npm install
```

Dependencies installed successfully.

npm reported:

```text
found 0 vulnerabilities
```

### Development Server

```bash
npm run dev
```

The Vite development server started successfully and the application loaded in the browser.

### Navigation Testing

Verified navigation between:

- Home
- Search
- Library

### Search Testing

Verified client-side filtering using multiple search inputs.

### MediaCard Testing

Verified that Home media cards execute their assigned callback through the browser console.

### Browser Developer Tools

Used the Console and Network tools to inspect:

- component interaction
- image requests
- backend/API requests
- runtime errors

### Production Build

```bash
npm run build
```

The production build completed successfully.

The build:

- transformed 42 modules
- generated the `dist/` output
- completed without build errors

## Current Frontend Status

| Feature | Status |
|---|---|
| React/Vite setup | Working |
| Development server | Working |
| Production build | Working |
| Home page | Working UI |
| Search page | Working with mock/local data |
| Library page | Empty-state placeholder |
| Sidebar navigation | Working |
| MediaCard reuse | Working |
| Card selection callback | Working |
| Home search | UI only |
| Backend API service | Defined |
| Backend API integration | Not yet used by reviewed pages |
| Playback controls | UI state only |
| Actual audio playback | Not implemented |
| Settings | Placeholder |
| Media artwork | Asset missing |
