import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Star, Play, Home, Award, Music, Mic, MicOff, CheckCircle2, RotateCcw,
  Wind, BookOpen, Trophy, Zap, Users, Music2, Drum, Radio, Volume2,
  ChevronDown, VolumeX, Sparkles, Settings, Plus, Trash2, Save, X,
  Pencil, Mic2, RefreshCw, Gauge, Brain, Share2, Download, Medal, Flame, Ear, Crown, Target, LogOut, Lock,
  ChevronLeft, ChevronRight, Search, Bird, Feather, Mountain, ArrowUp, ArrowDown, Square
} from 'lucide-react';

import { usePianoMic } from '../../hooks/usePianoMic';
import MicSettingsModal from '../core/components/MicSettingsModal';

// --- CONSTANTES DE RANGO ---
const RANKS = [
  { min: 0, title: "Pequeño Solista", color: "text-blue-400", bg: "bg-blue-600", next: 2000 },
  { min: 2000, title: "Explorador Rítmico", color: "text-green-400", bg: "bg-green-600", next: 5000 },
  { min: 5000, title: "Cadete del Sonido", color: "text-indigo-400", bg: "bg-indigo-600", next: 10000 },
  { min: 10000, title: "Comandante Melódico", color: "text-purple-400", bg: "bg-purple-600", next: 20000 },
  { min: 20000, title: "Maestro Galáctico", color: "text-yellow-400", bg: "bg-yellow-600", next: 50000 },
  { min: 50000, title: "Leyenda del Piano", color: "text-red-400", bg: "bg-red-600", next: 100000 }
];

const STICKERS_BASE = {
  1: { id: 1, name: "Elefante", emoji: "🐘", color: "bg-blue-400" },
  2: { id: 2, name: "Gato", emoji: "🐱", color: "bg-orange-400" },
  3: { id: 3, name: "Oso", emoji: "🐻", color: "bg-green-400" },
  4: { id: 4, name: "Mono", emoji: "🐒", color: "bg-yellow-400" },
  5: { id: 5, name: "Zorro", emoji: "🦊", color: "bg-red-400" },
  6: { id: 6, name: "León", emoji: "🦁", color: "bg-amber-500" },
  7: { id: 7, name: "Jirafa", emoji: "🦒", color: "bg-yellow-500" },
  8: { id: 8, name: "Cebra", emoji: "🦓", color: "bg-slate-400" },
  9: { id: 9, name: "Panda", emoji: "🐼", color: "bg-emerald-400" },
  10: { id: 10, name: "Koala", emoji: "🐨", color: "bg-gray-400" },
  11: { id: 11, name: "Tiburón", emoji: "🦈", color: "bg-blue-600" },
  12: { id: 12, name: "Rana", emoji: "🐸", color: "bg-lime-500" },
  13: { id: 13, name: "Abeja", emoji: "🐝", color: "bg-yellow-300" },
  14: { id: 14, name: "Mariposa", emoji: "🦋", color: "bg-purple-300" },
  15: { id: 15, name: "Ballena", emoji: "🐳", color: "bg-blue-300" },
  20: { id: 20, name: "Arcoíris", emoji: "🌈", color: "bg-indigo-400" }
};



const FREQUENCIES = { 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88, 'R': 0 };
const NOTE_COLORS = { 'C': '#EF4444', 'C#': '#B91C1C', 'D': '#F97316', 'D#': '#C2410C', 'E': '#FACC15', 'F': '#22C55E', 'F#': '#15803D', 'G': '#38BDF8', 'G#': '#0369A1', 'A': '#1D4ED8', 'A#': '#1E3A8A', 'B': '#9333EA', 'R': 'transparent' };
const NOTE_NAMES = { 'C': 'DO', 'C#': 'DO#', 'D': 'RE', 'D#': 'RE#', 'E': 'MI', 'F': 'FA', 'F#': 'FA#', 'G': 'SOL', 'G#': 'SOL#', 'A': 'LA', 'A#': 'LA#', 'B': 'SI', 'R': 'SILENCIO' };

const API_URL = 'backend/api.php';

