# Project Risk — Frontend/Backend API Contract Gap (tracked under SW-98)

**Status:** Open — recorded during SW-98 (API service unit/contract tests)

## Description
`services/api.js` and the backend `/api/tracks` endpoint do not yet agree on a response
shape. `getTracks()` passes through whatever JSON the backend returns; the frontend does
not yet transform, validate, or render that payload as track objects.

## Secondary risk
`VITE_API_URL` and `VITE_BACKEND_URL` are two independent environment variables with
separate defaults. They are not derived from a single source of truth, so a deployment
config that updates one without the other will silently misroute requests.

## Recommended follow-up
- Role A and Role B agree on and document the `/api/tracks` response shape.
- Consolidate the two base-URL env vars, or add a CI check that fails if they diverge
  outside local development.
