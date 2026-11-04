import { FaceRegion, type FaceRegionId } from "../types";
import type { Point2D } from "./scale";

export interface FaceMeshVertexInput {
  readonly x: number;
  readonly y: number;
  readonly z?: number;
  readonly u?: number;
  readonly v?: number;
}

export interface FaceMeshGeometryData {
  readonly positions: Float32Array;
  readonly uvs: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint16Array;
  readonly boundaryDistances: Float32Array;
  readonly regionIds: Uint8Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
}

export const REGION_CODE_MAP: Record<FaceRegionId, number> = {
  [FaceRegion.FOREHEAD]: 1,
  [FaceRegion.LEFT_CHEEK]: 2,
  [FaceRegion.RIGHT_CHEEK]: 3,
  [FaceRegion.NOSE]: 4,
  [FaceRegion.CHIN]: 5,
  [FaceRegion.PERIORAL]: 6,
  [FaceRegion.UNDER_EYES]: 7,
  [FaceRegion.T_ZONE]: 8,
  [FaceRegion.U_ZONE]: 9
};

export const CODE_TO_REGION_MAP: Record<number, FaceRegionId> = {
  1: FaceRegion.FOREHEAD,
  2: FaceRegion.LEFT_CHEEK,
  3: FaceRegion.RIGHT_CHEEK,
  4: FaceRegion.NOSE,
  5: FaceRegion.CHIN,
  6: FaceRegion.PERIORAL,
  7: FaceRegion.UNDER_EYES,
  8: FaceRegion.T_ZONE,
  9: FaceRegion.U_ZONE
};

/**
 * Maps a canonical UV coordinate (u in [0, 1], v in [0, 1]) to a FaceRegionId.
 */
export function getRegionFromUV(u: number, v: number): FaceRegionId {
  if (v < 0.35) {
    return FaceRegion.FOREHEAD;
  }
  if (v >= 0.35 && v < 0.68) {
    if (u >= 0.42 && u <= 0.58) {
      return FaceRegion.NOSE;
    }
    if (v < 0.48 && (u < 0.42 || u > 0.58)) {
      return FaceRegion.UNDER_EYES;
    }
    if (u < 0.45) {
      return FaceRegion.LEFT_CHEEK;
    }
    return FaceRegion.RIGHT_CHEEK;
  }
  if (v >= 0.68 && v < 0.82) {
    return FaceRegion.PERIORAL;
  }
  return FaceRegion.CHIN;
}

/**
 * Calculates biological 3D facial depth prior from 2D coordinates (u, v) centered at (0.5, 0.5).
 * Simulates the natural cranial ellipsoid curvature + nasal projection + eye socket depression.
 */
export function computeFacialDepthPrior(u: number, v: number): number {
  const dx = (u - 0.5) * 2.0; // [-1, 1]
  const dy = (v - 0.5) * 2.0; // [-1, 1]

  // Base ellipsoidal curvature
  const r2 = (dx * dx) / 1.1 + (dy * dy) / 1.3;
  let z = -0.35 * Math.max(0, r2);

  // Nasal ridge and tip projection
  const noseDistX = Math.abs(u - 0.5);
  const noseDistY = v - 0.52;
  if (noseDistX < 0.14 && v >= 0.35 && v <= 0.66) {
    const nasalRidge = Math.cos((noseDistX / 0.14) * (Math.PI / 2));
    const nasalLength = Math.max(0, 1.0 - Math.abs(noseDistY) / 0.18);
    z += 0.22 * nasalRidge * nasalLength;
  }

  // Cheekbone subtle elevation
  const cheekY = Math.abs(v - 0.54);
  const cheekX = Math.abs(Math.abs(u - 0.5) - 0.28);
  if (cheekX < 0.16 && cheekY < 0.14) {
    z += 0.08 * (1.0 - cheekX / 0.16) * (1.0 - cheekY / 0.14);
  }

  // Eye socket indentation
  const leftEyeDist = Math.hypot(u - 0.33, v - 0.42);
  const rightEyeDist = Math.hypot(u - 0.67, v - 0.42);
  if (leftEyeDist < 0.1) {
    z -= 0.08 * (1.0 - leftEyeDist / 0.1);
  } else if (rightEyeDist < 0.1) {
    z -= 0.08 * (1.0 - rightEyeDist / 0.1);
  }

  return z;
}