export default function PianoMagico({ userId, onExit }) {
  // --- PERSISTENCIA STORE ---
  const [users, setUsers] = useState([]);
  const [userPerformances, setUserPerformances] = useState([]);
  const [songs, setSongs] = useState([]);
  const [unlockedStickers, setUnlockedStickers] = useState([]);
  const [memoryMedals, setMemoryMedals] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [profile, setProfile] = useState({ name: "NUEVO MÚSICO", avatarId: 1 });
  const [adminSongs, setAdminSongs] = useState([]);
  const [isEditingSong, setIsEditingSong] = useState(false);
  const [adminTab, setAdminTab] = useState('lessons'); // 'musicians' | 'lessons'
  const [isMicSettingsOpen, setIsMicSettingsOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [rawSequenceText, setRawSequenceText] = useState('');
  const [isDrumEnabled, setIsDrumEnabled] = useState(true);
  const [currentRhythm, setCurrentRhythm] = useState('pop');
  const [sessionErrors, setSessionErrors] = useState(0);
  const mapSongs = songs.filter(s => !s.isUserCreated);
  const [activePopover, setActivePopover] = useState(null);

  // --- JUEGO & NAVEGACIÓN ---
  const [view, setView] = useState('menu');
  const [mode, setMode] = useState('solo');
  const [currentSong, setCurrentSong] = useState(null);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tempoFactor, setTempoFactor] = useState(1);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [memoryMode, setMemoryMode] = useState(false);
  const [memoryIntegrity, setMemoryIntegrity] = useState(true);
  const [noteReady, setNoteReady] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', type: '' });
  const [detectedNote, setDetectedNote] = useState(null);
  const [parentMath, setParentMath] = useState({ v1: 0, v2: 0, result: '' });
  const [simonStep, setSimonStep] = useState(1);
  const [userSimonIndex, setUserSimonIndex] = useState(0);
  const [albumTab, setAlbumTab] = useState('stickers');
  const [newUsername, setNewUsername] = useState('');
  const [isPassportExpanded, setIsPassportExpanded] = useState(false);

  // --- HELPER SPEED ALGORITHM ---
  // If speed is > 300, we assume it's legacy data in milliseconds (e.g., 800).
  // Otherwise, it's BPM, so we convert it to the ms-interval per beat.
  const getIntervalMs = (speedValue) => {
    if (!speedValue) return 600; // Default fallback to 100 BPM (60000/100 = 600)
    const val = Number(speedValue);
    if (val > 300) return val;
    return 60000 / val;
  };

  // Parses a note string like "C:0.5" into { pitch: "C", duration: 0.5 }
  // Default duration is 1 (Negra) if no colon is present
  const parseNote = (noteStr) => {
    if (!noteStr) return { pitch: 'C', duration: 1 };
    const parts = noteStr.split(':');
    return {
      pitch: parts[0],
      duration: parts.length > 1 ? parseFloat(parts[1]) : 1
    };
  };

  const getDurationLabel = (dur) => {
    switch (dur) {
      case 4: return 'Redonda';
      case 2: return 'Blanca';
      case 1: return 'Negra';
      case 0.5: return 'Corchea';
      case 0.25: return 'Semicorchea';
      default: return `${dur}x`;
    }
  };

  const getNotePositionPercent = (pitch) => {
    const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    if (pitch === 'R') return 43.5;

    const isSharp = pitch.includes('#');
    const basePitch = pitch.replace('#', '');
    const baseIndex = naturalNotes.indexOf(basePitch);

    if (baseIndex === -1) return 0;

    if (!isSharp) {
      return (baseIndex * (100 / 7)) + 0.64;
    } else {
      return ((baseIndex + 1) * (100 / 7)) - 5.0;
    }
  };

  // --- ADHD FEATURES STATE ---
  const [failureCount, setFailureCount] = useState(0);
  const [isCalmMode, setIsCalmMode] = useState(false);

  // --- NEURODIVERSITY STATES & REFS ---
  const [detectiveAttempts, setDetectiveAttempts] = useState(0);
  const [showDirectionFeedback, setShowDirectionFeedback] = useState(null); // { dir: 'left'|'right', text: '' }
  const [highlightTarget, setHighlightTarget] = useState(false);

  // --- GAMIFICATION: SUPERNOVA & BOSSES ---
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  const [isSupernova, setIsSupernova] = useState(false);

  const { isListening, toggleMic } = usePianoMic((note) => {
    handleAction(note);
  });

  // Calculate cumulative positions for proportional rhythm jumps
  const cumulativePositions = useMemo(() => {
    if (!currentSong?.sequence) return [];
    let pos = 0;
    return currentSong.sequence.map(n => {
      const currentPos = pos;
      pos += parseNote(n).duration;
      return currentPos;
    });
  }, [currentSong]);

  const lastInteractionRef = useRef(Date.now());
  const stopPreviewRef = useRef(false);
  const pressStartRef = useRef(0);
  const ecoTargetDurations = useRef([]);
  const ecoCurrentIndex = useRef(0);
  const rocketRef = useRef(null);

  // Auto-scroll to Rocket on View Menu load
  useEffect(() => {
    if (view === 'menu' && rocketRef.current) {
      setTimeout(() => {
        if (rocketRef.current) {
          rocketRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [view, userId, mapSongs.length, userPerformances.length, memoryMedals.length]);

  // --- AUDIO ENGINE (WEB AUDIO API) ---
  const audioCtx = useRef(null);
  const drumInterval = useRef(null);
  const beatCount = useRef(0);
  const currentDrumParams = useRef({ rhythm: '', interval: 0 });

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playKick = (time) => {
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    const gainVal = isCalmMode ? 0.5 : 1;
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  };

  const playSnare = (time) => {
    // Noise buffer
    const bufferSize = audioCtx.current.sampleRate * 0.1;
    const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = audioCtx.current.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioCtx.current.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);

    const noiseGain = audioCtx.current.createGain();
    const gVal = isCalmMode ? 0.5 : 1;
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.current.destination);

    noiseGain.gain.setValueAtTime(gVal, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    // Oscillator for the snap
    const osc = audioCtx.current.createOscillator();
    const oscGain = audioCtx.current.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, time);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.current.destination);
    oscGain.gain.setValueAtTime(gVal * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.start(time);
    osc.start(time);
    osc.stop(time + 0.2);
  };

  // --- CARGA INICIAL DE USUARIOS ---
  useEffect(() => {
    // Ya no cargamos usuarios aquí, se hace en MusicSuite
    // Solo aseguramos que se envíe a 'menu'
    setView('menu');
  }, []);

  // --- CARGA DE DATOS DEPENDIENTE DE USUARIO ---
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        // Profile
        const resProfile = await fetch(`${API_URL}?action=get_profile&user_id=${userId}`);
        const dataProfile = await resProfile.json();
        if (dataProfile) setProfile({ name: dataProfile.name, avatarId: dataProfile.avatar_id });
        if (dataProfile) setTotalScore(dataProfile.total_score);

        // Songs
        const resSongs = await fetch(`${API_URL}?action=get_songs&user_id=${userId}&instrument=piano`);
        const userSongs = await resSongs.json();

        if (Array.isArray(userSongs)) {
          setSongs(userSongs.sort((a, b) => {
            const orderA = a.order_index !== null && a.order_index !== undefined ? Number(a.order_index) : Number(a.id);
            const orderB = b.order_index !== null && b.order_index !== undefined ? Number(b.order_index) : Number(b.id);
            return orderA - orderB;
          }));
        } else {
          setSongs([]);
        }

        // Stickers
        const resStickers = await fetch(`${API_URL}?action=get_stickers&user_id=${userId}`);
        const stickers = await resStickers.json();
        setUnlockedStickers(stickers || []);

        // Medals
        const resMedals = await fetch(`${API_URL}?action=get_medals&user_id=${userId}`);
        const medals = await resMedals.json();
        setMemoryMedals(medals || []);

        // Performances
        const resPerf = await fetch(`${API_URL}?action=get_performances&user_id=${userId}`);
        const perfs = await resPerf.json();
        setUserPerformances(perfs || []);

        // Transition to menu after successful login
        setView('menu');
      } catch (error) {
        console.error("Error loading data from SQL:", error);
      }
    };
    loadData();
  }, [userId]);

  // --- GUARDADO EN SQL ---
  useEffect(() => {
    // Debounce or only save on specific actions as needed, 
    // but for now we'll do literal sync where possible or manually
  }, []);

  const updateProfileOnServer = async (newProfile, newScore) => {
    if (!userId) return;
    try {
      await fetch(`${API_URL}?action=update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: newProfile.name, avatarId: newProfile.avatarId, totalScore: newScore })
      });
    } catch (e) { console.error(e); }
  };

  const unlockStickerOnServer = async (stickerId) => {
    if (!userId) return;
    try {
      await fetch(`${API_URL}?action=unlock_sticker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, stickerId })
      });
    } catch (e) { console.error(e); }
  };

  const unlockMedalOnServer = async (songId) => {
    if (!userId) return;
    try {
      await fetch(`${API_URL}?action=unlock_medal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, songId })
      });
    } catch (e) { console.error(e); }
  };

  const addSongOnServer = async (song) => {
    if (!userId) return null;
    try {
      const res = await fetch(`${API_URL}?action=add_song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...song, userId })
      });
      return await res.json();
    } catch (e) { console.error(e); return null; }
  };

  const savePerformanceOnServer = async (songId, log, finalScore) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}?action=save_performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, songId, performanceLog: log, score: finalScore })
      });
      const data = await res.json();
      if (data.id) {
        // Refresh performances
        const resPerf = await fetch(`${API_URL}?action=get_performances&user_id=${userId}`);
        setUserPerformances(await resPerf.json());
      }
    } catch (e) { console.error(e); }
  };

  // --- REFRESH ADMIN DATA ---
  const fetchAdminSongs = async () => {
    try {
      const res = await fetch(`${API_URL}?action=get_admin_songs`);
      const data = await res.json();
      setAdminSongs(data || []);
    } catch (e) { console.error(e); }
  };

  // --- ESTADOS DE GRABACIÓN Y COMPOSITOR ---
  const [performanceLog, setPerformanceLog] = useState([]);
  const [startTime, setStartTime] = useState(0);

  const startDrumLoop = (rhythmType, speedOrInterval) => {
    initAudio();
    const interval = speedOrInterval || 750;
    const type = rhythmType?.toLowerCase();

    // Evitar reinicio si ya es el mismo ritmo y velocidad
    if (drumInterval.current &&
      currentDrumParams.current.rhythm === type &&
      currentDrumParams.current.interval === interval) {
      return;
    }

    stopDrumLoop();
    beatCount.current = 0;
    currentDrumParams.current = { rhythm: type, interval };

    drumInterval.current = setInterval(() => {
      const time = audioCtx.current.currentTime;
      const beat = (beatCount.current % 4) + 1;

      // Logic for patterns
      if (type === 'pop' || type === 'bubble') {
        if (beat === 1 || beat === 3) playKick(time);
        if (beat === 2 || beat === 4) playSnare(time);
      } else if (type === 'rock' || type === 'robot') {
        playKick(time);
        if (beat === 2 || beat === 4) playSnare(time);
      } else if (type === 'march' || type === 'marcha') {
        if (beat === 1) { playKick(time); playSnare(time); }
        if (beat === 2 || beat === 4) playSnare(time);
        if (beat === 3) playKick(time);
      } else if (type === 'clasico' || type === 'clásico') {
        if (beat === 1) playKick(time);
        if (beat === 2 || beat === 3 || beat === 4) playSnare(time);
      }

      beatCount.current++;
    }, interval);
  };


  const stopDrumLoop = () => {
    if (drumInterval.current) {
      clearInterval(drumInterval.current);
      drumInterval.current = null;
    }
  };
  const [isRecordingPerformance, setIsRecordingPerformance] = useState(false);
  const [composerRecording, setComposerRecording] = useState(false);
  const [composerSequence, setComposerSequence] = useState([]);

  // --- REFS ---
  const drumTimer = useRef(null);
  const lockRef = useRef(false);
  const stepRef = useRef(0);
  const readyTimeRef = useRef(0);
  const previewTimers = useRef([]);
  const playbackTimers = useRef([]);

  const playSynth = (freq, type = 'triangle', gainVal = 0.2, decay = 0.8) => {
    if (!freq || freq === 0) return;
    initAudio();
    const osc = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    const finalGain = isCalmMode ? gainVal * 0.5 : gainVal;
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    g.gain.setValueAtTime(finalGain, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + decay);
    osc.connect(g); g.connect(audioCtx.current.destination);
    osc.start(); osc.stop(audioCtx.current.currentTime + decay);
  };

  // --- DRUM MACHINE INTEGRATION ---
  useEffect(() => {
    const isGame = view === 'game' && currentSong && !isPreviewing && mode !== 'oído';
    const isComposer = view === 'composer' && composerRecording;

    if ((isGame || isComposer) && isDrumEnabled) {
      const rhythm = isGame ? currentSong.rhythm : currentRhythm;
      const baseInterval = isGame ? getIntervalMs(currentSong.speed) : 750;
      const interval = baseInterval / tempoFactor;
      startDrumLoop(rhythm, interval);
    } else {
      stopDrumLoop();
    }
    return () => stopDrumLoop();
  }, [view, currentSong, tempoFactor, isPreviewing, isDrumEnabled, composerRecording, currentRhythm, mode]);

  // --- LÓGICA DE SIMON ---
  const stopAllPreviews = useCallback(() => {
    previewTimers.current.forEach(t => clearTimeout(t));
    previewTimers.current = [];
    setIsPreviewing(false);
  }, []);

  const runSimonSequence = useCallback((currentSequenceLength) => {
    if (!currentSong) return;
    stopAllPreviews();
    setIsPreviewing(true);
    lockRef.current = true;

    const interval = getIntervalMs(currentSong?.speed) / tempoFactor;

    for (let i = 0; i < currentSequenceLength; i++) {
      const t = setTimeout(() => {
        const note = currentSong.sequence[i];
        const parsed = parseNote(note);
        // Simon sounds: specific frequencies for better memory
        const simonFreqs = { 'C': 261, 'D': 329, 'E': 392, 'F': 523, 'G': 659, 'A': 783, 'B': 1046 };
        if (parsed.pitch !== 'R') {
          playSynth(simonFreqs[parsed.pitch] || FREQUENCIES[parsed.pitch], 'square', 0.2, 0.4);
          setDetectedNote(parsed.pitch);
          const tOff = setTimeout(() => setDetectedNote(null), interval * 0.7);
          previewTimers.current.push(tOff);
        }

        if (i === currentSequenceLength - 1) {
          const tEnd = setTimeout(() => {
            setIsPreviewing(false);
            setUserSimonIndex(0);
            lockRef.current = false;
            setFeedback({ msg: "¡TU TURNO!", type: "perfect" });
            setTimeout(() => setFeedback({ msg: '', type: '' }), 1000);
          }, interval * 0.8);
          previewTimers.current.push(tEnd);
        }
      }, i * interval + 2000); // 2-second initial delay for "¡ESCUCHA!"
      previewTimers.current.push(t);
    }
  }, [currentSong, tempoFactor, stopAllPreviews]);

  const runEcoSequence = useCallback(() => {
    if (!currentSong) return;
    stopAllPreviews();
    setIsPreviewing(true);
    lockRef.current = true;

    // Eco Rhythm: based on BPM but slightly faster for punchiness (x0.6)
    const baseDuration = (getIntervalMs(currentSong?.speed) * 0.6) / tempoFactor;
    ecoTargetDurations.current = [baseDuration, baseDuration, baseDuration];
    ecoCurrentIndex.current = 0;

    const firstNoteStr = currentSong.sequence[0];
    const firstNoteParsed = parseNote(firstNoteStr);
    const totalPulses = ecoTargetDurations.current.length;
    let accumulatedTime = 0;

    for (let i = 0; i < totalPulses; i++) {
      const pulseDur = ecoTargetDurations.current[i];
      const t = setTimeout(() => {
        if (firstNoteParsed.pitch !== 'R') {
          playSynth(FREQUENCIES[firstNoteParsed.pitch], 'square', 0.2, (pulseDur / 1000) * 0.8);
          setDetectedNote(firstNoteParsed.pitch);
          const tOff = setTimeout(() => setDetectedNote(null), pulseDur * 0.8);
          previewTimers.current.push(tOff);
        }

        if (i === totalPulses - 1) {
          const tEnd = setTimeout(() => {
            setIsPreviewing(false);
            lockRef.current = false;
            setFeedback({ msg: "¡TÚ RITMO!", type: "perfect" });
            setTimeout(() => setFeedback({ msg: '', type: '' }), 1000);
          }, pulseDur * 0.9);
          previewTimers.current.push(tEnd);
        }
      }, accumulatedTime + 1500); // 1.5s initial delay

      accumulatedTime += pulseDur;
      previewTimers.current.push(t);
    }
  }, [currentSong, tempoFactor, stopAllPreviews]);

  // --- MANEJO DE ACCIÓN ---
  const handleReorder = async (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === adminSongs.length - 1)
    ) return;

    const newAdminSongs = [...adminSongs];
    const itemToMove = newAdminSongs[index];
    newAdminSongs.splice(index, 1);
    newAdminSongs.splice(index + direction, 0, itemToMove);

    setAdminSongs(newAdminSongs);

    const payload = newAdminSongs.map((song, i) => ({
      id: song.id,
      order_index: i
    }));

    try {
      await fetch(`${API_URL}?action=reorder_songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: payload })
      });
      await fetchAdminSongs();
      if (userId) {
        const resSongs = await fetch(`${API_URL}?action=get_songs&user_id=${userId}&instrument=piano`);
        const userSongs = await resSongs.json();
        if (Array.isArray(userSongs)) {
          setSongs(userSongs.sort((a, b) => (Number(a.order_index ?? a.id)) - (Number(b.order_index ?? b.id))));
        }
      }
    } catch (e) {
      console.error("Error reordering:", e);
    }
  };

  const handleAction = useCallback((note) => {
    // Reset glow behavior
    lastInteractionRef.current = Date.now();
    setHighlightTarget(false);

    if (isPreviewing || lockRef.current) {
      if (view === 'composer' && composerRecording) {
        playSynth(FREQUENCIES[note], 'triangle', 0.3, 0.8);
        setDetectedNote(note); setTimeout(() => setDetectedNote(null), 150);
        setComposerSequence(prev => [...prev, note]);
      }
      return;
    }

    initAudio();

    if (mode === 'eco') {
      playSynth(FREQUENCIES[note], 'triangle', 0.3, 0.8);
      setDetectedNote(note); setTimeout(() => setDetectedNote(null), 150);
      pressStartRef.current = Date.now();
      return;
    }

    if (view === 'composer') {
      playSynth(FREQUENCIES[note], 'triangle', 0.3, 0.8);
      setDetectedNote(note); setTimeout(() => setDetectedNote(null), 150);
      if (composerRecording) setComposerSequence(prev => [...prev, note]);
      return;
    }

    if (view === 'admin') {
      playSynth(FREQUENCIES[note], 'triangle', 0.3, 0.8);
      setDetectedNote(note); setTimeout(() => setDetectedNote(null), 150);
      return;
    }

    if (!currentSong) return;

    if (mode === 'oído') {
      const targetNoteStr = currentSong.sequence[userSimonIndex];
      const targetNote = parseNote(targetNoteStr).pitch;
      playSynth(FREQUENCIES[note], 'triangle', 0.3, 0.8);
      setDetectedNote(note); setTimeout(() => setDetectedNote(null), 150);
      if (note === targetNote) {
        if (userSimonIndex === currentSong.sequence.length - 1) {
          const newScore = totalScore + 1000;
          setTotalScore(newScore);
          updateProfileOnServer(profile, newScore);

          if (!unlockedStickers.includes(currentSong.stickerId)) {
            setUnlockedStickers(ps => [...ps, currentSong.stickerId]);
            unlockStickerOnServer(currentSong.stickerId);
          }
          savePerformanceOnServer(currentSong.id, performanceLog, newScore);
          setView('success');
        } else if (userSimonIndex === simonStep - 1) {
          const newScore = totalScore + 200;
          setTotalScore(newScore);
          updateProfileOnServer(profile, newScore);
          const nextStep = simonStep + 1;
          setSimonStep(nextStep);
          runSimonSequence(nextStep);
        } else {
          setUserSimonIndex(prev => prev + 1);
        }
      } else {
        setFeedback({ msg: "¡UPS!", type: "miss" });
        setTimeout(() => runSimonSequence(simonStep), 1000);
      }
      return;
    }

    const currentTargetNode = currentSong.sequence[stepRef.current];
    if (!currentTargetNode) return;
    let target = parseNote(currentTargetNode).pitch;

    if (target === 'R') return; // Ignore mic events during rests

    // In Boss Hybrid Mode: Even steps are Visual (Solo), Odd steps are Auditory (Oído)
    if (mode === 'boss' && stepRef.current % 2 !== 0) {
      // It's the oído phase of the boss battle
      // Play the target note for them to hear if they haven't pressed yet
      // Actually, the note is played via another effect or we just wait for input
    }

    if (note === target && !noteReady) {
      setFeedback({ msg: "¡ESPERA!", type: "miss" });
      setConsecutiveHits(0);
      setIsSupernova(false);
      return;
    }

    if (note === target) {
      lockRef.current = true;
      playSynth(FREQUENCIES[note], 'triangle', 0.3, 0.8);
      const timeOffset = Date.now() - startTime;
      if (isRecordingPerformance) setPerformanceLog(prev => [...prev, { note, time: timeOffset }]);

      setDetectedNote(note); setTimeout(() => setDetectedNote(null), 150);

      const rx = (Date.now() - readyTimeRef.current) * tempoFactor;
      let p = rx < 450 ? 200 : 100;
      const newScore = totalScore + p;
      setTotalScore(newScore);
      updateProfileOnServer(profile, newScore);

      setEnergy(e => Math.min(100, e + 10));
      setFeedback({ msg: p === 200 ? "¡GENIAL!" : "¡BIEN!", type: "perfect" });
      setFailureCount(0); // Reset ADHD failure count on success

      const newHits = consecutiveHits + 1;
      setConsecutiveHits(newHits);
      if (newHits >= 10 && !isCalmMode) {
        setIsSupernova(true);
      }

      setTimeout(() => {
        setFeedback({ msg: '', type: '' });
        if (stepRef.current + 1 >= currentSong.sequence.length) {
          if (loopEnabled) {
            setStep(0); stepRef.current = 0;
            setTimeout(() => { lockRef.current = false; }, 150);
          } else {
            setIsRecordingPerformance(false);
            const isFailed = sessionErrors >= 3;

            if (!isFailed) {
              if (!unlockedStickers.includes(currentSong.stickerId)) {
                setUnlockedStickers(ps => [...ps, currentSong.stickerId]);
                unlockStickerOnServer(currentSong.stickerId);
              }
              if (sessionErrors === 0 && !memoryMedals.includes(currentSong.id)) {
                setMemoryMedals(pm => [...pm, currentSong.id]);
                unlockMedalOnServer(currentSong.id);
              }
              savePerformanceOnServer(currentSong.id, performanceLog, totalScore + (Date.now() - readyTimeRef.current < 450 ? 200 : 100));
            }

            // Recompensa Extra de Boss: Si es nivel 10,20,30,40
            const currentIdx = songs.findIndex(s => s.id === currentSong.id);
            if ((currentIdx + 1) % 10 === 0 && !isFailed && !currentSong.isUserCreated) {
              // Implement background unlock or extra logic later
            }

            setView('success');
            lockRef.current = false;
          }
        } else {
          setStep(s => s + 1); stepRef.current++;
          setTimeout(() => { lockRef.current = false; }, 150);
        }
      }, 350);
    } else {
      setFeedback({ msg: "¡UPS!", type: "miss" });
      setConsecutiveHits(0);
      setIsSupernova(false);

      if (mode === 'detective') {
        const notesArr = Object.keys(NOTE_NAMES);
        const userIdx = notesArr.indexOf(note);
        const targetIdx = notesArr.indexOf(target);

        const isAgudo = userIdx > targetIdx;
        const distance = Math.abs(userIdx - targetIdx);

        setShowDirectionFeedback({
          dir: isAgudo ? 'left' : 'right',
          distance: distance
        });

        const newAtt = detectiveAttempts + 1;
        setDetectiveAttempts(newAtt);

        // Wait for visual feedback before applying consequences
        setTimeout(() => {
          setShowDirectionFeedback(null);
          if (newAtt >= 2) {
            setIsCalmMode(true);
            setFeedback({ msg: "MODO CALMA", type: "miss" });
          }
        }, 2500);

        return;
      }

      setSessionErrors(s => s + 1);
      const newFailCount = failureCount + 1;
      setFailureCount(newFailCount);
      if (newFailCount >= 3) {
        setIsCalmMode(true);
        setCurrentRhythm('bubble');
        if (currentSong) setCurrentSong(prev => ({ ...prev, rhythm: 'bubble' }));
        setFeedback({ msg: "MODO CALMA ACTIVADO", type: "miss" });
      }
    }
  }, [currentSong, mode, userSimonIndex, simonStep, noteReady, tempoFactor, energy, unlockedStickers, memoryMode, memoryIntegrity, memoryMedals, runSimonSequence, isPreviewing, view, composerRecording, isRecordingPerformance, startTime, totalScore, profile, loopEnabled, detectiveAttempts]);

  const handleActionUp = useCallback((note) => {
    if (mode !== 'eco' || isPreviewing || lockRef.current || !currentSong) return;

    const duration = Date.now() - pressStartRef.current;
    const targetDuration = ecoTargetDurations.current[ecoCurrentIndex.current];

    if (Math.abs(duration - targetDuration) <= 250) {
      setFeedback({ msg: "¡BIEN!", type: "perfect" });
      setTimeout(() => setFeedback({ msg: '', type: '' }), 500);

      ecoCurrentIndex.current++;
      if (ecoCurrentIndex.current >= ecoTargetDurations.current.length) {
        setFeedback({ msg: "¡PERFECTO!", type: "perfect" });
        setTimeout(() => {
          setFeedback({ msg: '', type: '' });
          const newScore = totalScore + 300;
          setTotalScore(newScore);
          updateProfileOnServer(profile, newScore);
          savePerformanceOnServer(currentSong.id, performanceLog, newScore);
          setView('success');
        }, 1000);
      }
    } else {
      setFeedback({ msg: "¡CASI! ESCUCHA...", type: "miss" });
      setTimeout(() => {
        setFeedback({ msg: '', type: '' });
        runEcoSequence();
      }, 1500);
    }
  }, [mode, isPreviewing, currentSong, totalScore, profile, performanceLog, runEcoSequence]);

  // --- EFECTOS ---
  useEffect(() => {
    if (view === 'game' && currentSong && mode !== 'oído') {
      setNoteReady(false);

      const currentNoteStr = currentSong.sequence[stepRef.current];
      if (!currentNoteStr) return;
      const parsedCurrent = parseNote(currentNoteStr);
      const isRest = parsedCurrent.pitch === 'R';
      const delayMs = (getIntervalMs(currentSong.speed) / tempoFactor) * parsedCurrent.duration;

      if (isRest) {
        // Auto-advance for rests (silencios)
        const t = setTimeout(() => {
          if (stepRef.current + 1 >= currentSong.sequence.length) {
            if (loopEnabled) {
              setStep(0); stepRef.current = 0;
            } else {
              // Finish song
              if (!unlockedStickers.includes(currentSong.stickerId)) {
                setUnlockedStickers(ps => [...ps, currentSong.stickerId]);
                unlockStickerOnServer(currentSong.stickerId);
              }
              if (sessionErrors === 0 && !memoryMedals.includes(currentSong.id)) {
                setMemoryMedals(pm => [...pm, currentSong.id]);
                unlockMedalOnServer(currentSong.id);
              }
              savePerformanceOnServer(currentSong.id, performanceLog, totalScore + 100);
              setView('success');
            }
          } else {
            setStep(s => s + 1); stepRef.current++;
          }
        }, delayMs);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          setNoteReady(true);
          readyTimeRef.current = Date.now();

          // Auto-play sound for Detective mode
          if (mode === 'detective') {
            const targetNoteStr = currentSong.sequence[stepRef.current];
            if (targetNoteStr) {
              const parsedTarget = parseNote(targetNoteStr);
              playSynth(FREQUENCIES[parsedTarget.pitch], 'triangle', 0.3, 0.8);
            }
          }
        }, delayMs);
        return () => clearTimeout(t);
      }
    } else if (mode === 'oído') setNoteReady(true);
  }, [step, view, tempoFactor, currentSong, mode, loopEnabled]);

  useEffect(() => {
    if (view !== 'game' || isPreviewing || !currentSong || (mode !== 'solo' && mode !== 'duo')) {
      setHighlightTarget(false);
      return;
    }
    const interval = setInterval(() => {
      // 3 seconds pedagogical glow prompt
      if (!lockRef.current && Date.now() - lastInteractionRef.current >= 3000) {
        setHighlightTarget(true);
      } else {
        setHighlightTarget(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [view, isPreviewing, mode, currentSong]);

  const startLevel = (song, m) => {
    setCurrentSong(song); setMode(m); setStep(0); stepRef.current = 0;
    setSimonStep(1); setUserSimonIndex(0); setEnergy(0);
    setFailureCount(0); setSessionErrors(0); setIsCalmMode(false); // Reset ADHD features
    setTempoFactor(1); // Reset speed multiplier to 1x (Original creation BPM)

    // Neurodiversity states reset
    setDetectiveAttempts(0);
    setShowDirectionFeedback(null);
    setHighlightTarget(false);
    lastInteractionRef.current = Date.now();

    setPerformanceLog([]); setStartTime(Date.now()); setIsRecordingPerformance(true);
    setView('game'); initAudio(); setMemoryIntegrity(memoryMode);

    if (m === 'oído') setTimeout(() => runSimonSequence(1), 600);
    if (m === 'eco') setTimeout(() => runEcoSequence(), 600);
  };

  const startPlayback = () => {
    setView('playback'); initAudio();
    playbackTimers.current.forEach(clearTimeout);
    playbackTimers.current = [];
    performanceLog.forEach(item => {
      const t = setTimeout(() => {
        playSynth(FREQUENCIES[item.note], 'triangle', 0.3, 0.8);
        setDetectedNote(item.note);
        setTimeout(() => setDetectedNote(null), 200);
      }, item.time);
      playbackTimers.current.push(t);
    });
    const maxTime = performanceLog.length > 0 ? Math.max(...performanceLog.map(i => i.time)) : 0;
    const endT = setTimeout(() => setView('success'), maxTime + 1500);
    playbackTimers.current.push(endT);
  };

  const currentRank = RANKS.reduce((prev, curr) => (totalScore >= curr.min ? curr : prev), RANKS[0]);
  const progressPercent = Math.min(100, (totalScore / (RANKS.find(r => r.min > totalScore)?.min || totalScore)) * 100);

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-white font-sans flex flex-col items-center overflow-hidden select-none relative">

      {/* HUD SUPERIOR FIXED PERSISTENTE */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 flex justify-center shadow-2xl transition-all">
        <div className="w-full max-w-7xl px-2 sm:px-6 py-2 flex justify-between items-center gap-1 sm:gap-2">
          {/* Left: Perfil */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <button onClick={() => setView('id_card')} className="flex items-center gap-1.5 bg-indigo-600/30 p-1 pr-2.5 rounded-full border border-indigo-500/40 active:scale-95 transition-all hover:bg-indigo-600/50 cursor-pointer shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-inner">
                {STICKERS_BASE[profile.avatarId]?.emoji || '👤'}
              </div>
              <span className="text-[9px] sm:text-xs font-black uppercase truncate max-w-[65px] sm:max-w-[120px] tracking-wider text-indigo-100">{profile.name}</span>
            </button>
          </div>

          {/* Center: Galactic Adventure Title & Stats (Only on Menu) */}
          {view === 'menu' && (
            <>
              {/* Desktop / Tablet Center View */}
              <div className="hidden md:flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-3 my-0.5">
                <h1 className="text-sm sm:text-xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 drop-shadow-md truncate">
                  Galactic Adventure
                </h1>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`font-black uppercase text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 shadow-lg ${currentRank.color}`}>
                    {currentRank.title}
                  </div>
                  <div className="bg-indigo-600/30 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                    <Zap size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[9px] sm:text-[10px] font-black text-yellow-200">{totalScore}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Compact Score Badge */}
              <div className="flex md:hidden items-center gap-1 bg-indigo-600/30 px-2 py-1 rounded-full border border-indigo-500/30 shrink-0">
                <Zap size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[9px] font-black text-yellow-200">{totalScore}</span>
              </div>
            </>
          )}

          {/* Right: Acciones y Navegación */}
          <div className="flex gap-1 sm:gap-1.5 items-center shrink-0">
            {view === 'menu' && (
              <button
                onClick={() => { setView('composer'); setComposerSequence([]); setComposerRecording(false); }}
                className="px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[9px] sm:text-xs font-bold uppercase transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                title="Abrir Estudio Mágico"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">Composer Studio</span>
                <span className="sm:hidden">Studio</span>
              </button>
            )}

            {(view === 'game' || view === 'composer') && (
              <div className="flex items-center bg-slate-900/80 rounded-xl p-1 border border-white/10 shrink-0">
                <button
                  onClick={() => {
                    initAudio();
                    setIsDrumEnabled(!isDrumEnabled);
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${isDrumEnabled ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-white/5 text-white/40'}`}
                  title="Acompañamiento Rítmico"
                >
                  <Drum size={15} className={isDrumEnabled ? 'animate-bounce' : ''} />
                </button>

                {isDrumEnabled && (
                  <select
                    value={(view === 'game' ? currentSong?.rhythm : currentRhythm) || 'pop'}
                    onChange={(e) => {
                      const r = e.target.value;
                      initAudio();
                      if (view === 'game') setCurrentSong(prev => ({ ...prev, rhythm: r }));
                      setCurrentRhythm(r);
                    }}
                    className="ml-1 bg-slate-950 text-indigo-200 text-xs font-black uppercase rounded-lg px-1.5 py-1 border border-white/10 outline-none cursor-pointer hover:border-indigo-400/50 transition-all"
                  >
                    <option value="pop">POP</option>
                    <option value="rock">ROCK</option>
                    <option value="clasico">CLÁSICO</option>
                    <option value="marcha">MARCHA</option>
                  </select>
                )}
              </div>
            )}

            {view === 'game' && (
              <div className="flex items-center bg-slate-900/80 rounded-xl p-1 border border-white/10 shrink-0">
                <select
                  value={tempoFactor}
                  onChange={(e) => setTempoFactor(Number(e.target.value))}
                  className="bg-slate-950 text-indigo-200 text-xs font-black rounded-lg px-2 py-1 border border-white/10 outline-none cursor-pointer hover:border-indigo-400/50 transition-all"
                  title={`Velocidad (${Math.round((currentSong?.speed || 100) * tempoFactor)} BPM)`}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                </select>
              </div>
            )}

            <button
              onClick={toggleMic}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${isListening ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
              title="Escuchar Piano Real"
            >
              {isListening ? <Mic size={15} /> : <MicOff size={15} />}
            </button>

            {view === 'menu' && (
              <button
                onClick={() => setIsMicSettingsOpen(true)}
                className="p-1.5 text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/20 rounded-xl cursor-pointer"
                title="Configurar Micrófono"
              >
                <Settings size={15} />
              </button>
            )}

            {view === 'menu' && (
              <button
                onClick={() => {
                  setParentMath({ v1: Math.floor(Math.random() * 50) + 20, v2: Math.floor(Math.random() * 40) + 10, result: '' });
                  setView('parent_gate');
                }}
                className="p-1.5 bg-white/5 hover:bg-indigo-600/30 text-white/50 hover:text-indigo-200 transition-all rounded-xl cursor-pointer"
                title="Panel de Control de Profesor / Padres"
              >
                <Settings size={15} />
              </button>
            )}
            {view === 'menu' && (
              <button
                onClick={() => {
                  if (onExit) onExit();
                }}
                className="px-2 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[9px] sm:text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
              >
                Cerrar Piano
              </button>
            )}
            <button onClick={() => { stopAllPreviews(); setView('menu'); }} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer" title="Ir al Menú"><Home size={15} /></button>
          </div>
        </div>
      </div>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 min-h-0 w-full max-w-7xl pt-12 sm:pt-14 relative flex flex-col bg-slate-900/10 overflow-hidden px-2 sm:px-4">

        {/* AUTH / SELECCIÓN DE USUARIO */}
        {view === 'auth' && (
          <div className="absolute inset-0 z-[60] bg-[#020617] animate-in fade-in zoom-in overflow-y-auto">
            {/* Colorful background glow */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-purple-900 to-transparent pointer-events-none" />

            {/* Cosmic Stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={`auth-star-${i}`} className="absolute rounded-full bg-white animate-twinkle pointer-events-none" style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.7 + 0.3
              }} />
            ))}

            <div className="min-h-full flex flex-col items-center justify-center p-6 py-12 relative z-10 font-[Lexend,sans-serif]">
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 shadow-[0_0_50px_rgba(79,70,229,0.4)] animate-bounce">
                  <Music2 size={48} className="text-white" />
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">Piano Mágico</h1>
                <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">SISTEMA GALÁCTICO DE APRENDIZAJE</p>
              </div>

              <div className="w-full max-w-lg flex flex-col gap-8">
                {users.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="text-[12px] font-black uppercase text-white/60 tracking-widest ml-4 drop-shadow-md">¿QUIÉN ERES?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto px-2 py-4 scrollbar-hide">
                      {users.map((u, idx) => {
                        const noteColors = Object.values(NOTE_COLORS);
                        const color = noteColors[idx % noteColors.length];

                        return (
                          <button
                            key={u.id}
                            onClick={() => setUserId(u.id)}
                            className="relative group p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-200 active:translate-y-2 active:shadow-none hover:scale-105"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 8px 0 ${color}88, 0 15px 25px rgba(0,0,0,0.4), inset 0 2px 5px rgba(255,255,255,0.3)`
                            }}
                          >
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-inner border border-white/30 group-hover:bg-white/30 transition-colors">
                              <span className="text-4xl drop-shadow-lg scale-110 group-hover:scale-125 transition-transform">{STICKERS_BASE[u.avatar_id]?.emoji || '👤'}</span>
                            </div>
                            <span className="font-black text-[12px] uppercase truncate w-full text-center text-white drop-shadow-md tracking-wide">{u.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 px-2">
                  <h2 className="text-[12px] font-black uppercase text-white/60 tracking-widest ml-4 drop-shadow-md">NUEVO MÚSICO</h2>
                  <div className="bg-white/5 backdrop-blur-md border border-indigo-400 p-2 rounded-2xl flex gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                    <input
                      placeholder="TU NOMBRE..."
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toUpperCase())}
                      className="flex-1 bg-transparent border-none outline-none p-3 font-bold text-lg uppercase placeholder:text-white/10"
                    />
                    <button
                      onClick={async () => {
                        if (!newUsername.trim()) return;
                        try {
                          const res = await fetch(`${API_URL}?action=register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: newUsername })
                          });
                          const data = await res.json();
                          if (data.userId) {
                            const resUsers = await fetch(`${API_URL}?action=get_users`);
                            setUsers(await resUsers.json());
                            setUserId(data.userId);
                          }
                        } catch (e) { console.error(e); }
                      }}
                      className="bg-indigo-600 aspect-square w-14 rounded-xl text-white shadow-[0_6px_0_#3730a3] active:translate-y-1.5 active:shadow-none hover:bg-indigo-500 transition-all flex items-center justify-center shrink-0"
                    >
                      <Plus size={28} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {feedback.msg && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none text-center">
            <div className={`text-6xl font-black italic animate-bounce ${feedback.type === 'perfect' ? 'text-yellow-400 drop-shadow-[0_0_30px_gold]' : 'text-red-500'}`}>{feedback.msg}</div>
          </div>
        )}

        {/* DIRECTIONAL FEEDBACK PARA DETECTIVE */}
        {showDirectionFeedback && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center animate-in zoom-in pointer-events-none bg-black/40 backdrop-blur-sm">
            {showDirectionFeedback.dir === 'left' ? (
              <ChevronLeft size={150} className="text-sky-400 animate-pulse drop-shadow-[0_0_40px_rgba(56,189,248,0.8)]" />
            ) : (
              <ChevronRight size={150} className="text-emerald-400 animate-pulse drop-shadow-[0_0_40px_rgba(52,211,153,0.8)]" />
            )}
            <h1 className="text-5xl font-black text-white mt-4 uppercase italic tracking-tighter drop-shadow-lg">{showDirectionFeedback.text}</h1>
          </div>
        )}

        {/* SIDEBAR MINI */}
        {view === 'game' && mode !== 'oído' && !isPreviewing && (
          <div className="absolute right-0 top-16 sm:top-20 z-40 flex flex-col gap-3 items-center bg-white/5 p-2 rounded-l-2xl border-l border-y border-white/10 backdrop-blur-md animate-in slide-in-from-right">
            <button onClick={() => { if (stepRef.current > 0) setMemoryIntegrity(false); setMemoryMode(!memoryMode); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${memoryMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-black/40 text-white/40 hover:text-white'}`} title="Modo Memoria"><Brain size={20} /></button>
            <button onClick={() => setLoopEnabled(!loopEnabled)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${loopEnabled ? 'bg-indigo-600 text-white shadow-lg' : 'bg-black/40 text-white/40 hover:text-white'}`} title="Repetir Lección (Bucle)"><RefreshCw size={20} className={loopEnabled ? 'animate-spin-slow' : ''} /></button>
          </div>
        )}

        {/* MENU GALÁCTICO (STAR MAP) */}
        {view === 'menu' && (
          <div className="flex-1 flex flex-col items-center h-full animate-in fade-in overflow-y-auto pb-40 w-full relative bg-[#020617] scrollbar-hide">

            {/* Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#312e81] opacity-50" />
              {/* Stars Parallax (Static for now but styled) */}
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="absolute rounded-full bg-white animate-twinkle" style={{
                  width: Math.random() * 3 + 1 + 'px',
                  height: Math.random() * 3 + 1 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: Math.random() * 0.7 + 0.3
                }} />
              ))}
            </div>



            {/* STAR MAP CONTAINER */}
            {(() => {
              const totalItems = mapSongs.length;

              const getX = (i) => {
                const pos = i % 4;
                if (pos === 0) return 20;
                if (pos === 2) return 80;
                return 50;
              };

              const getLevelIndex = (songId) => mapSongs.findIndex(s => s.id === songId);

              // Calculate current progress for rocket position
              const completedSongIds = new Set(userPerformances.map(p => p.song_id));

              let highestUnlockedIndex = 0;
              for (let i = 0; i < totalItems; i++) {
                const prevId = mapSongs[i - 1]?.id || -1;
                const isUnlocked = i === 0 || completedSongIds.has(prevId) || memoryMedals.includes(prevId);
                if (isUnlocked) {
                  highestUnlockedIndex = i;
                } else {
                  break;
                }
              }

              const rocketTop = 95 - ((highestUnlockedIndex / (totalItems > 1 ? totalItems - 1 : 1)) * 90);
              const rocketLeft = getX(highestUnlockedIndex) + '%';

              return (
                <div
                  className="relative w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto flex flex-col items-center justify-start mt-4 px-4"
                  style={{ height: `${totalItems * 160 + 300}px` }}
                  onClick={() => setActivePopover(null)}
                >

                  {/* Dotted Path Connector */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1 }}>
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {mapSongs.map((song, idx) => {
                      if (idx === 0) return null;
                      const pRatio = (idx - 1) / (totalItems - 1);
                      const cRatio = idx / (totalItems - 1);
                      const pY = 95 - (pRatio * 90);
                      const cY = 95 - (cRatio * 90);
                      const midY = (pY + cY) / 2;
                      return (
                        <path
                          key={`path-${idx}`}
                          d={`M ${getX(idx - 1)} ${pY} C ${getX(idx - 1)} ${midY}, ${getX(idx)} ${midY}, ${getX(idx)} ${cY}`}
                          stroke="rgba(255,255,255,0.6)"
                          strokeWidth="3"
                          strokeDasharray="8 8"
                          filter="url(#glow)"
                          vectorEffect="non-scaling-stroke"
                          fill="none"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>

                  {/* ROCKET AVATAR */}
                  <div
                    ref={rocketRef}
                    className="absolute z-30 transition-all duration-1000 ease-in-out pointer-events-none drop-shadow-[0_15px_35px_rgba(79,70,229,0.5)]"
                    style={{
                      left: rocketLeft,
                      top: `calc(${rocketTop}% - 50px)`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center border-4 border-green-300 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-pulse">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                        <span className="text-xl">{STICKERS_BASE[profile.avatarId]?.emoji || '🚀'}</span>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-green-400/20 rounded-full blur-xl border border-green-400/30 -z-10" />
                  </div>

                  {mapSongs.map((song, idx) => {
                    const isUnlocked = idx === 0 || completedSongIds.has(mapSongs[idx - 1]?.id || -1) || memoryMedals.includes(mapSongs[idx - 1]?.id || -1);
                    const isPerfect = memoryMedals.includes(song.id);
                    const isCompleted = completedSongIds.has(song.id);
                    const isBoss = (idx + 1) % 10 === 0;

                    const leftPercent = getX(idx);
                    const cRatio = idx / (totalItems > 1 ? totalItems - 1 : 1);
                    const topPercent = 95 - (cRatio * 90);

                    const getPlanetColor = () => {
                      if (!isUnlocked) return '#1e293b';
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
                      return colors[idx % colors.length];
                    };

                    return (
                      <div
                        key={song.id}
                        className={`absolute flex flex-col items-center group ${!isUnlocked ? 'opacity-90' : 'hover:scale-110'} transition-all ${activePopover === song.id ? 'z-[300]' : 'z-10'}`}
                        style={{ left: `${leftPercent}%`, top: `${topPercent}%`, transform: 'translate(-50%, -50%)' }}
                        onMouseEnter={() => {
                          if (isUnlocked && activePopover === null) setActivePopover(song.id);
                        }}
                        onMouseLeave={() => {
                          if (activePopover === song.id) setActivePopover(null);
                        }}
                        onClick={(e) => {
                          if (isUnlocked) {
                            e.stopPropagation();
                            setActivePopover(activePopover === song.id ? null : song.id);
                          }
                        }}
                      >

                        {/* Interaction Popover */}
                        <div className={`absolute bottom-full mb-8 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-[2rem] shadow-2xl transition-all scale-75 z-50 ${activePopover === song.id ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

                          {/* Invisible bridge to catch mouse and prevent closing when moving towards popover */}
                          <div className="absolute top-full left-0 right-0 h-10 pointer-events-auto" />

                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{isBoss ? 'BOSS BATTLE' : `NIVEL ${idx + 1}`}</span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3].map(s => <Star key={s} size={12} className={isPerfect ? 'fill-yellow-400 text-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : isCompleted ? 'fill-slate-400 text-slate-500' : 'text-white/10'} />)}
                            </div>
                          </div>

                          <h3 className="text-white font-black uppercase text-base mb-4 truncate leading-tight tracking-tight">{song.title}</h3>

                          <div className="flex flex-col gap-2 relative z-[100]">
                            {isUnlocked ? (
                              <>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startLevel(song, 'solo'); }}
                                    className="w-full bg-indigo-600 p-3 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-500 shadow-md border-b-4 border-indigo-800 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-white pointer-events-auto"
                                  >
                                    <Play size={12} fill="white" /> SOLO
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startLevel(song, 'oído'); }}
                                    className="bg-purple-600 p-3 rounded-2xl text-[10px] font-black uppercase hover:bg-purple-500 shadow-md border-b-4 border-purple-800 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-white pointer-events-auto"
                                  >
                                    <Music2 size={12} /> OÍDO
                                  </button>
                                </div>

                                {isBoss && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startLevel(song, 'boss'); }}
                                    className="w-full bg-rose-600 p-4 rounded-2xl text-[11px] font-black uppercase hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] border-b-4 border-rose-800 active:translate-y-1 transition-all animate-pulse mt-1 flex items-center justify-center gap-3 text-white pointer-events-auto"
                                  >
                                    <Zap size={16} fill="white" className="animate-bounce" /> ¡ENFRENTAR JEFE!
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="w-full text-center p-4 bg-black/40 rounded-2xl text-xs font-black text-white/20 border border-white/5 flex items-center justify-center gap-2">
                                <Lock size={14} /> NIVEL BLOQUEADO
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Planet Node */}
                        <div className={`relative flex items-center justify-center transition-all ${isBoss ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'}`}>

                          {/* Aura / Orbit */}
                          <div className={`absolute inset-[-12px] rounded-full border border-white/5 border-dashed animate-spin-slow opacity-30`} />

                          {/* Planet Circle */}
                          <div
                            className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-300 ${isUnlocked ? 'planet-texture cursor-pointer active:scale-95' : 'bg-slate-800'} ${isUnlocked ? 'shadow-[0_0_40px_rgba(255,255,255,0.1)]' : ''}`}
                            style={isUnlocked ? { backgroundColor: getPlanetColor(), boxShadow: `inset -10px -10px 25px rgba(0,0,0,0.6), inset 6px 6px 15px rgba(255,255,255,0.3), 0 0 30px ${getPlanetColor()}66` } : {}}
                          >
                            {!isUnlocked ? (
                              <div className="w-14 h-14 bg-slate-700 rounded-full border-4 border-slate-600 flex items-center justify-center shadow-inner">
                                <Lock className="text-white/20" size={24} />
                              </div>
                            ) : (
                              <>
                                <div className="planet-spots" />
                                <span className={`${isBoss ? 'text-5xl sm:text-6xl drop-shadow-md' : 'text-3xl sm:text-4xl drop-shadow-sm'} z-10 animate-float`}>
                                  {isBoss ? '👾' : (STICKERS_BASE[song.stickerId]?.emoji || '🪐')}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Level Badge Pill - Duolingo style */}
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                            <div className={`relative min-w-[70px] h-8 rounded-full flex items-center justify-between px-3 gap-2 border-2 ${isUnlocked ? 'bg-indigo-600 border-indigo-400 shadow-[0_4px_0_#1e1b4b]' : 'bg-slate-700 border-slate-500 shadow-[0_4px_0_#0f172a]'} transition-transform group-hover:scale-110`}>
                              <span className="text-[11px] font-black text-white">{idx + 1}</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map(star => (
                                  <Star size={10} key={star} className={
                                    isPerfect ? 'fill-yellow-400 text-yellow-500' :
                                      isCompleted ? 'fill-white/80 text-white' :
                                        'text-white/20'
                                  } />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Visible Lesson Title Badge next to bubble */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${leftPercent > 50 ? 'right-full mr-3 text-right' : 'left-full ml-3 text-left'} pointer-events-none z-20 whitespace-nowrap`}>
                          <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border backdrop-blur-md shadow-lg flex flex-col ${isUnlocked ? 'bg-slate-900/90 border-white/15 text-indigo-100' : 'bg-slate-950/60 border-white/5 text-white/30'}`}>
                            <span className="text-[9px] sm:text-xs font-black uppercase tracking-tight max-w-[110px] sm:max-w-[160px] truncate">
                              {song.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* COMPOSITOR */}
        {view === 'composer' && (
          <div className="absolute inset-0 z-50 bg-slate-950 p-6 flex flex-col items-center justify-center animate-in zoom-in overflow-hidden">
            <div className="w-full flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase text-indigo-400 tracking-tighter">Estudio Mágico</h2>
              <X onClick={() => setView('menu')} className="text-white/40 cursor-pointer" />
            </div>

            <div className="bg-white/5 p-8 rounded-[3rem] border-4 border-indigo-500 shadow-2xl w-full max-w-sm text-center mb-8">
              {!composerRecording ? (
                <>
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                    <Mic2 size={48} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">¿Listo para grabar?</h3>
                  <button
                    onClick={() => { setComposerRecording(true); setComposerSequence([]); initAudio(); }}
                    className="w-full p-5 bg-red-600 rounded-2xl font-black text-xl shadow-lg border-b-4 border-red-800 active:translate-y-1"
                  >
                    ¡EMPEZAR REC!
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3 mb-4 text-red-500 animate-pulse">
                    <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_red]" />
                    <span className="font-black italic text-xs uppercase tracking-widest">Grabando Notas...</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-[100px] overflow-y-auto pr-2 scrollbar-hide">
                    {composerSequence.map((n, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-md" style={{ backgroundColor: NOTE_COLORS[n] }}>
                        {NOTE_NAMES[n]}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setComposerRecording(false)}
                    className="w-full p-5 bg-white text-slate-900 rounded-2xl font-black text-xl active:translate-y-1"
                  >
                    TERMINAR
                  </button>
                </>
              )}
            </div>

            {composerSequence.length > 0 && !composerRecording && (
              <button
                onClick={async () => {
                  try {
                    const newS = {
                      title: `Mi Obra ${songs.length + 1}`,
                      sequence: composerSequence,
                      stickerId: Math.floor(Math.random() * 15) + 1,
                      speed: 100, // Default 100 BPM
                      rhythm: currentRhythm
                    };
                    const result = await addSongOnServer(newS);
                    if (result && result.id) {
                      const savedSong = { ...newS, id: result.id, isUserCreated: true };
                      setSongs(prev => [...prev, savedSong]);
                      setFeedback({ msg: "¡GUARDADO!", type: "perfect" });
                      setTimeout(() => setFeedback({ msg: '', type: '' }), 1500);
                      setView('menu');
                    } else {
                      setFeedback({ msg: "ERROR AL GUARDAR", type: "miss" });
                    }
                  } catch (err) {
                    console.error("Error saving song:", err);
                    setFeedback({ msg: "ERROR TÉCNICO", type: "miss" });
                  }
                }}
                className="w-full max-w-sm p-6 bg-green-600 rounded-3xl font-black text-xl shadow-xl border-b-4 border-green-800 uppercase animate-bounce"
              >
                ¡GUARDAR EN MI ÁLBUM!
              </button>
            )}
          </div>
        )}

        {/* PLAYBACK */}
        {view === 'playback' && (
          <div className="absolute inset-0 z-50 bg-indigo-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 border-4 border-white/20 animate-bounce">
              <Volume2 size={64} className="text-white" />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center animate-pulse">
              Escuchando tu Concierto...
            </h2>
          </div>
        )}

        {/* PASAPORTE / ID CARD */}
        {view === 'id_card' && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center p-4 pt-4 animate-in zoom-in overflow-y-auto pb-20 scrollbar-hide">

            {/* CABECERA / TARJETA: IDENTIDAD (EXPANDIBLE) */}
            <div
              onClick={() => setIsPassportExpanded(!isPassportExpanded)}
              className={`w-full max-w-sm bg-white rounded-[2rem] shadow-2xl relative transition-all duration-500 cursor-pointer group hover:shadow-indigo-500/20 flex-shrink-0 ${isPassportExpanded ? 'mb-8 overflow-visible' : 'mb-4 overflow-hidden'}`}
            >
              {/* Header decorativo (solo en expandido o con estilo reducido en compacto) */}
              <div className={`bg-gradient-to-r from-indigo-600 to-indigo-700 flex justify-between items-center text-white transition-all duration-500 ${isPassportExpanded ? 'p-5' : 'p-3'}`}>
                {isPassportExpanded ? (
                  <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
                    <span className="font-black italic text-[9px] uppercase tracking-[0.2em] opacity-80">PASAPORTE GALÁCTICO</span>
                    <span className="text-[10px] font-bold opacity-60">SISTEMA PIANO MÁGICO v4.0</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-xl shadow-inner overflow-hidden">
                      {STICKERS_BASE[profile.avatarId]?.emoji || '👤'}
                    </div>
                    <span className="font-black text-xs uppercase tracking-tight">{profile.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {!isPassportExpanded && (
                    <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-full border border-white/10 animate-in fade-in slide-in-from-right-2">
                      <div className="flex items-center gap-1">
                        <Zap size={10} className="text-yellow-400" />
                        <span className="text-[10px] font-black">{totalScore}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Medal size={10} className="text-purple-400" />
                        <span className="text-[10px] font-black">{memoryMedals.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-orange-400" />
                        <span className="text-[10px] font-black">{unlockedStickers.length}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
                    {isPassportExpanded ? <ChevronDown size={18} className="text-white/40 rotate-180 transition-transform" /> : <ChevronDown size={18} className="text-white/60 animate-bounce" />}
                  </div>
                </div>
              </div>

              {/* Contenido detallado (solo si está expandido) */}
              {isPassportExpanded && (
                <div className="p-7 text-slate-900 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center w-full gap-5">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
                      <div className="relative bg-white w-24 h-24 text-6xl rounded-[1.75rem] border-4 border-indigo-50 flex items-center justify-center shadow-xl">
                        {STICKERS_BASE[profile.avatarId]?.emoji || '👤'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          value={profile.name}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => updateProfileOnServer(profile, totalScore)}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value.toUpperCase() })}
                          className="w-full font-black text-indigo-700 outline-none bg-transparent border-b-2 border-indigo-50 focus:border-indigo-500 transition-all uppercase text-2xl py-1"
                        />
                        <Pencil size={12} className="absolute right-0 top-3 text-indigo-200" />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Trophy size={14} className="text-yellow-600" />
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${currentRank.color}`}>{currentRank.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full my-6">
                    <div className="bg-indigo-50 p-3 rounded-2xl flex flex-col items-center border border-indigo-100 shadow-sm">
                      <Zap size={18} className="text-indigo-600 mb-1" />
                      <span className="text-xs font-black text-indigo-900">{totalScore}</span>
                      <span className="text-[7px] font-bold text-indigo-400 uppercase">PUNTOS</span>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-2xl flex flex-col items-center border border-purple-100 shadow-sm">
                      <Medal size={18} className="text-purple-600 mb-1" />
                      <span className="text-xs font-black text-purple-900">{memoryMedals.length}</span>
                      <span className="text-[7px] font-bold text-purple-400 uppercase">MEDALLAS</span>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-2xl flex flex-col items-center border border-orange-100 shadow-sm">
                      <Star size={18} className="text-orange-500 mb-1" />
                      <span className="text-xs font-black text-orange-900">{unlockedStickers.length}</span>
                      <span className="text-[7px] font-bold text-orange-400 uppercase">STICKERS</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Gauge size={10} /> SIGUIENTE RANGO
                      </span>
                      <span className="text-[9px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded-full">{Math.floor(progressPercent)}%</span>
                    </div>
                    <div className="h-3 w-full bg-white rounded-full p-0.5 border border-slate-100 overflow-hidden shadow-inner">
                      <div className={`h-full ${currentRank.bg} rounded-full transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN DE LOGROS: ÁLBUM (SIEMPRE VISIBLE, PERO COMPRIMIDA SI SE EXPANDE LA TARJETA) */}
            <div className={`w-full max-w-sm bg-white/10 backdrop-blur-md rounded-[2.5rem] p-1 border border-white/10 shadow-xl transition-all duration-700 ${isPassportExpanded ? 'opacity-30 scale-90 blur-[1px] pointer-events-none mb-4' : 'opacity-100 scale-100 mb-0'}`}>
              <div className="flex gap-1 bg-black/20 p-1.5 rounded-[2rem] mb-4">
                <button onClick={() => setAlbumTab('stickers')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${albumTab === 'stickers' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-indigo-200/50 hover:bg-white/5'}`}>
                  <Star size={14} /> Animales
                </button>
                <button onClick={() => setAlbumTab('memory')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${albumTab === 'memory' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-indigo-200/50 hover:bg-white/5'}`}>
                  <Brain size={14} /> Memorias
                </button>
                <button onClick={() => setAlbumTab('perf')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${albumTab === 'perf' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-indigo-200/50 hover:bg-white/5'}`}>
                  <Play size={14} /> Conciertos
                </button>
              </div>

              <div className="px-3 pb-6">
                <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                  {albumTab === 'stickers' && (
                    <div className="grid grid-cols-4 gap-2.5 animate-in fade-in duration-500">
                      {Object.values(STICKERS_BASE).map(st => (
                        <div key={st.id} className={`aspect-square rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-500 transform hover:scale-105 active:scale-90 ${unlockedStickers.includes(st.id) ? 'bg-white border-white shadow-md' : 'bg-black/20 border-white/5 opacity-20 grayscale'}`}>
                          {unlockedStickers.includes(st.id) ? st.emoji : ''}
                        </div>
                      ))}
                    </div>
                  )}
                  {albumTab === 'memory' && (
                    <div className="grid grid-cols-4 gap-2.5 animate-in fade-in duration-500">
                      {songs.filter(s => !s.isUserCreated).map(s => (
                        <div key={s.id} className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-500 transform hover:scale-105 active:scale-90 ${memoryMedals.includes(s.id) ? 'bg-indigo-100 border-indigo-200 text-indigo-600 shadow-md' : 'bg-black/20 border-white/5 opacity-20'}`}>
                          {memoryMedals.includes(s.id) ? <Medal size={22} className="fill-indigo-600/20" /> : <Brain size={18} className="opacity-50" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {albumTab === 'perf' && (
                    <div className="flex flex-col gap-2 animate-in fade-in duration-500">
                      {userPerformances.length === 0 ? (
                        <div className="text-center py-10 opacity-30 font-black text-[10px] uppercase">Aún no hay conciertos grabados</div>
                      ) : (
                        userPerformances.map(p => (
                          <div key={p.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-indigo-400">{p.song_title || "MI OBRA"}</span>
                              <span className="text-[8px] font-bold text-white/20 uppercase">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => { setPerformanceLog(p.log_data); setStartTime(0); startPlayback(); }} className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 group-hover:scale-110 transition-transform">
                              <Play size={16} fill="white" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/20 w-1/2 animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              <div className={`w-full max-w-xs flex flex-col gap-3 ${isPassportExpanded ? 'opacity-20 scale-75 blur-[2px] mt-2' : 'opacity-100 scale-100 mt-6'}`}>
                <button
                  onClick={() => { updateProfileOnServer(profile, totalScore); setView('menu'); setIsPassportExpanded(false); }}
                  className="group w-full bg-white text-indigo-950 p-6 rounded-3xl font-black text-xl uppercase shadow-[0_10px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-3 hover:scale-105"
                >
                  <CheckCircle2 size={24} className="group-hover:animate-bounce" /> LISTO
                </button>
                <button
                  onClick={() => {
                    updateProfileOnServer(profile, totalScore);
                    setUserId(null);
                    setSongs([]);
                    setUserPerformances([]);
                    setMemoryMedals([]);
                    setUnlockedStickers([]);
                    setView('auth');
                    setIsPassportExpanded(false);
                  }}
                  className="group w-full bg-white/5 border border-white/10 text-white/50 p-4 rounded-3xl font-black text-sm uppercase active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={16} /> CAMBIAR MÚSICO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ÉXITO / INTENTO */}
        {view === 'success' && currentSong && (() => {
          const isFailed = sessionErrors >= 3;
          const isPerfect = !isFailed && sessionErrors === 0;

          const currentIndex = mapSongs.findIndex(s => s.id === currentSong.id);
          const nextSong = currentIndex >= 0 && currentIndex < mapSongs.length - 1 ? mapSongs[currentIndex + 1] : null;

          return (
            <div className="absolute inset-0 z-40 bg-indigo-950 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
              <div className="relative mb-8 scale-150">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-5xl shadow-2xl border-4 border-white/20 animate-bounce">
                  {STICKERS_BASE[currentSong.stickerId]?.emoji || '🎵'}
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                {[1, 2, 3].map((star, i) => (
                  <Star
                    key={star}
                    size={48}
                    className={`transition-all duration-1000 delay-[${i * 300}ms] ${isFailed ? 'text-white/20 fill-black/20' :
                      isPerfect ? 'fill-yellow-400 text-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse' :
                        'fill-slate-300 text-slate-400 drop-shadow-[0_0_15px_rgba(203,213,225,0.6)] animate-pulse'
                      }`}
                  />
                ))}
              </div>

              <h2 className={`text-4xl font-black mb-10 italic uppercase tracking-tighter ${isFailed ? 'text-red-400' : 'text-white'}`}>
                {isFailed ? '¡VUELVE A INTENTARLO, TÚ PUEDES!' : '¡LO LOGRASTE!'}
              </h2>

              <div className="flex flex-col gap-3 w-full max-w-sm">

                {/* ROW 1: Next Lesson & Retry */}
                <div className="flex gap-3 w-full">
                  {nextSong && !isFailed ? (
                    <button
                      onClick={() => startLevel(nextSong, 'solo')}
                      className="flex-1 p-5 bg-green-500 text-white rounded-3xl font-black text-lg shadow-[0_8px_0_#166534] hover:bg-green-400 active:translate-y-2 active:shadow-[0_0px_0_#166534] transition-all uppercase flex items-center justify-center gap-3 drop-shadow-xl"
                    >
                      <Play size={24} fill="white" /> Siguiente Lección
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <button
                    onClick={() => startLevel(currentSong, mode)}
                    className="w-16 h-16 shrink-0 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_6px_0_#3730a3] hover:bg-indigo-500 active:translate-y-1.5 active:shadow-[0_0px_0_#3730a3] transition-all self-center"
                    title="Repetir Lección"
                  >
                    <RotateCcw size={24} />
                  </button>
                </div>

                {/* ROW 2: Concert */}
                {performanceLog.length > 0 && mode !== 'oído' && (
                  <button
                    onClick={startPlayback}
                    className="w-full mt-2 p-5 bg-orange-500 text-white rounded-3xl font-black text-md shadow-[0_6px_0_#9a3412] hover:bg-orange-400 active:translate-y-1.5 active:shadow-[0_0px_0_#9a3412] transition-all uppercase flex items-center justify-center gap-3"
                  >
                    <Volume2 size={20} /> OÍR MI CONCIERTO
                  </button>
                )}

                {/* ROW 3: Home */}
                <button
                  onClick={() => setView('menu')}
                  className="mt-6 w-14 h-14 mx-auto bg-white/10 text-white rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 active:scale-95 transition-all shadow-lg"
                  title="Menú Principal"
                >
                  <Home size={20} className="opacity-80 drop-shadow-md" />
                </button>

              </div>
            </div>
          )
        })()}

        {/* JUEGO */}
        {view === 'game' && currentSong && (
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {/* ADHD PROGRESS BAR */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-50">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${(step / currentSong.sequence.length) * 100}%` }}
              />
            </div>

            {isCalmMode && mode !== 'detective' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-indigo-600/40 backdrop-blur-md rounded-full border border-indigo-400/30 flex items-center gap-2 animate-pulse">
                <Sparkles size={14} className="text-indigo-300" />
                <span className="text-[10px] font-black uppercase italic text-indigo-100 tracking-widest">Modo Calma Activo</span>
              </div>
            )}
            {mode !== 'oído' && (
              <div className={`absolute bottom-0 w-full h-[120px] bg-gradient-to-t from-white/10 to-transparent border-t-2 z-10 transition-all duration-500 ${noteReady ? 'border-green-500/50 shadow-lg' : 'border-red-500/20 opacity-30'}`}>
                <div className="flex justify-center pt-4"><ChevronDown className={`transition-all duration-300 ${noteReady ? 'text-green-400 animate-bounce scale-125' : 'text-red-500/20'}`} size={28} /></div>
              </div>
            )}
            <div className="flex-1 relative flex justify-around px-2">
              {mode === 'detective' ? (
                <div className="flex flex-col items-center justify-center w-full gap-8 animate-in zoom-in h-full">
                  {!showDirectionFeedback ? (
                    <div className="flex flex-col items-center gap-12 mt-10 w-full max-w-sm">
                      {/* Avatar Detective */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-40 h-40 bg-indigo-500/10 rounded-full animate-pulse" />
                        <div className="relative bg-white/10 backdrop-blur-md w-32 h-32 rounded-full border-4 border-indigo-500/50 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] z-10">
                          <span className="text-6xl drop-shadow-md animate-bounce" style={{ animationDuration: '3s' }}>{STICKERS_BASE[profile.avatarId]?.emoji || '👤'}</span>
                          <Search size={32} className="text-yellow-400 absolute -bottom-2 -right-2 drop-shadow-lg" />
                        </div>
                        {/* Pequeñas estrellas animadas */}
                        <Sparkles size={20} className="text-yellow-300 absolute -top-4 left-0 animate-pulse" />
                        <Sparkles size={16} className="text-yellow-100 absolute bottom-4 -left-6 animate-pulse" style={{ animationDelay: '500ms' }} />
                      </div>

                      {/* Botón de Oreja Mágica Gigante Dorado (Sin Texto) */}
                      <button
                        onClick={() => {
                          const target = currentSong.sequence[stepRef.current];
                          if (target) playSynth(FREQUENCIES[target], 'triangle', 0.3, 0.8);
                        }}
                        className="relative group active:scale-95 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[30px] opacity-40 group-hover:opacity-60 animate-pulse transition-opacity duration-500" />
                        <div className="relative w-36 h-36 bg-gradient-to-tr from-yellow-500 via-yellow-400 to-yellow-200 rounded-[3rem] border-4 border-white/40 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.5),inset_0_-8px_20px_rgba(161,98,7,0.4)]">
                          <Ear size={72} className="text-white drop-shadow-lg group-active:scale-90 transition-transform duration-200" />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
                      <div className="text-center w-full bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md relative overflow-hidden">
                        {/* Graphical animated radar lines */}
                        <div className="absolute inset-0 opacity-20" style={{
                          background: `repeating-linear-gradient(${showDirectionFeedback.dir === 'left' ? '-45deg' : '45deg'}, transparent, transparent 10px, white 10px, white 20px)`
                        }} />

                        <div className="relative z-10 flex flex-col items-center gap-6">
                          <div className="flex items-center gap-4">
                            {showDirectionFeedback.dir === 'left' ? (
                              <>
                                <Mountain size={64} className="text-orange-300 animate-pulse drop-shadow-md" />
                                <div className="p-4 rounded-full bg-orange-500 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                  <ChevronLeft size={64} className="text-white animate-bounce" />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="p-4 rounded-full bg-cyan-500 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                  <ChevronRight size={64} className="text-white animate-bounce" />
                                </div>
                                <div className="relative">
                                  <Bird size={64} className="text-cyan-300 animate-bounce drop-shadow-md" />
                                  <Feather size={24} className="text-cyan-200 absolute -top-4 -right-4 animate-spin-slow" />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Intensity dots */}
                          <div className="flex gap-2 mt-2">
                            {Array.from({ length: Math.min(5, showDirectionFeedback.distance) }).map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full animate-pulse ${showDirectionFeedback.dir === 'left' ? 'bg-orange-400' : 'bg-cyan-400'}`} style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : mode !== 'oído' ? (
                <div className="absolute inset-0 ease-out transition-transform" style={{ transform: `translateY(${cumulativePositions[step] * 100}px)`, transitionDuration: `${(getIntervalMs(currentSong?.speed) / tempoFactor) * (currentSong?.sequence[step] ? parseNote(currentSong.sequence[step]).duration : 1)}ms` }}>
                  {currentSong.sequence.map((n, i) => {
                    if (i < step - 1 || i > step + 12) return null;
                    let op = "opacity-90"; let sc = "scale-95";
                    if (i < step) op = "opacity-0 scale-50";
                    else if (i === step) { op = noteReady ? "opacity-100 ring-4 ring-white shadow-2xl" : "opacity-60 blur-[1px]"; sc = noteReady ? "scale-110" : "scale-100"; }
                    else if (memoryMode) op = combo >= 10 ? "opacity-0" : combo >= 5 ? "opacity-25" : "opacity-80";

                    // Desaturación en modo calma
                    const parsed = parseNote(n);
                    const noteColor = isCalmMode ? `${NOTE_COLORS[parsed.pitch]}AA` : NOTE_COLORS[parsed.pitch];
                    const isSharp = parsed.pitch.includes('#');
                    const noteWidthClass = isSharp ? "w-[10%]" : "w-[13%]";
                    const noteLeftPercent = getNotePositionPercent(parsed.pitch);
                    const noteHeight = Math.max(26, Math.round(parsed.duration * 80));

                    return (
                      <div key={i} className={`absolute ${noteWidthClass} rounded-[1.2rem] flex flex-col items-center justify-center border-2 border-white/40 transition-all duration-500 ${op} ${sc}`} style={{ backgroundColor: noteColor, left: `${noteLeftPercent}%`, bottom: `${cumulativePositions[i] * 100 + 10}px`, height: `${noteHeight}px` }}>
                        <span className={`${noteHeight < 45 ? 'text-xs font-black' : 'text-xl sm:text-2xl font-black'} text-white drop-shadow-md`}>{NOTE_NAMES[parsed.pitch]}</span>
                        {parsed.duration !== 1 && (
                          <span className="absolute -bottom-2 text-[9px] font-black uppercase text-white/80 bg-black/60 px-1.5 py-0.2 rounded-full border border-white/20 shadow-sm">{parsed.duration}x</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full gap-8 animate-in zoom-in h-full">
                  <div className={`p-10 rounded-[3rem] border-4 transition-all duration-500 ${isPreviewing ? 'bg-indigo-600/30 border-indigo-500 animate-pulse scale-110 shadow-[0_0_40px_rgba(99,102,241,0.4)]' : 'bg-green-600/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]'}`}>
                    {isPreviewing ? <Volume2 size={100} className="text-indigo-400" /> : <Ear size={100} className="text-green-400 animate-bounce" />}
                  </div>
                  <div className="text-center">
                    <h2 className="text-5xl font-black italic uppercase text-center tracking-tighter mb-4">
                      {isPreviewing ? "¡ESCUCHA!" : "¡TU TURNO!"}
                    </h2>
                    <div className="flex justify-center gap-2">
                      {currentSong.sequence.map((_, i) => {
                        if (i >= simonStep) return null;
                        return (
                          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < userSimonIndex ? 'bg-green-500 scale-125' : 'bg-white/20'}`} />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PARENT GATE */}
        {view === 'parent_gate' && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="bg-white/5 p-10 rounded-[3rem] border-4 border-indigo-500 shadow-2xl w-full max-w-sm text-center">
              <Settings className="mx-auto text-indigo-400 mb-4" size={40} />
              <h2 className="text-xl font-black mb-6 uppercase tracking-tighter text-indigo-200">Entrada</h2>
              <div className="text-4xl font-black text-white mb-6 bg-black/40 py-6 rounded-3xl border border-white/5">{parentMath.v1} + {parentMath.v2}</div>
              <input type="number" value={parentMath.result} onChange={(e) => setParentMath({ ...parentMath, result: e.target.value })} className="w-full bg-white/10 border-4 border-indigo-500/30 p-5 rounded-2xl text-center text-3xl font-black outline-none mb-6 focus:border-indigo-400" autoFocus />
              <button onClick={async () => {
                if (parseInt(parentMath.result) === parentMath.v1 + parentMath.v2) {
                  // Refresh users to have latest data in admin panel
                  try {
                    const res = await fetch(`${API_URL}?action=get_users`);
                    const data = await res.json();
                    setUsers(data || []);
                    await fetchAdminSongs();
                  } catch (e) { console.error(e); }
                  setView('admin');
                } else {
                  setParentMath({ ...parentMath, result: '' });
                }
              }} className="w-full p-4 bg-indigo-600 rounded-xl font-bold uppercase shadow-lg active:scale-95">Entrar</button>
            </div>
          </div>
        )}

        {/* ADMINISTRACIÓN */}
        {view === 'admin' && (
          <div className="fixed inset-0 z-[80] bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-8 overflow-y-auto flex justify-center items-start">
            <div className="w-full max-w-6xl my-auto bg-slate-900 border-2 border-indigo-500/50 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in fade-in">
              <div className="flex justify-between items-center mb-8 bg-white/5 p-4 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
                    <Settings size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tighter leading-tight">Panel de Control</h2>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest opacity-70">Gestión de la Academia Galáctica - Edición de Lecciones y Alumnos</p>
                  </div>
                </div>
                <button
                  onClick={() => setView('menu')}
                  className="p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-white/60 hover:text-white cursor-pointer"
                  title="Cerrar Panel"
                >
                  <X size={24} />
                </button>
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setAdminTab('lessons')}
                  className={`flex-1 p-4 sm:p-5 rounded-3xl font-black uppercase text-xs sm:text-sm tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer ${adminTab === 'lessons' ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] ring-2 ring-indigo-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  <Music size={22} />
                  Gestión de Lecciones
                </button>
                <button
                  onClick={() => setAdminTab('musicians')}
                  className={`flex-1 p-4 sm:p-5 rounded-3xl font-black uppercase text-xs sm:text-sm tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer ${adminTab === 'musicians' ? 'bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.4)] ring-2 ring-purple-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  <Users size={22} />
                  Gestión de Músicos
                </button>
              </div>

              <div className="w-full">
                {/* SECCIÓN MÚSICOS */}
                {adminTab === 'musicians' && (
                  <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                      <Users className="text-purple-400" size={24} />
                      <h3 className="font-black uppercase text-lg tracking-widest text-white/80">Músicos Registrados ({users.length})</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                      {users.map(u => (
                        <div key={u.id} className="bg-black/40 border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                              {STICKERS_BASE[u.avatar_id]?.emoji || '👤'}
                            </div>
                            <div>
                              <div className="font-black text-sm uppercase tracking-tight text-white mb-0.5">{u.name}</div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold text-white/30 uppercase">ID: {u.id}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-indigo-400">{u.total_score || 0}</div>
                            <div className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">PUNTOS</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECCIÓN LECCIONES GLOBALES */}
                {adminTab === 'lessons' && (
                  <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Music className="text-indigo-400" size={24} />
                        <h3 className="font-black uppercase text-lg tracking-widest text-white/80">Lecciones ({adminSongs.length})</h3>
                      </div>
                      <button
                        onClick={() => {
                          setEditingSong({ title: 'NUEVA LECCIÓN', sequence: ['C:1'], stickerId: 1, speed: 100, rhythm: 'pop', targetOrder: adminSongs.length + 1 });
                          setIsEditingSong(true);
                        }}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 font-black text-xs uppercase cursor-pointer"
                      >
                        <Plus size={18} /> <span>Nueva Lección</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                      {adminSongs.map((song, idx) => (
                        <div key={song.id} className="bg-black/40 border border-white/5 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-indigo-500/40 transition-all gap-4">

                          {/* Left: Move Controls + Avatar + Info */}
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                              <button
                                onClick={() => handleReorder(idx, -1)}
                                disabled={idx === 0}
                                className={`p-1.5 bg-white/5 rounded-lg hover:bg-white/20 transition-all cursor-pointer ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'text-indigo-300'}`}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <span className="text-[10px] font-black text-white/40">#{idx + 1}</span>
                              <button
                                onClick={() => handleReorder(idx, 1)}
                                disabled={idx === adminSongs.length - 1}
                                className={`p-1.5 bg-white/5 rounded-lg hover:bg-white/20 transition-all cursor-pointer ${idx === adminSongs.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-indigo-300'}`}
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>

                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                              {STICKERS_BASE[song.stickerId]?.emoji || '🎵'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-black text-base uppercase tracking-tight text-white mb-1 truncate">{song.title}</div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 bg-purple-500/20 rounded-full text-[9px] font-black text-purple-300 uppercase tracking-widest">{song.rhythm}</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase">{song.sequence?.length || 0} NOTAS</span>
                              </div>
                              <div className="text-xs font-mono text-white/30 truncate max-w-xs sm:max-w-md" title={song.sequence?.join(' - ')}>
                                {song.sequence?.join(' - ')}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              onClick={() => {
                                setEditingSong({ ...song, targetOrder: idx + 1 });
                                setIsEditingSong(true);
                              }}
                              className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded-xl text-indigo-300 transition-all flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
                              title="Editar"
                            >
                              <Pencil size={14} /> <span>Editar</span>
                            </button>
                            <button
                              onClick={async () => {
                                const copy = { ...song, title: `${song.title} (COPIA)`, id: undefined, order_index: adminSongs.length + 1 };
                                await fetch(`${API_URL}?action=add_song`, {
                                  method: 'POST',
                                  body: JSON.stringify({ ...copy, userId: null })
                                });
                                await fetchAdminSongs();
                              }}
                              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/40 border border-green-500/30 rounded-xl text-green-300 transition-all flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
                              title="Duplicar"
                            >
                              <Save size={14} /> <span>Duplicar</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('¿Seguro que quieres borrar esta lección?')) return;
                                await fetch(`${API_URL}?action=delete_song`, {
                                  method: 'POST',
                                  body: JSON.stringify({ id: song.id })
                                });
                                await fetchAdminSongs();
                              }}
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-red-300 transition-all cursor-pointer"
                              title="Borrar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 bg-indigo-600/10 border border-indigo-500/20 p-4 sm:p-6 rounded-[2.5rem] flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div className="font-black text-xs uppercase tracking-widest text-indigo-200">Total de Músicos: {users.length}</div>
                </div>
                <button
                  onClick={() => setView('menu')}
                  className="px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black text-sm uppercase shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Volver al Menú
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITOR DE LECCIONES */}
        {isEditingSong && editingSong && (
          <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xl p-4 sm:p-6 lg:p-10 overflow-y-auto flex items-start justify-center">
            <div className="w-full max-w-lg lg:max-w-5xl xl:max-w-6xl bg-slate-900 border-2 border-indigo-500 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in fade-in my-auto">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-indigo-400 tracking-tighter">Editor Galáctico de Lecciones</h3>
                  <p className="text-xs text-white/50 font-medium">Versión PC / Desktop - Edición de lecciones para chicos</p>
                </div>
                <button
                  onClick={() => setIsEditingSong(false)}
                  className="p-3 bg-white/5 hover:bg-white/15 rounded-2xl text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Cerrar"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COLUMNA IZQUIERDA: CONFIGURACIÓN GENERAL */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Título de la canción */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Nombre de la canción</label>
                    <input
                      value={editingSong.title}
                      onChange={e => setEditingSong({ ...editingSong, title: e.target.value.toUpperCase() })}
                      className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl font-black text-xl text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Posición / Orden de Aparición */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center ml-4 pr-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Orden / Posición de aparición (#)</label>
                      <span className="text-[10px] font-bold text-indigo-400">Total: {adminSongs.length + (editingSong.id ? 0 : 1)}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={adminSongs.length + (editingSong.id ? 0 : 1)}
                      value={editingSong.targetOrder ?? (adminSongs.findIndex(s => s.id === editingSong.id) >= 0 ? adminSongs.findIndex(s => s.id === editingSong.id) + 1 : adminSongs.length + 1)}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setEditingSong({ ...editingSong, targetOrder: isNaN(val) ? 1 : val });
                      }}
                      className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl font-black text-xl text-white outline-none focus:border-indigo-500 transition-all"
                      placeholder="Ej: 1 (primera), 2, 3..."
                    />
                  </div>

                  {/* Selector de Icono (Biblioteca) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Biblioteca de Iconos</label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-2 bg-white/5 p-4 rounded-[2rem] border border-white/10 max-h-[160px] overflow-y-auto scrollbar-hide">
                      {Object.values(STICKERS_BASE).map(st => (
                        <button
                          key={st.id}
                          onClick={() => setEditingSong({ ...editingSong, stickerId: st.id })}
                          className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${editingSong.stickerId === st.id ? 'bg-indigo-600 scale-110 shadow-lg ring-2 ring-indigo-400' : 'bg-black/20 opacity-40 hover:opacity-100'}`}
                        >
                          {st.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ritmo y Velocidad */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Ritmo</label>
                      <select
                        value={editingSong.rhythm}
                        onChange={e => {
                          const rhythmVal = e.target.value;
                          const speedVal = rhythmVal === 'clasico' ? 136 : editingSong.speed;
                          setEditingSong({ ...editingSong, rhythm: rhythmVal, speed: speedVal });
                        }}
                        className="bg-white/5 border border-white/10 p-4 rounded-2xl font-bold text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="pop" className="bg-slate-900">POP (4/4)</option>
                        <option value="rock" className="bg-slate-900">ROCK (Fuerte)</option>
                        <option value="clasico" className="bg-slate-900">CLÁSICO (Elegante - 136 BPM)</option>
                        <option value="bubble" className="bg-slate-900">BUBBLE (Balada)</option>
                        <option value="robot" className="bg-slate-900">ROBOT (Rápido)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Velocidad (BPM)</label>
                      <input
                        type="number"
                        min="30"
                        max="300"
                        value={editingSong.speed === '' ? '' : editingSong.speed}
                        onChange={e => setEditingSong({ ...editingSong, speed: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        className="bg-white/5 border border-white/10 p-4 rounded-2xl font-bold text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={async () => {
                        const isNew = !editingSong.id;
                        const action = isNew ? 'add_song' : 'update_song';
                        const desiredPos = parseInt(editingSong.targetOrder) || (adminSongs.length + (isNew ? 1 : 0));
                        const targetIdx = Math.max(0, desiredPos - 1);

                        const body = {
                          ...editingSong,
                          userId: null,
                          is_user_created: 0,
                          isUserCreated: false,
                          order_index: targetIdx
                        };

                        const saveRes = await fetch(`${API_URL}?action=${action}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body)
                        });
                        const saveObj = await saveRes.json();
                        const songId = editingSong.id || saveObj?.id;

                        // Fetch current list from backend
                        const res = await fetch(`${API_URL}?action=get_admin_songs`);
                        let latestSongs = await res.json();
                        if (Array.isArray(latestSongs) && latestSongs.length > 0 && songId) {
                          const targetItem = latestSongs.find(s => String(s.id) === String(songId));
                          const filtered = latestSongs.filter(s => String(s.id) !== String(songId));

                          if (targetItem) {
                            const clampedIdx = Math.max(0, Math.min(filtered.length, targetIdx));
                            filtered.splice(clampedIdx, 0, targetItem);

                            const payload = filtered.map((song, i) => ({
                              id: song.id,
                              order_index: i
                            }));

                            await fetch(`${API_URL}?action=reorder_songs`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orders: payload })
                            });
                          }
                        }

                        setIsEditingSong(false);
                        await fetchAdminSongs();
                        if (userId) {
                          const resSongs = await fetch(`${API_URL}?action=get_songs&user_id=${userId}&instrument=piano`);
                          const userSongs = await resSongs.json();
                          if (Array.isArray(userSongs)) {
                            setSongs(userSongs.sort((a, b) => (Number(a.order_index ?? a.id)) - (Number(b.order_index ?? b.id))));
                          }
                        }
                      }}
                      className="flex-1 p-5 bg-gradient-to-tr from-green-600 to-emerald-500 text-white rounded-2xl font-black text-lg uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Save size={22} /> Guardar Lección
                    </button>
                    <button
                      onClick={() => setIsEditingSong(false)}
                      className="px-6 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm uppercase transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                {/* COLUMNA DERECHA: EDICIÓN DE NOTAS Y SECUENCIA */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Secuencia Manual (Texto) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Importar Secuencia de Texto</label>
                    <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-[2rem] border border-white/10">
                      <textarea
                        value={rawSequenceText}
                        onChange={e => setRawSequenceText(e.target.value)}
                        placeholder="Pega las notas separadas por espacios, ej: C C G G A A G C:0.5 R:1"
                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm resize-none h-24 outline-none focus:border-indigo-500 transition-all placeholder:text-white/20"
                      />
                      <button
                        onClick={() => {
                          if (!rawSequenceText.trim()) return;
                          const tokens = rawSequenceText.trim().split(/\s+/);
                          const newSeq = [];
                          tokens.forEach(t => {
                            const parts = t.toUpperCase().split(':');
                            const cleanPitch = parts[0].replace(/[^A-Z#]/g, '');
                            if (NOTE_NAMES.hasOwnProperty(cleanPitch)) {
                              const dur = parts.length > 1 ? parts[1].replace(/[^0-9.]/g, '') : '1';
                              newSeq.push(`${cleanPitch}:${dur}`);
                            }
                          });
                          if (newSeq.length > 0) {
                            setEditingSong({ ...editingSong, sequence: newSeq });
                          }
                          setRawSequenceText('');
                        }}
                        className="self-end px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer"
                      >
                        Importar Texto
                      </button>
                    </div>
                  </div>

                  {/* Notas y Música (Visual) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between ml-4 pr-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Secuencia Melódica Visual: {editingSong.sequence?.length || 0} Notas</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (!editingSong.sequence || editingSong.sequence.length === 0) return;
                            setIsPreviewing(true);
                            stopPreviewRef.current = false;
                            const baseSpeed = getIntervalMs(editingSong.speed);
                            for (let i = 0; i < editingSong.sequence.length; i++) {
                              const n = editingSong.sequence[i];
                              if (!isEditingSong || stopPreviewRef.current) break;
                              const parsed = parseNote(n);
                              setDetectedNote(parsed.pitch);
                              playSynth(FREQUENCIES[parsed.pitch], 'triangle', 0.3, 0.8);
                              await new Promise(r => setTimeout(r, Math.max(baseSpeed * parsed.duration, 200)));
                            }
                            setDetectedNote(null);
                            setIsPreviewing(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                          title="Escuchar secuencia"
                        >
                          <Volume2 size={14} /> Play
                        </button>
                        {isPreviewing && (
                          <button
                            onClick={() => {
                              stopPreviewRef.current = true;
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-black uppercase tracking-wider transition-all animate-in fade-in cursor-pointer"
                            title="Detener secuencia"
                          >
                            <Square size={14} fill="currentColor" /> Stop
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 sm:p-5 rounded-[2rem] border border-white/10 flex flex-wrap gap-2 max-h-[350px] overflow-y-auto scrollbar-hide">
                      {editingSong.sequence && editingSong.sequence.length > 0 && (
                        <button
                          onClick={() => {
                            const newSeq = ['C:1', ...editingSong.sequence];
                            setEditingSong({ ...editingSong, sequence: newSeq });
                          }}
                          className="w-5 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/30 hover:text-white transition-all mx-0.5 cursor-pointer"
                          title="Insertar nota al principio"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                      {editingSong.sequence && editingSong.sequence.map((n, i) => {
                        const parsed = parseNote(n);
                        return (
                          <div key={i} className="flex items-center gap-1">
                            <div className="relative group/note flex flex-col items-center gap-1">
                              <select
                                className="w-14 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg cursor-pointer outline-none appearance-none text-center transition-all hover:scale-110"
                                style={{
                                  backgroundColor: NOTE_COLORS[parsed.pitch],
                                  color: parsed.pitch === 'R' ? '#94a3b8' : 'white',
                                  border: parsed.pitch === 'R' ? '2px dashed #475569' : 'none'
                                }}
                                value={parsed.pitch}
                                onChange={(e) => {
                                  const newSeq = [...editingSong.sequence];
                                  newSeq[i] = `${e.target.value}:${parsed.duration}`;
                                  setEditingSong({ ...editingSong, sequence: newSeq });
                                }}
                              >
                                {Object.entries(NOTE_NAMES).map(([pitch, label]) => (
                                  <option key={pitch} value={pitch} className="bg-slate-800 text-white font-sans font-bold">
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const durs = [1, 0.5, 0.25, 2];
                                  const nextDur = durs[(durs.indexOf(parsed.duration) + 1) % durs.length] || 1;
                                  const newSeq = [...editingSong.sequence];
                                  newSeq[i] = `${parsed.pitch}:${nextDur}`;
                                  setEditingSong({ ...editingSong, sequence: newSeq });
                                }}
                                className="text-[8px] font-black uppercase text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 hover:bg-indigo-500/30 transition-all cursor-pointer"
                                title="Cambiar Ritmo"
                              >
                                {parsed.duration}x
                              </button>
                              <button
                                onClick={() => {
                                  const newSeq = editingSong.sequence.filter((_, idx) => idx !== i);
                                  setEditingSong({ ...editingSong, sequence: newSeq });
                                }}
                                className="absolute -top-1 -right-1 bg-red-600 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/note:opacity-100 transition-all z-10 cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const newSeq = [...editingSong.sequence];
                                newSeq.splice(i + 1, 0, 'C:1');
                                setEditingSong({ ...editingSong, sequence: newSeq });
                              }}
                              className="w-5 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/30 hover:text-white transition-all mx-0.5 cursor-pointer"
                              title="Insertar nota aquí"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => setEditingSong({ ...editingSong, sequence: [...(editingSong.sequence || []), 'C:1'] })}
                        className="w-10 h-10 bg-indigo-600/30 rounded-xl flex items-center justify-center text-indigo-400 border-2 border-dashed border-indigo-500/50 hover:bg-indigo-600 hover:text-white transition-all group cursor-pointer"
                        title="Añadir nota al final"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TECLADO */}
      {
        !['auth', 'id_card', 'parent_gate', 'admin'].includes(view) && (
          <div className={`w-full max-w-7xl h-[85px] sm:h-[120px] lg:h-[140px] shrink-0 bg-slate-950/90 backdrop-blur-xl p-1.5 flex gap-1 sm:gap-2 border-t-2 border-white/10 relative z-30 transition-all rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)]`}>
            {Object.keys(NOTE_NAMES).filter(n => !n.includes('#') && n !== 'R').map((naturalNote) => {
              const sharpNote = naturalNote + '#';
              const hasSharp = ['C', 'D', 'F', 'G', 'A'].includes(naturalNote);

              const renderButton = (note, isSharp) => {
                const isSimonPlayingThisNote = isPreviewing && detectedNote === note;
                const isSimonPlayingOtherNote = isPreviewing && !isSimonPlayingThisNote;
                let isTargetGlow = highlightTarget && currentSong && !isPreviewing && note === currentSong.sequence[stepRef.current];

                const isLabelHidden = mode === 'detective' || (mode === 'boss' && stepRef.current % 2 !== 0);
                if (mode === 'boss' && stepRef.current % 2 !== 0) {
                  isTargetGlow = false;
                }

                return (
                  <button
                    key={note}
                    onMouseDown={(e) => { if (e.cancelable) e.preventDefault(); handleAction(note); }}
                    onMouseUp={(e) => { if (e.cancelable) e.preventDefault(); handleActionUp(note); }}
                    onMouseLeave={() => handleActionUp(note)}
                    onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); handleAction(note); }}
                    onTouchEnd={(e) => { if (e.cancelable) e.preventDefault(); handleActionUp(note); }}
                    className={`
                      touch-none select-none rounded-xl transition-all duration-75 flex flex-col items-center justify-end pb-2 border-b-4 border-black/40 
                      ${isSharp ? 'absolute z-40 top-0 -right-[2px] translate-x-1/2 w-[65%] h-[60%] shadow-[0_5px_15px_rgba(0,0,0,0.5)]' : 'w-full h-full z-30 relative'}
                      ${!isPreviewing ? 'active:border-b-0 active:translate-y-1' : ''}
                      ${detectedNote === note && !isPreviewing ? 'brightness-150 scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.4)] z-[60]' : ''}
                      ${isSimonPlayingOtherNote ? 'opacity-50 grayscale blur-[1px]' : ''}
                      ${isSimonPlayingThisNote ? 'brightness-125 saturate-150 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.7)] z-[60]' : ''}
                      ${isTargetGlow ? 'animate-golden-glow saturate-150 ring-4 ring-yellow-400 z-[60]' : ''}
                    `}
                    style={{
                      backgroundColor: NOTE_COLORS[note],
                      boxShadow: detectedNote === note ? `0 0 ${isPreviewing ? '40px' : '25px'} ${NOTE_COLORS[note]}CC` : (isSupernova ? `0 0 15px ${NOTE_COLORS[note]}88` : (isSharp ? '0 5px 15px rgba(0,0,0,0.5)' : 'none')),
                      filter: isSupernova ? 'saturate(1.5) contrast(1.2)' : 'none'
                    }}
                  >
                    <div className="bg-white/30 px-1 sm:px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-inner pointer-events-none mb-1">
                      <span className={`text-[8px] sm:text-xs font-black text-white drop-shadow-sm transition-opacity duration-300 ${isLabelHidden ? 'opacity-0' : 'opacity-100'}`}>{NOTE_NAMES[note]}</span>
                    </div>
                  </button>
                );
              };

              return (
                <div key={naturalNote} className="flex-1 relative h-full">
                  {renderButton(naturalNote, false)}
                  {hasSharp && renderButton(sharpNote, true)}
                </div>
              );
            })}
          </div>
        )
      }

      {/* SUPERNOVA UI EFFECTS */}
      {
        isSupernova && !isCalmMode && (
          <div className="pointer-events-none fixed inset-0 z-[100] bg-gradient-to-t from-yellow-500/20 via-orange-500/10 to-transparent mix-blend-overlay animate-pulse" />
        )
      }

      {/* MODAL CONFIGURACIÓN DE MICRÓFONO */}
      <MicSettingsModal isOpen={isMicSettingsOpen} onClose={() => setIsMicSettingsOpen(false)} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes golden-glow { 0% { box-shadow: 0 0 5px #facc15; } 50% { box-shadow: 0 0 20px #facc15, 0 0 40px #fbbf24; } 100% { box-shadow: 0 0 5px #facc15; } }
        @keyframes solar-flare { 0% { box-shadow: 0 0 20px rgba(249,115,22,0.4), inset -6px -6px 15px rgba(0,0,0,0.4), inset 4px 4px 10px rgba(255,255,255,0.4); } 50% { box-shadow: 0 0 60px rgba(249,115,22,1), inset -6px -6px 15px rgba(0,0,0,0.6), inset 4px 4px 10px rgba(255,255,255,0.8); } 100% { box-shadow: 0 0 20px rgba(249,115,22,0.4), inset -6px -6px 15px rgba(0,0,0,0.4), inset 4px 4px 10px rgba(255,255,255,0.4); } }
        .animate-golden-glow { animation: golden-glow 1.5s infinite; }
        .animate-solar-flare { animation: solar-flare 2.5s infinite ease-in-out; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div >
  );
};
