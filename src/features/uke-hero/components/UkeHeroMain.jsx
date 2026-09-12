import React, { useState, useRef, useEffect } from 'react';
import { useUkeStore } from '../store/useUkeStore';
import FocusToggle from './FocusToggle';
import SpatialTablature from './SpatialTablature';
import { Home, ShoppingBag, GraduationCap, Play, Square, ChevronLeft } from 'lucide-react';
import { audioEngine } from '../services/AudioEngine';
import { evaluatePerformance } from '../services/TutorLogic';

export default function UkeHeroMain({ onExit, currentSong, tempoFactor, onNoteHit, onLevelComplete, onTimelineRewind }) {
    const { focusMode, currentNarrative, score, errorCount, tempoBpm, setCurrentNarrative, lastManualHit } = useUkeStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [notes, setNotes] = useState([]);
    const [tutorMessage, setTutorMessage] = useState(null);
    const animationRef = useRef(null);
    const lastTimeRef = useRef(0);
    const isPlayingRef = useRef(false);

    const startGame = async () => {
        await audioEngine.start();

        audioEngine.onPitchDetected = (stringId, rawPitch) => {
            if (!isPlaying) return;
            handlePitchHit(stringId);
        };

        setIsPlaying(true);
        isPlayingRef.current = true;
        lastTimeRef.current = performance.now();

        // Parsea la secuencia dinámica de la canción actual
        const newNotes = [];
        let accumulatedTimeMs = 3000; // 3 secs lead
        const speedVal = currentSong?.speed || 800;
        const baseInterval = speedVal > 300 ? speedVal : (60000 / speedVal);
        const interval = baseInterval / (tempoFactor || 1);

        if (currentSong?.sequence) {
            currentSong.sequence.forEach(token => {
                const parts = token.split(':');
                const chords = parts[0].split('+');
                const dur = parts.length > 1 ? parseFloat(parts[1]) : 1;

                if (!parts[0].startsWith('R')) {
                    chords.forEach((chordPart, idx) => {
                        const [stringId, fret, finger] = chordPart.split('-');
                        if (stringId && fret) {
                            newNotes.push({
                                id: Math.random().toString(),
                                stringId: stringId,
                                fret: fret,
                                finger: finger || '0',
                                hitTime: accumulatedTimeMs,
                                duration: dur * interval > 400 ? dur * interval : 0,
                                hit: false,
                                missed: false,
                            });
                        }
                    });
                }
                accumulatedTimeMs += (dur * interval);
            });
        }

        setNotes(newNotes.length > 0 ? newNotes : [
            { id: '1', stringId: '1', hitTime: 3000, duration: 0, hit: false, missed: false, narrative: 'Casa' }
        ]);

        loop(performance.now());
    };

    // Escuchar toques manuales desde el mástil inferior en UkeHero.jsx
    useEffect(() => {
        if (isPlaying && lastManualHit) {
            handlePitchHit(lastManualHit.note);
        }
    }, [lastManualHit]);

    const handlePitchHit = (stringId) => {
        if (!isPlaying) return;

        // Obtain exact state ref without waiting for React batching cycle
        setCurrentTime((exactCurrentTime) => {
            const TOLERANCE = 300; // Adjusted tolerance for visual sync and musical feel

            setNotes(prev => {
                let closestIdx = -1;
                let minDiff = Infinity;

                // Find the closest valid note to the hit time
                prev.forEach((note, index) => {
                    if (!note.hit && !note.missed && note.stringId === stringId) {
                        const timeDiff = Math.abs(note.hitTime - exactCurrentTime);
                        if (timeDiff <= TOLERANCE && timeDiff < minDiff) {
                            closestIdx = index;
                            minDiff = timeDiff;
                        }
                    }
                });

                if (closestIdx !== -1) {
                    const updated = [...prev];
                    updated[closestIdx] = { ...updated[closestIdx], hit: true };

                    setTimeout(() => {
                        useUkeStore.getState().addScore(100);
                        if (onNoteHit) onNoteHit();
                    }, 0);
                    return updated;
                }

                return prev;
            });
            return exactCurrentTime;
        });
    };

    const stopGame = () => {
        audioEngine.stop();
        audioEngine.onPitchDetected = null;
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setCurrentTime(0);
    };

    const loop = (now) => {
        if (!isPlayingRef.current) return;
        if (!lastTimeRef.current) { lastTimeRef.current = now; }
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;

        setCurrentTime((exactCurrentTime) => {
            const currentTempo = currentSong?.speed || useUkeStore.getState().tempoBpm;
            const currentTempoBpm = currentTempo > 300 ? (60000 / currentTempo) : currentTempo;
            const timeToAdd = delta * (currentTempoBpm / 60) * (tempoFactor || 1);
            let nextTime = exactCurrentTime + timeToAdd;

            // Usamos un ref auxiliar para asegurar sync entre lógica de tiempo y notas
            // o lo hacemos iterando las notas de manera predecible.
            // setNotes actualizará la pantalla.
            let rewindTime = null;

            setNotes(currentNotes => {
                let errorAdded = false;
                let updated = currentNotes.map(n => {
                    // MISS DETECTION
                    if (!n.hit && !n.missed && nextTime > n.hitTime + 300) {
                        errorAdded = true;
                        return { ...n, missed: true };
                    }
                    return n;
                });

                if (errorAdded) {
                    const evalResult = evaluatePerformance();

                    setTimeout(() => {
                        useUkeStore.getState().addError();
                        if (evalResult.action === 'loop_and_slow') {
                            setTutorMessage(evalResult.message);
                            setTimeout(() => setTutorMessage(null), 3000);
                        }
                    }, 0);

                    if (evalResult.action === 'loop_and_slow') {
                        // We must rewind time! We store it to return it later
                        rewindTime = Math.max(0, nextTime - 4000);

                        // Reset notes that are in the rewound timeframe
                        updated = updated.map(n => {
                            if (n.hitTime >= rewindTime) {
                                return { ...n, hit: false, missed: false };
                            }
                            return n;
                        });

                        if (onTimelineRewind) {
                            const pastNotesCount = updated.filter(n => n.hitTime < rewindTime).length;
                            setTimeout(() => onTimelineRewind(pastNotesCount), 0);
                        }
                    }
                }

                // Check level complete
                if (updated.length > 0 && !rewindTime) {
                    const lastNoteTime = Math.max(...updated.map(n => n.hitTime));
                    if (nextTime > lastNoteTime + 2000) {
                        setTimeout(() => {
                            stopGame();
                            if (onLevelComplete) onLevelComplete();
                        }, 0);
                    }
                }

                return updated;
            });

            // The state updater function inside setCurrentTime executes immediately,
            // so if rewindTime was set, we return it to jump the timeline clock back!
            if (rewindTime !== null) {
                return rewindTime;
            }

            return nextTime;
        });

        animationRef.current = requestAnimationFrame(loop);
    };



    return (
        <div className={`flex-1 h-full overflow-hidden w-full flex flex-col items-center justify-start p-4 md:p-8 font-sans transition-colors duration-700 select-none ${focusMode ? 'bg-amber-950 text-amber-200/50' : 'bg-gradient-to-br from-amber-900 via-yellow-950 to-amber-950 text-white'}`}>

            {/* Header / Nav */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-6 px-4">
                <button onClick={onExit} className={`p-4 hover:scale-105 active:scale-95 rounded-2xl transition-all shadow-md border-2 ${focusMode ? 'bg-amber-900 border-amber-800' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <ChevronLeft size={32} className="text-white" />
                </button>
                <div className="flex gap-2 sm:gap-4 items-center">
                    <FocusToggle />
                    {isPlaying ? (
                        <button onClick={stopGame} className="w-28 sm:w-40 h-12 sm:h-16 flex justify-center items-center gap-2 sm:gap-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl shadow-lg border-b-4 border-red-800 transition-all">
                            <Square size={20} fill="white" className="sm:w-6 sm:h-6" /> <span className="">PARAR</span>
                        </button>
                    ) : (
                        <button onClick={startGame} className="w-28 sm:w-40 h-12 sm:h-16 flex justify-center items-center gap-2 sm:gap-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl shadow-lg border-b-4 border-emerald-700 transition-all">
                            <Play size={20} fill="white" className="sm:w-6 sm:h-6" /> <span className="">TOCAR</span>
                        </button>
                    )}
                </div>
            </div>



            {/* Spatial Tablature Timeline */}
            <SpatialTablature notes={notes} currentTime={currentTime} onManualHit={handlePitchHit} />

            {/* Tutor Feedback Loop Message */}
            {tutorMessage && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-yellow-400 text-yellow-900 px-12 py-6 rounded-[3rem] shadow-[0_20px_60px_rgba(250,204,21,0.6)] font-black text-4xl uppercase animate-bounce text-center tracking-tighter border-8 border-yellow-200">
                    {tutorMessage}
                </div>
            )}

            {/* Tutor Info (Only visible in normal mode for tutors/parents) */}
            {!focusMode && (
                <div className="mt-12 flex gap-8 text-3xl font-black text-amber-200/50 bg-black/40 px-12 py-6 rounded-full border-4 border-amber-900/60">
                    <span className="text-red-400">Fallas: {errorCount}</span>
                    <span className="text-blue-400">Velocidad: {tempoBpm} BPM</span>
                    <span className="text-yellow-400">Puntaje: {score}</span>
                </div>
            )}
        </div>
    );
}
