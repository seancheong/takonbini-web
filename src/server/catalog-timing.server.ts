import { AsyncLocalStorage } from "node:async_hooks";
export const catalogTiming = new AsyncLocalStorage<{ sourceMs: number }>();
