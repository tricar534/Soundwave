# Soundwave Deployment Setup Guide



**Project:** Soundwave

**Course:** CPSC 491-03 — Senior Capstone

**Sprint:** Sprint 4 — Fall 2026

**Jira Issue:** SW-163

**Assigned Role:** D — CI/CD and Deployment



## 1. Purpose



This guide documents Soundwave's current development environment, application build procedures, database setup, CI/CD validation, and deployment preparation requirements.



The purpose is to help team members reproduce the existing setup and understand the steps required before deploying the application.



This document distinguishes between local development, automated CI validation, and production deployment readiness.



## 2. Application Architecture



Soundwave uses a three-tier application architecture:



- **Frontend:** React and Vite.

- **Backend:** Node.js, Express, and TypeScript.

- **Database:** PostgreSQL managed through Prisma.



GitHub Actions provides automated testing, build verification, database validation, and security checks.



## 3. Required Software



Developers should have the following tools installed:



- Git

- Node.js and npm (Node.js 24 is used in CI)

- Docker Desktop or another compatible Docker environment

- A code editor or IDE



Verify the tools using:



```bash

git --version

node --version

npm --version

docker --version

docker compose version

```



The `docker --version` command verifies that Docker is installed. It does not confirm that the Docker engine is running.



## 4. Repository Setup



Clone the Soundwave repository:



```bash

git clone https://github.com/tricar534/Soundwave.git

cd Soundwave

```



Install the frontend dependencies:



```bash

cd frontend

npm ci

cd ..

```



Install the backend dependencies:



```bash

cd backend

npm ci

cd ..

```



Install the database dependencies:



```bash

cd database

npm ci

cd ..

```



Each component has its own package configuration and lockfile.



## 5. Database Configuration



The repository includes a PostgreSQL Docker Compose configuration at:



`database/compose.yaml`



Start the PostgreSQL service from the repository root:



```bash

docker compose -f database/compose.yaml up -d

```



Configure the database environment variables according to the existing project documentation.



Do not commit local credentials or `.env` files containing sensitive information.



From the database directory, generate the Prisma Client and validate the database:



```bash

cd database

npm run db:generate

npm run db:validate

npm run db:deploy

npm run db:status

```



When sample data is required:



```bash

npm run db:seed

```



Run the automated database tests:



```bash

npm run test:db

```



Additional setup instructions are available in:



- `docs/database/local\_setup.md`

- `database/README.md`



## 6. Frontend Build Validation



From the frontend directory, run:



```bash

cd frontend

npm ci

npm run build

npm test -- --run

```



A successful frontend build produces output in:



`frontend/dist/`



The build verifies that the application can be compiled for production, but does not independently confirm deployment readiness.



## 7. Backend Build Validation



From the backend directory, run:



```bash

cd backend

npm ci

npm run build

npm test

```



A successful backend build produces compiled output in:



`backend/dist/`



Backend execution also requires the appropriate runtime environment and database connectivity.



## 8. GitHub Actions CI/CD Pipeline



The primary GitHub Actions workflow is located at:



`.github/workflows/ci.yml`



The existing workflow includes:



- Repository validation.

- Frontend linting, automated tests, and build verification.

- Backend TypeScript build and automated tests.

- Backend linting.

- PostgreSQL readiness and database health checks.

- Prisma schema and migration validation.

- Database integrity and relationship tests.

- Backend/database integration smoke testing.

- Automated dependency vulnerability scanning.

- Centralized CI validation summary and failure reporting.



The pipeline records build identifiers and Git commit information for traceability.



## 9. Dependency Security Scanning



Sprint 4 introduced automated dependency vulnerability scanning using:



```bash

npm audit --audit-level=high

```



The security scanning job evaluates both frontend and backend npm dependencies.



The configured threshold is High or Critical severity.



When vulnerabilities meeting this threshold are detected, the security validation job reports failure.



During Sprint 4 validation, the automated scans identified:



| Component | Moderate | High | Total |

|---|---:|---:|---:|

| Frontend | 7 | 3 | 10 |

| Backend | 12 | 1 | 13 |



These findings demonstrate vulnerability detection, but remediation remains outstanding.



Dependency updates should be coordinated with the responsible frontend and backend developers.



## 10. Docker and Deployment Configuration



The SW-161 configuration review confirmed:



- Docker CLI version 29.8.2 was installed locally.

- The repository contained `database/compose.yaml`.

- No application Dockerfile was found during the repository search.

- No `docker-compose.yml` file was found.



The existing Compose configuration supports PostgreSQL development.



Application Docker image creation and automated Docker build validation remain separate Sprint 4 objectives.



Until application container packaging and deployment procedures are implemented and verified, Soundwave should not be described as having a completed production deployment pipeline.



## 11. Deployment Readiness Checklist



Before deploying Soundwave, verify that:



- Frontend dependencies install successfully.

- Backend dependencies install successfully.

- Frontend production build completes.

- Backend TypeScript build completes.

- Automated frontend and backend tests pass.

- Database migrations apply successfully.

- Database health checks pass.

- Backend/database integration tests pass.

- Dependency security findings are reviewed and remediated or formally dispositioned.

- Docker image builds pass when application container packaging is available.

- Required environment variables are configured securely.

- GitHub Actions validation completes successfully.

- Code changes receive teammate review and approval before merging.



## 12. Known Limitations and Follow-Up Work



The Sprint 4 configuration review identified several areas requiring additional work:



**SW-164 — Docker Build Validation:** Add automated validation of application container builds.



**SW-165 — CI Test Reporting:** Improve visibility into automated test results and failures.



**SW-166 — Docker Build Versioning:** Associate Docker image builds with CI build identifiers.



**SW-167 — CI Failure and Recovery:** Verify that the pipeline correctly reports failures and subsequent successful recovery.



**SW-168 — Docker Build Failure Detection:** Validate that Docker build errors cause the appropriate CI failure status.



**SW-169 — Deployment Readiness Review:** Evaluate the final application build, security findings, and deployment configuration.



The security vulnerability findings identified during Sprint 4 also require team-coordinated remediation.



## 13. References



**GitHub Repository:**

https://github.com/tricar534/Soundwave



**Jira Board:**

https://soundwave-capstone.atlassian.net/jira/software/projects/SW/boards/1



**Related Repository Files:**



- `README.md`

- `backend/README.md`

- `database/README.md`

- `docs/database/local\_setup.md`

- `database/compose.yaml`

- `.github/workflows/ci.yml`



**Related Jira Issues:** SW-161, SW-163, SW-164, SW-165, SW-166, SW-167, SW-168, SW-169.
