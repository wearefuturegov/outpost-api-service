# outpost-api-service

This is a simple Node.js app which queries information from a MongoDB collection and publishes it as a read-only public API.

It's not useful by itself — it should be used alongside [Outpost](https://github.com/wearefuturegov/outpost). The API it outputs is consumable by [Scout](https://github.com/wearefuturegov/scout-x).

## Running it locally

You need Node.js, npm and a working MongoDB database available on `localhost:27017`.

```
npm i
npm run dev
```

## Running it on the web

It's suitable for 12-factor hosting like Heroku.

```
npm start
```

## Configuration

It expects a `MONGODB_URI` environment variable. You can supply this with a `.env` file in the root. It will default to `localhost:27017/outpost_development` otherwise.