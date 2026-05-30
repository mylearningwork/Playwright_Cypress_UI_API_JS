export class TtlCache {
  constructor(defaultTtlMs = 60000) {
    this.defaultTtlMs = defaultTtlMs;
    this.items = new Map();
  }

  get(key) {
    const entry = this.items.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.items.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.items.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  size() {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }
}
