build:
	docker compose -f docker-compose.dev.yml build

dev:
	docker compose -f docker-compose.dev.yml up -d

down:
	docker compose -f docker-compose.dev.yml down

run:
	docker compose -f docker-compose.dev.yml run --rm quinto-circle $(cmd)
