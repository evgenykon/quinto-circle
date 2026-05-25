# Rules

- Node.js and npm are not available on the host. Never run npm/yarn commands directly.
  Use `make` commands which run inside the Docker container:
  - `make build` — build image
  - `make dev` — start dev server (background)
  - `make down` — stop dev server
  - `make run cmd="<command>"` — run any command inside the container
    (e.g. `make run cmd="npm install <pkg>"`)

- `make dev` already runs `yarn install` automatically on container start.
  After adding/removing dependencies with `make run cmd="yarn add <pkg>"`, restart
  the container with `make down && make dev`.
