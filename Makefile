build:
	docker compose -f docker-compose.dev.yml build

dev:
	docker compose -f docker-compose.dev.yml up -d

down:
	docker compose -f docker-compose.dev.yml down

run:
	docker compose -f docker-compose.dev.yml run --rm app $(cmd)

test:
	docker compose -f docker-compose.dev.yml run --rm app sh -c "node scripts/check-chords.ts && node scripts/check-tree.ts"
