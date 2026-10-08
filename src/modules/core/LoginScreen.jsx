import React from 'react';
import { ArrowRight, UserRound } from 'lucide-react';

export default function LoginScreen({ users = [], onLogin, loading = false, error = null, onRetry }) {
    return <main className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col items-center justify-center gap-6 px-5 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">VALLE DE LAS NOTAS</h1>
        <h2 className="text-lg">Elige tu perfil</h2>
        {loading && <p role="status">Cargando perfiles...</p>}
        {error && <div className="text-center space-y-3">
            <p role="alert" className="text-red-300">{error}</p>
            <button onClick={onRetry} className="rounded-lg border border-white/30 px-4 py-2">Reintentar</button>
        </div>}
        {!error && users.length > 0 && <section aria-label="Perfiles" className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            {users.map(user => <button key={user.id} onClick={() => onLogin(user.id)} disabled={loading}
                aria-label={`Entrar como ${user.name}`}
                className="rounded-lg border border-white/20 hover:border-emerald-400 hover:bg-emerald-950/20 disabled:opacity-50 p-5 flex items-center gap-3 text-left">
                <UserRound size={24} className="shrink-0 text-emerald-300"/>
                <span className="min-w-0 flex-1">
                    <span className="block font-bold break-words">{user.name}</span>
                    {user.total_score != null && <span className="block text-xs text-zinc-400 mt-1">{Number(user.total_score) || 0} XP</span>}
                </span>
                <ArrowRight size={18} className="shrink-0"/>
            </button>)}
        </section>}
        {!loading && !error && users.length === 0 && <p>No hay perfiles disponibles.</p>}
    </main>;
}
