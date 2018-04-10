import { svg } from '../scripts/lit-html/lit-html.js';
import { html, LitElement } from '../scripts/@polymer/lit-element/lit-element.js';
import { fromJS, getIn, setIn, Map } from '../scripts/immutable/dist/immutable.es.js';
import { styles } from '../styles/main.js';
import * as lib from '../lib/notes.js';
import * as auth from '../lib/auth.js';

const statusEnum = {
    ERROR: -1,
    DEFAULT: 0,
    SUCCESS: 1,
    LOADING: 2
}

export class LitKeyboard extends LitElement {

    static get properties() {
        return {
            defaultPatch: Object,
            patch: Object,
            patches: Array,
            profile: Object,
            context: Object,
            oscillatorNode: Object,
            gainNode: Object,
            biquadFilterNode: Object,
            saveMode: Boolean,
            status: Object
        }
    }

    set patch(patch) {
        // set my special hidden variable
        this._patch = patch;
        // have to invalidate manually
        this.invalidate();
        // assuming if there's a context, everything else is defined
        if(this.context) {
            this.oscillatorNode.type = getIn(patch, ['waveType']);
            this.biquadFilterNode.frequency.setValueAtTime(this.computeFilterFreq(getIn(patch, ['filterFreqLog'])), this.context.currentTime);
        }
        // console.log(this.oscillatorNode)
    }

    get patch() {
        return this._patch;
    }

