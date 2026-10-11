# Soundwave
Senior capstone project for a self hostable music streaming application for playback, discovery, playlists, and user personalization.

## Git Workflow
- Do not push feature work directly to `main`.
- Create a branch for each Jira task.
- Open a pull request before merging into `main`.
- At least one teammate must approve the pull request.
- Resolve review comments before merging.
- Link the Jira issue in the branch, commit, or pull request when possible.

## Local Development Setup

Soundwave consists of a frontend, backend, and PostgreSQL database. Each part of the project must be configured before running the full application locally.

### Prerequisites

Install the following development tools:

- Node.js
- npm
- Docker
- Docker Compose
- Git

### Setup Guides

Use the following project documentation for detailed setup instructions:

- **Frontend:** See `frontend/README.md`
- **Backend:** See `backend/README.md`
- **Database:** See `docs/database/local_setup.md`

### Recommended Setup Order

For a new local development environment:

1. Clone the Soundwave repository.
2. Configure and start the PostgreSQL database using the database setup guide.
3. Install and start the backend using the backend README.
4. Install and start the frontend using the frontend README.
5. Verify that each service is running successfully before beginning development.

Environment files and credentials should remain local and should not be committed to GitHub.