import { Star, LogOut, Music, Mic2 } from 'lucide-react';

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

export default function InstrumentSelection({ profile, onSelectApp, onLogout }) {
    const avatar = STICKERS_BASE[profile?.avatarId] || STICKERS_BASE[1];

    return (
        <div className="min-h-screen bg-[#F7F7F7] font-sans flex flex-col items-center p-4 pt-4 md:pt-6 relative overflow-y-auto text-slate-800">
            {/* Header Profile */}
            <div className="relative w-full max-w-5xl px-2 flex justify-between items-center z-20 mb-6 shrink-0">
                <div className="flex items-center gap-3 bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 p-2 pr-5 rounded-full shadow-sm">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl border-b-2 shadow-inner ${avatar.color}`}>
                        {avatar.emoji}
                    </div>
                    <div>
                        <h2 className="font-black uppercase tracking-wide text-xs md:text-sm text-slate-700">Hola, {profile?.name || 'Músico'}</h2>
                        <div className="flex items-center gap-1.5 text-xs text-[#FFC800] font-black">
                            <Star size={14} fill="currentColor" />
                            <span className="text-slate-600">{profile?.totalScore || 0} PTS</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 p-2.5 md:p-3 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:translate-y-1 active:border-b-2 transition-all shadow-sm group cursor-pointer"
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-5xl my-auto">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#58CC02] drop-shadow-sm tracking-tight uppercase italic mb-1 text-center">
                    Elige tu Instrumento
                </h1>
                <p className="text-slate-400 font-extrabold tracking-widest uppercase mb-8 sm:mb-12 text-center text-xs sm:text-sm">
                    ¿Qué vamos a tocar hoy?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full px-2">

                    {/* Card: Piano Mágico */}
                    <button
                        onClick={() => onSelectApp('piano')}
                        className="group relative bg-white border-2 border-[#1CB0F6] border-b-[8px] border-b-[#1899D6] rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between text-left transition-all duration-150 active:translate-y-1 active:border-b-2 hover:-translate-y-1 cursor-pointer shadow-md overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#1CB0F6] border-b-4 border-[#1899D6] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <Music size={36} className="text-white drop-shadow-md" />
                            </div>
                            <span className="bg-sky-100 text-[#1899D6] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                Recomendado
                            </span>
                        </div>

                        <div>
                            <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight text-[#1CB0F6] mb-2">
                                Piano Mágico
                            </h2>
                            <p className="text-slate-500 font-bold text-sm sm:text-base leading-snug mb-6">
                                Sigue la ruta de estrellas, aprende melodías y domina el teclado en una gran aventura galáctica.
                            </p>
                        </div>

                        <div className="w-full py-3 bg-[#1CB0F6] border-b-4 border-[#1899D6] rounded-2xl text-white font-black text-sm uppercase text-center tracking-wider shadow-sm group-hover:brightness-105">
                            ¡Tocar Piano!
                        </div>
                    </button>

                    {/* Card: Uke Hero */}
                    <button
                        onClick={() => onSelectApp('guitar')}
                        className="group relative bg-white border-2 border-[#FF9600] border-b-[8px] border-b-[#E58700] rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between text-left transition-all duration-150 active:translate-y-1 active:border-b-2 hover:-translate-y-1 cursor-pointer shadow-md overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#FF9600] border-b-4 border-[#E58700] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <span className="text-4xl drop-shadow-md">🎸</span>
                            </div>
                            <span className="bg-amber-100 text-[#E58700] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                4 Cuerdas
                            </span>
                        </div>

                        <div>
                            <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight text-[#FF9600] mb-2">
                                Uke Hero
                            </h2>
                            <p className="text-slate-500 font-bold text-sm sm:text-base leading-snug mb-6">
                                Aprende tus primeras melodías, rasgueos básicos y domina el ukelele paso a paso.
                            </p>
                        </div>

                        <div className="w-full py-3 bg-[#FF9600] border-b-4 border-[#E58700] rounded-2xl text-white font-black text-sm uppercase text-center tracking-wider shadow-sm group-hover:brightness-105">
                            ¡Tocar Ukelele!
                        </div>
                    </button>

                    {/* Card: Music Studio */}
                    <button
                        onClick={() => onSelectApp('studio')}
                        className="group relative bg-white border-2 border-[#CE82FF] border-b-[8px] border-b-[#A558D8] rounded-[2.5rem] p-6 sm:p-8 md:col-span-2 flex flex-col sm:flex-row items-center justify-between text-left transition-all duration-150 active:translate-y-1 active:border-b-2 hover:-translate-y-1 cursor-pointer shadow-md overflow-hidden gap-6"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-3xl bg-[#CE82FF] border-b-4 border-[#A558D8] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <Mic2 size={36} className="text-white drop-shadow-md" />
                            </div>
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight text-[#CE82FF] mb-1">
                                    Music Studio
                                </h2>
                                <p className="text-slate-500 font-bold text-sm sm:text-base leading-snug max-w-md">
                                    Crea ritmos, graba instrumentos y graba tu propia voz en tu estudio personal.
                                </p>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto px-8 py-3 bg-[#CE82FF] border-b-4 border-[#A558D8] rounded-2xl text-white font-black text-sm uppercase text-center tracking-wider shrink-0 shadow-sm group-hover:brightness-105">
                            ¡Entrar al Estudio!
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
}
