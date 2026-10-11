import { ArrowRight, ArrowLeft, UserRound } from 'lucide-react';
import ProfilePortraits from '../../game/entry/ProfilePortraits.jsx';
import { ValleyTitle, ValleyButton } from '../../game/presentation/ValleyUI.jsx';

export default function LoginScreen({ users = [], onLogin, loading = false, error = null, onRetry, onBack }) {
  return <main className="valley-menu entry-profiles-screen">
    {onBack && <button className="entry-back" onClick={onBack}><ArrowLeft size={20}/>Volver</button>}
    <div className="valley-profile-layout">
      <h2 className="valley-menu-heading">¿Quien va a explorar hoy?</h2><p className="entry-profile-subtitle">Elige un perfil para comenzar o continuar tu aventura</p>
      {loading && <p role="status" className="valley-menu-heading">Cargando perfiles...</p>}
      {error && <div className="valley-menu-heading"><p role="alert">{error}</p><ValleyButton onClick={onRetry}>Reintentar</ValleyButton></div>}
      {!error && users.length > 0 && <section aria-label="Perfiles" className="valley-profiles entry-profile-grid">
        <ProfilePortraits users={users}/>
        {users.map(user => <button key={user.id} className="valley-profile" onClick={() => onLogin(user.id)} disabled={loading} aria-label={`Entrar como ${user.name}`}>
          <span className="valley-profile-name">{user.name}</span>
          <span className="entry-profile-portrait" data-profile-portrait={user.id}>{!user.summary?.existing && <UserRound size={46}/>}</span>
          <span className="entry-profile-state">{user.summary?.existing ? 'Continuar aventura' : 'Comenzar aventura'}<ArrowRight size={18}/></span>
        </button>)}
      </section>}
      {!loading && !error && users.length === 0 && <p className="valley-menu-heading">No hay perfiles disponibles.</p>}
    </div>
  </main>;
}
