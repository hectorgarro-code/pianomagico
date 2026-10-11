import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ContentBootstrap from './game/content/ContentBootstrap.jsx'
const ValleAdmin = lazy(() => import('./admin/ValleAdmin.jsx'));
const isAdminRoute = /\/valle-admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div role="status">Cargando...</div>}>
      {isAdminRoute ? <ValleAdmin /> : <ContentBootstrap />}
    </Suspense>
  </StrictMode>,
)
