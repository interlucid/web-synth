const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('json spaces', 2);
app.use(express.static('public'));

let patches = [];
let latestPatchId = 0;

app.get('/api/patches', (req, res) => {
    res.send(patches);
});

app.post('/api/patches', (req, res) => {
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
    const index = patches.findIndex(el => el.id == req.params.id);
    res.status(404).send(index > -1 ? patches[index] : `Patch ${req.params.id} not found.`);
});

app.delete('/api/patch/:id', (req, res) => {
    const index = patches.findIndex(el => el.id == req.params.id);
    if(index > -1) {
        patches.splice(index, 1);
        res.send(`Successfully delete patch ${req.params.id}.`)
    } else res.status(404).send(`Patch ${req.params.id} not found.`);
});

app.listen(3000, '0.0.0.0', () => console.log('Server listening on port 3000!'));