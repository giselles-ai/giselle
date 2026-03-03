# Contributing

Thank you for your interest in this project! Please contribute according to the following guidelines:

Please note we have a [code of conduct](CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Development environment setup

### Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 24+ | `node -v` |
| pnpm | 10+ | `pnpm -v` |
| PostgreSQL | 14+ | `psql --version` |

### 1. Clone and install

```bash
git clone https://github.com/giselles-ai/giselle.git
cd giselle
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/studio.giselles.ai/.env.example apps/studio.giselles.ai/.env.local
```

Open `.env.local` and fill in the **required** variables (marked in the file):

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | PostgreSQL connection string (e.g. `postgres://user:pass@localhost:5432/giselle`) |
| `GITHUB_APP_ID` | Your GitHub App's ID |
| `GITHUB_APP_PRIVATE_KEY` | Your GitHub App's private key (PEM format) |
| `GITHUB_APP_CLIENT_ID` | Your GitHub App's client ID |
| `GITHUB_APP_CLIENT_SECRET` | Your GitHub App's client secret |
| `GITHUB_APP_WEBHOOK_SECRET` | Your GitHub App's webhook secret |

You also need at least one AI provider API key:

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GOOGLE_AI_API_KEY` | Google AI |

All other variables in `.env.example` are optional for local development.

> **Tip:** To create a GitHub App for development, see [GitHub's documentation](https://docs.github.com/en/apps/creating-github-apps). Set the homepage URL to `http://localhost:3000` and the callback URL to `http://localhost:3000/api/auth/callback/github-app`.

### 3. Set up the database

Create a PostgreSQL database and make sure `POSTGRES_URL` in `.env.local` points to it:

```bash
createdb giselle
```

Run migrations to set up the schema:

```bash
cd apps/studio.giselles.ai
npx drizzle-kit push
cd ../..
```

### 4. Start the development server

```bash
pnpm dev:studio.giselles.ai
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Giselle studio.

### Project structure

Giselle has both a Cloud version and a Self-hosting version, which can be found in the following directories:

- Cloud: [apps/studio.giselles.ai/](apps/studio.giselles.ai/)

## Issues and feature requests

You've found a bug in the source code, a mistake in the documentation or maybe you'd like a new feature? Take a look at [GitHub Discussions](https://github.com/giselles-ai/giselle/discussions) to see if it's already being discussed. You can help us by [submitting an issue on GitHub](https://github.com/giselles-ai/giselle/issues). Before you create an issue, make sure to search the issue archive -- your issue may have already been addressed!

Please try to create bug reports that are:

- _Reproducible._ Include steps to reproduce the problem.
- _Specific._ Include as much detail as possible: which version, what environment, etc.
- _Unique._ Do not duplicate existing opened issues.
- _Scoped to a Single Bug._ One bug per report.

**Even better: Submit a pull request with a fix or new feature!**

### How to submit a Pull Request

1. Search our repository for open or closed [Pull Requests](https://github.com/giselles-ai/giselle/pulls) that relate to your submission. You don't want to duplicate effort.
2. Fork the project
3. Create your feature branch (`git switch -c feat/amazing_feature`)
4. Commit your changes (`git commit -m 'feat: add amazing_feature'`)
5. Push to the branch (`git push origin feat/amazing_feature`)
6. [Open a Pull Request](https://github.com/giselles-ai/giselle/compare?expand=1)
