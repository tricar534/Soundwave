# Defect: SearchPage search input has no accessible label

**Found during:** SW-99 ([TEST] [A] Add accessible role and label assertions for main pages)

**Component:** `frontend/src/pages/SearchPage.jsx`

## Problem

The search input on the Search page is missing an accessible label:

```jsx
<input
  className="search-input search-page-input"
  type="search"
  placeholder="Search Soundwave"
  value={query}
  onChange={(event) => setQuery(event.target.value)}
/>
```

It has a `placeholder`, but no `aria-label`, `aria-labelledby`, or associated
`<label>` element. Placeholder text is not a substitute for an accessible
name: it disappears once the user types, and is not reliably announced by
all screen readers.

This is inconsistent with the Home page's search input
(`frontend/src/pages/HomePage.jsx`), which already does this correctly:

```jsx
<input
  className="search-input"
  type="search"
  placeholder="Search songs, artists, or albums"
  aria-label="Search music"
/>
```

## Impact

A screen reader user tabbing to the Search page's search input hears no
name for the field, only that it is a search box. This fails the "Search
input reachable by label" acceptance criterion for SW-99 on the Search
page specifically; it already passes on the Home page.

## Suggested fix

Add an `aria-label` to the SearchPage input, mirroring HomePage's pattern,
e.g.:

```jsx
<input
  className="search-input search-page-input"
  type="search"
  placeholder="Search Soundwave"
  aria-label="Search Soundwave"
  value={query}
  onChange={(event) => setQuery(event.target.value)}
/>
```

## Why this isn't fixed in SW-99

SW-99's scope is to add test coverage for existing accessible roles/labels,
not to implement missing accessibility features — its acceptance criteria
explicitly call for logging missing accessibility features as separate
Jira issues rather than fixing them here. Writing a `getByLabelText` test
against this input today would fail CI, since the label doesn't exist yet.
This file documents the gap so it can be filed as its own ticket and fixed
under its own PR/review.
