import { useState } from 'react';
import { Play, Settings, X } from 'lucide-react';
import { ValleyButton } from '../presentation/ValleyUI.jsx';

export default function TitleScreen({ onEnter }) {
  const [settings, setSettings] = useState(false);
  return <main className="entry-screen entry-title-screen entry-title-illustrated">
    <picture className="entry-title-art" aria-hidden="true">
      <source media="(max-aspect-ratio: 4/5)" srcSet="images/entry/valley-fantasy-title-portrait-v1.webp"/>
      <img src="images/entry/valley-fantasy-title-v1.webp" alt="" fetchPriority="high" decoding="async"/>
    </picture>
    <h1 className="sr-only">VALLE DE LAS NOTAS</h1><p className="sr-only">Una aventura musical</p>
    <ValleyButton className="entry-title-enter" tone="gold" onClick={onEnter} aria-label="Entrar al Valle"><Play fill="currentColor" size={29}/>Entrar al Valle</ValleyButton>
    <div className="entry-secondary"><button aria-label="Configuracion" title="Configuracion" onClick={() => setSettings(true)}><Settings/></button></div>
    {settings && <section className="entry-settings" role="dialog" aria-label="Configuracion"><button aria-label="Cerrar configuracion" onClick={() => setSettings(false)}><X/></button><h2>Configuracion</h2><label><input type="checkbox" defaultChecked={false} onChange={event => { document.documentElement.dataset.entryMotion = event.target.checked ? 'reduced' : ''; }}/>Reducir movimiento de portada</label></section>}
  </main>;
}
