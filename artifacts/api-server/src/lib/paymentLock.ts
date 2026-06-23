const inFlight = new Set<string>();

export function tryAcquireRef(ref: string): boolean {
  if (!ref) return true;
  if (inFlight.has(ref)) return false;
  inFlight.add(ref);
  return true;
}

export function releaseRef(ref: string): void {
  inFlight.delete(ref);
}
