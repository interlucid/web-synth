const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('json spaces', 2);
app.use(express.static('public'));
app.use('/bower_scripts', express.static(__dirname + '/bower_components/'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

let patches = [];
let latestPatchId = 0;

app.get('/api/patches', (req, res) => {
    res.send(patches);
});

// simple search
app.get('/api/patches/:query', (req, res) => {
    const patch = findPatch(req.params.query, res)
    res.send(patch);
});

app.post('/api/patches', (req, res) => {
    const existingPatch = patches.find(patch => { 
        return patch.name.toLowerCase() === req.body.name.toLowerCase();
    });
    if(existingPatch) {
        const index = getPatchIndex(existingPatch.id, res);
        patches[index] = {
            ...req.body,
            id: patches[index].id
        };
        res.send(existingPatch)
        return;
    }
    // create new patch
    latestPatchId += 1;
    const patch = {
        ...req.body,
        id: latestPatchId
    }
    // add to patches array
    patches.push(patch)
    // send new patch
    res.send(patch);
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
