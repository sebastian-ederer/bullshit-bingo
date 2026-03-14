# Bullshit Bingo

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

A real-time multiplayer bingo game. Create custom bingo decks, host game sessions, and play with friends. Includes admin controls for managing games, players, and bingo cards.

## Features

- **Custom decks** -- Create and manage your own bingo card phrases and combinations
- **Combo bonuses** -- Set up multi-phrase combos for bonus points
- **Real-time multiplayer** -- Play live sessions with other players
- **Admin panel** -- Manage games, players, and card collections
- **PWA support** -- Install as an app on your device

## Documentation

- [**User Guide**](docs/guide.md) - How to play, create decks, host games, and use combos.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)

### Local Development

```bash
git clone https://github.com/<your-username>/bullshit-bingo.git
cd bullshit-bingo

pnpm install

# Copy the example environment file and fill in your values
cp .env.example .env

pnpm db:push
pnpm db:seed

pnpm dev
```

The app will be available at `http://localhost:5173`.

## Configuration

Create a `.env` file based on `.env.example`. The following variables are available:

| Variable             | Description                                                    | Example                                |
| -------------------- | -------------------------------------------------------------- | -------------------------------------- |
| `APP_NAME`           | Display name shown in the UI                                   | `Bullshit Bingo`                       |
| `APP_SHORT_NAME`     | Short name used by the PWA manifest                            | `Bullshit Bingo`                       |
| `APP_DESCRIPTION`    | Description used by the PWA manifest                           | `Play Bingo with friends in real-time` |
| `DOMAIN`             | Domain for the Caddy reverse proxy (Docker only)               | `bingo.example.com`                    |
| `ORIGIN`             | Full origin URL used by SvelteKit                              | `https://bingo.example.com`            |
| `DATABASE_URL`       | Path to the SQLite database file                               | `local.db`                             |
| `BETTER_AUTH_URL`    | Auth callback URL (usually same as `ORIGIN`)                   | `https://bingo.example.com`            |
| `BETTER_AUTH_SECRET` | Secret key for signing auth tokens -- generate a random string | _(random string)_                      |
| `ADMIN_USERNAME`     | Username for the initial admin account                         | `admin`                                |
| `ADMIN_PASSWORD`     | Password for the initial admin account                         | _(your password)_                      |

## Deployment (Docker)

The project includes a `docker-compose.yml` that pulls a pre-built image from [GHCR](https://github.com/sebastian-ederer/bullshit-bingo/pkgs/container/bullshit-bingo) and runs the app behind a [Caddy](https://caddyserver.com/) reverse proxy with automatic HTTPS.

### Steps

1. **Clone the repo** (for the `Caddyfile` and compose file):

   ```bash
   git clone https://github.com/sebastian-ederer/bullshit-bingo.git
   cd bullshit-bingo
   ```

2. **Create your `.env` file** with production values (see [Configuration](#configuration)).

3. **Start the containers:**

   ```bash
   docker compose up -d
   ```

4. **Run the database seed** to create the initial admin account:

   ```bash
   docker compose exec app node scripts/seed.mjs
   ```

5. Your app is now running. Caddy will automatically provision TLS certificates for the configured `DOMAIN`.

### Building from Source

If you prefer to build the Docker image locally instead of pulling from GHCR, use the development compose file:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Notes

- The SQLite database is stored in a Docker volume (`bingo-data`) and persists across restarts.
- Database migrations run automatically on container startup.
- The app listens on port 3000 internally; Caddy handles ports 80/443 externally.
- To use a different reverse proxy, remove the `caddy` service and point your proxy to the `app` service on port 3000.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
