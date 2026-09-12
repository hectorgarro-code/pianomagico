import * as fs from 'fs';
import * as alphaTab from '@coderline/alphatab';

async function test() {
    try {
        const buffer = fs.readFileSync('c:/xampp/htdocs/pianomagicoweb/beatles-blackbird.gp4');
        const settings = new alphaTab.Settings();
        const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(buffer), settings);
        console.log("Track keys:", Object.keys(score.tracks[0]));
        console.log("Staff keys:", Object.keys(score.tracks[0].staves[0]));

        // Find which property is an array and possibly contains bars/measures
        for (let key in score.tracks[0].staves[0]) {
            if (Array.isArray(score.tracks[0].staves[0][key])) {
                console.log("Array in Staff:", key, "length:", score.tracks[0].staves[0][key].length);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
