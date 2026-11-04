import { z } from "zod";

export const ModelAssetManifestSchema = z.object({
  id: z.string(),
  version: z.string(),
  fileName: z.string(),
  sha256: z.string(),
  sizeBytes: z.number().int().positive(),
  runtime: z.enum(["wasm", "webgl", "webgpu"])
});

export type ModelAssetManifest = z.infer<typeof ModelAssetManifestSchema>;

export const MODEL_REGISTRY: Record<string, ModelAssetManifest> = {
  faceLandmarker: {
    id: "face_landmarker",
    version: "0.10.0",
    fileName: "face_landmarker.task",
    sha256: "placeholder-hash",
    sizeBytes: 3_800_000,
    runtime: "wasm"
  }
};
