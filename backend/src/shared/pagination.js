export function encodeCursor({ createdAt, id }) {
  return Buffer.from(JSON.stringify({ createdAt, id }), 'utf8').toString('base64url');
}

export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!parsed?.createdAt || !parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildCursorMeta(items, limit) {
  if (items.length <= limit) {
    return { hasMore: false, nextCursor: null };
  }
  const page = items.slice(0, limit);
  const last = page[page.length - 1];
  return {
    hasMore: true,
    nextCursor: encodeCursor({ createdAt: last.createdAt, id: last.id })
  };
}
