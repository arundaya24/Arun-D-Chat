"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ArtisanalCanvasProps {
  theme?: "dark" | "light";
}

const waveShaderFunctions = `
  uniform float uTime;
  uniform vec2 uMouse;

  float getRawElevation(vec2 pos, float time) {
    float primary = sin(pos.x * 0.82 + time * 0.36 + cos(pos.y * 0.62 + time * 0.22) * 0.78) * 0.62;
    float secondary = cos(pos.x * 1.38 + pos.y * 0.72 + time * 0.42) * 0.28;
    float tertiary = sin(pos.x * 2.05 - pos.y * 0.68 + time * 0.48) * 0.12;

    float mouseDist = distance(vec2(pos.x * 0.30, pos.y * 0.46), uMouse);
    float mouseDecay = exp(-mouseDist * mouseDist * 2.2);
    float mouseWave = cos(mouseDist * 2.4 - time * 0.75) * mouseDecay * 0.20;

    return primary + secondary + tertiary + mouseWave;
  }

  float getEdgeTaper(vec2 pos) {
    float normX = clamp(pos.x / 6.6 * 0.5 + 0.5, 0.0, 1.0);
    float normY = clamp(pos.y / 3.0 * 0.5 + 0.5, 0.0, 1.0);
    float taperX = smoothstep(0.0, 0.15, normX) * smoothstep(1.0, 0.85, normX);
    float taperY = smoothstep(0.0, 0.16, normY) * smoothstep(1.0, 0.82, normY);
    return taperX * taperY;
  }

  float getElevation(vec2 pos, float time) {
    return getRawElevation(pos, time) * getEdgeTaper(pos);
  }
`;

const wireframeVertexShader = `
  varying vec2 vUv;
  varying float vElevation;
  ${waveShaderFunctions}

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float elevation = getElevation(transformed.xy, uTime);
    transformed.z += elevation;
    vElevation = elevation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const wireframeFragmentShader = `
  uniform vec3 uWireColor;
  uniform vec3 uWireCrestColor;
  uniform float uWireOpacity;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float edgeAlphaX = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
    float edgeAlphaY = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.80, vUv.y);
    float edgeAlpha = edgeAlphaX * edgeAlphaY;
    float crestMix = smoothstep(-0.25, 0.55, vElevation);
    vec3 finalColor = mix(uWireColor, uWireCrestColor, crestMix);
    gl_FragColor = vec4(finalColor, uWireOpacity * edgeAlpha);
  }
