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

To get up and running quickly with some data use docker compose.

```sh
git clone git@github.com:wearefuturegov/outpost-api-service.git && cd outpost-api-service

# build the image
docker compose build

# run the container
docker compose up -d

# open shell in container
docker compose exec outpost-api-dev /bin/ash;

# run the tests
docker compose exec outpost-api-dev npm run test

# stop the container
docker compose stop
```

If you want to use it in conjunction with a local mongodb database, for example you are using [Outpost](https://github.com/wearefuturegov/outpost/) you could also run it using just docker.

```sh
git clone git@github.com:wearefuturegov/outpost-api-service.git && cd outpost-api-service

# build the image - if using for the first time
docker build --tag outpost-api-dev --target development .

# run the image in local environment
docker run -p 3001:3001 --name outpost-api-dev -v $(pwd):/usr/src/app:cached -i -d outpost-api-dev

# setup indices
docker exec -it outpost-api-dev npm run prepare-indices

# access the site
open http://localhost:3001/api/v1/services

# open shell in container
docker exec -it outpost-api-dev /bin/ash;

# run tests
docker exec -it outpost-api-dev npm run test

# stop the container
docker stop outpost-api-dev

# start again
docker start outpost-api-dev
```

## Deploying it

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

It's suitable for 12-factor hosting like Heroku. It has a [Procfile](https://devcenter.heroku.com/articles/procfile) that will make sure the proper MongoDB indices are set up.

```
npm start
```

You can also deploy via docker compose

```sh
# build the image
docker compose build

# run the container
docker compose up -d
```

and docker

```sh
# build the image
docker build  --tag outpost-api --target production .

# run the container
docker run -p 3001:3001/tcp --name outpost-api -i -d outpost-api
```

## Mongodb container running in docker

```sh
docker run -p 27017:27017/tcp \
--name outpost-api-mongo  \
-e MONGO_INITDB_DATABASE=outpost_api \
--volume outpost-api-mongo-volume:/data/db \
--volume $(pwd)/setup-mongodb-production.js:/docker-entrypoint-initdb.d/mongo-init.js:ro -i -d mongo:6
```

-v $(pwd):/usr/src/app

## Indices

It needs the right indices on the MongoDB collection to enable full-text and geo search. Something like:

```

db.indexed_services.createIndex({ name: "text", description: "text" })
db.indexed_services.createIndex({ "locations.coordinates": "2dsphere" })

```

You can create these two, plus an index of taxonomy slugs, automatically with the `npm run prepare-indices` command.

```

```
