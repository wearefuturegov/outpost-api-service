# outpost-api-service

This is a simple node.js app which queries information from a mongodb table and publishes it as a read-only public API.

## Running it locally

You need node.js, npm and a working mongodb database available on `localhost:27017`.

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