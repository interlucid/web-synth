const changeAttack = (attack) => {
    amplitudeEnvelope.attack = attack / 1000;
};

const changeSustain = (sustain) => {
    amplitudeEnvelope.sustain = sustain;
};

const changeDecay = (decay) => {
    amplitudeEnvelope.decay = decay / 1000;
};

const changeRelease = (release) => {
    amplitudeEnvelope.release = release / 1000;
};
