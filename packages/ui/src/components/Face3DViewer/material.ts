import * as THREE from "three";

export const FACE_3D_VERTEX_SHADER = /* glsl */ `
  attribute float boundaryDist;
  attribute float regionId;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vBoundaryDist;
  varying float vRegionId;

  void main() {
    vUv = uv;
    vBoundaryDist = boundaryDist;
    vRegionId = regionId;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const FACE_3D_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform sampler2D uAlbedo;
  uniform sampler2D uHeatmap;
  uniform float uOpacity;
  uniform float uEdgeFade;
  uniform float uSelectedRegion;
  uniform float uPulseTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vBoundaryDist;
  varying float vRegionId;

  // WCAG-compliant color-blind safe thermal false-color mapping:
  // Navy rgb(26, 43, 76) -> Amber rgb(230, 149, 0) -> Coral rgb(235, 75, 75)
  vec3 getThermalColor(float t) {
    vec3 cNavy = vec3(0.102, 0.169, 0.298);
    vec3 cAmber = vec3(0.902, 0.584, 0.0);
    vec3 cCoral = vec3(0.922, 0.294, 0.294);

    if (t < 0.5) {
      return mix(cNavy, cAmber, t * 2.0);
    } else {
      return mix(cAmber, cCoral, (t - 0.5) * 2.0);
    }
  }

  void main() {
    vec4 albedo = texture2D(uAlbedo, vUv);
    vec4 heat = texture2D(uHeatmap, vUv);

    // Heatmap intensity (chroma / severity)
    float heatIntensity = heat.r;
    vec3 thermalRgb = getThermalColor(heatIntensity);

    // Subtle diffuse lighting for natural 3D depth
    vec3 lightDir = normalize(vec3(0.2, 0.4, 1.0));
    float diff = max(0.45, dot(vNormal, lightDir));
    vec3 litAlbedo = albedo.rgb * diff;

    // Blend albedo with false-color heatmap based on slider opacity
    vec3 blended = mix(litAlbedo, thermalRgb, uOpacity * heat.a);

    // Highlight selected region on tap
    if (abs(vRegionId - uSelectedRegion) < 0.5 && uSelectedRegion > 0.5) {
      float pulse = 0.5 + 0.5 * sin(uPulseTime * 5.0);
      vec3 highlightGlow = vec3(0.15, 0.85, 0.65); // Accessible mint-cyan glow
      blended = mix(blended, highlightGlow, 0.35 + 0.2 * pulse);
    }

    // Soft boundary edge fade to prevent cardboard cut-out silhouette
    float alphaFade = smoothstep(0.0, uEdgeFade, vBoundaryDist);
    float finalAlpha = albedo.a * alphaFade;

    if (finalAlpha < 0.02) {
      discard;
    }

    gl_FragColor = vec4(blended, finalAlpha);
  }
`;

export interface Face3DShaderUniforms {
  uAlbedo: { value: THREE.Texture | null };
  uHeatmap: { value: THREE.Texture | null };
  uOpacity: { value: number };
  uEdgeFade: { value: number };
  uSelectedRegion: { value: number };
  uPulseTime: { value: number };
}

export function createFace3DShaderMaterial(
  albedoTexture: THREE.Texture | null,
  heatmapTexture: THREE.Texture | null,
  opacity = 0.85,
  edgeFade = 0.12
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: FACE_3D_VERTEX_SHADER,
    fragmentShader: FACE_3D_FRAGMENT_SHADER,
    uniforms: {
      uAlbedo: { value: albedoTexture },
      uHeatmap: { value: heatmapTexture },
      uOpacity: { value: opacity },
      uEdgeFade: { value: edgeFade },
      uSelectedRegion: { value: 0 },
      uPulseTime: { value: 0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true
  });
}