export interface BuildFaceMeshOptions {
  readonly gridResolutionX?: number; // default 36
  readonly gridResolutionY?: number; // default 44
  readonly depthSmoothingIterations?: number; // default 3
  readonly depthSmoothingWeight?: number; // default 0.45
  readonly inputLandmarks?: readonly FaceMeshVertexInput[];
}

/**
 * Builds canonical 3D face mesh geometry with:
 * - Depth-smoothed 3D vertex positions
 * - Canonical UV coordinates
 * - Smooth vertex normals
 * - Geodesic boundary distance for soft edge fading in shader
 * - Facial region code mapping per vertex
 */
export function buildCanonicalFaceMeshGeometry(
  options: BuildFaceMeshOptions = {}
): FaceMeshGeometryData {
  const resX = options.gridResolutionX ?? 36;
  const resY = options.gridResolutionY ?? 44;
  const smoothingIterations = options.depthSmoothingIterations ?? 3;
  const smoothingWeight = options.depthSmoothingWeight ?? 0.45;

  const rawVertices: {
    x: number;
    y: number;
    z: number;
    u: number;
    v: number;
    boundaryDist: number;
    regionId: number;
  }[] = [];

  const gridIndexMap: number[][] = [];

  for (let iy = 0; iy <= resY; iy++) {
    const rowMap: number[] = [];
    const v = iy / resY; // 0.0 (top) to 1.0 (bottom)
    const normY = (v - 0.5) * 2.0;

    for (let ix = 0; ix <= resX; ix++) {
      const u = ix / resX; // 0.0 (left) to 1.0 (right)
      const normX = (u - 0.5) * 2.0;

      // Elliptical boundary condition: discard vertices outside face oval
      // Forehead is broader, chin narrows
      const widthFactor = 0.88 - 0.25 * Math.max(0, normY);
      const heightFactor = 0.94;
      const normalizedDistSq =
        (normX * normX) / (widthFactor * widthFactor) +
        (normY * normY) / (heightFactor * heightFactor);

      if (normalizedDistSq > 1.0) {
        rowMap.push(-1);
        continue;
      }

      // Normalized distance from boundary [0 = edge, 1 = center]
      const boundaryDist = Math.max(0, Math.min(1.0, 1.0 - Math.sqrt(normalizedDistSq)));

      // Scaled world-space 3D coordinates (centered at 0, 0, 0)
      const worldX = normX * 0.95;
      const worldY = -normY * 1.15; // Invert Y for 3D coordinate convention
      const baseZ = computeFacialDepthPrior(u, v);

      const region = getRegionFromUV(u, v);
      const regionCode = REGION_CODE_MAP[region] ?? 0;

      const vertexIdx = rawVertices.length;
      rawVertices.push({
        x: worldX,
        y: worldY,
        z: baseZ,
        u,
        v: 1.0 - v, // Flip V for Three.js texture coordinate system
        boundaryDist,
        regionId: regionCode
      });
      rowMap.push(vertexIdx);
    }
    gridIndexMap.push(rowMap);
  }

  // Generate triangle indices
  const indicesList: number[] = [];
  const adjacency: Set<number>[] = Array.from({ length: rawVertices.length }, () => new Set<number>());

  for (let iy = 0; iy < resY; iy++) {
    const rowCurrent = gridIndexMap[iy];
    const rowNext = gridIndexMap[iy + 1];
    if (!rowCurrent || !rowNext) continue;

    for (let ix = 0; ix < resX; ix++) {
      const p0 = rowCurrent[ix] ?? -1;
      const p1 = rowCurrent[ix + 1] ?? -1;
      const p2 = rowNext[ix] ?? -1;
      const p3 = rowNext[ix + 1] ?? -1;

      // Triangle 1: (p0, p2, p1)
      if (p0 !== -1 && p2 !== -1 && p1 !== -1) {
        indicesList.push(p0, p2, p1);
        adjacency[p0]?.add(p2);
        adjacency[p0]?.add(p1);
        adjacency[p2]?.add(p0);
        adjacency[p2]?.add(p1);
        adjacency[p1]?.add(p0);
        adjacency[p1]?.add(p2);
      }

      // Triangle 2: (p1, p2, p3)
      if (p1 !== -1 && p2 !== -1 && p3 !== -1) {
        indicesList.push(p1, p2, p3);
        adjacency[p1]?.add(p2);
        adjacency[p1]?.add(p3);
        adjacency[p2]?.add(p1);
        adjacency[p2]?.add(p3);
        adjacency[p3]?.add(p1);
        adjacency[p3]?.add(p2);
      }
    }
  }

  // Depth smoothing: Laplacian iteration across vertex adjacency
  const zPositions = rawVertices.map((v) => v.z);
  for (let iter = 0; iter < smoothingIterations; iter++) {
    const nextZ = [...zPositions];
    for (let i = 0; i < rawVertices.length; i++) {
      const neighbors = adjacency[i];
      if (!neighbors || neighbors.size === 0) continue;

      let sumNeighborZ = 0;
      for (const nIdx of neighbors) {
        sumNeighborZ += zPositions[nIdx] ?? 0;
      }
      const avgNeighborZ = sumNeighborZ / neighbors.size;
      const currentZ = zPositions[i] ?? 0;
      nextZ[i] = currentZ * (1.0 - smoothingWeight) + avgNeighborZ * smoothingWeight;
    }
    for (let i = 0; i < rawVertices.length; i++) {
      zPositions[i] = nextZ[i] ?? 0;
    }
  }

  // Compute smooth surface vertex normals
  const vertexCount = rawVertices.length;
  const triangleCount = indicesList.length / 3;

  const normalsAcc = new Float32Array(vertexCount * 3);

  for (let t = 0; t < triangleCount; t++) {
    const i0 = indicesList[t * 3] ?? 0;
    const i1 = indicesList[t * 3 + 1] ?? 0;
    const i2 = indicesList[t * 3 + 2] ?? 0;

    const v0 = rawVertices[i0];
    const v1 = rawVertices[i1];
    const v2 = rawVertices[i2];
    if (!v0 || !v1 || !v2) continue;

    const z0 = zPositions[i0] ?? 0;
    const z1 = zPositions[i1] ?? 0;
    const z2 = zPositions[i2] ?? 0;

    // Edge vectors: v1 - v0, v2 - v0
    const ax = v1.x - v0.x;
    const ay = v1.y - v0.y;
    const az = z1 - z0;

    const bx = v2.x - v0.x;
    const by = v2.y - v0.y;
    const bz = z2 - z0;

    // Cross product: A x B
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    // Accumulate onto all 3 vertices
    normalsAcc[i0 * 3] = (normalsAcc[i0 * 3] ?? 0) + nx;
    normalsAcc[i0 * 3 + 1] = (normalsAcc[i0 * 3 + 1] ?? 0) + ny;
    normalsAcc[i0 * 3 + 2] = (normalsAcc[i0 * 3 + 2] ?? 0) + nz;

    normalsAcc[i1 * 3] = (normalsAcc[i1 * 3] ?? 0) + nx;
    normalsAcc[i1 * 3 + 1] = (normalsAcc[i1 * 3 + 1] ?? 0) + ny;
    normalsAcc[i1 * 3 + 2] = (normalsAcc[i1 * 3 + 2] ?? 0) + nz;

    normalsAcc[i2 * 3] = (normalsAcc[i2 * 3] ?? 0) + nx;
    normalsAcc[i2 * 3 + 1] = (normalsAcc[i2 * 3 + 1] ?? 0) + ny;
    normalsAcc[i2 * 3 + 2] = (normalsAcc[i2 * 3 + 2] ?? 0) + nz;
  }

  // Pack final typed arrays
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const normals = new Float32Array(vertexCount * 3);
  const boundaryDistances = new Float32Array(vertexCount);
  const regionIds = new Uint8Array(vertexCount);
  const indices = new Uint16Array(indicesList);

  for (let i = 0; i < vertexCount; i++) {
    const rv = rawVertices[i];
    if (!rv) continue;

    positions[i * 3] = rv.x;
    positions[i * 3 + 1] = rv.y;
    positions[i * 3 + 2] = zPositions[i] ?? rv.z;

    uvs[i * 2] = rv.u;
    uvs[i * 2 + 1] = rv.v;

    boundaryDistances[i] = rv.boundaryDist;
    regionIds[i] = rv.regionId;

    // Normalize normal vector
    const nx = normalsAcc[i * 3] ?? 0;
    const ny = normalsAcc[i * 3 + 1] ?? 0;
    const nz = normalsAcc[i * 3 + 2] ?? 1;
    const len = Math.hypot(nx, ny, nz) || 1.0;

    normals[i * 3] = nx / len;
    normals[i * 3 + 1] = ny / len;
    normals[i * 3 + 2] = nz / len;
  }

  return {
    positions,
    uvs,
    normals,
    indices,
    boundaryDistances,
    regionIds,
    vertexCount,
    triangleCount
  };
}
