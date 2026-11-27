"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ArtisanalCanvasProps {
  theme?: "dark" | "light";
}

const vertexShaderSource = `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 transformed = position;
    
    float waveA = sin(transformed.x * 1.8 + uTime * 0.45) * cos(transformed.y * 1.4 + uTime * 0.35);
    float waveB = sin(transformed.x * 3.2 - uTime * 0.6 + transformed.y * 2.4) * 0.18;
    float mouseDistance = distance(transformed.xy * 0.5, uMouse);
    float mouseRipple = sin(mouseDistance * 6.0 - uTime * 1.2) * exp(-mouseDistance * 2.2) * 0.22;
    
    float totalElevation = (waveA + waveB + mouseRipple) * 0.42;
    transformed.z += totalElevation;
    
    vElevation = totalElevation;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);
    vViewPosition = -modelViewPosition.xyz;
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

const fragmentShaderSource = `
  uniform float uTime;
  uniform float uTheme;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vElevation;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);
    
    vec3 darkBase = vec3(0.045, 0.055, 0.048);
    vec3 darkAccent = vec3(0.063, 0.639, 0.498);
    vec3 darkSecondary = vec3(0.08, 0.18, 0.14);
    
    vec3 lightBase = vec3(0.965, 0.978, 0.968);
    vec3 lightAccent = vec3(0.058, 0.603, 0.462);
    vec3 lightSecondary = vec3(0.88, 0.94, 0.91);
    
    vec3 activeBase = mix(darkBase, lightBase, uTheme);
    vec3 activeAccent = mix(darkAccent, lightAccent, uTheme);
    vec3 activeSecondary = mix(darkSecondary, lightSecondary, uTheme);
    
    float surfaceGradient = smoothstep(-0.4, 0.4, vElevation);
    vec3 color = mix(activeBase, activeSecondary, surfaceGradient * 0.65);
    color = mix(color, activeAccent, fresnel * (uTheme > 0.5 ? 0.35 : 0.65));
    
    float subtleIridescence = sin(vUv.x * 12.0 + uTime * 0.3) * cos(vUv.y * 12.0 + uTime * 0.2) * 0.035;
    color += subtleIridescence * (uTheme > 0.5 ? 0.5 : 0.8);
    
    float alpha = mix(0.48, 0.28, uTheme);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function ArtisanalCanvas({ theme = "dark" }: ArtisanalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeUniformRef = useRef<THREE.IUniform<number>>({ value: theme === "light" ? 1.0 : 0.0 });

  useEffect(() => {
    themeUniformRef.current.value = theme === "light" ? 1.0 : 0.0;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobileViewport = window.innerWidth < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, -1.2, 3.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const segments = isMobileViewport ? 48 : 96;
    const geometry = new THREE.PlaneGeometry(6.4, 4.8, segments, segments);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uTheme: themeUniformRef.current,
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      uniforms,
      transparent: true,
      depthWrite: false,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.55;
    scene.add(mesh);

    const mouseCurrent = new THREE.Vector2(0, 0);
    const mouseTarget = new THREE.Vector2(0, 0);

    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseTarget.set(x, y);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    let animationFrameIdentifier = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsedTime = clock.getElapsedTime();

      if (!isReducedMotion) {
        uniforms.uTime.value = elapsedTime;
      }

      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.045;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.045;
      uniforms.uMouse.value.copy(mouseCurrent);

      mesh.rotation.z = mouseCurrent.x * 0.06;
      mesh.rotation.x = -0.55 + mouseCurrent.y * 0.06;

      renderer.render(scene, camera);
      animationFrameIdentifier = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameIdentifier);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="artisanal-canvas-container"
      aria-hidden="true"
    />
  );
}
