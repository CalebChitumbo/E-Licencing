.PHONY: help install backend frontend emulators dev test lint typecheck build clean

help:
	@echo "RPA-IRMS — make targets"
	@echo "  install       Install backend + frontend deps"
	@echo "  backend       Run Django API (http://localhost:8000)"
	@echo "  frontend      Run Vite dev server (http://localhost:5173)"
	@echo "  emulators     Start Firebase Auth + Firestore + Storage emulators"
	@echo "  dev           Run emulators, backend, and frontend together"
	@echo "  test          Run backend + frontend tests"
	@echo "  lint          Lint backend (ruff) + frontend (eslint)"
	@echo "  typecheck     mypy + tsc"
	@echo "  build         Build frontend production bundle"

install:
	cd backend && pip install -e .[dev]
	cd frontend && npm install

backend:
	cd backend && python manage.py runserver 0.0.0.0:8000

frontend:
	cd frontend && npm run dev

emulators:
	firebase emulators:start --only auth,firestore,storage

dev:
	@echo "Start three terminals: 'make emulators', 'make backend', 'make frontend'"

test:
	cd backend && pytest
	cd frontend && npm test -- --run

lint:
	cd backend && ruff check .
	cd frontend && npm run lint

typecheck:
	cd backend && mypy .
	cd frontend && npm run typecheck

build:
	cd frontend && npm run build

clean:
	rm -rf backend/.pytest_cache backend/htmlcov backend/.coverage
	rm -rf frontend/dist frontend/node_modules/.vite
