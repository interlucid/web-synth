import { html } from '../scripts/lit-html/lit-html.js';

export const styles = html`
    <style>

        :host {
            --primary-values: 230, 115, 15;
            --primary: rgb(var(--primary-values));
        }
        
        :root {
            --primary-values: 230, 115, 15;
            --primary: rgb(var(--primary-values));
        }

        .white-key {
            fill: #fff;
            stroke-width: 1px;
            stroke: #000;
        }

        .black-key {
            stroke-width: 1px;
            stroke: #000;
        }

        .white-key:hover,
        .black-key:hover,
        .active-key {
            stroke-width: 5px;
            stroke: var(--primary);
        }

        .horizontal-container {
            display: flex;
        }

        .horizontal-container > * + * {
            margin-left: 2em;
        }

        .vertical-container > * + * {
            margin-top: 2em;
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

        .options {
            overflow: scroll;
            border: solid rgba(var(--primary-values), .5) .1em;
            border-radius: .3em;
        }

        .options > * {
            display: block;
            border: none;
            border-radius: 0;
            width: 100%;
        }

        .options > * + * {
            border-top: solid rgba(var(--primary-values), .5) .1em;
        }

        button,
        input,
        textarea {
            -webkit-appearance: none;
            background: transparent;
            border: solid rgba(var(--primary-values), .5) .1em;
            border-radius: .3em;
            padding: .5em;
            outline: none;
            font-size: 1em;
        }

        button:focus,
        input:focus,
        textarea:focus {
            border-color: #000;
        }

        .active,
        button:hover {
            background-color: var(--primary);
            border-color: rgba(0, 0, 0, 0);
            color: white;
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
        
    </style>
`;