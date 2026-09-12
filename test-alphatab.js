import * as fs from 'fs';
import * as alphaTab from '@coderline/alphatab';

async function test() {
    try {
        const buffer = fs.readFileSync('c:/xampp/htdocs/pianomagicoweb/beatles-blackbird.gp4');
        const settings = new alphaTab.Settings();
        const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(buffer), settings);

        console.log("Score loaded:", score.title);
        console.log("Tracks:", score.tracks.length);

        const track = score.tracks[0];
        console.log("Track 1 name:", track.name);
        console.log("Measures:", track.staves[0].measures.length);

        // Let's inspect the first measure's beats
        const firstMeasure = track.staves[0].measures[0];
        console.log("First measure beats:", firstMeasure.voices[0].beats.length);

        for (const beat of firstMeasure.voices[0].beats) {
            console.log("  Beat duration:", beat.duration);
            for (const note of beat.notes) {
                console.log(`    Note string: ${note.string}, fret: ${note.fret}`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
