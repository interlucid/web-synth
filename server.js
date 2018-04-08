const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const mongoose = require('mongoose');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('json spaces', 2);
app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

// DATABASE SETUP

mongoose.connect('mongodb://localhost:27017/webSynth');
const db = mongoose.connection;

const patchSchema = mongoose.Schema({
    name: String,
    ampEnv: Object,
    waveType: String,
    filterFreqLog: Number,
    userID: String
});

const Patch = mongoose.model('Patch', patchSchema, 'patches');

db.on('error', console.error.bind(console, 'connection error:'));

// AUTHORIZATION MIDDLEWARE

const loginCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://interlucid.auth0.com/.well-known/jwks.json"
    }),
    audience: '/api',
    issuer: "https://interlucid.auth0.com/",
    algorithms: ['RS256']
});

// ENDPOINTS

const router = express.Router();

// TODO: add login check to post
// TODO: prevent any user from posting using another user's ID
router.route('/patches')
    .get((req, res) => {
        Patch.find((e, patches) => {
            if(e) res.send(e);
            else res.json(patches);
        })
    })
    .post((req, res) => {
        const patch = new Patch(req.body);
        patch.save(e => {
            if(e) res.send(e);
        })
        res.json(patch);
    })

// TODO: add login check for put and delete
// TODO: prevent any user from putting or deleting another user's patches
router.route('/patch/:id')
    .get((req, res) => {
        Patch.findById(req.params.id, (e, patch) => {
            if(e) res.send(e);
            else res.json(patch);
        });
    })
    .put((req, res) => {
        Patch.findByIdAndUpdate(req.params.id, req.body, { new: true }, (e, patch) => {
            if(e) res.send(e);
            else res.json(patch);
        });
    })
    .delete((req, res) => {
        Patch.findByIdAndRemove(req.params.id, (e, patch) => {
            if(e) res.send(e);
            else if(patch === null) res.send('Nothing to delete');
            else res.send(`Successfully deleted patch with ID ${req.params.id}`);
        })
    })

// get info for the current user (currently, just patches)
router.route('/user/:id')
    .get((req, res) => {
        Patch.find({ userID: req.params.id }, (e, patches) => {
            if(e) res.send(e);
            else res.json(patches);
        })
    })

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

// all of our routes will be prefixed with /api
app.use('/api', router);

const port = 3000;

app.listen(port, () => console.log(`Server listening on port ${port}!`));
