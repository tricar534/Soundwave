# SW-227: Backend Regression Tests (Baseline and After Change)

## Purpose
Confirm that adding the Helmet security-header middleware (SOC 2 CC5.2 / CC6.1,
SW-228/SW-229) does not break any existing backend functionality - `/health`,
`/api/tracks`, `/api/search`, CORS behavior, and existing error handling -
and that no existing assertions were weakened to force a pass.

## Verification

### Baseline (before change)
- Branch: `main`
- Commit SHA: `57bc13d93eea5d27c29b755f3858db0de27ea162`
- Command: `npm test`
- Output saved: [sw-227-baseline-main.txt](./sw-227-baseline-main.txt)

Result:
```
Test Files  5 passed | 1 skipped (6)
     Tests  35 passed | 3 skipped | 2 todo (40)
```
All passing, no failures. (The 1 skipped file is the Postgres integration
smoke test, which requires a live database and is expected to skip locally.)

### After change (Helmet added)
- Branch: `role-b/SW-soc2-http-security-headers`
- Commit SHA: `961a43596721b1eface093df5702294cb34da4ab`
- Command: `npm test`
- Output saved: [sw-227-after-change.txt](./sw-227-after-change.txt)

Result:
```
Test Files  7 passed | 1 skipped (8)
     Tests  71 passed | 3 skipped | 2 todo (76)
```
All passing, no failures. The increase from 5 to 7 test files and 35 to 71
tests reflects new coverage added alongside this ticket (SW-101 boundary/
equivalence tests, SW-102 Supertest route and unknown-route coverage,
SW-228/SW-229 security header tests) - every test present in the baseline
run is still present and still passing after the change, with no assertions
removed or weakened.

## Result
✅ Baseline: green (35/35 non-skipped tests passing)
✅ After change: green (71/71 non-skipped tests passing)
✅ No existing test was modified, removed, or weakened to pass
✅ `/health`, `/api/tracks`, `/api/search`, CORS, and error-handling behavior
   all unchanged and still covered

Evidence: raw `npm test` output for both runs saved alongside this file.
