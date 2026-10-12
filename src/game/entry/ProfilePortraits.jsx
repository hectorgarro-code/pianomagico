import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { loadCharacterPresentation, applyEquipment, readEquipment } from '../presentation/characterEquipment.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { getGameplayContent } from '../gameplay/gameplayContent.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';

// One scissored renderer for every profile, with isolated previews and shared asset caches.
export default function ProfilePortraits({ users }) {
  const host = useRef(null);
  useEffect(() => {
    let live = true, frame;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.current.appendChild(renderer.domElement);
    const views = [], skeletons = new Set();
    const resize = () => renderer.setSize(host.current.clientWidth, host.current.clientHeight);
    const observer = new ResizeObserver(resize); observer.observe(host.current); resize();
    const addModel = (view, data, height, x) => {
      const model = clone(data.scene), bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
      model.scale.setScalar(height / Math.max(.1, size.y)); model.position.set(x, -bounds.min.y * model.scale.x, 0);
      model.traverse(node => { if (node.skeleton) skeletons.add(node.skeleton); }); view.scene.add(model);
      const mixer = new THREE.AnimationMixer(model), clip = data.animations.find(item => item.name === 'Idle' || item.name === 'idle');
      if (clip) mixer.clipAction(clip).play(); view.mixers.push(mixer); return model;
    };
    (async () => {
      for (const user of users) {
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, .1, 25), view = { scene, camera, id: user.id, centerX:user.petId ? .2 : 0, mixers: [] };
        views.push(view);
        scene.add(new THREE.HemisphereLight(0xfff3dd, 0x537969, 2.5)); const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(3, 5, 6); scene.add(sun);
        const data = await loadCharacterPresentation(user.avatarId); if (!live) return;
        const hero = addModel(view, data, 2.2, user.petId ? -.35 : 0);
        await applyEquipment(hero, user.avatarId, readEquipment(user.id, user.avatarId)); if (!live) return;
        if (user.petId) {
          const pet = getGameplayContent().pets.find(item => item.id === user.petId), asset = pet && ASSET_CATALOG.assets.find(item => item.id === pet.assetId);
          if (asset) { const petData = await loadCachedModel(asset.url); if (!live) return; addModel(view, petData, .8, 1); }
        }
      }
      if (live) renderer.domElement.dataset.portraitsReady = 'true';
    })().catch(error => { if (live) { renderer.domElement.dataset.portraitError = 'true'; console.warn('Profile preview', error); } });
    let last = performance.now();
    const animate = () => {
      frame = requestAnimationFrame(animate); const now = performance.now(), delta = Math.min(.05, (now - last) / 1000); last = now;
      if (document.hidden) return;
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      const bounds = host.current.getBoundingClientRect();
      for (const view of views) {
        const element = host.current.parentElement.querySelector(`[data-profile-portrait="${view.id}"]`); if (!element) continue;
        const rect = element.getBoundingClientRect(); if (rect.bottom < 0 || rect.top > innerHeight) continue;
        const x = rect.left - bounds.left, y = bounds.bottom - rect.bottom;
        view.camera.aspect = rect.width / rect.height; view.camera.updateProjectionMatrix(); view.camera.position.set(view.centerX, 1.9, Math.max(3.6, 2.3 / (2*Math.tan(Math.PI/10)*view.camera.aspect))); view.camera.lookAt(view.centerX, 1.25, 0);
        view.mixers.forEach(mixer => mixer.update(delta));
        renderer.setViewport(x, y, rect.width, rect.height); renderer.setScissor(x, y, rect.width, rect.height); renderer.render(view.scene, view.camera);
      }
    }; animate();
    return () => { live = false; cancelAnimationFrame(frame); observer.disconnect(); views.forEach(view => { view.mixers.forEach(mixer => { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }); view.scene.clear(); }); skeletons.forEach(skeleton => skeleton.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, [users]);
  return <div className="entry-portraits" ref={host} aria-hidden="true"/>;
}
