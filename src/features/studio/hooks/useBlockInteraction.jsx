import { useState, useEffect, useCallback } from 'react';
import { useStudioStore } from '../store/useStudioStore';

/**
 * Hook para gestionar el Drag & Trim de bloques en la línea de tiempo.
 */
export function useBlockInteraction(trackId, block, zoomLevel = 1, tempo = 120, trackSpeed = 1) {
    const { updateBlock } = useStudioStore();
    const PIXELS_PER_MS = tempo / 1500;

    // Estado local para Feedback UI en tiempo real
    const [localState, setLocalState] = useState({
        startTime: block.startTime,
        duration: block.duration,
        sourceOffset: block.sourceOffset || 0
    });

    // Estado de interacción
    const [interactionType, setInteractionType] = useState(null); // 'move', 'trim-left', 'trim-right', null
    const [dragStart, setDragStart] = useState({ x: 0, originalStartTime: 0, originalDuration: 0, originalSourceOffset: 0 });

    // Sincronizar con el store si cambia externamente
    useEffect(() => {
        if (!interactionType) {
            setLocalState({
                startTime: block.startTime,
                duration: block.duration,
                sourceOffset: block.sourceOffset || 0
            });
        }
    }, [block.startTime, block.duration, block.sourceOffset, interactionType]);

    // Calcular dimensiones visuales con corrección de velocidad
    const visualLeft = (localState.startTime / trackSpeed) * zoomLevel;
    const visualWidth = Math.max(10, (localState.duration / trackSpeed) * zoomLevel);

    const handleMouseDown = useCallback((e, type) => {
        e.stopPropagation();
        setInteractionType(type);
        setDragStart({
            x: e.clientX,
            originalStartTime: localState.startTime,
            originalDuration: localState.duration,
            originalSourceOffset: localState.sourceOffset
        });
    }, [localState]);

    useEffect(() => {
        if (!interactionType) return;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - dragStart.x;

            // Convertir píxeles a "tiempo" interno considerando zoom y velocidad
            const deltaMs = (deltaX / zoomLevel) * trackSpeed;

            if (interactionType === 'move') {
                setLocalState(prev => ({
                    ...prev,
                    startTime: Math.max(0, dragStart.originalStartTime + deltaMs)
                }));
            }
            else if (interactionType === 'trim-left') {
                // Ajustamos el offset izquierdo
                const maxDelta = dragStart.originalDuration - 20; // mínimo 20ms de ancho
                const clampedDeltaMs = Math.min(maxDelta, deltaMs);

                // No permitir cruzar el límite izquierdo 0
                const finalDeltaMs = Math.max(-dragStart.originalStartTime, clampedDeltaMs);

                setLocalState(prev => ({
                    ...prev,
                    startTime: Math.max(0, dragStart.originalStartTime + finalDeltaMs),
                    duration: Math.max(20, dragStart.originalDuration - finalDeltaMs),
                    // Sólo util para MicTrack (desfase interno del audio original)
                    sourceOffset: Math.max(0, dragStart.originalSourceOffset + finalDeltaMs)
                }));
            }
            else if (interactionType === 'trim-right') {
                // Ajustamos el borde derecho (sólo duración)
                // Capping it so it does not exceed any arbitrary extreme max length is optional, 
                // but let's at least ensure minimum length.
                setLocalState(prev => ({
                    ...prev,
                    duration: Math.max(20, dragStart.originalDuration + deltaMs)
                }));
            }
        };

        const handleMouseUp = () => {
            // Confirmamos el cambio al store
            setLocalState(currentState => {
                updateBlock(trackId, block.id, {
                    startTime: currentState.startTime,
                    duration: currentState.duration,
                    sourceOffset: currentState.sourceOffset
                });
                return currentState;
            });
            setInteractionType(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interactionType, dragStart, trackSpeed, zoomLevel, trackId, block.id, updateBlock]);

    return {
        localState,
        visualLeft,
        visualWidth,
        isInteracting: interactionType !== null,
        handleMouseDown
    };
}
