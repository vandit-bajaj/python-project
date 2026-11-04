import * as Comlink from "comlink";
import type { VisionWorkerApi } from "./vision.worker";

let workerInstance: Worker | null = null;
let wrappedWorker: Comlink.Remote<VisionWorkerApi> | null = null;

export function getVisionWorker(): Comlink.Remote<VisionWorkerApi> | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }

  if (!wrappedWorker) {
    try {
      workerInstance = new Worker(new URL("./vision.worker.ts", import.meta.url), {
        type: "module"
      });
      wrappedWorker = Comlink.wrap<VisionWorkerApi>(workerInstance);
    } catch {
      // In environments where Worker initialization fails (e.g. test emulators), return null
      return null;
    }
  }

  return wrappedWorker;
}

export function terminateVisionWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    wrappedWorker = null;
  }
}
