# Web Synth

A simple synthesizer built with the web audio API.

## Set up

1. `npm install`
2. `node server.js`
3. Navigate to http://localhost:3000

## API

```
GET /api/patches
```

Get all patches from the database

```
POST /api/patches
```

Save a new patch to the database (auth required)

```
GET /api/patch/:id
```

Get a patch from the database using the patch ID

```
PUT /api/patch/:id
```

Update a patch in the database using the patch ID (auth required)

```
DELETE /api/patch/:id
```

Delete a patch from the database using the patch ID (auth required)

## Technologies used

- Lit HTML (templating)
- Polymer 3 (web components syntactic sugar)
- Immutable.js (state management)
- MongoDB (database)
- Mongoose (database modeling)
- Auth0 (authentication)