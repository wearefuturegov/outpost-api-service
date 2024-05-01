<p align="center">
    <a href="https://outpost-platform.wearefuturegov.com/">
        <img src="docs/logo-icon-outpost-api-main.png?raw=true" width="350px" />               
    </a>
</p>
  
<p align="center">
    <em>Service directories done right</em>         
</p>

---

<p align="center">
   <img src="docs/screenshot-outpost-api-output.png?raw=true" width="750px" />     
</p>

<p align="center">
    <em>Example API Output</em>         
</p>

---

This is [Outpost](https://github.com/wearefuturegov/outpost)'s public API component.

It's not useful by itself — it depends on a public index built by [Outpost](https://github.com/wearefuturegov/outpost). The API it outputs is consumable by [Scout](https://github.com/wearefuturegov/scout-x) and other compatible Open Referral applications.

✨ **[Full documentation is available here](https://outpost-platform.wearefuturegov.com/docs/outpost-api-service)** ✨

## 🧱 How it's built

It's a simple Node.js app which queries information from a MongoDB collection and publishes it as a read-only, rate-limited REST API.

To run it on your machine you need Node.js, npm, nvm (https://github.com/nvm-sh/nvm) and a working MongoDB database [with the right indices](#indices) available on `localhost:27017`.

## 🧬 Configure Outpost API

It expects a few environment variables.

`DB_URI`

- MongoDB connection URI

`GOOGLE_API_KEY`

- Used for geocoding `location=` parameters.
- **Needs the geocoding API enabled.**

Other environmental variables:

`COMPOSE_PROJECT_NAME`

- This is used to name the docker images and containers

---

## 💻 Running it locally

```sh
# get the code
git clone git@github.com:wearefuturegov/outpost-api-service.git && cd outpost-api-service

# make sure your using the correct node version
nvm use

# setup env and database variables
# see setting up database below
cp sample.env .env

# Setup your database locally (see below) or start up a database using docker
# NB this runs mongo on a non-standard port `27018` in case you have mongo already running, you can change it to `27017` if you would like to
# connect with compass or mongosh with: mongodb://outpost:password@localhost:27018
docker compose up -d mongo

# once its setup you can just use this to restart it
docker start outpost-api-db

# install dependencies
npm install

# run development mode
npm run dev


# add some dummy data (if required)
npm run dummy-data

# stop your database
docker compose stop

# delete your database image
docker compose down

```

### Setting up database locally

```sh
# create the database on your localhost and run
mongosh .docker/services/mongo/setup-mongodb.js

# you can also run the following to use add the indices on to an existing database
npm run prepare-indices
```

or you can use the following commands to create your indices

# 🧬 Configuration

## Environmental Variables

You can provide config with a `.env` file. Run `cp sample.env .env` to create a fresh one.

The following environmental variables are required.

| Variable         | Description        | Example                                                              | Required? |
| ---------------- | ------------------ | -------------------------------------------------------------------- | --------- |
| `DB_URI`         | Mongo database url | `mongodb://outpost:password@localhost:27018/outpost_api_development` | Yes       |
| `GOOGLE_API_KEY` | Google API Key     | `1234`                                                               | Yes       |

# ✨ Features

## Geocoding

It is recommended to have an API for each environment, `outpost_api_service_geocode_dev`, `outpost_api_service_geocode_staging` and `outpost_api_service_geocode_prod`.

You will need to enable the `Geocode API`, no restrictions are needed.

## 🌎 Running it on the web

### Deploying using heroku (recommended)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

It's suitable for 12-factor hosting like Heroku. It has a [Procfile](https://devcenter.heroku.com/articles/procfile) that will make sure the proper MongoDB indices are set up.

### Deploying using docker

We also provide a Docker image if you would like to host the application in a container

We provide scripts to initialise the database once its been created.

```sh
docker run -it --rm \
--env-file .env \
-e DB_URI=mongodb://outpost:password@host.docker.internal:27018/outpost_api_development \
outpost-api-service:production prepare-collection

docker run -it --rm \
--env-file .env \
-e DB_URI=mongodb://outpost:password@host.docker.internal:27018/outpost_api_development \
outpost-api-service:production prepare-indices

docker run -it --rm \
--env-file .env \
-e DB_URI=mongodb://outpost:password@host.docker.internal:27018/outpost_api_development \
outpost-api-service:production dummy-data
```

```sh
docker build --pull --rm --no-cache --progress plain -f Dockerfile.production -t outpost-api-service:production .

docker run \
-e FORCE_SSL=false \
-e DB_URI=mongodb://outpost:password@host.docker.internal:27018/outpost_api_development \
--env-file .env \
-p 3002:3000 \
--name outpost-api-production \
-d outpost-api-service:production

docker stop outpost-api-production && docker rm outpost-api-production

docker image rm outpost-api-service:production
```

## Indices

It needs the right indices on the MongoDB collection to enable full-text and geo search. Something like:

```
db.indexed_services.createIndex({ name: "text", description: "text" })
db.indexed_services.createIndex({ "locations.coordinates": "2dsphere" })
```

You can create these two, plus an index of taxonomy slugs, automatically with the `npm run prepare-indices` command.

# 🧪 Tests

```sh
npm run test

# or
docker compose exec app npm run test
```
