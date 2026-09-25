// Inputs are remembered in this browser only (localStorage), never sent anywhere.
// Storage can be blocked (private windows, strict settings); the pages work without it.

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not being able to save is fine.
  }
}
