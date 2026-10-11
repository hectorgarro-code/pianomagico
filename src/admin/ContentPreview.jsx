import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { WorldGenerator } from '../game/world/WorldGenerator.js';
import { loadCachedModel } from '../game/assets/assetManifest.js';
import { CONTENT_COMPOSITIONS } from '../game/content/contentDefaults.js';

export default function ContentPreview({ region, selectedId, asset, clipName, onSelect }) {
  const host = useRef(null), selectRef = useRef(onSelect);
  const terrainCache = useRef(null), cameraPose = useRef(null);
  const [error, setError] = useState(null);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => () => {
    terrainCache.current?.geometry.dispose(); terrainCache.current?.material.dispose(); terrainCache.current = null;
  }, []);
  useEffect(() => {
    let live = true, frame, observer, controls, renderer, mixer, generated, root, helper;
    const container = host.current;
    const owned = [];
    const start = async () => {
      await Promise.resolve();
      if (!live) return;
      setError(null);
      renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace; container.appendChild(renderer.domElement);
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd6e6df);
      const camera = new THREE.PerspectiveCamera(45, 1, .1, 600);
      controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x61756b, 2.5));
      const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(15, 30, 15); scene.add(sun);
      root = new THREE.Group(); scene.add(root);
      if (asset) {
        const gltf = await loadCachedModel(asset.url); if (!live) return;
        const model = clone(gltf.scene); root.add(model);
        mixer = new THREE.AnimationMixer(model);
        let animations = gltf.animations;
        const source = asset.animationSources?.find(s => clipName ? s.clips.includes(clipName) : s.clips.some(c => /idle/i.test(c)));
        if (source) { const library = await loadCachedModel(source.url); if (!live) return; animations = library.animations; }
        const clip = animations.find(a => a.name === clipName) || animations.find(a => /idle/i.test(a.name)) || animations[0];
        if (clip) mixer.clipAction(clip).play();
      } else if (region) {
        const generator = new WorldGenerator(); generated = generator;
        const source = CONTENT_COMPOSITIONS.find(c => c.groupName === region.id);
        await Promise.all([...new Set(region.instances.map(i => i.assetUrl))].map(async url => {
          const gltf = await loadCachedModel(url); generator.models.set(url, gltf.scene);
        }));
        if (!live) return;
        generator.generateComposition(root, { ...source, instances: region.instances });
        if (!terrainCache.current) terrainCache.current = generator.buildTerrain();
        scene.add(terrainCache.current.clone());
        const grid = new THREE.GridHelper(40, 40, 0x596961, 0x94aca0);
        const center = region.instances.find(i => i.id === selectedId)?.position || source.spawn.position;
        grid.position.set(center[0], center[1] + .05, center[2]); scene.add(grid); owned.push(grid);
      }
      const box = new THREE.Box3().setFromObject(root), center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      let selected;
      root.traverse(node => { if (node.userData.compositionId === selectedId) selected = node; });
      if (selected) { helper = new THREE.BoxHelper(selected, 0xffb928); scene.add(helper); }
      const target = selected ? new THREE.Box3().setFromObject(selected).getCenter(new THREE.Vector3()) : center;
      const distance = asset ? Math.max(size.x, size.y, size.z, 1) * 2 : selected ? 10 : Math.min(Math.max(size.x, size.z, 12), 60);
      controls.target.copy(target); camera.position.copy(target).add(new THREE.Vector3(distance * .7, distance * .65, distance)); controls.update();
      const poseKey = asset ? asset.url : `${region?.id}:${selectedId}`;
      if (cameraPose.current?.key === poseKey) { camera.position.fromArray(cameraPose.current.position); controls.target.fromArray(cameraPose.current.target); controls.update(); }
      const remember = () => { cameraPose.current = { key: poseKey, position: camera.position.toArray(), target: controls.target.toArray() }; };
      controls.addEventListener('change', remember);
      const resize = () => { const width = container.clientWidth, height = container.clientHeight; renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
      observer = new ResizeObserver(resize); observer.observe(container); resize();
      const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
      const select = event => {
        if (asset) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
        ray.setFromCamera(pointer, camera);
        let node = ray.intersectObject(root, true)[0]?.object;
        while (node && !node.userData.compositionId) node = node.parent;
        if (node) selectRef.current?.(node.userData.compositionId);
      };
      renderer.domElement.addEventListener('dblclick', select);
      const clock = new THREE.Clock();
      const tick = () => { if (!live) return; mixer?.update(Math.min(clock.getDelta(), .05)); controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(tick); }; tick();
    };
    start().catch(e => { if (live) setError(e.message); });
    return () => {
      live = false; cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose(); mixer?.stopAllAction();
      helper?.geometry.dispose(); helper?.material.dispose();
      owned.forEach(node => { node.geometry?.dispose(); if (Array.isArray(node.material)) node.material.forEach(m => m.dispose()); else node.material?.dispose(); });
      generated?.collisionDebug.traverse(node => { node.geometry?.dispose(); node.material?.dispose(); });
      renderer?.dispose(); renderer?.domElement.remove();
      // Cached model geometry/materials are shared and must not be disposed by preview.
    };
  }, [region, selectedId, asset, clipName]);
  return <div className="admin-preview" ref={host}>{error && <p role="alert">{error}</p>}</div>;
}
