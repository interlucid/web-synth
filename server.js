const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('json spaces', 2);
app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const mongoURL = 'mongodb://localhost:27017';

// Database Name
const dbName = 'webSynth';
const patchCollection = 'patches';
let db;

// Use connect method to connect to the server
MongoClient.connect(mongoURL, (err, client) => {
  assert.equal(null, err);
  console.log(`Connected successfully to MongoDB on ${ mongoURL }`);

  db = client.db(dbName);
//   db.collection(patchCollection).createIndex( { name: "text" } ).catch(e => console.log(e))

//   client.close();
});

// let patches = [];
// let latestPatchId = 0;

app.get('/api/patches', (req, res) => {
     const patches = db.collection(patchCollection)
        .find({})
        .toArray((err, docs) => {
            res.send(docs);
        })
        // .catch((e) => {
        //     console.log('crap');    
        // })
    // res.send(patches);
});

// simple search
app.get('/api/patches/:query', (req, res) => {
    db.collection(patchCollection)
        .find( { name: new RegExp(req.params.query, 'g') })
        .toArray((e, docs) => {
            res.send(docs.length ? docs[0] : undefined);
        });
});

app.post('/api/patches', async (req, res) => {
    const query = { name: req.body.name };
    const sendResult = async result => {
        db.collection(patchCollection)
            .find(query)
            .toArray((e, docs) => res.send(docs));
    }
    // check if patch exists
    if((await db.collection(patchCollection).find(query).toArray()).length) {
        // if so, update
        db.collection(patchCollection)
            .updateOne(query, { $set: req.body })
            .then(sendResult)
            .catch(e => {
                console.log(`Heh...`, e);
            })
    } else {
        // otherwise, create new patch
        db.collection(patchCollection)
            .insertOne(req.body)
            .then(sendResult)
            .catch(e => {
                console.log(`Heh...`, e);
            })
    }
});

app.get('/api/patch/:id', (req, res) => {
    const index = getPatchIndex(req.params.id, res);
    res.status(200).send(patches[index]);
});

app.put('/api/patch/:id', (req, res) => {
    const index = getPatchIndex(req.params.id, res);
    patches[index] = req.body;
    res.status(200).send(patches[index]);
});

app.delete('/api/patch/:id', (req, res) => {
    const index = getPatchIndex(req.params.id, res);
    patches.splice(index, 1);
    res.send(`Successfully deleted patch ${req.params.id}.`)
});

const findPatch = (query, res) => {
    const patch = patches.find(patch => patch.name.includes(query));
    if(!patch) res.status(404).send(`Found no matching patches`);
    return patch;
}

const getPatchIndex = (id, res) => {
    const index = patches.findIndex(el => el.id == id);
    if(index === -1) res.status(404).send(`Patch ${id} not found.`);
    return index;
}

const port = 3000;

app.listen(port, () => console.log(`Server listening on port ${port}!`));
