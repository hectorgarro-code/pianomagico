import { ArrowRight, Star, UserRound } from 'lucide-react';
import ValleyScene from '../../game/presentation/ValleyScene.jsx';
import { ValleyTitle, ValleyButton } from '../../game/presentation/ValleyUI.jsx';
import { STICKERS_BASE } from '../piano-magico/PianoMagico.jsx';

export default function LoginScreen({ users = [], onLogin, loading = false, error = null, onRetry }) {
  return <main className="valley-menu">
    <ValleyScene />
    <div className="valley-profile-layout">
      <ValleyTitle /><h2 className="valley-menu-heading">Elige tu perfil</h2>
      {loading && <p role="status" className="valley-menu-heading">Cargando perfiles...</p>}
      {error && <div className="valley-menu-heading"><p role="alert">{error}</p><ValleyButton onClick={onRetry}>Reintentar</ValleyButton></div>}
      {!error && users.length > 0 && <section aria-label="Perfiles" className="valley-profiles">
        {users.map(user => <button key={user.id} className="valley-profile" onClick={() => onLogin(user.id)} disabled={loading} aria-label={`Entrar como ${user.name}`}>
          <span className="valley-profile-avatar">{STICKERS_BASE[user.avatar_id ?? user.avatarId]?.emoji || <UserRound size={42}/>}</span>
          <span className="valley-profile-name">{user.name}</span>
          {user.total_score != null && <span className="valley-profile-score"><Star size={17}/>{Number(user.total_score) || 0} XP</span>}
          <ArrowRight size={18}/>
        </button>)}
      </section>}
      {!loading && !error && users.length === 0 && <p className="valley-menu-heading">No hay perfiles disponibles.</p>}
    </div>
  </main>;
}
