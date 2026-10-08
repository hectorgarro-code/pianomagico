import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Cache for loaded GLTF objects to avoid refetching
const gltfCache = new Map();
const gltfLoadingPromises = new Map();

const loadGLTFWithCache = (url) => {
  if (gltfCache.has(url)) {
    return Promise.resolve(gltfCache.get(url));
  }
  if (gltfLoadingPromises.has(url)) {
    return gltfLoadingPromises.get(url);
  }

  const loader = new GLTFLoader();
  const promise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        gltfCache.set(url, gltf);
        gltfLoadingPromises.delete(url);
        resolve(gltf);
      },
      undefined,
      (err) => {
        gltfLoadingPromises.delete(url);
        reject(err);
      }
    );
  });

  gltfLoadingPromises.set(url, promise);
  return promise;
};

export default function Model3DViewer({
  modelUrl,
  animationName = 'Idle',
  scale = 1.0,
  yOffset = -0.9,
  cameraDistance = 2.4,
  autoRotate = false,
  interactive = true,
  fallbackEmoji = '⭐',
  className = '',
  shadow = true
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // References to keep across renders
  const sceneRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const currentActionRef = useRef(null);
  const modelRootRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !modelUrl) return;

    let isMounted = true;
    let animationFrameId = null;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 150;
    const height = container.clientHeight || 150;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, cameraDistance);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = shadow;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Lighting (Toy / Stylized Cartoon aesthetic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    mainLight.position.set(4, 8, 5);
    mainLight.castShadow = shadow;
    if (shadow) {
      mainLight.shadow.mapSize.width = 512;
      mainLight.shadow.mapSize.height = 512;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 20;
      mainLight.shadow.bias = -0.001;
    }
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    // Subtle ground shadow disc
    if (shadow) {
      const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 64;
      shadowCanvas.height = 64;
      const ctx = shadowCanvas.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.12)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = yOffset + 0.02;
      scene.add(shadowMesh);
    }

    // 3. Load Model
    loadGLTFWithCache(modelUrl)
      .then((gltf) => {
        if (!isMounted) return;

        // Clone model scene cleanly
        const model = SkeletonUtils.clone(gltf.scene);
        model.scale.set(scale, scale, scale);
        model.position.set(0, yOffset, 0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = shadow;
            child.receiveShadow = false;
            if (child.material) {
              child.material = child.material.clone();
              child.material.roughness = Math.min(child.material.roughness || 0.8, 0.6);
            }
          }
        });

        scene.add(model);
        modelRootRef.current = model;

        // Animations setup
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          actionsRef.current = {};

          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actionsRef.current[clip.name] = action;
          });

          // Play initial animation
          const initialClipName = actionsRef.current[animationName] ? animationName : gltf.animations[0].name;
          const initialAction = actionsRef.current[initialClipName];
          if (initialAction) {
            initialAction.play();
            currentActionRef.current = initialAction;
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load 3D model:', modelUrl, err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    // 4. Pointer Interaction
    const handlePointerDown = (e) => {
      if (!interactive) return;
      isPointerDownRef.current = true;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      if (!interactive || !isPointerDownRef.current) return;
      const deltaX = e.clientX - pointerStartRef.current.x;
      targetRotationRef.current.y += deltaX * 0.015;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
    };

    if (interactive) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    // 5. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 6. Render loop
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      if (modelRootRef.current) {
        if (autoRotate && !isPointerDownRef.current) {
          targetRotationRef.current.y += delta * 0.8;
        }
        // Smooth lerp rotation towards target
        modelRootRef.current.rotation.y += (targetRotationRef.current.y - modelRootRef.current.rotation.y) * 0.12;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      if (interactive) {
        container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      }

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [modelUrl, scale, yOffset, cameraDistance, autoRotate, interactive, shadow]);

  // Handle animation changes dynamically
  useEffect(() => {
    if (!mixerRef.current || !actionsRef.current || !animationName) return;

    const nextAction = actionsRef.current[animationName];
    if (nextAction && nextAction !== currentActionRef.current) {
      const prevAction = currentActionRef.current;
      if (prevAction) {
        prevAction.fadeOut(0.25);
      }
      nextAction.reset().fadeIn(0.25).play();
      currentActionRef.current = nextAction;
    }
  }, [animationName]);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Three.js Canvas container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading indicator or fallback */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-xs rounded-2xl animate-pulse">
          <span className="text-3xl animate-bounce">{fallbackEmoji}</span>
        </div>
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl drop-shadow">{fallbackEmoji}</span>
        </div>
      )}
    </div>
  );
}
