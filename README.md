## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.
[TypeOrm](https://typeorm.io/) Type Orm document.

# env config

copy .env.example to .env
update content info in .env

## Installation

```bash
yarn
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev
or
$ yarn dev

# production mode
$ yarn start:prod
```

## run migration build in

```
open bash (teminal)
create migration
yarn migration:create -- -n SeedingUser -d database/seedings

run migration
yarn migration:run -- -c default

revert migration
yarn migration:revert


```
## run seed build in

```
open bash (teminal)
running the app
yarn seed:run


```
