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

`DATABASE_URL`

- MongoDB connection URI

`GOOGLE_API_KEY`

- Used for geocoding `location=` parameters.
- **Needs the geocoding API enabled.**

Other environmental variables:

`COMPOSE_PROJECT_NAME`

- Groups the docker-compose containers under a nice name

`PROJECT_NAME`

- This is used to name the docker images and containers

---

## Getting started

There are three ways to run the Outpost API locally

1. As an entire project, alongside [Outpost](https://github.com/wearefuturegov/outpost) and [Scout](https://github.com/wearefuturegov/scout-x), please see the [Outpost](https://github.com/wearefuturegov/outpost) documentation.
2. On its own - using docker-compose
3. On its own - using your own machine

### On its own - using docker-compose

- Requires docker quick to setup and run no worrying about node versions

```sh
# checkout the code
git clone \
git@github.com:wearefuturegov/outpost-api-service.git \
&& cd outpost-api-service

# build the image
make build

# start the containers
make start

# (if this is your first time installing - prepare the db)
make prepare_db

# outpost api is running on http://localhost:3001
```

To change the port edit the ports in docker-compose file to portyouwant:3001, then run `make stop && make build && make start`

### On its own - using your own machine

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

Build the image and push to container repository

```sh
# Build it locally
docker build --no-cache --tag outpost-api:production --target production .

# Build it ready to push to dockerhub
docker build --no-cache --tag apricot13/outpost-api:production --target production .
docker push apricot13/outpost-api:production
```

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

It's suitable for 12-factor hosting like Heroku. It has a [Procfile](https://devcenter.heroku.com/articles/procfile) that will make sure the proper MongoDB indices are set up.

```
npm start
```

## Indices

It needs the right indices on the MongoDB collection to enable full-text and geo search. Something like:

```
db.indexed_services.createIndex({ name: "text", description: "text" })
db.indexed_services.createIndex({ "locations.coordinates": "2dsphere" })
```

You can create these two, plus an index of taxonomy slugs, automatically with the `npm run prepare-indices` command.
