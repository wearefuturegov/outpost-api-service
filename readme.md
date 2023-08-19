<p align="center">
    <a href="https://outpost-platform.wearefuturegov.com/">
        <img src="logo-icon-outpost-api-main.png?raw=true" width="350px" />               
    </a>
</p>
  
<p align="center">
    <em>Service directories done right</em>         
</p>

---

<p align="center">
   <img src="screenshot-outpost-api-output.png?raw=true" width="750px" />     
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

- MongoDB connection URI nb if you're running in a docker container and want to connect to your local db use `host.docker.internal` instead of `localhost`

`GOOGLE_API_KEY`

- Used for geocoding `location=` parameters.
- **Needs the geocoding API enabled.**

Other environmental variables:

`COMPOSE_PROJECT_NAME`

- This is used to name the docker images and containers

---

## 💻 Getting started

### Using docker

```sh
git clone git@github.com:wearefuturegov/outpost-api-service.git && cd outpost-api-service

# build the image - if using for the first time
docker build --tag outpost-api-service:development --target development .

# run the image in local environment
docker run -p 3001:3001 --name outpost-api-service -v $(pwd):/app:cached -i -d outpost-api-service:development

# setup indices
docker exec -it outpost-api-service npm run prepare-indices

# access the site
open http://localhost:3001/api/v1/services

# open shell in container
docker exec -it outpost-api-service /bin/ash;

# run tests
docker exec -it outpost-api-service npm run test

# stop the container
docker stop outpost-api-service

# start again
docker start outpost-api-service
```

### Using docker-compose

```sh
git clone git@github.com:wearefuturegov/outpost-api-service.git && cd outpost-api-service

# build the image
docker compose -f docker-compose.development.yml build

# run the container
docker compose -f docker-compose.development.yml up -d

# setup indices
docker compose -f docker-compose.development.yml exec outpost-api npm run prepare-indices;

# open shell in container
docker compose -f docker-compose.development.yml exec outpost-api /bin/ash;

# run tests
docker compose -f docker-compose.development.yml exec outpost-api npm run test

# stop the container
docker compose -f docker-compose.development.yml stop

```

### On your machine

To run it on your machine you need Node.js, npm, nvm (https://github.com/nvm-sh/nvm) and a working MongoDB database [with the right indices](#indices) available on `localhost:27017`.

```
# use the right node version
nvm use

# install npm packages
npm i

# if this is your first time installing it prepare the database
npm run prepare-indices

# start the local development server
npm run dev

# outpost api is running on http://localhost:3001
```

## Deploying it

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

It's suitable for 12-factor hosting like Heroku. It has a [Procfile](https://devcenter.heroku.com/articles/procfile) that will make sure the proper MongoDB indices are set up.

```
npm start
```

You can also deploy via docker

```sh
# build the image
docker compose build

# run the container
docker compose up -d
```

## Indices

It needs the right indices on the MongoDB collection to enable full-text and geo search. Something like:

```
db.indexed_services.createIndex({ name: "text", description: "text" })
db.indexed_services.createIndex({ "locations.coordinates": "2dsphere" })
```

You can create these two, plus an index of taxonomy slugs, automatically with the `npm run prepare-indices` command.
