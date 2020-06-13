# outpost-api-service

This is a simple Node.js app which queries information from a MongoDB collection and publishes it as a read-only public API.

It's not useful by itself — it should be used alongside [Outpost](https://github.com/wearefuturegov/outpost). The API it outputs is consumable by [Scout](https://github.com/wearefuturegov/scout-x).

## Running it locally

You need Node.js, npm and a working MongoDB database available on `localhost:27017`.

```
npm i
npm run create-indices
npm run dev
```

By default it will be on `localhost:4000/api`.

## Running it on the web

It's suitable for 12-factor hosting like Heroku.

```
npm start
```

## API parameters

| Parameter     | Description                                                                                                                                                                        | Example                                    |
|--------  -----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| `taxonomies=` | Only returns services in one or more of the supplied taxonomy names                                                                                                                | `taxonomies=8 to 11&taxonomy=Things to do` |
| `keywords=`   | Find services with a match in the name or description. Also sorts by relevance unless location parameters are also given.                                                          | `keywords=evening gym`                     |
| `location=`   | Provide a string that can be parsed as a location in the UK. Will be geocoded and used to return results by increasing distance from that point. Overrides the keyword sort order. | `location=Aylesbury`                       |
| `lat=&lng=`   | As above, but skip the geocoding step.                                                                                                                                             | `lng=-0.78206&lat=51.612687`               |

## Configuration

It expects a `MONGODB_URI` environment variable. You can supply this with a `.env` file in the root. It will default to `localhost:27017/outpost_development` otherwise.

### Indexes

It needs the right indexes on the MongoDB collection to enable full-text and geo search. Something like:

```
db.indexed_services.createIndex({ "service.name": "text", "service.description": "text" })
db.indexed_services.createIndex({ "location.coordinates": "2dsphere" })
```

You can cr