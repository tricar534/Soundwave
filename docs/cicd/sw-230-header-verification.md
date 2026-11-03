# SW-230: Security header verification evidence

Control: HTTP security response headers (Sprint 4 SOC 2, Role B).

## Manual check (curl, backend on port 4000, SW-228 Helmet branch)
Taken 2026-10-31, before the CSP frame-ancestors fix.

- sw-230-curl-health-headers.txt: GET /health response headers
- sw-230-curl-cors-preflight.txt: OPTIONS /api/tracks preflight with Origin http://localhost:5173

| AC | Header | Result in the output |
|----|--------|----------------------|
| AC-01 | X-Content-Type-Options | nosniff |
| AC-02 | X-Frame-Options | DENY (CSP also had frame-ancestors 'self', fixed in a follow-up PR) |
| AC-03 | Strict-Transport-Security | max-age=31536000; includeSubDomains |
| AC-04 | Content-Security-Policy | present, script-src 'self', no wildcard source, style-src allows unsafe-inline |
| CORS | Access-Control-Allow-Origin | present, preflight returned 204 |

## CI and review (AC-07)
To be added once the checks finish.
