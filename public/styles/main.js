import { html } from '../scripts/lit-html/lit-html.js';

export const styles = html`
    <style>

        :host {
            display: block;
            padding: 2em;
            --primary: #e6730f;
        }

        .white-key {
            fill:#fff;
            stroke-width:1px;
            stroke:#000;
        }

        .black-key {
            stroke-width:1px;
            stroke:#000;
        }

        .horizontal-container {
            display: flex;
        }

        .horizontal-container > * + * {
            margin-left: 2em;
        }

        .sliders {
            min-width: 30%;
        }

        .sliders label {
            display: flex;
            justify-content: space-between;
        }

        .sliders label > * {
            flex-basis: 50%;
        }

        button,
        input,
        textarea {
            -webkit-appearance: none;
            background: transparent;
            border: solid #BBB .1em;
            border-radius: .3em;
            padding: .5em;
            outline: none;
            font-size: 1em;
        }

        input:focus,
        textarea:focus,
        button:focus {
            border-color: #000;
        }

        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 1.4em;
            width: 1.4em;
            margin-top: -.4em;
            border-radius: 5em;
            background: #333;
        }

        input[type=range]::-moz-range-thumb {
            height: 1.4em;
            width: 1.4em;
            margin-top: -.4em;
            border-radius: 5em;
            background: #333;
        }

        input[type=range]::-webkit-slider-runnable-track {
            height: .5em;
            margin: .7em .3em;
            border-radius: 5em;
            background: var(--primary);
        }

        input[type=range]::-moz-range-track {
            height: .5em;
            width: 100%;
            margin: .7em .3em;
            border-radius: 5em;
            background: var(--primary);
        }

        button {
            border: solid #bbb .05em;
            border-radius: .3em;
            padding: .5em;
            cursor: pointer;
            
        }

        .active,
        button:hover {
            background-color: var(--primary);
            color: white;
        }
    </style>
`