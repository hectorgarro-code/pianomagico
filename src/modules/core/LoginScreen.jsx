import React, { useState } from 'react';
import { Sparkles, Music, Star, ChevronRight } from 'lucide-react';

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

export default function LoginScreen({ users, onLogin }) {
    const [hoveredUser, setHoveredUser] = useState(null);

    return (
        <div className="min-h-screen bg-[#060b19] font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background FX */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/40 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            {/* Stars */}
            {[...Array(30)].map((_, i) => (
                <div
                    key={i}
                    className="absolute bg-white rounded-full animate-pulse"
                    style={{
                        width: Math.random() * 3 + 1 + 'px',
                        height: Math.random() * 3 + 1 + 'px',
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                        animationDelay: Math.random() * 5 + 's',
                        opacity: Math.random() * 0.7 + 0.3
                    }}
                />
            ))}

            <div className="z-10 flex flex-col items-center w-full max-w-4xl">
                <div className="mb-12 flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-full" />
                        <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center border-4 border-white/20 shadow-2xl rotate-3 hover:rotate-6 transition-all duration-500">
                            <Music className="text-white" size={64} />
                            <Sparkles className="absolute -top-4 -right-4 text-yellow-300 animate-pulse" size={32} />
                            <Star className="absolute -bottom-2 -left-4 text-blue-300 animate-spin-slow" size={24} />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.5)] tracking-tighter uppercase italic">
                        Galaxia Musical
                    </h1>
                    <p className="text-lg text-indigo-200 mt-4 font-bold tracking-widest uppercase bg-indigo-950/50 px-6 py-2 rounded-full border border-indigo-500/30 backdrop-blur-md">
                        Selecciona a tu músico
                    </p>
                </div>

                {users && users.length > 0 ? (
                    <div className="w-full">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
                            {users.map((user) => {
                                const avatar = STICKERS_BASE[user.avatar_id] || STICKERS_BASE[1];
                                const isHovered = hoveredUser === user.id;

                                return (
                                    <button
                                        key={user.id}
                                        onMouseEnter={() => setHoveredUser(user.id)}
                                        onMouseLeave={() => setHoveredUser(null)}
                                        onClick={() => onLogin(user.id)}
                                        className={`relative group bg-slate-900/60 backdrop-blur-xl border-2 rounded-[2rem] p-6 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden shadow-xl
                      ${isHovered ? 'border-indigo-400 scale-105 shadow-indigo-500/40 -translate-y-2' : 'border-slate-700/50 hover:border-indigo-500/50'}`}
                                    >
                                        {/* Hover Glow */}
                                        <div className={`absolute inset-0 bg-gradient-to-b from-${avatar.color.split('-')[1]}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 transition-transform duration-500 shadow-lg ${avatar.color} ${isHovered ? 'scale-110 shadow-[0_0_20px_white]' : ''}`}>
                                            {avatar.emoji}
                                        </div>

                                        <span className={`text-xl font-black uppercase tracking-wider text-center transition-colors duration-300 w-full truncate ${isHovered ? 'text-white drop-shadow-[0_0_10px_white]' : 'text-slate-200'}`}>
                                            {user.name}
                                        </span>

                                        {/* Arrow Indicator */}
                                        <div className={`mt-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isHovered ? 'bg-indigo-500 text-white translate-x-0 opacity-100' : 'bg-slate-800 text-slate-500 -translate-x-4 opacity-0'}`}>
                                            <ChevronRight size={20} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-8 rounded-3xl text-center shadow-2xl max-w-md w-full">
                        <div className="text-4xl mb-4 animate-bounce">🤔</div>
                        <p className="text-xl font-bold text-slate-300 mb-2">No hay músicos registrados.</p>
                        <p className="text-sm text-slate-500">Contacta al administrador para crear una cuenta.</p>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
        </div>
    );
}
