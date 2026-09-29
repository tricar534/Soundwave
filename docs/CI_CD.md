# Soundwave CI/CD Pipeline

## Overview

The Soundwave CI/CD pipeline automatically validates project changes through GitHub Actions.

The Sprint 2 pipeline supports:

- Pull request validation
- Frontend build and testing
- Backend build and testing
- Database validation
- PostgreSQL health checks
- Build versioning
- Build artifact generation
- Failure detection and recovery

## Pipeline Trigger

The CI workflow runs when:

- A pull request targets `main`
- Changes are pushed to `main`

Workflow file:

`.github/workflows/ci.yml`

## Pipeline Flow

Pull Request
    ↓
Repository Check
    ↓
Frontend / Backend / Database Validation
    ↓
Database Health Check
    ↓
Peer Review
    ↓
Merge to Main
    ↓
Versioned Build
    ↓
Build Artifacts
    ↓
PASS / FAIL

## CI Jobs

### Repository Check

Verifies that the required Soundwave project directories and repository files exist.

Checks include:

- frontend directory
- backend directory
- database directory
- docs directory
- README.md

### Frontend CI

The frontend CI job:

1. Sets up Node.js
2. Installs frontend dependencies
3. Runs linting
4. Builds the frontend
5. Runs frontend tests
6. Uploads the frontend build artifact

Commands:

```bash
npm install
npm run lint
npm run build
npm test
