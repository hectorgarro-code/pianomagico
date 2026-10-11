import React, { useState, useEffect, useRef } from 'react';
import { KAYKIT_ASSETS, getAssetStats, loadCachedModel } from './assetManifest';
import { Box, Cat, Skull, UserRound, Hammer, Building2, Trees, Flower2 } from 'lucide-react';

const catalogTabs = [
  ['CHARACTER_PLAYER', 'Jugadores', UserRound], ['PET', 'Mascotas', Cat], ['WORLD_CREATURE', 'Criaturas', Skull],
  ['PROP', 'Props', Box], ['DESTRUCTIBLE', 'Destructibles', Hammer], ['ARCHITECTURE', 'Arquitectura', Building2],
  ['VEGETATION', 'Vegetacion', Trees], ['DECORATION', 'Decoracion', Flower2]
];

export default function AssetDiagnosticModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(getAssetStats());
  const [activeCategory, setActiveCategory] = useState('forest');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loadStatus, setLoadStatus] = useState(null);
  const [catalog, setCatalog] = useState(null), [catalogError, setCatalogError] = useState('');
  const request = useRef({ version: 0 });
  const selectCategory = category => {
    request.current.version++;
    setActiveCategory(category); setSelectedAsset(null); setLoadStatus(null);
  };

  useEffect(() => {
    if (isOpen) {
      setStats(getAssetStats());
    }
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    const counter = request.current;
    if (isOpen && import.meta.env.DEV) import('./assetCatalog.js').then(module => { if (active) setCatalog(module.ASSET_CATALOG); }).catch(() => { if (active) setCatalogError('No se pudo cargar el catalogo local.'); });
    return () => { active = false; counter.version++; };
  }, [isOpen]);

  const handleTestLoad = async (url) => {
    const token = ++request.current.version;
    setSelectedAsset(url);
    setLoadStatus('loading');
    try {
      const gltf = await loadCachedModel(url);
      if (token !== request.current.version) return;
      if (gltf) {
        setLoadStatus('success');
        setStats(getAssetStats());
      } else {
        setLoadStatus('error');
      }
    } catch {
      if (token === request.current.version) setLoadStatus('error');
    }
  };

  if (!isOpen) return null;
  const selectedMetadata = catalog?.assets.find(asset => asset.url === selectedAsset);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={22}/> Catalogo de assets (DEV)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              KayKit / Kenney
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          padding: '16px 24px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>{stats.treesCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Árboles</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{stats.bushesCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Arbustos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#facc15' }}>{stats.rocksCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rocas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a78bfa' }}>{stats.wallsCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Paredes Dungeon</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f472b6' }}>{stats.containersCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contenedores</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb923c' }}>{stats.charactersCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Modelos previos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{stats.cachedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>En Caché</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Navigation Sidebar */}
          <div style={{ width: '180px', flexShrink: 0, overflowY: 'auto', borderRight: '1px solid #334155', padding: '12px' }}>
            {catalogTabs.map(([category, label, icon]) => <button key={category} disabled={!catalog} onClick={() => selectCategory(`catalog:${category}`)} aria-pressed={activeCategory === `catalog:${category}`} style={{ width: '100%', textAlign: 'left', padding: '9px 8px', display: 'flex', alignItems: 'center', gap: '8px', border: 0, borderRadius: '6px', background: activeCategory === `catalog:${category}` ? '#237846' : 'transparent', color: '#f8fafc', fontSize: '0.8rem', cursor: 'pointer' }}>{React.createElement(icon, { size: 16 })}{label} <span style={{ marginLeft: 'auto' }}>{catalog?.assets.filter(asset => asset.category === category).length ?? '...'}</span></button>)}
            <hr style={{ borderColor: '#334155', margin: '10px 0' }}/>
            {[
              { id: 'forest', label: '🌲 Bosque / Naturaleza' },
              { id: 'rocks', label: '🪨 Rocas & Terreno' },
              { id: 'dungeon_walls', label: '🏰 Dungeon Paredes' },
              { id: 'dungeon_props', label: '🕯️ Dungeon Props' },
              { id: 'furniture', label: '🪑 Mobiliario' },
              { id: 'characters', label: '🧙 Personajes' },
              { id: 'accessories', label: '⚔️ Accesorios' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => selectCategory(tab.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeCategory === tab.id ? '#3b82f6' : 'transparent',
                  color: activeCategory === tab.id ? '#ffffff' : '#94a3b8',
                  fontWeight: activeCategory === tab.id ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginBottom: '4px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Asset List & Quick Load Tester */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {catalogError && <p role="alert">{catalogError}</p>}
            {selectedMetadata && <section aria-label="Ficha del asset" style={{ borderBottom: '1px solid #475569', paddingBottom: '16px', marginBottom: '16px', fontSize: '0.82rem', overflowWrap: 'anywhere' }}>
              <h3 style={{ margin: '0 0 8px' }}>{selectedMetadata.name}</h3>
              <p>{selectedMetadata.category} / {selectedMetadata.packId} / {selectedMetadata.format || selectedMetadata.url.split('.').pop().toUpperCase()}</p>
              <p>{selectedMetadata.url}</p>
              {selectedMetadata.bounds && <p>Tamano nativo XYZ: {selectedMetadata.bounds.size.join(' / ')}. Base Y: {selectedMetadata.bounds.min[1]}.</p>}
              {selectedMetadata.license && <p>Licencia: {selectedMetadata.license.type} / {selectedMetadata.license.file}</p>}
              {selectedMetadata.animations && <p>Clips embebidos: {selectedMetadata.animations.map(clip => clip.name).join(', ') || 'Ninguno'}</p>}
              {selectedMetadata.animationSources?.map(source => <p key={source.url}>Biblioteca externa: {source.url.split('/').pop()} / {source.clips.join(', ')}</p>)}
              {selectedMetadata.rigs && <p>Rig: {selectedMetadata.rigs.map(rig => `${rig.name} (${rig.jointCount} joints)`).join(', ') || selectedMetadata.animationKind}</p>}
              {selectedMetadata.variants?.map(variant => <p key={variant.id}>Variante existente conservada: {variant.url} / {variant.animations.length} clips / {variant.rigs[0]?.jointCount} joints.</p>)}
            </section>}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Hacé click en cualquier asset para comprobar su carga real:
              </div>
              {loadStatus && (
                <div style={{
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: loadStatus === 'success' ? '#065f46' : loadStatus === 'loading' ? '#1e3a8a' : '#7f1d1d',
                  color: loadStatus === 'success' ? '#34d399' : loadStatus === 'loading' ? '#60a5fa' : '#f87171'
                }}>
                  {loadStatus === 'loading' && '⏳ Cargando modelo...'}
                  {loadStatus === 'success' && '✅ Modelo y texturas OK'}
                  {loadStatus === 'error' && '❌ Error al cargar'}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
              {(() => {
                let items = [];
                if (activeCategory === 'forest') items = [...KAYKIT_ASSETS.forest.trees, ...KAYKIT_ASSETS.forest.bushes];
                else if (activeCategory === 'rocks') items = [...KAYKIT_ASSETS.forest.rocks, ...KAYKIT_ASSETS.forest.trunks];
                else if (activeCategory === 'dungeon_walls') items = [...KAYKIT_ASSETS.dungeon.walls, ...KAYKIT_ASSETS.dungeon.columns];
                else if (activeCategory === 'dungeon_props') items = [...KAYKIT_ASSETS.dungeon.props, ...KAYKIT_ASSETS.dungeon.containers];
                else if (activeCategory === 'furniture') items = KAYKIT_ASSETS.dungeon.furniture;
                else if (activeCategory === 'characters') items = Object.values(KAYKIT_ASSETS.characters);
                else if (activeCategory === 'accessories') items = KAYKIT_ASSETS.accessories;
                else if (activeCategory.startsWith('catalog:')) items = catalog?.assets.filter(asset => asset.category === activeCategory.slice(8)).map(asset => asset.url) || [];

                if (!items.length && catalog && activeCategory.startsWith('catalog:')) return <p>Sin assets registrados.</p>;

                return items.map((url) => {
                  const filename = url.split('/').pop();
                  const isSelected = selectedAsset === url;
                  const metadata = catalog?.assets.find(asset => asset.url === url);
                  return (
                    <button
                      key={url}
                      onClick={() => handleTestLoad(url)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                        backgroundColor: isSelected ? '#1e293b' : '#0f172a',
                        color: isSelected ? '#38bdf8' : '#e2e8f0',
                        fontSize: '0.78rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={url}
                    >
                      {metadata?.previewUrl && <img src={metadata.previewUrl} alt="" width={36} height={36} loading="lazy" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}/>}{filename}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
