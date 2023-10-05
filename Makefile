cache:
	symfony console cache:clear

doctrine:
	symfony console doctrine:schema:update --force

npm-build:
	npm run build

install-webpack:
	npm install
	make npm-build

phpcs:
	docker pull oskarstark/php-cs-fixer-ga:latest
	docker run --rm -it -w=/app -v $(CURDIR):/app oskarstark/php-cs-fixer-ga:latest --diff

install:
	symfony composer install --no-interaction --no-progress
	symfony php vendor/bin/simple-phpunit install
	make install-webpack

lint_yaml:
	symfony console lint:yaml config --parse-tags

lint_twig:
	symfony console cache:clear --env=prod 
	symfony console lint:twig templates --env=prod

lint_xliff:
	symfony console lint:xliff translations

lint_container:
	symfony console lint:container --no-debug

doctrine_schema_validate:
	symfony console doctrine:schema:validate --skip-sync -vvv --no-interaction

composer_validate:
	symfony composer validate --strict

check_security:
	symfony check:security

phpstan:
	symfony php vendor/bin/phpstan analyze

phpunit:
	symfony php vendor/bin/phpunit

test:
	make phpcs lint_yaml lint_twig lint_xliff lint_container doctrine_schema_validate composer_validate check_security phpstan

server:
	symfony server:start
