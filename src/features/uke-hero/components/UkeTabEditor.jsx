import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, AlignJustify } from 'lucide-react';

const STRING_NAMES = { 4: 'G', 3: 'C', 2: 'E', 1: 'A' };
const FINGER_COLORS = { '0': 'bg-white/10 text-white', '1': 'bg-blue-500 text-white', '2': 'bg-yellow-500 text-slate-900', '3': 'bg-red-500 text-white', '4': 'bg-green-500 text-white' };
const DURATIONS = [
    { value: '4', label: 'Redonda (4)' },
    { value: '2', label: 'Blanca (2)' },
    { value: '1', label: 'Negra (1)' },
    { value: '0.5', label: 'Corchea (½)' },
    { value: '0.25', label: 'Semicorchea (¼)' },
    { value: 'R', label: 'Silencio' }
];

export default function UkeTabEditor({ initialSequence = [], onChange }) {
    const [columns, setColumns] = useState([]);

    // Inicializar columnas basado en initialSequence
    useEffect(() => {
        if (!initialSequence || initialSequence.length === 0) {
            setColumns([createEmptyColumn()]);
            return;
        }

        const parsedColumns = initialSequence.map(noteString => {
            const col = createEmptyColumn();
            const parts = noteString.split(':');
            const pitchPart = parts[0];
            col.duration = parts.length > 1 ? parts[1] : '1';

            if (pitchPart === 'R') {
                col.isRest = true;
            } else {
                const chords = pitchPart.split('+');
                chords.forEach(chord => {
                    const [stringId, fret, finger] = chord.split('-');
                    if (stringId && fret !== undefined) {
                        col.strings[stringId] = { fret, finger: finger || '0' };
                    }
                });
            }
            return col;
        });

        setColumns(parsedColumns);
    }, []); // Solo al montar

    const createEmptyColumn = () => ({
        id: Math.random().toString(36).substring(7),
        duration: '1',
        isRest: false,
        strings: {
            1: { fret: '', finger: '0' },
            2: { fret: '', finger: '0' },
            3: { fret: '', finger: '0' },
            4: { fret: '', finger: '0' }
        }
    });

    const generateSequence = (cols) => {
        return cols.map(col => {
            if (col.isRest) {
                return `R:${col.duration}`;
            }

            const activeStrings = [];
            [1, 2, 3, 4].forEach(stringId => {
                const data = col.strings[stringId];
                if (data.fret !== '') {
                    activeStrings.push(`${stringId}-${data.fret}-${data.finger}`);
                }
            });

            if (activeStrings.length === 0) {
                return `R:${col.duration}`; // Fallback a silencio si no hay traste
            }

            return `${activeStrings.join('+')}:${col.duration}`;
        });
    };

    const handleColumnChange = (newCols) => {
        setColumns(newCols);
        if (onChange) {
            onChange(generateSequence(newCols));
        }
    };

    const addColumn = () => {
        handleColumnChange([...columns, createEmptyColumn()]);
    };

    const removeColumn = (index) => {
        const newCols = columns.filter((_, i) => i !== index);
        if (newCols.length === 0) newCols.push(createEmptyColumn());
        handleColumnChange(newCols);
    };

    const updateCellParams = (colIndex, stringId, field, value) => {
        const newCols = [...columns];
        newCols[colIndex].isRest = false; // Al escribir en un traste, deja de estar en silencio
        newCols[colIndex].strings[stringId][field] = value;
        handleColumnChange(newCols);
    };

    const cycleFinger = (colIndex, stringId) => {
        const newCols = [...columns];
        const currentFinger = parseInt(newCols[colIndex].strings[stringId].finger || '0');
        newCols[colIndex].strings[stringId].finger = ((currentFinger + 1) % 5).toString();
        handleColumnChange(newCols);
    };

    const updateDuration = (colIndex, value) => {
        const newCols = [...columns];
        if (value === 'R') {
            newCols[colIndex].isRest = true;
            newCols[colIndex].duration = '1'; // Default rest duration
        } else {
            newCols[colIndex].duration = value;
        }
        handleColumnChange(newCols);
    };

    return (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 overflow-x-auto w-full custom-scrollbar">
            <div className="flex gap-4 min-w-max">

                {/* Cabecera de Cuerdas (Eje Y) */}
                <div className="flex flex-col gap-2 justify-end pb-8">
                    {[1, 2, 3, 4].reverse().map(stringId => (
                        <div key={stringId} className="h-10 w-8 flex items-center justify-center font-bold text-white/40 text-xs">
                            {STRING_NAMES[stringId]}
                        </div>
                    ))}
                    <div className="h-10 w-8 flex items-center justify-center font-bold text-indigo-400 text-xs mt-2">
                        Dur
                    </div>
                </div>

                {/* Tablatura Grid */}
                <div className="flex gap-2 relative">
                    {/* Líneas Horizontales que cruzan toda la tablatura */}
                    <div className="absolute top-0 left-0 right-0 h-[178px] pointer-events-none flex flex-col gap-2 pt-5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-full h-[1px] bg-white/10 mt-[39px]"></div>
                        ))}
                    </div>

                    {columns.map((col, colIdx) => (
                        <div key={col.id} className="flex flex-col gap-2 relative group z-10 w-14 items-center">

                            {col.isRest && (
                                <div className="absolute top-0 left-0 w-full h-[178px] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20 rounded-lg border border-white/5">
                                    <span className="text-white/30 font-black text-2xl">Z</span>
                                </div>
                            )}

                            {[1, 2, 3, 4].reverse().map(stringId => {
                                const cell = col.strings[stringId];
                                return (
                                    <div key={stringId} className="h-10 w-10 flex items-center justify-center relative">
                                        <input
                                            type="text"
                                            maxLength="2"
                                            value={cell.fret}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                updateCellParams(colIdx, stringId, 'fret', val);
                                            }}
                                            className={`w-8 h-8 rounded-full text-center font-black text-sm outline-none transition-all cursor-text z-30 ${cell.fret !== '' ? FINGER_COLORS[cell.finger] : 'bg-slate-800 text-transparent hover:bg-slate-700 focus:bg-white focus:text-slate-900'}`}
                                            placeholder="-"
                                        />
                                        {cell.fret !== '' && (
                                            <div
                                                onClick={() => cycleFinger(colIdx, stringId)}
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-[8px] font-bold text-white flex items-center justify-center cursor-pointer shadow-md z-40 hover:scale-110 active:scale-95 transition-transform"
                                                title="Cambiar dedo"
                                            >
                                                {cell.finger}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Duration Label */}
                            <select
                                value={col.isRest ? 'R' : col.duration}
                                onChange={(e) => updateDuration(colIdx, e.target.value)}
                                className="mt-2 text-[10px] font-black text-indigo-300 bg-indigo-900/30 border border-indigo-500/30 rounded px-1 py-1 w-12 text-center outline-none appearance-none cursor-pointer"
                            >
                                {DURATIONS.map(d => <option key={d.value} value={d.value} className="bg-slate-800 text-white">{d.label}</option>)}
                            </select>

                            <button
                                onClick={() => removeColumn(colIdx)}
                                className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-0.5 z-50 hover:scale-110"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}

                    {/* Add Button */}
                    <button
                        onClick={addColumn}
                        className="w-14 h-[178px] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/30 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all z-10"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex gap-4 text-[10px] text-white/40 uppercase font-black tracking-wider">
                <span>Click en nro para escribir traste.</span>
                <span>Click en subíndice azul para cambiar dedo (0-4).</span>
                <span>Selecciona 'R' en duración para convertir en silencio.</span>
            </div>
        </div>
    );
}
