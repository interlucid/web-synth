import { svg } from '../scripts/lit-html/lit-html.js';
import { html, LitElement } from '../scripts/@polymer/lit-element/lit-element.js';
import { fromJS, getIn, setIn, Map } from '../scripts/immutable/dist/immutable.es.js';
import { styles } from '../styles/main.js';

export class LitKeyboard extends LitElement {

    static get properties() {
        return {
            patch: Object,
            context: Object,
            oscillatorNode: Object,
            gainNode: Object,
            biquadFilterNode: Object,
            saveMode: Boolean
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
        this.patch = fromJS({
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
        // todo: dummy fill cancelAndHoldAtTime for other browsers
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
        window.addEventListener('keydown', (e) => {
            this.playNoteWithKeyboard(e);
        })
        window.addEventListener('keyup', (e) => {
            this.stopPlayingWithKeyboard(e);
        })
    }

    // attributeChangedCallback(name, oldValue, newValue) {
    //     console.log('attributeChangedCallback', name, oldValue, newValue);
    // }

    // _propertiesChanged(currentProps, changedProps, oldProps) {
    //     super();
    //     console.log('attributeChangedCallback', currentProps, changedProps, oldProps);
    // }

    playNoteWithMouse(e, note) {
        // only play if the left mouse button is down
        if(e.buttons === 1) this.playNote(e.target.getAttribute('note'));
    }

    playNoteWithKeyboard(e) {
        let note;
        if(keys[e.key] && !keys[e.key].pressed) {
            // set the key to be pressed
            keys[e.key].pressed = true;
            // get the appropriate note
            note = keys[e.key].note;
        }
        // only play a note if it is defined
        if(note) this.playNote(note);
    }

    playNote(note) {
        this.oscillatorNode.frequency.exponentialRampToValueAtTime(noteFrequencies[note], this.context.currentTime + 0.03)
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
        if(keys[e.key]) {
            // clear the key press
            keys[e.key].pressed = false;
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
        return !Object.values(keys).map(key => key.pressed).reduce((acc, cur) => acc || cur);
    }

    computeFilterFreq(log) {
        return Math.pow(2, log / 10).toFixed(0);
    }

    saveToDatabase() {
        fetch('/api/patches', {
            method: 'POST',
            body: JSON.stringify(this.patch),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });
    }
    
    loadFromDatabase() {
        fetch(`/api/patches/${ getIn(this.patch, ['name']) }`)
            .then(async response => {
                this.patch = await response.json();
            });
    }

    keyboardOctave() {
        return html`
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 800 500" stroke-linejoin="round">
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="c" d="M119.9 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="d" d="M205 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="e" d="M290.3 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="f" d="M375.5 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="g" d="M460.6 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="a" d="M545.9 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="b" d="M631 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="white-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="c2" d="M716.4 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>
                <path class="black-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="c#" d="M146 42.6c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>
                <path class="black-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="d#" d="M231.8 42.6c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>
                <path class="black-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="f#" d="M401 42.6c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>
                <path class="black-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="g#" d="M488 42.5c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>
                <path class="black-key" on-mouseover="playNoteWithMouse" on-mousedown="playNoteWithMouse" note="a#" d="M573 42.5c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>
            </svg>
        `;
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
            ${ this.keyboardOctave() }
            <div class="horizontal-container">
                ${ this.amplitudeEnvelope() }
                ${ this.oscillatorType() }
                ${ this.filter() }
            </div>
            <p>Tip: Filter works best with sawtooth oscillators.</p>
            <p>
                <button on-click="${ e => this.saveMode = false }">Load Patch</button>
                <button on-click="${ e => this.saveMode = true }">Save Patch</button>
            </p>
            <h2>${ this.saveMode ? 'Save to' : 'Load from' } database</h2>
            <label>Name: <input type="text" value="${ getIn(this.patch, ['name']) }" on-input="${ e => this.patch = setIn(this.patch, ['name'], e.target.value) }"></label>
            <button on-click="${ e => this.saveMode ? this.saveToDatabase() : this.loadFromDatabase() }">${ this.saveMode ? 'Save' : 'Load' }</button>
        `;
    }

}

customElements.define('lit-keyboard', LitKeyboard);