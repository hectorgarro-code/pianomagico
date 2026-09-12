import * as fs from 'fs';
import * as alphaTab from '@coderline/alphatab';

async function test() {
    try {
        const buffer = fs.readFileSync('c:/xampp/htdocs/pianomagicoweb/beatles-blackbird.gp4');
        const settings = new alphaTab.Settings();
        const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(buffer), settings);
        console.log('Score Tracks:', score.tracks.length);
        const track = score.tracks[0];
        console.log('Track Measures (if any):', !!track.measures);
        console.log('Track Staves:', track.staves ? track.staves.length : 0);

        let measures;
        if (track.measures) measures = track.measures;
        else if (track.staves && track.staves.length > 0 && track.staves[0].measures) measures = track.staves[0].measures;

        if (!measures) {
            // Check masterbars
            if (score.masterBars) {
                console.log('Using masterBars length:', score.masterBars.length);
                // Can we get track measures from masterBars?
            }
        }

        if (measures && measures.length > 0) {
            console.log('Measures found:', measures.length);
            const measure = measures[0];
            console.log('Measure keys:', Object.keys(measure));
            if (measure.voices) {
                const voice = measure.voices[0];
                console.log('Voice keys:', Object.keys(voice));
                if (voice.beats) {
                    const beat = voice.beats[0];
                    console.log('Beat keys:', Object.keys(beat));
                    if (beat.notes) {
                        const note = beat.notes[0];
                        console.log('Note keys:', Object.keys(note));
                        console.log('Note string, fret:', note.string, note.fret);
                    }
                }
            }
        } else {
            console.log("Track keys:", Object.keys(track));
            // Check alphaTab API 1.3
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
