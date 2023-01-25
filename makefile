.PHONY: help
# Make stuff

-include .env

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

.DEFAULT_GOAL := help

ARTIFACTS_DIRECTORY := "./environment/artifacts"

CURRENT_PATH :=${abspath .}

SHELL_CONTAINER_NAME := $(if $(c),$(c),outpost-api)
BUILD_TARGET := $(if $(t),$(t),development)

help: ## Help.
	@grep -E '^[a-zA-Z-]+:.*?## .*$$' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "[32m%-27s[0m %s\n", $$1, $$2}'

build: ## Build images.
	@docker-compose -f docker-compose.$(BUILD_TARGET).yml build

start: ## Start previously builded application images.
	@make create_project_artifacts
# @make start_mongo
	@make start_outpost_api

stop: ## Stop all images.
	@docker-compose -f docker-compose.$(BUILD_TARGET).yml stop

shell: ## Internal image bash command line.
	@if [[ -z `docker ps | grep ${SHELL_CONTAINER_NAME}` ]]; then \
		echo "${SHELL_CONTAINER_NAME} is NOT running (make start)."; \
	else \
		docker-compose -f docker-compose.$(BUILD_TARGET).yml exec $(SHELL_CONTAINER_NAME) /bin/ash; \
	fi

clear: ## Clear images
	@docker compose -f docker-compose.$(BUILD_TARGET).yml rm 

prepare_db: ## Prepare indices in mongodb
	docker-compose -f docker-compose.$(BUILD_TARGET).yml exec $(SHELL_CONTAINER_NAME) npm run prepare-indices; \

tests: ## Run tests
	docker-compose -f docker-compose.$(BUILD_TARGET).yml exec $(SHELL_CONTAINER_NAME) npm run test; \

create_project_artifacts: 
	mkdir -p ./environment/artifacts/mongo

start_mongo: ## Start mongo image.
	@if [[ -z `docker ps | grep mongo` ]]; then \
		docker-compose -f docker-compose.$(BUILD_TARGET).yml up -d mongo; \
	else \
		echo "Mongo is running."; \
	fi

start_outpost_api: ## Start node image.
	@if [[ -z `docker ps | grep node` ]]; then \
		docker-compose -f docker-compose.$(BUILD_TARGET).yml up -d outpost-api; \
	else \
		echo "Node is running."; \
	fi
