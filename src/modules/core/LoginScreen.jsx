import React, { useState } from 'react';
import { Sparkles, Music, Star, ChevronRight } from 'lucide-react';

const STICKERS_BASE = {
    1: { id: 1, name: "Elefante", emoji: "🐘", color: "bg-[#1CB0F6] border-[#1899D6]" },
    2: { id: 2, name: "Gato", emoji: "🐱", color: "bg-[#FF9600] border-[#E58700]" },
    3: { id: 3, name: "Oso", emoji: "🐻", color: "bg-[#58CC02] border-[#46A302]" },
    4: { id: 4, name: "Mono", emoji: "🐒", color: "bg-[#FFC800] border-[#E5A500]" },
    5: { id: 5, name: "Zorro", emoji: "🦊", color: "bg-[#FF4B4B] border-[#EA2B2B]" },
    6: { id: 6, name: "León", emoji: "🦁", color: "bg-[#FF9600] border-[#E58700]" },
    7: { id: 7, name: "Jirafa", emoji: "🦒", color: "bg-[#FFC800] border-[#E5A500]" },
    8: { id: 8, name: "Cebra", emoji: "🦓", color: "bg-[#AFAFAF] border-[#8E8E8E]" },
    9: { id: 9, name: "Panda", emoji: "🐼", color: "bg-[#58CC02] border-[#46A302]" },
    10: { id: 10, name: "Koala", emoji: "🐨", color: "bg-[#AFAFAF] border-[#8E8E8E]" },
    11: { id: 11, name: "Tiburón", emoji: "🦈", color: "bg-[#1CB0F6] border-[#1899D6]" },
    12: { id: 12, name: "Rana", emoji: "🐸", color: "bg-[#58CC02] border-[#46A302]" },
    13: { id: 13, name: "Abeja", emoji: "🐝", color: "bg-[#FFC800] border-[#E5A500]" },
    14: { id: 14, name: "Mariposa", emoji: "🦋", color: "bg-[#CE82FF] border-[#A558D8]" },
    15: { id: 15, name: "Ballena", emoji: "🐳", color: "bg-[#1CB0F6] border-[#1899D6]" },
    20: { id: 20, name: "Arcoíris", emoji: "🌈", color: "bg-[#CE82FF] border-[#A558D8]" }
};

export default function LoginScreen({ users, onLogin }) {
    const [hoveredUser, setHoveredUser] = useState(null);

    return (
        <div className="min-h-screen bg-[#F7F7F7] font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-800">
            {/* Background Soft Blobs */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-emerald-200/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[15%] right-[15%] w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[120px]" />
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-4xl">
                {/* Brand Header */}
                <div className="mb-10 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#58CC02] border-b-[6px] border-[#46A302] rounded-[2.5rem] flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <Music className="text-white drop-shadow-md" size={56} />
                            <Sparkles className="absolute -top-3 -right-3 text-[#FFC800] animate-bounce" size={28} />
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black text-[#58CC02] tracking-tight uppercase italic drop-shadow-sm">
                        Academia Galáctica
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-extrabold tracking-widest uppercase mt-2 bg-white px-5 py-2 rounded-2xl border-2 border-slate-200 shadow-sm">
                        ¡Elige tu perfil para comenzar!
                    </p>
                </div>

                {/* Users Grid */}
                {users && users.length > 0 ? (
                    <div className="w-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-2">
                            {users.map((user) => {
                                const avatar = STICKERS_BASE[user.avatar_id] || STICKERS_BASE[1];
                                const isHovered = hoveredUser === user.id;

                                return (
                                    <button
                                        key={user.id}
                                        onMouseEnter={() => setHoveredUser(user.id)}
                                        onMouseLeave={() => setHoveredUser(null)}
                                        onClick={() => onLogin(user.id)}
                                        className={`relative group bg-white border-2 border-b-[6px] rounded-3xl p-5 flex flex-col items-center justify-between transition-all duration-150 cursor-pointer active:translate-y-1 active:border-b-2 ${
                                            isHovered
                                                ? 'border-[#1CB0F6] border-b-[#1899D6] shadow-md -translate-y-1'
                                                : 'border-slate-200 border-b-slate-300 shadow-sm'
                                        }`}
                                    >
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-3 border-b-4 transition-transform duration-200 shadow-inner ${avatar.color} ${isHovered ? 'scale-105' : ''}`}>
                                            <span className="drop-shadow-md">{avatar.emoji}</span>
                                        </div>

                                        <span className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-700 text-center w-full truncate mb-2">
                                            {user.name}
                                        </span>

                                        <div className={`w-full py-2 rounded-xl text-xs font-black uppercase transition-all duration-150 flex items-center justify-center gap-1 ${
                                            isHovered ? 'bg-[#1CB0F6] text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            <span>Entrar</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-8 rounded-3xl text-center shadow-md max-w-md w-full">
                        <div className="text-5xl mb-4 animate-bounce">👋</div>
                        <p className="text-lg font-black text-slate-700 uppercase tracking-tight mb-1">¡No hay músicos aún!</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pide a tu profesor registrar tu cuenta en el panel.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
