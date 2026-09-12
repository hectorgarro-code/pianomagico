import * as fs from 'fs';
import * as alphaTab from '@coderline/alphatab';

async function test() {
    try {
        const buffer = fs.readFileSync('c:/xampp/htdocs/pianomagicoweb/beatles-blackbird.gp4');
        const settings = new alphaTab.Settings();
        const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(buffer), settings);
        console.log("Bar keys:", Object.keys(score.tracks[0].staves[0].bars[0]));

        const bar = score.tracks[0].staves[0].bars[0];
        console.log("Does bar have voices?", !!bar.voices);
        if (bar.voices) {
            console.log("Voice keys:", Object.keys(bar.voices[0]));
            console.log("Does voice have beats?", !!bar.voices[0].beats);
            if (bar.voices[0].beats) {
                console.log("Beat keys:", Object.keys(bar.voices[0].beats[0]));
                console.log("Does beat have notes?", !!bar.voices[0].beats[0].notes);
                if (bar.voices[0].beats[0].notes) {
                    console.log("Note keys:", Object.keys(bar.voices[0].beats[0].notes[0]));
                    console.log("Note string/fret:", bar.voices[0].beats[0].notes[0].string, bar.voices[0].beats[0].notes[0].fret);
                }
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
