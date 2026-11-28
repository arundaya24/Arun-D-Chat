"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { AccentColor } from "@/types";

interface ArtisanalCanvasProps {
  theme?: "dark" | "light";
  accent?: AccentColor;
}

interface WaveColorValues {
  ambient: string;
  hemiSky: string;
  hemiGround: string;
  rim: string;
  point: string;
  surface: string;
  emissive: string;
  fresnel: string;
  wire: string;
  crest: string;
}

interface WaveColors {
  ambient: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  rim: THREE.Color;
  point: THREE.Color;
  surface: THREE.Color;
  emissive: THREE.Color;
  fresnel: THREE.Color;
  wire: THREE.Color;
  crest: THREE.Color;
}

const createWaveColors = (values: WaveColorValues): WaveColors => ({
  ambient: new THREE.Color(values.ambient),
  hemiSky: new THREE.Color(values.hemiSky),
  hemiGround: new THREE.Color(values.hemiGround),
  rim: new THREE.Color(values.rim),
  point: new THREE.Color(values.point),
  surface: new THREE.Color(values.surface),
  emissive: new THREE.Color(values.emissive),
  fresnel: new THREE.Color(values.fresnel),
  wire: new THREE.Color(values.wire),
  crest: new THREE.Color(values.crest),
});

const waveColorPalettes: Record<
  AccentColor,
  { dark: WaveColors; light: WaveColors }
> = {
  green: {
    dark: createWaveColors({
      ambient: "#0d4436",
      hemiSky: "#6ee7b7",
      hemiGround: "#052e16",
      rim: "#10b981",
      point: "#34d399",
      surface: "#0c4636",
      emissive: "#064e3b",
      fresnel: "#34d399",
      wire: "#10b981",
      crest: "#6ee7b7",
    }),
    light: createWaveColors({
      ambient: "#bbf7d0",
      hemiSky: "#d1fae5",
      hemiGround: "#065f46",
      rim: "#059669",
      point: "#047857",
      surface: "#10b981",
      emissive: "#064e3b",
      fresnel: "#10b981",
      wire: "#34d399",
      crest: "#a7f3d0",
    }),
  },
  red: {
    dark: createWaveColors({
      ambient: "#441b24",
      hemiSky: "#fda4af",
      hemiGround: "#450a0a",
      rim: "#fb7185",
      point: "#fda4af",
      surface: "#471c25",
      emissive: "#3f1016",
      fresnel: "#fb7185",
      wire: "#f87171",
      crest: "#fda4af",
    }),
    light: createWaveColors({
      ambient: "#fee2e2",
      hemiSky: "#fff1f2",
      hemiGround: "#991b1b",
      rim: "#dc2626",
      point: "#b91c1c",
      surface: "#ef4444",
      emissive: "#7f1d1d",
      fresnel: "#dc2626",
      wire: "#ef4444",
      crest: "#fecdd3",
    }),
  },
  yellow: {
    dark: createWaveColors({
      ambient: "#443514",
      hemiSky: "#fde68a",
      hemiGround: "#422006",
      rim: "#eab308",
      point: "#fde047",
      surface: "#46350e",
      emissive: "#422006",
      fresnel: "#facc15",
      wire: "#eab308",
      crest: "#fef08a",
    }),
    light: createWaveColors({
      ambient: "#fef3c7",
      hemiSky: "#fef9c3",
      hemiGround: "#92400e",
      rim: "#a16207",
      point: "#92400e",
      surface: "#ca8a04",
      emissive: "#78350f",
      fresnel: "#a16207",
      wire: "#ca8a04",
      crest: "#fde68a",
    }),
  },
};

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
    float taperX = smoothstep(0.0, 0.15, normX) * (1.0 - smoothstep(0.85, 1.0, normX));
    float taperY = smoothstep(0.0, 0.16, normY) * (1.0 - smoothstep(0.82, 1.0, normY));
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
    float edgeAlphaX = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));
    float edgeAlphaY = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.80, 1.0, vUv.y));
    float edgeAlpha = edgeAlphaX * edgeAlphaY;
    float crestMix = smoothstep(-0.25, 0.55, vElevation);
    vec3 finalColor = mix(uWireColor, uWireCrestColor, crestMix);
    gl_FragColor = vec4(finalColor, uWireOpacity * edgeAlpha);
  }
