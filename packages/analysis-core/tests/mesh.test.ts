import { describe, expect, it } from "vitest";
import {
  buildCanonicalFaceMeshGeometry,
  computeFacialDepthPrior,
  getRegionFromUV,
  FaceRegion
} from "../src";

describe("Face Mesh 3D Geometry Engine", () => {
  it("builds canonical face mesh geometry with valid topology and attributes", () => {
    const mesh = buildCanonicalFaceMeshGeometry({
      gridResolutionX: 20,
      gridResolutionY: 24,
      depthSmoothingIterations: 2
    });

    expect(mesh.vertexCount).toBeGreaterThan(100);
    expect(mesh.triangleCount).toBeGreaterThan(150);

    // Buffers lengths match counts exactly
    expect(mesh.positions.length).toBe(mesh.vertexCount * 3);
    expect(mesh.uvs.length).toBe(mesh.vertexCount * 2);
    expect(mesh.normals.length).toBe(mesh.vertexCount * 3);
    expect(mesh.indices.length).toBe(mesh.triangleCount * 3);
    expect(mesh.boundaryDistances.length).toBe(mesh.vertexCount);
    expect(mesh.regionIds.length).toBe(mesh.vertexCount);

    // Indices reference valid vertices
    for (let i = 0; i < mesh.indices.length; i++) {
      const idx = mesh.indices[i]!;
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(mesh.vertexCount);
    }
  });

  it("produces finite coordinates and normalized surface normals", () => {
    const mesh = buildCanonicalFaceMeshGeometry({
      gridResolutionX: 16,
      gridResolutionY: 20
    });

    for (let i = 0; i < mesh.vertexCount; i++) {
      const x = mesh.positions[i * 3]!;
      const y = mesh.positions[i * 3 + 1]!;
      const z = mesh.positions[i * 3 + 2]!;
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);

      const u = mesh.uvs[i * 2]!;
      const v = mesh.uvs[i * 2 + 1]!;
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);

      const nx = mesh.normals[i * 3]!;
      const ny = mesh.normals[i * 3 + 1]!;
      const nz = mesh.normals[i * 3 + 2]!;
      const normalLen = Math.hypot(nx, ny, nz);
      expect(normalLen).toBeCloseTo(1.0, 1);

      const bDist = mesh.boundaryDistances[i]!;
      expect(bDist).toBeGreaterThanOrEqual(0);
      expect(bDist).toBeLessThanOrEqual(1);
    }
  });

  it("calculates biological depth prior with nasal ridge projection", () => {
    const noseDepth = computeFacialDepthPrior(0.5, 0.5);
    const templeDepth = computeFacialDepthPrior(0.15, 0.4);

    // Nasal bridge projects outward relative to temples
    expect(noseDepth).toBeGreaterThan(templeDepth);
  });

  it("correctly maps canonical UV coordinates to facial regions", () => {
    expect(getRegionFromUV(0.5, 0.15)).toBe(FaceRegion.FOREHEAD);
    expect(getRegionFromUV(0.5, 0.50)).toBe(FaceRegion.NOSE);
    expect(getRegionFromUV(0.2, 0.55)).toBe(FaceRegion.LEFT_CHEEK);
    expect(getRegionFromUV(0.8, 0.55)).toBe(FaceRegion.RIGHT_CHEEK);
    expect(getRegionFromUV(0.5, 0.75)).toBe(FaceRegion.PERIORAL);
    expect(getRegionFromUV(0.5, 0.90)).toBe(FaceRegion.CHIN);
  });
});
