import React, { useState, useEffect } from 'react';
import { KAYKIT_ASSETS, getAssetStats, loadCachedModel } from './assetManifest';

export default function AssetDiagnosticModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(getAssetStats());
  const [activeCategory, setActiveCategory] = useState('forest');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loadStatus, setLoadStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStats(getAssetStats());
    }
  }, [isOpen]);

  const handleTestLoad = async (url) => {
    setSelectedAsset(url);
    setLoadStatus('loading');
    try {
      const gltf = await loadCachedModel(url);
      if (gltf) {
        setLoadStatus('success');
      } else {
        setLoadStatus('error');
      }
    } catch (e) {
      setLoadStatus('error');
    }
  };

  if (!isOpen) return null;

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
        borderRadius: '16px',
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
              <span>📦</span> Biblioteca de Assets KayKit (Inventario)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Catálogo verificado de modelos GLTF/GLB disponibles en public/models
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
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Personajes</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{stats.cachedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>En Caché</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Navigation Sidebar */}
          <div style={{ width: '200px', borderRight: '1px solid #334155', padding: '12px' }}>
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
                onClick={() => setActiveCategory(tab.id)}
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

                return items.map((url) => {
                  const filename = url.split('/').pop();
                  const isSelected = selectedAsset === url;
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
                      {filename}
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
