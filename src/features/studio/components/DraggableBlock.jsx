import React from 'react';
import { Trash2 } from 'lucide-react';
import { useBlockInteraction } from '../hooks/useBlockInteraction';
import { useStudioStore } from '../store/useStudioStore';

export default function DraggableBlock({
    trackId,
    block,
    zoomLevel,
    tempo,
    trackSpeed,
    className,
    children,
    onClick
}) {
    const { removeBlockFromTrack } = useStudioStore();
    const {
        localState,
        visualLeft,
        visualWidth,
        isInteracting,
        handleMouseDown
    } = useBlockInteraction(trackId, block, zoomLevel, tempo, trackSpeed);

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm('¿Eliminar este bloque?')) {
            removeBlockFromTrack(trackId, block.id);
        }
    };

    return (
        <div
            className={`absolute top-2 bottom-2 rounded-md border shadow-md flex items-center px-1 overflow-visible backdrop-blur-sm group/block ${className} ${isInteracting ? 'z-50 ring-2 ring-white/50' : 'z-10 hover:z-20'}`}
            style={{
                left: `${visualLeft}px`,
                // El width visual mínimo lo controla el hook
                width: `${visualWidth}px`,
                cursor: 'grab'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            onClick={onClick}
        >
            {/* Botón de eliminar */}
            <button
                onClick={handleDelete}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-opacity z-30 hover:bg-red-600 shadow-lg"
                title="Eliminar bloque"
            >
                <Trash2 size={10} />
            </button>

            {/* Contenido inyectado (nota, onda, etc) */}
            <div className="w-full h-full overflow-hidden flex items-center pt-px relative pointer-events-none">
                {children}
            </div>

            {/* Tirador Izquierdo */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 bg-transparent hover:bg-white/50 cursor-ew-resize flex items-center justify-center -translate-x-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity z-20"
                onMouseDown={(e) => handleMouseDown(e, 'trim-left')}
            >
                <div className="w-0.5 h-3 bg-white rounded-full pointer-events-none shadow"></div>
            </div>

            {/* Tirador Derecho */}
            <div
                className="absolute right-0 top-0 bottom-0 w-2 bg-transparent hover:bg-white/50 cursor-ew-resize flex items-center justify-center translate-x-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity z-20"
                onMouseDown={(e) => handleMouseDown(e, 'trim-right')}
            >
                <div className="w-0.5 h-3 bg-white rounded-full pointer-events-none shadow"></div>
            </div>
        </div>
    );
}
