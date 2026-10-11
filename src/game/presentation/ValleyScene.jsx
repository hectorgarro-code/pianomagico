import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { WorldGenerator } from '../world/WorldGenerator.js';
import { getCharacterModel } from '../../modules/core/utils/characterModels.js';
import { createCharacterAnimator, rotateShowcase } from './characterActions.js';
import { loadCharacterPresentation, applyEquipment, getEquipment } from './characterEquipment.js';

export default function ValleyScene({ characterId = null, showcase = false, rotation = 0, action = null, equipment = null, autoDemo = false }) {
  const container = useRef(null), runtime = useRef(null), pose = useRef({ rotation, action });
  pose.current = { rotation, action, equipment, autoDemo };
  const [error, setError] = useState('');
  useEffect(() => {
    const host = container.current;
    let alive = true, frame, model = null, animator = null, mixer = null;
    const ownedGeometry = new Set(), ownedMaterials = new Set();
    const generator = new WorldGenerator(), scene = new THREE.Scene();
    scene.background = new THREE.Color('#90d4eb'); scene.fog = new THREE.Fog('#90d4eb', 55, 170);
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 250);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#fff5ce', '#4b7152', 2.1));
    const sun = new THREE.DirectionalLight('#ffe1a1', 2.6); sun.position.set(-12, 24, 18); scene.add(sun);
    const resize = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
      const mobile = width < 700;
      if (showcase) { camera.position.set(0, 2.8, mobile ? 8.5 : 7.2); camera.lookAt(0, 1.6, 0); }
      else { camera.position.set(16, mobile ? 13 : 11, 22); camera.lookAt(-1, 1, -9); }
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const releaseCharacter = () => {
      animator?.dispose();
      if (model) {
        // SkeletonUtils clones own bone textures; model geometry stays in the shared cache.
        const skeletons = new Set(); model.traverse(node => { if (node.skeleton) skeletons.add(node.skeleton); });
        for (const skeleton of skeletons) skeleton.dispose();
        scene.remove(model);
      }
      model = null; animator = null; mixer = null;
    };
    generator.buildSection1().then(({ sceneGroup, debugGroup }) => {
      const disposeDebug = () => debugGroup.traverse(node => { node.geometry?.dispose(); if (node.material) for (const mat of [].concat(node.material)) mat.dispose(); });
      disposeDebug();
      const cachedGeometry = new Set(), cachedMaterials = new Set();
      for (const root of generator.models.values()) root.traverse(node => {
        if (node.geometry) cachedGeometry.add(node.geometry);
        for (const mat of [].concat(node.material || [])) cachedMaterials.add(mat);
      });
      sceneGroup.traverse(node => {
        if (node.geometry && !cachedGeometry.has(node.geometry)) ownedGeometry.add(node.geometry);
        for (const mat of [].concat(node.material || [])) if (!cachedMaterials.has(mat)) ownedMaterials.add(mat);
      });
      if (!alive) { for (const g of ownedGeometry) g.dispose(); for (const m of ownedMaterials) m.dispose(); return; }
      scene.add(sceneGroup);
      if (showcase) { sceneGroup.position.set(0, -1.6, -17); }
    }).catch(() => { if (alive) setError('No se pudo cargar el Valle.'); });
    let previous = performance.now(), angle = pose.current.rotation, drag = false, pointerX = 0, actionToken;
    runtime.current = {
      async load(id) {
        const info = id ? getCharacterModel(id) : null;
        const data = info ? await loadCharacterPresentation(id) : null;
        if (!alive || runtime.current?.characterId !== id) return;
        releaseCharacter();
        if (!data) return;
        model = SkeletonUtils.clone(data.scene); model.scale.setScalar(showcase ? 1.35 : 2.1);
        model.position.set(showcase ? 0 : 4, showcase ? 0 : .1, showcase ? 0 : 3);
        const selectedEquipment = getEquipment(info.id, pose.current.equipment);
        await applyEquipment(model, info.id, selectedEquipment.id);
        if (!alive || runtime.current?.characterId !== id) return;
        scene.add(model); mixer = new THREE.AnimationMixer(model); animator = createCharacterAnimator(mixer, data.animations, info.id, selectedEquipment);
        nextDemo = performance.now() + 1800;
      },
      equip(choice) {
        if (!model) return;
        const selectedEquipment = getEquipment(runtime.current.characterId, choice);
        animator?.setEquipment(selectedEquipment);
        applyEquipment(model, runtime.current.characterId, choice).catch(() => { if (alive) setError('No se pudo cargar el arma.'); });
      }, characterId: null
    };
    const down = event => { if (!showcase) return; drag = true; pointerX = event.clientX; host.setPointerCapture(event.pointerId); };
    const move = event => { if (!drag) return; angle = rotateShowcase(angle, (event.clientX - pointerX) * .012); pointerX = event.clientX; };
    const up = () => { drag = false; };
    const key = event => {
      if (!showcase || event.repeat || event.target.closest('input,textarea,select')) return;
      if (event.code === 'KeyQ' || event.code === 'KeyE') { event.preventDefault(); animator?.express(event.code.slice(-1)); }
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') { event.preventDefault(); angle = rotateShowcase(angle, event.code === 'ArrowLeft' ? -.5 : .5); }
    };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up); window.addEventListener('keydown', key);
    let lastRotation = pose.current.rotation, frames = 0, sample = performance.now(), nextDemo = Infinity, demoIndex = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate); const now = performance.now(), delta = Math.min(.05, (now - previous) / 1000); previous = now;
      if (pose.current.rotation !== lastRotation) { angle = rotateShowcase(angle, pose.current.rotation - lastRotation); lastRotation = pose.current.rotation; }
      if (pose.current.action && pose.current.action.token !== actionToken) { actionToken = pose.current.action.token; animator?.express(pose.current.action.key); }
      if (showcase && pose.current.autoDemo && !drag && !animator?.locked && now >= nextDemo) {
        animator?.express(demoIndex++ % 2 ? 'E' : 'Q'); nextDemo = now + 4500;
      }
      mixer?.update(delta);
      if (model) model.rotation.y = showcase ? angle : Math.PI + .35;
      renderer.render(scene, camera);
      if (import.meta.env.DEV) {
        renderer.domElement.dataset.showcase = JSON.stringify({ rotation: angle, animation: animator?.name, characterId: runtime.current?.characterId, loaded: Boolean(model), equipment: getEquipment(runtime.current?.characterId, pose.current.equipment).id, visibleEquipment: model ? [...model.getObjectsByProperty('isMesh', true)].filter(node => node.visible).map(node => node.name) : [] });
        frames++;
        if (now - sample > 1000) { renderer.domElement.dataset.renderMetrics = JSON.stringify({ fps: Math.round(frames * 1000 / (now - sample)), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, foreground: document.hasFocus(), sampledAt: now }); frames = 0; sample = now; }
      }
    };
    animate();
    return () => {
      alive = false; cancelAnimationFrame(frame); observer.disconnect(); releaseCharacter();
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); window.removeEventListener('keydown', key);
      for (const g of ownedGeometry) g.dispose(); for (const m of ownedMaterials) m.dispose();
      renderer.dispose(); renderer.domElement.remove(); runtime.current = null;
    };
  }, [showcase]);
  useEffect(() => {
    if (!runtime.current) return;
    runtime.current.characterId = characterId;
    runtime.current.load(characterId).catch(() => setError('No se pudo cargar el personaje.'));
  }, [characterId, showcase]);
  useEffect(() => { runtime.current?.equip(equipment); }, [equipment]);
  return <div className={`valley-scene ${showcase ? 'is-showcase' : ''}`} ref={container} aria-label={showcase ? 'Personaje 3D' : 'Valle de las Notas 3D'}>{error && <p role="alert" className="valley-scene-error">{error}</p>}</div>;
}
