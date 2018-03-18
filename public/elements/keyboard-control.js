import { svg } from '../scripts/lit-html/lit-html.js';
import { html, LitElement } from '../scripts/@polymer/lit-element/lit-element.js';

let keyboardLength = 8;

const hideBlackKey = (index) => {
    return index % 7 === 2 || index % 7 === 6;
}

const updateKeys = (index) => {
    keyboardLength = index;
    myRender()
}

const theSVGinQuestion = () => {
    return svg`<svg xmlns="http://www.w3.org/2000/svg" width$="${ keyboardLength * 55 }" height="300" viewbox$="0 0 ${ keyboardLength * 90 } 500" stroke-linejoin="round">
                  ${ Array.from(Array(keyboardLength).keys()).map(index => svg`<path class="white-key" onmouseover="playNoteWithMouse(event, 'c')" onmousedown="playNoteWithMouse(event, 'c')" d="M${ 120 + 85 * index } 46.3c0-5.4-4.4-9.8-9.8-9.8l-65.7 0c-5.4 0-9.8 4.4-9.8 9.8l0 409.8c0 5.4 4.4 9.8 9.8 9.8l65.7 0c5.4 0 9.8-4.4 9.8-9.8l0-409.8Z"/>`) }
                  ${ Array.from(Array(keyboardLength - 1).keys()).map(index => hideBlackKey(index) ? '' : svg`<path class="black-key" onmouseover="playNoteWithMouse(event, 'c#')" onmousedown="playNoteWithMouse(event, 'c#')" d="M${ 146 + 85 * index } 42.6c0-3.3-2.7-6-6-6l-40.6 0c-3.3 0-6 2.7-6 6l0 258.1c0 3.3 2.7 6 6 6l40.6 0c3.3 0 6-2.7 6-6l0-258.1Z"/>`) }
              </svg>
              Keyboard length: <input type="range" value="${keyboardLength}" min="1" max="20" oninput="console.log(keyboardLength)">`;
};

export class KeyboardControl extends LitElement {

    render() {
        console.log('render');
        return html`
            <style>
                .white-key {
                    fill:#fff;
                    stroke-width:1px;
                    stroke:#000;
                }
                .black-key {
                    stroke-width:1px;
                    stroke:#000;
                }
            </style>
            <h1>Web Synth!</h1>
            ${ theSVGinQuestion() }
            Keyboard length: <input type="range" value="${keyboardLength}" min="1" max="20" oninput="console.log(keyboardLength)">
        `;
    }

}

customElements.define('keyboard-control', KeyboardControl);