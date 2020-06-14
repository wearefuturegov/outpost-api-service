# outpost-api-service

This is a simple Node.js app which queries information from a MongoDB collection and publishes it as a read-only public API.

It's not useful by itself — it should be used alongside [Outpost](https://github.com/wearefuturegov/outpost). The API it outputs is consumable by [Scout](https://github.com/wearefuturegov/scout-x).

## Running it locally

You need Node.js, npm and a working MongoDB database [with the right indices](#indexes) available on `localhost:27017`.

```
npm i
npm run dev
```

By default it will be on `localhost:4000/api/v1`.

## Running it on the web

It's suitable for 12-factor hosting like Heroku.

```
npm start
```

## API parameters

The `/services` endpoint supports the following query parameters: 

| Parameter                                | Description                                                                                                                                                                        | Example                                    |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| `taxonomies=`                            | Only returns services in one or more of the supplied taxonomy names.                                                                                                               | `taxonomies=8 to 11&taxonomy=Things to do` |
| `keywords=`                              | Find services with a match in the name or description. Also sorts by relevance unless location parameters are also given.                                                          | `keywords=evening gym`                     |
| `location=`, `postcode=` or `coverage=`  | Provide a string that can be parsed as a location in the UK. Will be geocoded and used to return results by increasing distance from that point. Overrides the keyword sort order. | `location=Aylesbury`                       |
| `lat=` and `lng=`                        | As above, but skip the geocoding step.                                                                                                                                             | `lng=-0.78206&lat=51.612687`               |

## Configuration

It expects a few environment variables.

- `MONGODB_URI` overrides the default `localhost:27017/outpost_development` MongoDB connection URI.
- `GOOGLE_API_KEY` used for geocoding from `location=` parameters. Needs the geocoding API enabled.

### Indexes

It needs the right indexes on the MongoDB collection to enable full-text and geo search. Something like:

```
db.indexed_services.createIndex({ "service.name": "text", "service.description": "text" })
db.indexed_services.createIndex({ "location.coordinates": "2dsphere" })
```

You can create them automatically with the `npm run prepare-indices` command.