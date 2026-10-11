import { memo, useMemo, useState } from 'react';
import { playerMapMarker, worldToMap } from './valleyNavigation.js';
import { cartographyAsset, cartographicPathKind, cartographyFrame } from './mapCartography.js';
import { mapIllustration, MAP_LABEL_OFFSETS } from './mapLandmarks.js';

export function CartographyIcon({ asset, x, y, size = 24 }) {
  const src = cartographyAsset(asset);
  const [failed, setFailed] = useState(null);
  if (!src || failed === src) return <path data-asset-fallback={asset} d={`M${x-4},${y+4} l4,-8 l4,8 Z`} fill="none" stroke="currentColor" strokeWidth="1.5" />;
  return <image href={src} x={x-size/2} y={y-size/2} width={size} height={size}
    onError={() => setFailed(src)} data-cartography-asset={asset} />;
}

const point = position => { const p = worldToMap(position); return `${p.x},${p.y}`; };

const StaticInk = memo(function StaticInk({ model, illustration, enlarged }) {
  return <g className="cartography-ink">
    {illustration.water.length > 0 && <polyline className="cartography-river" points={illustration.water.map(point).join(' ')} />}
    {model.paths.map(path => <polyline key={path.id} data-map-path={path.id}
      className={'cartography-path is-' + cartographicPathKind(path)} points={path.points.map(point).join(' ')} />)}
    {illustration.landmarks.map(landmark => {
      const p = worldToMap(landmark.position);
      return <g key={landmark.id} data-map-landmark={landmark.id}><title>{landmark.id}</title>
        <CartographyIcon asset={landmark.asset} x={p.x} y={p.y} size={(enlarged ? 38 : 32)*landmark.scale} />
      </g>;
    })}
    {enlarged && model.regions.map(region => {
      const p = worldToMap(region.position), [dx, dy] = MAP_LABEL_OFFSETS[region.id] || [0, -25];
      const words = region.name.split(' '), split = Math.ceil(words.length / 2);
      const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
      return <text key={region.id} data-map-region={region.id} className="cartography-label" textAnchor="middle">
        {lines.map((line, i) => <tspan key={i} x={p.x+dx} y={p.y+dy+i*18}>{line}</tspan>)}
      </text>;
    })}
    {model.chests.filter(c => c.state !== 'UNKNOWN').map(chest => {
      const p = worldToMap(chest.position), completed = chest.state === 'COMPLETED';
      return <g key={chest.id} data-map-chest={chest.id} data-state={chest.state} className={'cartography-chest is-' + chest.state.toLowerCase()}>
        <title>{`${chest.label}: ${chest.state}`}</title>
        <CartographyIcon asset="chest" x={p.x} y={p.y} size={enlarged ? 20 : 16} />
        {completed && <path className="cartography-check" d={`M${p.x+3},${p.y+2} l2,2 l5,-6`} />}
      </g>;
    })}
  </g>;
});

export default function CartographyLayer({ model, pose, enlarged = false }) {
  const marker = playerMapMarker(pose);
  const illustration = useMemo(() => mapIllustration(model), [model]);
  const frame = cartographyFrame(illustration, marker, enlarged);
  const targets = model.target?.choices || (model.target ? [model.target] : []);
  return <svg className="cartography-drawing" viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
    role="img" aria-label="Mapa del Valle, norte arriba">
    <StaticInk model={model} illustration={illustration} enlarged={enlarged} />
    {targets.map(target => {
      const p = worldToMap(target.position);
      return <circle key={target.id} data-map-target={target.id} className="cartography-objective" cx={p.x} cy={p.y} r={enlarged ? 11 : 9}><title>{target.label}</title></circle>;
    })}
    <g data-map-player="true" transform={`translate(${marker.x} ${marker.y}) rotate(${marker.angle})`}>
      <path className="cartography-player" d="M0,-9 L6,7 L0,3 L-6,7 Z" />
    </g>
  </svg>;
}
