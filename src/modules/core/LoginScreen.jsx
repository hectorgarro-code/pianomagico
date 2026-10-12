import { Play, ArrowLeft, Sparkles, Shield, WandSparkles, Swords, Crosshair, Compass } from 'lucide-react';
import ProfilePortraits from '../../game/entry/ProfilePortraits.jsx';
import { ValleyButton } from '../../game/presentation/ValleyUI.jsx';
import '../../game/entry/profileSelection.css';

const heraldry={1:[Shield,'#236389'],2:[WandSparkles,'#64407c'],3:[Swords,'#935123'],4:[Crosshair,'#853846'],5:[Compass,'#357652']};

export default function LoginScreen({ users = [], onLogin, loading = false, error = null, onRetry, onBack }) {
  return <main className="valley-menu entry-profiles-screen profile-gallery">
    <img className="profile-valley-art" src="images/entry/profile-valley-v1.webp" alt="" aria-hidden="true"/>
    {onBack && <button className="entry-back" onClick={onBack} aria-label="Volver" title="Volver"><ArrowLeft size={30}/></button>}
    <div className="valley-profile-layout">
      <h2 className="profile-gallery-heading"><span className="sr-only">Elige tu perfil</span><img src="images/entry/profile-heading-v1.webp" alt="" aria-hidden="true"/></h2>
      {loading && <p role="status" className="valley-menu-heading">Cargando perfiles...</p>}
      {error && <div className="valley-menu-heading"><p role="alert">{error}</p><ValleyButton onClick={onRetry}>Reintentar</ValleyButton></div>}
      {!error && users.length > 0 && <section aria-label="Perfiles" className="valley-profiles entry-profile-grid" style={{'--profile-columns':Math.min(users.length,4)}}>
        <ProfilePortraits users={users}/>
        {users.map(user => {const [Emblem,color]=heraldry[user.avatarId]||heraldry[1];return <button key={user.id} className="valley-profile" onClick={() => onLogin(user.id)} disabled={loading} aria-label={`Entrar como ${user.name}`}>
          <img className="profile-pedestal-art" src="images/entry/profile-pedestal-v1.webp" alt="" draggable="false"/>
          <span className="profile-heraldry" style={{'--banner-color':color}} aria-hidden="true"><Emblem/></span>
          <span className="valley-profile-name">{user.name}</span>
          <span className="entry-profile-portrait" data-profile-portrait={user.id}/>
          <span className="entry-profile-state" aria-label={user.summary?.existing ? 'Continuar aventura' : 'Comenzar aventura'}>{user.summary?.existing ? <Play size={26} fill="currentColor"/> : <Sparkles size={26}/>}</span>
        </button>;})}
      </section>}
      {!loading && !error && users.length === 0 && <p className="valley-menu-heading">No hay perfiles disponibles.</p>}
    </div>
  </main>;
}
