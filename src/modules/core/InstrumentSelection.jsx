import { Star, LogOut, Music, Guitar, Mic2 } from 'lucide-react';

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

export default function InstrumentSelection({ profile, onSelectApp, onLogout }) {
    const avatar = STICKERS_BASE[profile?.avatarId] || STICKERS_BASE[1];

    return (
        <div className="min-h-screen bg-[#060b19] font-sans flex flex-col items-center p-4 pt-4 md:pt-8 relative overflow-y-auto text-white">
            {/* Background FX */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <div className="absolute top-[10%] right-[10%] w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute bottom-[10%] left-[10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            {/* Stars Grid */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none z-0"></div>

            {/* Header Profile */}
            <div className="relative w-full max-w-5xl px-2 flex justify-between items-center z-20 mb-6 shrink-0">
                <div className="flex items-center gap-3 md:gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-2 pr-5 rounded-full shadow-lg">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-inner ${avatar.color}`}>
                        {avatar.emoji}
                    </div>
                    <div>
                        <h2 className="font-black uppercase tracking-wider text-xs md:text-sm text-slate-200">Hola, {profile?.name || 'Músico'}</h2>
                        <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                            <Star size={12} fill="currentColor" /> {profile?.totalScore || 0} pts
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-2.5 md:p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-lg group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-5xl my-auto">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.4)] tracking-tighter uppercase italic mb-2 text-center">
                    Elige tu Instrumento
                </h1>
                <p className="text-indigo-300 font-bold tracking-widest uppercase mb-12 text-center">
                    ¿Qué vamos a tocar hoy?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">

                    {/* Card: Piano Mágico */}
                    <button
                        onClick={() => onSelectApp('piano')}
                        className="group relative h-[400px] rounded-[3rem] overflow-hidden border-4 border-slate-800 hover:border-blue-400 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:-translate-y-2 text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 z-0" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwdjJWMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48cGF0aCBkPSJNMTAgMGgydjQwSDEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] z-0 pointer-events-none opacity-20" />

                        {/* Piano Keys Decorative Background */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 flex z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={`flex-1 border-r border-white/20 relative ${[1, 2, 4, 5, 6, 8, 9].includes(i) ? "after:content-[''] after:absolute after:top-0 after:-right-2 after:w-4 after:h-16 after:bg-black" : ""}`}></div>
                            ))}
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />

                        <div className="relative z-10 p-10 h-full flex flex-col justify-end">
                            <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border-2 border-blue-400/50 flex items-center justify-center backdrop-blur-md mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-110 group-hover:bg-blue-500/40 transition-all duration-500">
                                <Music size={40} className="text-blue-300 drop-shadow-[0_0_10px_white]" />
                            </div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 drop-shadow-md mb-2">
                                Piano Mágico
                            </h2>
                            <p className="text-slate-300 font-medium text-lg max-w-xs group-hover:text-white transition-colors duration-300">
                                Sigue las estrellas, aprende melodías y domina el teclado en una aventura galáctica.
                            </p>
                        </div>
                    </button>

                    {/* Card: Blues Hero */}
                    <button
                        onClick={() => onSelectApp('guitar')}
                        className="group relative h-[400px] rounded-[3rem] overflow-hidden border-4 border-slate-800 hover:border-orange-500 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:-translate-y-2 text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 to-slate-900 z-0" />

                        {/* Ukelele Strings Decorative Background */}
                        <div className="absolute inset-0 flex flex-col justify-center gap-6 z-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700 -rotate-12 translate-y-12">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`w-[150%] h-2 bg-white shadow-[0_0_5px_white] -translate-x-12`}></div>
                            ))}
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />

                        <div className="relative z-10 p-10 h-full flex flex-col justify-end">
                            <div className="w-20 h-20 rounded-3xl bg-orange-500/20 border-2 border-orange-400/50 flex items-center justify-center backdrop-blur-md mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)] group-hover:scale-110 group-hover:bg-orange-500/40 transition-all duration-500">
                                <span className="text-4xl drop-shadow-[0_0_10px_white]">🎸</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-400 drop-shadow-md mb-2">
                                Uke Hero
                            </h2>
                            <p className="text-slate-300 font-medium text-lg max-w-xs group-hover:text-white transition-colors duration-300">
                                Aprende tus primeras melodías, rasgueos básicos y domina el ukelele de 4 cuerdas.
                            </p>
                        </div>
                    </button>

                    {/* Card: Music Studio */}
                    <button
                        onClick={() => onSelectApp('studio')}
                        className="group relative h-[400px] md:col-span-2 rounded-[3rem] overflow-hidden border-4 border-slate-800 hover:border-pink-500 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(236,72,153,0.3)] hover:-translate-y-2 text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-950 via-purple-950 to-slate-900 z-0" />

                        {/* Studio Audio Waves Decorative Background */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 z-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700">
                            {[10, 25, 40, 60, 30, 80, 45, 20, 50, 70, 35, 15].map((h, i) => (
                                <div key={i} className={`w-4 bg-white shadow-[0_0_10px_white] rounded-full`} style={{ height: `${h}%` }}></div>
                            ))}
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0" />

                        <div className="relative z-10 p-10 h-full flex flex-col justify-end items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-pink-500/20 border-2 border-pink-400/50 flex items-center justify-center backdrop-blur-md mb-6 shadow-[0_0_30px_rgba(236,72,153,0.3)] group-hover:scale-110 group-hover:bg-pink-500/40 transition-all duration-500">
                                <Mic2 size={40} className="text-pink-300 drop-shadow-[0_0_10px_white]" />
                            </div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-400 drop-shadow-md mb-2">
                                Music Studio
                            </h2>
                            <p className="text-slate-300 font-medium text-lg max-w-md group-hover:text-white transition-colors duration-300">
                                Crea ritmos, graba instrumentos y graba tu propia voz en tu estudio multipista personal.
                            </p>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
}
