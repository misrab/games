.PHONY: help install dev build test preview clean

NPM ?= npm

help:
	@echo "games — common commands"
	@echo ""
	@echo "  make install   install dependencies"
	@echo "  make dev       local dev server (Vite)"
	@echo "  make build     typecheck + production build"
	@echo "  make test      run unit tests"
	@echo "  make preview   serve production build locally"
	@echo "  make clean     remove node_modules and dist"

install:
	$(NPM) install

dev:
	$(NPM) run dev

build:
	$(NPM) run build

test:
	$(NPM) run test

preview:
	$(NPM) run preview

clean:
	rm -rf node_modules dist
