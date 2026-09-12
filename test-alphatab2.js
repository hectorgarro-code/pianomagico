import * as fs from 'fs';
import * as alphaTab from '@coderline/alphatab';

async function test() {
    try {
        const buffer = fs.readFileSync('c:/xampp/htdocs/pianomagicoweb/beatles-blackbird.gp4');
        const settings = new alphaTab.Settings();
        const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(buffer), settings);
        console.log(Object.keys(score));
        console.log(Object.keys(alphaTab.importer));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
