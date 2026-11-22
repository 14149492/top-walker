'use client';
export type EventType = 'PRODUCT_VIEW' | 'SIZE_SELECT' | 'COLOR_SELECT' | 'WHATSAPP_CLICK';
const sent = new Map<string, number>();
let memoryId: string | undefined;
export function recordEvent(productId: string, type: EventType, selection: { color?: string; size?: number } = {}) {
  try {
    let visitorId = memoryId;
    try { visitorId = sessionStorage.getItem('tw-visitor') || undefined; } catch { /* Private mode. */ }
    visitorId ||= memoryId ||= crypto.randomUUID();
    try { sessionStorage.setItem('tw-visitor', visitorId); } catch { /* Use memory only. */ }
    const key = JSON.stringify([productId, type, selection.color, selection.size]);
    if (Date.now() - (sent.get(key) || 0) < (type === 'PRODUCT_VIEW' ? 300000 : 30000)) return;
    sent.set(key, Date.now());
    void fetch('/api/events', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Topwalker-Request': '1' }, body: JSON.stringify({ id: crypto.randomUUID(), visitorId, productId, type, ...selection }) }).catch(() => undefined);
  } catch { /* Statistics must never prevent browsing or WhatsApp navigation. */ }
}
