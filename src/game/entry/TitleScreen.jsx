import { useState } from 'react';
import { Play, Settings, X } from 'lucide-react';
import { ValleyTitle, ValleyButton } from '../presentation/ValleyUI.jsx';

export default function TitleScreen({ onEnter }) {
  const [settings, setSettings] = useState(false);
  return <main className="entry-screen entry-title-screen">
    <div className="entry-title-content"><ValleyTitle/><p>Una aventura musical</p>
      <ValleyButton tone="gold" onClick={onEnter}><Play fill="currentColor" size={25}/>Entrar al Valle</ValleyButton>
    </div>
    <div className="entry-secondary"><button aria-label="Configuracion" title="Configuracion" onClick={() => setSettings(true)}><Settings/></button></div>
    {settings && <section className="entry-settings" role="dialog" aria-label="Configuracion"><button aria-label="Cerrar configuracion" onClick={() => setSettings(false)}><X/></button><h2>Configuracion</h2><label><input type="checkbox" defaultChecked={false} onChange={event => { document.documentElement.dataset.entryMotion = event.target.checked ? 'reduced' : ''; }}/>Reducir movimiento de portada</label></section>}
  </main>;
}
