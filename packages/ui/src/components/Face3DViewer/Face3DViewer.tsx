"use client";

import {
  buildCanonicalFaceMeshGeometry,
  CODE_TO_REGION_MAP,
  type FaceMeshGeometryData,
  type FaceRegionId,
  REGION_CODE_MAP
} from "@dermalens/analysis-core";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createFace3DShaderMaterial } from "./material";

export interface Face3DViewerProps {
  readonly albedoBuffer?: Uint8ClampedArray;
  readonly albedoWidth?: number;
  readonly albedoHeight?: number;
  readonly heatmapBuffer?: Uint8Array;
  readonly heatmapWidth?: number;
  readonly heatmapHeight?: number;
  readonly overlayOpacity?: number; // [0, 1]
  readonly selectedRegion?: FaceRegionId | null;
  readonly onSelectRegion?: (region: FaceRegionId) => void;
  readonly className?: string;
}

export function Face3DViewer({
  albedoBuffer,
  albedoWidth = 128,
  albedoHeight = 128,
  heatmapBuffer,
  heatmapWidth = 128,
  heatmapHeight = 128,
  overlayOpacity = 0.85,
  selectedRegion = null,
  onSelectRegion,
  className = ""
}: Face3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);
  const [isContextLost, setIsContextLost] = useState<boolean>(false);

  // References for scene, renderer, controls, and animation state
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const albedoTextureRef = useRef<THREE.DataTexture | null>(null);
  const heatmapTextureRef = useRef<THREE.DataTexture | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);

  // Trigger on-demand render
  const renderFrame = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // Request continuous animation when interacting or transitioning
  const startInteractionLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;

    const tick = () => {
      if (controlsRef.current?.update()) {
        renderFrame();
      }
      if (materialRef.current) {
        if (materialRef.current.uniforms.uPulseTime) { materialRef.current.uniforms.uPulseTime.value = performance.now() * 0.001; }
        renderFrame();
      }

      if (isInteractingRef.current) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
        renderFrame();
      }
    };

    isInteractingRef.current = true;
    rafIdRef.current = requestAnimationFrame(tick);
  }, [renderFrame]);

  const stopInteractionLoop = useCallback(() => {
    isInteractingRef.current = false;
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Check WebGL availability
    try {
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        setIsWebGLSupported(false);
        return;
      }
    } catch {
      setIsWebGLSupported(false);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 20);
    camera.position.set(0, 0, 2.6);
    cameraRef.current = camera;

    // WebGL Renderer with DPR cap & mediump precision for mobile efficiency
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // OrbitControls with strict mobile constraints: clamped azimuth and polar angles
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 4.0;
    // Single-photo constraint: clamp azimuth to ±45° (frontal hemisphere only)
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    // Clamp polar angle: no extreme under-chin or top-of-skull angles
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = (2 * Math.PI) / 3;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    controls.addEventListener("start", () => {
      startInteractionLoop();
    });
    controls.addEventListener("change", () => {
      renderFrame();
    });
    controls.addEventListener("end", () => {
      stopInteractionLoop();
      renderFrame();
    });
    controlsRef.current = controls;

    // Build canonical 3D face mesh geometry
    const meshData: FaceMeshGeometryData = buildCanonicalFaceMeshGeometry({
      gridResolutionX: 32,
      gridResolutionY: 40,
      depthSmoothingIterations: 3
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(meshData.positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(meshData.uvs, 2));
    geometry.setAttribute("normal", new THREE.BufferAttribute(meshData.normals, 3));
    geometry.setAttribute("boundaryDist", new THREE.BufferAttribute(meshData.boundaryDistances, 1));
    geometry.setAttribute("regionId", new THREE.BufferAttribute(new Float32Array(meshData.regionIds), 1));
    geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

    // Custom shader material with edge fade & false-color thermal blending
    const material = createFace3DShaderMaterial(null, null, overlayOpacity, 0.14);
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    // Context loss listeners
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setIsContextLost(true);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const handleContextRestored = () => {
      setIsContextLost(false);
      renderFrame();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    // Initial render
    renderFrame();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
          renderFrame();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [overlayOpacity, renderFrame, startInteractionLoop, stopInteractionLoop]);

  // Update Albedo Texture
  useEffect(() => {
    if (!materialRef.current || !albedoBuffer) return;

    if (albedoTextureRef.current) {
      albedoTextureRef.current.dispose();
    }

    const texture = new THREE.DataTexture(
      albedoBuffer,
      albedoWidth,
      albedoHeight,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    albedoTextureRef.current = texture;

    if (materialRef.current.uniforms.uAlbedo) { materialRef.current.uniforms.uAlbedo.value = texture; }
    renderFrame();
  }, [albedoBuffer, albedoWidth, albedoHeight, renderFrame]);

  // Update Heatmap Texture
  useEffect(() => {
    if (!materialRef.current || !heatmapBuffer) return;

    if (heatmapTextureRef.current) {
      heatmapTextureRef.current.dispose();
    }

    // Convert grayscale/alpha heatmap buffer to RGBA texture
    const pixelCount = heatmapWidth * heatmapHeight;
    const rgba = new Uint8Array(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      const val = heatmapBuffer[i] ?? 0;
      rgba[i * 4] = val; // R: intensity [0, 255]
      rgba[i * 4 + 1] = val; // G
      rgba[i * 4 + 2] = val; // B
      rgba[i * 4 + 3] = val > 0 ? 255 : 0; // A: alpha coverage
    }

    const texture = new THREE.DataTexture(
      rgba,
      heatmapWidth,
      heatmapHeight,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    heatmapTextureRef.current = texture;

    if (materialRef.current.uniforms.uHeatmap) { materialRef.current.uniforms.uHeatmap.value = texture; }
    renderFrame();
  }, [heatmapBuffer, heatmapWidth, heatmapHeight, renderFrame]);

  // Update Opacity uniform
  useEffect(() => {
    if (materialRef.current) {
      if (materialRef.current.uniforms.uOpacity) { materialRef.current.uniforms.uOpacity.value = overlayOpacity; }
      renderFrame();
    }
  }, [overlayOpacity, renderFrame]);

  // Update Selected Region uniform
  useEffect(() => {
    if (materialRef.current) {
      const regionCode = selectedRegion ? REGION_CODE_MAP[selectedRegion] ?? 0 : 0;
      if (materialRef.current.uniforms.uSelectedRegion) { materialRef.current.uniforms.uSelectedRegion.value = regionCode; }
      if (regionCode > 0) {
        startInteractionLoop();
        // Stop pulse loop after 1.5 seconds to save battery
        const timeout = setTimeout(() => {
          stopInteractionLoop();
          renderFrame();
        }, 1500);
        return () => clearTimeout(timeout);
      }
      renderFrame();
    }
  }, [selectedRegion, renderFrame, startInteractionLoop, stopInteractionLoop]);

  // Touch & Pointer interaction: Raycasting for tap-region highlight & double-tap to reset
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const now = performance.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;

    // Double-tap reset detection (< 300ms)
    if (timeSinceLastTap < 300 && controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0, 2.6);
      cameraRef.current.lookAt(0, 0, 0);
      renderFrame();
      return;
    }

    // Raycast on tap to select facial region
    const canvas = canvasRef.current;
    if (!canvas || !meshRef.current || !cameraRef.current || !onSelectRegion) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObject(meshRef.current);
    if (intersects.length > 0 && intersects[0]?.face) {
      const face = intersects[0].face;
      const geometry = meshRef.current.geometry;
      const regionAttr = geometry.getAttribute("regionId");
      if (regionAttr) {
        const regionCode = regionAttr.getX(face.a);
        const regionId = CODE_TO_REGION_MAP[regionCode];
        if (regionId) {
          onSelectRegion(regionId);
        }
      }
    }
  };

  if (!isWebGLSupported) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 text-center ${className}`}
        style={{ minHeight: "340px" }}
      >
        <div className="w-12 h-12 mb-3 rounded-full bg-slate-800 flex items-center justify-center text-xl">
          🌐
        </div>
        <p className="font-semibold text-sm text-slate-100">3D View Unavailable</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Hardware WebGL acceleration is not active on this browser session. The 2D heatmap projection remains fully functional.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/5] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
        aria-label="Interactive 3D Face Model"
        role="img"
      />

      {/* Approximate 3D Badge (Strict Roadmap requirement) */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/85 text-slate-300 border border-slate-700/60 backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          approximate 3D from a single photo
        </span>
      </div>

      {/* Orbit Gesture Guidance Pill */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none px-4">
        <span className="text-[10px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm shadow-sm text-center">
          Drag to rotate · Pinch to zoom · Tap region to inspect · Double tap to reset
        </span>
      </div>

      {isContextLost && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <p className="text-sm font-medium text-amber-300">GPU Context Suspended</p>
          <p className="text-xs text-slate-400 mt-1">Tap canvas to resume 3D rendering.</p>
        </div>
      )}
    </div>
  );
}

export function Face3DFallback() {
  return (
    <div
      className="w-full aspect-[4/5] max-h-[460px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-3 p-6 animate-pulse"
      style={{ minHeight: "340px" }}
    >
      <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-400">Loading 3D face viewer...</span>
    </div>
  );
}
