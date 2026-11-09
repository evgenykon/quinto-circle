# Rules

## Environment

- Projects live under `~/Projects` (`~/Projects/<project>`); clone new projects there.
  Personal GitHub sources: https://github.com/evgenykon
- Node.js and npm are not available on the host. Never run npm/yarn/node commands directly.
  Use `make` commands which run inside the Docker container:
  - `make build` — build image
  - `make dev` — start dev server (background)
  - `make down` — stop dev server
  - `make run cmd="<command>"` — run any command inside the container
    (e.g. `make run cmd="npm install <pkg>"`)

- `make dev` already runs `yarn install` automatically on container start.
  After adding/removing dependencies with `make run cmd="yarn add <pkg>"`, restart
  the container with `make down && make dev`.

## Builds and CI

- Builds, tests and installs run in GitHub Actions (`.github/workflows`), not on the host.
  Do not run local npm builds; verify through CI.
- Local containers are only for development and syntax checks.

## Git / GitHub

- Do not merge into `master`, do not tag, and do not write to GitHub (issues, PRs, releases,
  repo settings) without an explicit user command.
