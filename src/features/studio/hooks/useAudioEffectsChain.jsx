import { useEffect, useRef } from 'react';
import { createDistortionCurve, createReverbImpulseResponse } from '../utils/audioEffects';

export function useAudioEffectsChain(audioCtx, trackEffects = [], initialVolume = 1) {
    const inputNodeRef = useRef(null);
    const fxNodesRef = useRef([]);
    const audioParamsRef = useRef({}); // { [fxId]: { time: AudioParam, mix: AudioParam... } }

    useEffect(() => {
        if (!audioCtx) return;
        if (!inputNodeRef.current) {
            inputNodeRef.current = audioCtx.createGain();
            inputNodeRef.current.connect(audioCtx.destination);
        }
    }, [audioCtx]);

    // 1. TOPOLOGÍA: Solo reconstruye el grafo si cambia la catidad, ID o Tipo de efectos
    const topologyKey = JSON.stringify((trackEffects || []).map(fx => ({ id: fx.id, type: fx.type })));

    useEffect(() => {
        if (!audioCtx || !inputNodeRef.current) return;

        const inputNode = inputNodeRef.current;

        // Desconectar todo primero
        inputNode.disconnect();
        fxNodesRef.current.forEach(nodeArr => nodeArr.forEach(n => n && n.disconnect()));
        fxNodesRef.current = [];
        audioParamsRef.current = {};

        if (!trackEffects || trackEffects.length === 0) {
            inputNode.connect(audioCtx.destination);
            return;
        }

        let lastNode = inputNode;

        fxNodesRef.current = trackEffects.map(fx => {
            let coreNode, dryNode, wetNode, outNode;
            const paramsLinks = {}; // Enlaces a los AudioParams reales para este efecto

            outNode = audioCtx.createGain();
            dryNode = audioCtx.createGain();
            wetNode = audioCtx.createGain();

            switch (fx.type) {
                case 'delay':
                case 'slapback': {
                    coreNode = audioCtx.createDelay(5.0);
                    coreNode.delayTime.value = fx.params.time || 0.3;
                    paramsLinks.time = coreNode.delayTime;

                    const feedbackNode = audioCtx.createGain();
                    feedbackNode.gain.value = fx.params.feedback || 0;
                    paramsLinks.feedback = feedbackNode.gain;

                    coreNode.connect(feedbackNode);
                    feedbackNode.connect(coreNode);
                    break;
                }

                case 'reverb_room':
                case 'reverb_hall': {
                    coreNode = audioCtx.createConvolver();
                    const duration = fx.params.time || 1.0;
                    coreNode.buffer = createReverbImpulseResponse(audioCtx, duration, duration);
                    // Reverb (Convolver) no tiene "time" modificable en tiempo real sin reconstruir el buffer
                    // Lo dejamos estático según el valor inicial.
                    break;
                }

                case 'overdrive':
                case 'fuzz':
                    coreNode = audioCtx.createWaveShaper();
                    coreNode.curve = createDistortionCurve((fx.params.drive || 0.5) * 100);
                    coreNode.oversample = '4x';
                    // WaveShaper tampoco tiene audioParam para "drive", requiere regenerar curva.
                    // Para evitar clips pesados lo mantenemos sencillo, si cambian drive no aplica instantaneo
                    // a menos que forzemos rebuild.
                    break;

                case 'lowpass':
                case 'highpass':
                    coreNode = audioCtx.createBiquadFilter();
                    coreNode.type = fx.type;
                    coreNode.frequency.value = fx.params.frequency || 1000;
                    coreNode.Q.value = fx.params.Q || 1;
                    paramsLinks.frequency = coreNode.frequency;
                    paramsLinks.Q = coreNode.Q;
                    break;

                default:
                    coreNode = audioCtx.createGain();
            }

            // Mix
            const mix = fx.params.mix !== undefined ? fx.params.mix : 0.5;

            if (fx.type === 'lowpass' || fx.type === 'highpass') {
                lastNode.connect(coreNode);
                coreNode.connect(outNode);
            } else {
                dryNode.gain.value = 1 - mix;
                wetNode.gain.value = mix;
                paramsLinks._dry = dryNode.gain;
                paramsLinks._wet = wetNode.gain;
                // Exponemos un setter virtual 'mix'
                paramsLinks.mix = {
                    setTargetAtTime: (val, time, constant) => {
                        dryNode.gain.setTargetAtTime(1 - val, time, constant); // Inverso
                        wetNode.gain.setTargetAtTime(val, time, constant);
                    }
                };

                lastNode.connect(dryNode);
                dryNode.connect(outNode);

                lastNode.connect(coreNode);
                coreNode.connect(wetNode);
                wetNode.connect(outNode);
            }

            audioParamsRef.current[fx.id] = paramsLinks;
            lastNode = outNode;

            return [coreNode, dryNode, wetNode, outNode];
        });

        lastNode.connect(audioCtx.destination);

    }, [audioCtx, topologyKey]);

    // 2. PARÁMETROS EN TIEMPO REAL: Aplica cambios a los Knobs sin regenerar topología
    useEffect(() => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        trackEffects.forEach(fx => {
            const paramsMap = audioParamsRef.current[fx.id];
            if (!paramsMap) return;

            Object.entries(fx.params).forEach(([key, val]) => {
                const audioParam = paramsMap[key];
                if (audioParam && typeof audioParam.setTargetAtTime === 'function') {
                    // Smoothing a 50ms para evitar clicks bruscos
                    audioParam.setTargetAtTime(val, now, 0.05);
                } else if (key === 'drive' && (fx.type === 'overdrive' || fx.type === 'fuzz')) {
                    // Especial: WaveShaper. Hay que mutar la curva instanciando una nueva
                    const nodeArr = fxNodesRef.current[trackEffects.indexOf(fx)];
                    if (nodeArr) {
                        const coreNode = nodeArr[0];
                        if (coreNode.curve) {
                            coreNode.curve = createDistortionCurve(val * 100);
                        }
                    }
                }
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioCtx, trackEffects]); // Sí corre cada render que cambia un parámetro

    useEffect(() => {
        if (inputNodeRef.current && audioCtx) {
            inputNodeRef.current.gain.setTargetAtTime(initialVolume, audioCtx.currentTime, 0.05);
        }
    }, [audioCtx, initialVolume]);

    // eslint-disable-next-line
    return { trackInputNode: inputNodeRef.current };
}