`;

export function ArtisanalCanvas({ theme = "dark" }: ArtisanalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetThemeRef = useRef<number>(theme === "light" ? 1.0 : 0.0);

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
      44,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.48, 3.95);
    camera.lookAt(0, 0.10, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    const darkAmbientColor = new THREE.Color("#0d4436");
    const lightAmbientColor = new THREE.Color("#a7f3d0");
    const ambientLight = new THREE.AmbientLight(darkAmbientColor, 0.9);
    scene.add(ambientLight);

    const darkHemiSky = new THREE.Color("#6ee7b7");
    const lightHemiSky = new THREE.Color("#ecfdf5");
    const darkHemiGround = new THREE.Color("#052e16");
    const lightHemiGround = new THREE.Color("#064e3b");
    const hemiLight = new THREE.HemisphereLight(darkHemiSky, darkHemiGround, 0.95);
    scene.add(hemiLight);

    const darkKeyColor = new THREE.Color("#d1fae5");
    const lightKeyColor = new THREE.Color("#ffffff");
    const keyLight = new THREE.DirectionalLight(darkKeyColor, 2.75);
    keyLight.position.set(4.5, 6.2, 4.0);
    scene.add(keyLight);

    const darkRimColor = new THREE.Color("#10b981");
    const lightRimColor = new THREE.Color("#34d399");
    const rimLight = new THREE.DirectionalLight(darkRimColor, 3.1);
    rimLight.position.set(-5.2, 3.4, -3.6);
    scene.add(rimLight);

    const darkPointColor = new THREE.Color("#34d399");
    const lightPointColor = new THREE.Color("#10b981");
    const pointLight = new THREE.PointLight(darkPointColor, 6.8, 15, 1.5);
    pointLight.position.set(0.4, 1.9, 2.1);
    scene.add(pointLight);

    const segmentsX = isMobileViewport ? 72 : 128;
    const segmentsY = isMobileViewport ? 52 : 96;
    const surfaceGeometry = new THREE.PlaneGeometry(13.2, 6.0, segmentsX, segmentsY);

    const wireSegmentsX = isMobileViewport ? 36 : 56;
    const wireSegmentsY = isMobileViewport ? 24 : 40;
    const wireGeometry = new THREE.PlaneGeometry(13.2, 6.0, wireSegmentsX, wireSegmentsY);

    const sharedTimeUniform = { value: 0 };
    const sharedMouseUniform = { value: new THREE.Vector2(0, 0) };
    const fresnelColorUniform = { value: new THREE.Color("#34d399") };
    const fresnelStrengthUniform = { value: 0.85 };
    const themeUniform = { value: targetThemeRef.current };

    const darkSurfaceColor = new THREE.Color("#0c4636");
    const lightSurfaceColor = new THREE.Color("#065f46");
    const darkEmissiveColor = new THREE.Color("#064e3b");
    const lightEmissiveColor = new THREE.Color("#043b2c");
    const darkFresnelColor = new THREE.Color("#34d399");
    const lightFresnelColor = new THREE.Color("#10b981");

    const surfaceMaterial = new THREE.MeshPhysicalMaterial({
      color: darkSurfaceColor.clone(),
      emissive: darkEmissiveColor.clone(),
      emissiveIntensity: 0.42,
      metalness: 0.44,
      roughness: 0.28,
      clearcoat: 0.48,
      clearcoatRoughness: 0.22,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    surfaceMaterial.customProgramCacheKey = () => "artisanal-wave-physical-v1";
    surfaceMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = sharedTimeUniform;
      shader.uniforms.uMouse = sharedMouseUniform;
      shader.uniforms.uFresnelColor = fresnelColorUniform;
      shader.uniforms.uFresnelStrength = fresnelStrengthUniform;
      shader.uniforms.uTheme = themeUniform;

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          varying vec2 vWaveUv;
          varying float vElevation;
          ${waveShaderFunctions}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
          float wDelta = 0.06;
          float wElevX1 = getElevation(position.xy - vec2(wDelta, 0.0), uTime);
          float wElevX2 = getElevation(position.xy + vec2(wDelta, 0.0), uTime);
          float wElevY1 = getElevation(position.xy - vec2(0.0, wDelta), uTime);
          float wElevY2 = getElevation(position.xy + vec2(0.0, wDelta), uTime);
          objectNormal = normalize(vec3(wElevX1 - wElevX2, wElevY1 - wElevY2, 2.0 * wDelta));`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float wElev = getElevation(transformed.xy, uTime);
          transformed.z += wElev;
          vElevation = wElev;
          vWaveUv = uv;`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform vec3 uFresnelColor;
          uniform float uFresnelStrength;
          uniform float uTheme;
          varying vec2 vWaveUv;
          varying float vElevation;`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float elevNorm = clamp((vElevation + 0.55) / 1.1, 0.0, 1.0);
          diffuseColor.rgb *= mix(0.68, 1.28, elevNorm);
          float edgeAlphaX = smoothstep(0.0, 0.14, vWaveUv.x) * smoothstep(1.0, 0.86, vWaveUv.x);
          float edgeAlphaY = smoothstep(0.0, 0.15, vWaveUv.y) * smoothstep(1.0, 0.80, vWaveUv.y);
          diffuseColor.a *= edgeAlphaX * edgeAlphaY;`
        )
        .replace(
          "#include <opaque_fragment>",
          `float waveNdotV = clamp(dot(geometryViewDir, geometryNormal), 0.0, 1.0);
          float waveFresnel = pow(1.0 - waveNdotV, 2.2) * smoothstep(0.05, 0.34, waveNdotV);
          float ridgeCrest = smoothstep(0.14, 0.65, vElevation);
          outgoingLight += uFresnelColor * (waveFresnel * uFresnelStrength + ridgeCrest * uFresnelStrength * 0.20);
          #include <opaque_fragment>`
        );
    };

    const darkWireColor = new THREE.Color("#10b981");
    const lightWireColor = new THREE.Color("#064e3b");
    const darkWireCrestColor = new THREE.Color("#6ee7b7");
    const lightWireCrestColor = new THREE.Color("#a7f3d0");

    const wireUniforms = {
      uTime: sharedTimeUniform,
      uMouse: sharedMouseUniform,
      uWireColor: { value: darkWireColor.clone() },
      uWireCrestColor: { value: darkWireCrestColor.clone() },
      uWireOpacity: { value: 0.16 },
    };

    const wireMaterial = new THREE.ShaderMaterial({
      vertexShader: wireframeVertexShader,
      fragmentShader: wireframeFragmentShader,
      uniforms: wireUniforms,
      transparent: true,
      depthWrite: false,
      wireframe: true,
    });

    const waveGroup = new THREE.Group();
    waveGroup.position.set(0, -0.18, 0);
    waveGroup.rotation.x = -0.82;

    const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    wireMesh.position.z = 0.006;

    waveGroup.add(surfaceMesh);
    waveGroup.add(wireMesh);
    scene.add(waveGroup);

    const mouseCurrent = new THREE.Vector2(0, 0);
    const mouseTarget = new THREE.Vector2(0, 0);

    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseTarget.set(x, y);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    let animationFrameIdentifier = 0;
    let themeFactor = targetThemeRef.current;
    const clock = new THREE.Clock();

    const applyThemeBlend = (t: number) => {
      surfaceMaterial.color.lerpColors(darkSurfaceColor, lightSurfaceColor, t);
      surfaceMaterial.emissive.lerpColors(darkEmissiveColor, lightEmissiveColor, t);
      surfaceMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.42, 0.24, t);
      surfaceMaterial.metalness = THREE.MathUtils.lerp(0.44, 0.28, t);
      surfaceMaterial.roughness = THREE.MathUtils.lerp(0.28, 0.36, t);
      surfaceMaterial.clearcoat = THREE.MathUtils.lerp(0.48, 0.36, t);
      surfaceMaterial.opacity = THREE.MathUtils.lerp(0.92, 0.95, t);

      fresnelColorUniform.value.lerpColors(darkFresnelColor, lightFresnelColor, t);
      fresnelStrengthUniform.value = THREE.MathUtils.lerp(0.85, 0.45, t);
      themeUniform.value = t;

      ambientLight.color.lerpColors(darkAmbientColor, lightAmbientColor, t);
      ambientLight.intensity = THREE.MathUtils.lerp(0.9, 1.0, t);

      hemiLight.color.lerpColors(darkHemiSky, lightHemiSky, t);
      hemiLight.groundColor.lerpColors(darkHemiGround, lightHemiGround, t);
      hemiLight.intensity = THREE.MathUtils.lerp(0.95, 1.15, t);

      keyLight.color.lerpColors(darkKeyColor, lightKeyColor, t);
      keyLight.intensity = THREE.MathUtils.lerp(2.75, 2.55, t);

      rimLight.color.lerpColors(darkRimColor, lightRimColor, t);
      rimLight.intensity = THREE.MathUtils.lerp(3.1, 2.25, t);

      pointLight.color.lerpColors(darkPointColor, lightPointColor, t);
      pointLight.intensity = THREE.MathUtils.lerp(6.8, 5.2, t);

      wireUniforms.uWireColor.value.lerpColors(darkWireColor, lightWireColor, t);
      wireUniforms.uWireCrestColor.value.lerpColors(darkWireCrestColor, lightWireCrestColor, t);
      wireUniforms.uWireOpacity.value = THREE.MathUtils.lerp(0.16, 0.18, t);
    };

    applyThemeBlend(themeFactor);

    const renderLoop = () => {
      const elapsedTime = clock.getElapsedTime();

      if (!isReducedMotion) {
        sharedTimeUniform.value = elapsedTime;
      }

      themeFactor += (targetThemeRef.current - themeFactor) * 0.06;
      applyThemeBlend(themeFactor);

      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.045;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.045;
      sharedMouseUniform.value.copy(mouseCurrent);

      waveGroup.rotation.z = mouseCurrent.x * 0.04;
      waveGroup.rotation.x = -0.82 + mouseCurrent.y * 0.04;

      if (!isReducedMotion) {
        pointLight.position.x = Math.sin(elapsedTime * 0.35) * 2.2 + mouseCurrent.x * 1.4;
        pointLight.position.y = 1.85 + Math.cos(elapsedTime * 0.28) * 0.35 + mouseCurrent.y * 0.6;
      }

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

      surfaceGeometry.dispose();
      wireGeometry.dispose();
      surfaceMaterial.dispose();
      wireMaterial.dispose();
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