`;

export function ArtisanalCanvas({
  theme = "dark",
  accent = "green",
}: ArtisanalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetThemeRef = useRef<number>(theme === "light" ? 1.0 : 0.0);
  const targetAccentRef = useRef<AccentColor>(accent);

  useEffect(() => {
    targetThemeRef.current = theme === "light" ? 1.0 : 0.0;
  }, [theme]);

  useEffect(() => {
    targetAccentRef.current = accent;
  }, [accent]);

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

    const initialColors = waveColorPalettes[accent];
    const ambientLight = new THREE.AmbientLight(initialColors.dark.ambient, 0.9);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      initialColors.dark.hemiSky,
      initialColors.dark.hemiGround,
      0.95
    );
    scene.add(hemiLight);

    const darkKeyColor = new THREE.Color("#d1fae5");
    const lightKeyColor = new THREE.Color("#ffffff");
    const keyLight = new THREE.DirectionalLight(darkKeyColor, 2.75);
    keyLight.position.set(0, 6.2, 4.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(initialColors.dark.rim, 3.1);
    rimLight.position.set(0, 3.4, -3.6);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(initialColors.dark.point, 6.8, 15, 1.5);
    pointLight.position.set(0, 1.9, 2.1);
    scene.add(pointLight);

    const segmentsX = isMobileViewport ? 72 : 128;
    const segmentsY = isMobileViewport ? 52 : 96;
    const surfaceGeometry = new THREE.PlaneGeometry(13.2, 6.0, segmentsX, segmentsY);

    const wireSegmentsX = isMobileViewport ? 36 : 56;
    const wireSegmentsY = isMobileViewport ? 24 : 40;
    const wireGeometry = new THREE.PlaneGeometry(13.2, 6.0, wireSegmentsX, wireSegmentsY);

    const sharedTimeUniform = { value: 0 };
    const sharedMouseUniform = { value: new THREE.Vector2(0, 0) };
    const fresnelColorUniform = {
      value: initialColors.dark.fresnel.clone(),
    };
    const fresnelStrengthUniform = { value: 0.85 };
    const themeUniform = { value: targetThemeRef.current };

    const surfaceMaterial = new THREE.MeshPhysicalMaterial({
      color: initialColors.dark.surface.clone(),
      emissive: initialColors.dark.emissive.clone(),
      emissiveIntensity: 0.42,
      metalness: 0.32,
      roughness: 0.34,
      clearcoat: 0.36,
      clearcoatRoughness: 0.3,
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
          float edgeAlphaX = smoothstep(0.0, 0.14, vWaveUv.x) * (1.0 - smoothstep(0.86, 1.0, vWaveUv.x));
          float edgeAlphaY = smoothstep(0.0, 0.15, vWaveUv.y) * (1.0 - smoothstep(0.80, 1.0, vWaveUv.y));
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

    const wireUniforms = {
      uTime: sharedTimeUniform,
      uMouse: sharedMouseUniform,
      uWireColor: { value: initialColors.dark.wire.clone() },
      uWireCrestColor: { value: initialColors.dark.crest.clone() },
      uWireOpacity: { value: 0.035 },
    };

    const wireMaterial = new THREE.ShaderMaterial({
      vertexShader: wireframeVertexShader,
      fragmentShader: wireframeFragmentShader,
      uniforms: wireUniforms,
      transparent: true,
      depthWrite: false,
      wireframe: false,
    });

    const waveGroup = new THREE.Group();
    waveGroup.position.set(0, -0.62, 0);
    waveGroup.scale.setScalar(0.9);
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
      const palette = waveColorPalettes[targetAccentRef.current];
      surfaceMaterial.color.lerpColors(
        palette.dark.surface,
        palette.light.surface,
        t
      );
      surfaceMaterial.emissive.lerpColors(
        palette.dark.emissive,
        palette.light.emissive,
        t
      );
      surfaceMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.42, 0.18, t);
      surfaceMaterial.metalness = THREE.MathUtils.lerp(0.32, 0.2, t);
      surfaceMaterial.roughness = THREE.MathUtils.lerp(0.34, 0.46, t);
      surfaceMaterial.clearcoat = THREE.MathUtils.lerp(0.36, 0.28, t);
      surfaceMaterial.opacity = THREE.MathUtils.lerp(0.92, 0.95, t);

      fresnelColorUniform.value.lerpColors(
        palette.dark.fresnel,
        palette.light.fresnel,
        t
      );
      fresnelStrengthUniform.value = THREE.MathUtils.lerp(0.85, 0.38, t);
      themeUniform.value = t;

      ambientLight.color.lerpColors(
        palette.dark.ambient,
        palette.light.ambient,
        t
      );
      ambientLight.intensity = THREE.MathUtils.lerp(0.9, 0.72, t);

      hemiLight.color.lerpColors(
        palette.dark.hemiSky,
        palette.light.hemiSky,
        t
      );
      hemiLight.groundColor.lerpColors(
        palette.dark.hemiGround,
        palette.light.hemiGround,
        t
      );
      hemiLight.intensity = THREE.MathUtils.lerp(0.95, 0.78, t);

      keyLight.color.lerpColors(darkKeyColor, lightKeyColor, t);
      keyLight.intensity = THREE.MathUtils.lerp(2.75, 1.8, t);

      rimLight.color.lerpColors(palette.dark.rim, palette.light.rim, t);
      rimLight.intensity = THREE.MathUtils.lerp(3.1, 1.75, t);

      pointLight.color.lerpColors(palette.dark.point, palette.light.point, t);
      pointLight.intensity = THREE.MathUtils.lerp(4.5, 3.0, t);

      wireUniforms.uWireColor.value.lerpColors(
        palette.dark.wire,
        palette.light.wire,
        t
      );
      wireUniforms.uWireCrestColor.value.lerpColors(
        palette.dark.crest,
        palette.light.crest,
        t
      );
      wireUniforms.uWireOpacity.value = 0.035;
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
        pointLight.position.y = 1.55 + Math.cos(elapsedTime * 0.28) * 0.3 + mouseCurrent.y * 0.5;
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
      className={`artisanal-canvas-container${theme === "light" ? " is-light" : ""}`}
      aria-hidden="true"
    />
  );
}
