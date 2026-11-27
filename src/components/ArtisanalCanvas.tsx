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

  float getElevation(vec2 pos, float time) {
    float primary = sin(pos.x * 0.85 + time * 0.38 + cos(pos.y * 0.65 + time * 0.22) * 0.72) * 0.52;
    float secondary = cos(pos.x * 1.45 + pos.y * 0.75 + time * 0.44) * 0.24;
    float tertiary = sin(pos.x * 2.15 - pos.y * 0.65 + time * 0.48) * 0.10;
    
    float mouseDist = distance(pos * 0.48, uMouse);
    float mouseDecay = exp(-mouseDist * mouseDist * 2.4);
    float mouseWave = cos(mouseDist * 2.4 - time * 0.75) * mouseDecay * 0.18;
    
    return primary + secondary + tertiary + mouseWave;
  }

  void main() {
    vUv = uv;
    vec3 transformed = position;
    
    float elevation = getElevation(transformed.xy, uTime);
    transformed.z += elevation;
    vElevation = elevation;
    
    float delta = 0.04;
    float elevX = getElevation(transformed.xy + vec2(delta, 0.0), uTime);
    float elevY = getElevation(transformed.xy + vec2(0.0, delta), uTime);
    
    vec3 tangentX = vec3(delta, 0.0, elevX - elevation);
    vec3 tangentY = vec3(0.0, delta, elevY - elevation);
    vec3 calculatedNormal = normalize(cross(tangentX, tangentY));
    
    vNormal = normalize(normalMatrix * calculatedNormal);
    
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
    vec3 lightDir = normalize(vec3(0.55, 0.75, 1.15));
    
    float diffuse = max(dot(normal, lightDir), 0.0);
    float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 22.0);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    
    vec3 darkShadow = vec3(0.035, 0.045, 0.038);
    vec3 darkMid = vec3(0.065, 0.09, 0.075);
    vec3 darkHighlight = vec3(0.12, 0.25, 0.19);
    vec3 darkAccent = vec3(0.063, 0.639, 0.498);
    
    vec3 lightShadow = vec3(0.74, 0.82, 0.77);
    vec3 lightMid = vec3(0.86, 0.92, 0.88);
    vec3 lightHighlight = vec3(0.97, 1.0, 0.98);
    vec3 lightAccent = vec3(0.04, 0.55, 0.42);
    
    vec3 activeShadow = mix(darkShadow, lightShadow, uTheme);
    vec3 activeMid = mix(darkMid, lightMid, uTheme);
    vec3 activeHighlight = mix(darkHighlight, lightHighlight, uTheme);
    vec3 activeAccent = mix(darkAccent, lightAccent, uTheme);
    
    float elevationFactor = smoothstep(-0.4, 0.4, vElevation);
    vec3 surfaceColor = mix(activeShadow, activeMid, diffuse * 0.7 + 0.3);
    surfaceColor = mix(surfaceColor, activeHighlight, elevationFactor * 0.4 + specular * 0.6);
    surfaceColor = mix(surfaceColor, activeAccent, fresnel * (uTheme > 0.5 ? 0.45 : 0.65));
    
    float iridescentEffect = sin(vUv.x * 10.0 + uTime * 0.2) * cos(vUv.y * 10.0 + uTime * 0.2) * 0.025;
    surfaceColor += iridescentEffect * (uTheme > 0.5 ? 0.6 : 0.9);
    
    float alpha = mix(0.72, 0.62, uTheme);
    gl_FragColor = vec4(surfaceColor, alpha);
  }
`;

export function ArtisanalCanvas({ theme = "dark" }: ArtisanalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetThemeRef = useRef<number>(theme === "light" ? 1.0 : 0.0);
  const currentThemeUniformRef = useRef<THREE.IUniform<number>>({
    value: theme === "light" ? 1.0 : 0.0,
  });

  useEffect(() => {
    targetThemeRef.current = theme === "light" ? 1.0 : 0.0;
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
    camera.position.set(0, -1.15, 3.35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const segments = isMobileViewport ? 48 : 96;
    const geometry = new THREE.PlaneGeometry(6.6, 5.0, segments, segments);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uTheme: currentThemeUniformRef.current,
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

      currentThemeUniformRef.current.value +=
        (targetThemeRef.current - currentThemeUniformRef.current.value) * 0.05;

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
      renderer.forceContextLoss();
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
