import React, { useState } from 'react';
import { Sparkles, Music, Star, ChevronRight, ChevronLeft, Shield, Rocket, Flame, Zap } from 'lucide-react';
import Model3DViewer from './components/Model3DViewer';
import { getCharacterModel, CHARACTER_MODELS } from './utils/characterModels';

const AVAILABLE_AVATARS = [1, 2, 3, 4];

export default function LoginScreen({ users, onLogin }) {
    const [hoveredUser, setHoveredUser] = useState(null);
    const [selectedAvatars, setSelectedAvatars] = useState(() => {
        const initial = {};
        if (users) {
            users.forEach(u => {
                const saved = localStorage.getItem(`user_avatar_${u.id}`);
                initial[u.id] = saved ? Number(saved) : (u.avatar_id || 1);
            });
        }
        return initial;
    });

    const handleCycleAvatar = (userId, direction, e) => {
        e.stopPropagation();
        setSelectedAvatars(prev => {
            const current = prev[userId] || 1;
            const currentIdx = AVAILABLE_AVATARS.indexOf(current);
            const nextIdx = (currentIdx + direction + AVAILABLE_AVATARS.length) % AVAILABLE_AVATARS.length;
            const newAvatarId = AVAILABLE_AVATARS[nextIdx];
            localStorage.setItem(`user_avatar_${userId}`, newAvatarId);
            return { ...prev, [userId]: newAvatarId };
        });
    };

    const handleUserLogin = (userId) => {
        const chosenAvatar = selectedAvatars[userId] || 1;
        localStorage.setItem(`user_avatar_${userId}`, chosenAvatar);
        onLogin(userId);
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden text-white selection:bg-cyan-500">
            {/* Cosmic Space Nebula & Starfield Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[15%] right-[15%] w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[140px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-900/15 rounded-full blur-[160px]" />
                
                {/* Floating Cosmic Particles */}
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-5xl">
                {/* Space Brand Header */}
                <div className="mb-10 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-cyan-600 to-indigo-600 border-b-[6px] border-cyan-800 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <Rocket className="text-white drop-shadow-md" size={56} />
                            <Sparkles className="absolute -top-3 -right-3 text-yellow-300 animate-bounce" size={28} />
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent tracking-tight uppercase italic drop-shadow-[0_4px_12px_rgba(56,189,248,0.3)]">
                        Academia Galáctica
                    </h1>
                    <p className="text-xs sm:text-sm text-cyan-200/80 font-extrabold tracking-widest uppercase mt-3 bg-slate-900/80 px-5 py-2 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
                        ¡Elige y personaliza tu personaje espacial!
                    </p>
                </div>

                {/* Users Grid */}
                {users && users.length > 0 ? (
                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 px-2">
                            {users.map((user) => {
                                const currentAvatarId = selectedAvatars[user.id] || user.avatar_id || 1;
                                const charModel = getCharacterModel(currentAvatarId);
                                const isHovered = hoveredUser === user.id;

                                return (
                                    <div
                                        key={user.id}
                                        onMouseEnter={() => setHoveredUser(user.id)}
                                        onMouseLeave={() => setHoveredUser(null)}
                                        className={`relative group bg-slate-900/85 backdrop-blur-xl border-2 rounded-[2.2rem] p-5 flex flex-col items-center justify-between transition-all duration-300 shadow-2xl ${
                                            isHovered
                                                ? 'border-cyan-400 -translate-y-2 shadow-[0_0_35px_rgba(6,182,212,0.35)]'
                                                : 'border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                                        }`}
                                    >
                                        {/* Top Character Selector Controls */}
                                        <div className="w-full flex items-center justify-between mb-2 px-1 z-20">
                                            <button
                                                type="button"
                                                onClick={(e) => handleCycleAvatar(user.id, -1, e)}
                                                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-600 hover:text-white text-slate-300 transition-all border border-slate-700/60 active:scale-90 cursor-pointer"
                                                title="Personaje Anterior"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>

                                            <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                                                {charModel.role || 'Músico'}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={(e) => handleCycleAvatar(user.id, 1, e)}
                                                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-600 hover:text-white text-slate-300 transition-all border border-slate-700/60 active:scale-90 cursor-pointer"
                                                title="Siguiente Personaje"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>

                                        {/* 3D Character View Stage */}
                                        <div className="w-full h-44 relative flex items-center justify-center mb-2">
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/80 border border-cyan-500/20" />
                                            <Model3DViewer
                                                modelUrl={charModel.file}
                                                animationName={isHovered ? charModel.celebrateAnim : charModel.defaultAnim}
                                                scale={charModel.scale * 1.05}
                                                yOffset={charModel.yOffset}
                                                autoRotate={isHovered}
                                                interactive={true}
                                                fallbackEmoji="🚀"
                                                className="w-full h-full relative z-10"
                                            />
                                            {/* Role Pill */}
                                            <div className="absolute -bottom-2 bg-slate-900 border border-cyan-400/40 px-3 py-0.5 rounded-full text-[10px] font-black uppercase text-cyan-300 shadow-md z-20">
                                                {charModel.name}
                                            </div>
                                        </div>

                                        {/* User Name */}
                                        <span className="text-lg font-black uppercase tracking-wide text-white text-center w-full truncate my-2">
                                            {user.name}
                                        </span>

                                        {/* Action Button: Entrar */}
                                        <button
                                            type="button"
                                            onClick={() => handleUserLogin(user.id)}
                                            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                                                isHovered
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border-b-2 border-cyan-300'
                                                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700'
                                            }`}
                                        >
                                            <span>Entrar</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/90 border-2 border-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-md w-full">
                        <div className="text-5xl mb-4 animate-bounce">🪐</div>
                        <p className="text-lg font-black text-white uppercase tracking-tight mb-1">¡No hay músicos aún!</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pide a tu profesor registrar tu cuenta en el panel.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