    constructor() {
        super();
        this.defaultPatch = fromJS({
            name,
            ampEnv: {
                attack: 0.1,
                sustain: 0.8,
                decay: 0.3,
                release: 0.7
            },
            waveType: 'sawtooth',
            filterFreqLog: 84
        });
        this.patch = this.defaultPatch;
        this.profile = fromJS({});
        // set up this.context and oscillator
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillatorNode = this.context.createOscillator();
        this.gainNode = this.context.createGain();
        this.biquadFilterNode = this.context.createBiquadFilter();
        this.oscillatorNode.connect(this.biquadFilterNode);
        this.biquadFilterNode.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);
        // start at a very low volume to simulate no sound (and eliminate pop)
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime);
        this.oscillatorNode.start();
        // add some listeners for controlling how notes will play
        window.addEventListener('keydown', (e) => {
            this.playNoteWithKeyboard(e);
        })
        window.addEventListener('keyup', (e) => {
            this.stopPlayingWithKeyboard(e);
        })
        window.addEventListener('mouseup', (e) => {
            this.stopPlaying(e);
        })
        // set up authentication
        auth.handleAuthentication(this);
        auth.getProfile(this);
    }

    updateProfile(profile) {
        this.profile = fromJS(profile);
        this.getUserPatches();
        this.invalidate();
    }

    authCallback() {
        auth.getProfile(this);
    }

    playNoteWithMouse(e, note) {
        // only play if the left mouse button is down
        if(e.buttons === 1) this.playNote(note);
    }

    playNoteWithKeyboard(e) {
        let note;
        if(     lib.keys[e.key] 
            &&  !lib.keys[e.key].pressed
            // don't play when a text field is in focus
            &&  !(  this.shadowRoot.activeElement
                &&  this.shadowRoot.activeElement.getAttribute('type') === 'text')
        ) {
            // set the key to be pressed
            lib.keys[e.key].pressed = true;
            // get the appropriate note
            note = lib.keys[e.key].note;
        }
        // only play a note if it is defined
        if(note) this.playNote(note);
    }

    playNote(note) {
        this.oscillatorNode.frequency.exponentialRampToValueAtTime(lib.noteFrequencies[note], this.context.currentTime + 0.03)
        // cancel previous ramp
        this.gainNode.gain.cancelAndHoldAtTime(this.context.currentTime);
        // reset gain to 0
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.03);
        // ramp up for attack amount of time
        // console.log(this.patch, getIn(this.patch, ['ampEnv', 'attack']))
        this.gainNode.gain.exponentialRampToValueAtTime(1, this.context.currentTime + parseFloat(getIn(this.patch, ['ampEnv', 'attack'])));
        // gainNode.gain.setValueAtTime(1, this.context.currentTime + this.patch.attack);
        // ramp down to sustain level for decay amount of time
        this.gainNode.gain.exponentialRampToValueAtTime(getIn(this.patch, ['ampEnv', 'sustain']), parseFloat(this.context.currentTime) + parseFloat(getIn(this.patch, ['ampEnv', 'decay'])));
    }
    

    stopPlayingWithKeyboard(e) {
        if(lib.keys[e.key]) {
            // clear the key press
            lib.keys[e.key].pressed = false;
            // if all the keys are pressed, stop playing
            if(this.areAllKeysPressed()) this.stopPlaying();
        }
    }

    stopPlaying() {
        this.gainNode.gain.cancelAndHoldAtTime(this.context.currentTime);
        // ramp down for release amount of time
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + parseFloat(getIn(this.patch, ['ampEnv', 'release'])));
    }

    areAllKeysPressed() {
        return !Object.values(lib.keys).map(key => key.pressed).reduce((acc, cur) => acc || cur);
    }

    computeFilterFreq(log) {
        return Math.pow(2, log / 10).toFixed(0);
    }

    // create a new headers object for requests
    authHeaders() {
        return new Headers({
            'Authorization': `Bearer ${ localStorage.getItem('access_token') }`,
            'Content-Type': 'application/json'
        });
    }

    // post if no ID, put with ID otherwise
    saveToDatabase() {
        this.status = statusEnum.LOADING;
        if(!getIn(this.patch, ['_id'])) {
            const myObj = 
            fetch('/api/patches', {
                method: 'POST',
                // use Object.assign until object literal spread is implemented cross-browser
                body: JSON.stringify(Object.assign({
                    userID: getIn(this.profile, ['sub'])
                }, this.patch.toJS())),
                headers: this.authHeaders()
            }).then(async response => {
                this.status = statusEnum.SUCCESS;
                // set the response (which has the newly created object ID) as the patch
                this.patch = fromJS(await response.json());
                // get latest set of patches for this user
                auth.getProfile(this);
            }).catch(error => {
                this.status = statusEnum.ERROR;
                console.log(error)
            });
        } else {
            fetch(`/api/patch/${ getIn(this.patch, ['_id']) }`, {
                method: 'PUT',
                body: JSON.stringify(this.patch.toJS()),
                headers: this.authHeaders()
            }).then(async response => {
                this.status = statusEnum.SUCCESS;
                // get latest set of patches for this user
                auth.getProfile(this);
            }).catch(error => {
                this.status = statusEnum.ERROR;
            });
        }
        // console.log(this.profile.toJS());
        window.setTimeout(() => {
            this.status = statusEnum.DEFAULT;
        }, 3000)
    }

    // get the patches associated with the current user
    getUserPatches() {
        const userID = getIn(this.profile, ['sub']);
        if(!userID) {
            this.patches = [];
            return;
        }
        fetch(`/api/user/${ userID }`, {
            headers: this.authHeaders()
        }).then(async res => {
            if(res.status >= 400) throw res.statusText;
            this.patches = fromJS(await res.json())
        }).catch(e => {
            console.log('Error', e)
        });
    }
    
    loadFromDatabase() {
        this.status = statusEnum.LOADING;
        fetch(`/api/patches/${ getIn(this.patch, ['name']) }`)
            .then(async response => {
                this.patch = fromJS(await response.json()) || this.patch;
                this.status = statusEnum.SUCCESS;
        }).catch(error => {
            this.status = statusEnum.ERROR;
        });
        window.setTimeout(() => {
            this.status = statusEnum.DEFAULT;
        }, 3000)
    }

    getStatus(status) {
        switch(status) {
            case statusEnum.ERROR:
                return 'Error';
            case statusEnum.DEFAULT:
                return '';
            case statusEnum.LOADING:
                return 'Loading...';
            case statusEnum.SUCCESS:
                return 'Success';
        }
    }

    keyboardOctave() {
        const keyboardLength = 7;

        const hideBlackKey = (index) => {
            return index % 7 === 2 || index % 7 === 6;
        }

        const whiteKeys = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'c2'];
        const blackKeys = ['c#', 'd#', '', 'f#', 'g#', 'a#', '', 'c#2'];

        return html`
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 800 500" stroke-linejoin="round">
                ${ Array.from(Array(keyboardLength + 1).keys()).map(index => svg`
                    <path class="white-key" on-mouseover="${ e => this.playNoteWithMouse(e, whiteKeys[index]) }" on-mousedown="${ e => this.playNoteWithMouse(e, whiteKeys[index]) }" d$="M${120 + 85 * index} 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                `) }
                ${ Array.from(Array(keyboardLength).keys()).map(index => hideBlackKey(index) ? '' : svg`
                    <path class="black-key" on-mouseover="${ e => this.playNoteWithMouse(e, blackKeys[index]) }" on-mousedown="${ e => this.playNoteWithMouse(e, blackKeys[index]) }" d$="M${146 + 85 * index} 42.6c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>
                `) }
            </svg>
        `;
    }

    user() {
        return html`
            <style>
                #patches {
                    width: 300px;
                    max-height: 200px;
                }
            </style>
            <div class="vertical-container">
            ${  !auth.isAuthenticated()
                ? html`<button on-click="${ e => auth.login(this) }">Log in</button>`
                : html`
                    <p>Logged in as ${ getIn(this.profile, ['name']) }.  <button on-click="${ e => auth.logout(this) }">Log out</button></p>
                    <div id="patches" class="options">
                        ${ !this.patches ? '' : this.patches.map(patch => html`<button on-click="${ e => this.patch = patch }">${ getIn(patch, ['name']) }</button>`) }
                    </div>
                    <button on-click="${ e => this.patch = this.defaultPatch }">New Patch...</button>
                    <div>
                        <h2>Save to database</h2>
                        <label>Name: <input type="text" value="${ getIn(this.patch, ['name']) }" on-input="${ e => this.patch = setIn(this.patch, ['name'], e.target.value) }"></label>
                        <button hidden?="${ !getIn(this.patch, ['name']) }" on-click="${ e => this.saveToDatabase() }">Save</button>
                        <p>${ this.getStatus(this.status) }</p>
                    </div>
                `
            }
            </div>
        `
    }

    amplitudeEnvelope() {
        const items = [
            {
                label: 'Attack',
                unit: 's'
            },
            {
                label: 'Sustain',
                max: 1
            },
            {
                label: 'Decay',
                unit: 's'
            },
            {
                label: 'Release',
                unit: 's'
            }
        ];

        return html `
            <div id="amplitude-envelope" class="sliders">
                <h2>Amplitude Envelope</h2>
                ${ items.map(item => html`
                    <label>
                        <span>${ item.label }: ${ getIn(this.patch, ['ampEnv', item.label.toLowerCase()]) } ${ item.unit || '' }</span>
                        <input type="range" min="0.03" max="${ item.max || 2 }" step="0.001" value="${ getIn(this.patch, ['ampEnv', item.label.toLowerCase()]) }" on-input="${ e => this.patch = setIn(this.patch, ['ampEnv', item.label.toLowerCase()], e.target.value) }">
                    </label>
                `) }
            </div>
        `;
    }

    oscillatorType() {
        const items = [
            'Sine',
            'Square',
            'Sawtooth',
            'Triangle'
        ];

        return html`
            <div id="oscillator-type">
                <h2>Type: ${ getIn(this.patch, ['waveType']) }</h2>
                ${ items.map(item => html`
                    <button class$="${ getIn(this.patch, ['waveType']) === item.toLowerCase() ? 'active' : 'as' }" on-click="${ e => this.patch = setIn(this.patch, ['waveType'], item.toLowerCase()) }">${ item }</button>
                `) }
            </div>
        `;
    }

    filter() {
        return html`
            <div id="filter" class="sliders">
                <h2>Filter</h2>
                <label><span>Frequency: ${ this.computeFilterFreq(getIn(this.patch, ['filterFreqLog'])) } Hz</span> <input type="range" min="33" max="140" value="${ getIn(this.patch, ['filterFreqLog']) }" on-input="${ e => this.patch = setIn(this.patch, ['filterFreqLog'], e.target.value) }"></label>
            </div>
        `
    }

    render() {
        return html`
            ${ styles }
            ${ this.user() }
            ${ this.keyboardOctave() }
            <div class="horizontal-container">
                ${ this.amplitudeEnvelope() }
                ${ this.oscillatorType() }
                ${ this.filter() }
            </div>
            <p>Tip: Filter works best with sawtooth oscillators.</p>
        `;
    }

}

customElements.define('lit-keyboard', LitKeyboard);