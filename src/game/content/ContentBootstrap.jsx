import { useEffect, useState } from 'react';
import MusicSuite from '../../modules/core/MusicSuite.jsx';
import { applyGameContent } from './contentDefaults.js';
import { loadGameContent } from './contentRepository.js';

export default function ContentBootstrap() {
  const [status, setStatus] = useState({ ready: false, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    loadGameContent().then(content => {
      if (live) { applyGameContent(content); setStatus({ ready: true, error: null }); }
    }).catch(e => { if (live) setStatus({ ready: false, error: e.message }); });
    return () => { live = false; };
  }, [retry]);
  if (status.ready) return <MusicSuite />;
  return <main className="min-h-[100dvh] grid place-content-center gap-4 bg-zinc-950 text-white p-6">
    <p role={status.error ? 'alert' : 'status'}>{status.error || 'Cargando el Valle...'}</p>
    {status.error && <button onClick={() => setRetry(v => v + 1)}>Reintentar</button>}
  </main>;
}
