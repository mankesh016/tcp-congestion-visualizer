import { useEffect, useRef, useState } from "react";
import type { Sender } from "../sim/sender";

export interface DisplayedSender extends Sender {
  isDeparting: boolean;
}

/**
 * Wraps a live sender list so a removed sender doesn't just vanish from the
 * UI: it's kept around (frozen at its last known cwnd/state) for `graceMs`
 * with `isDeparting: true`, so the caller can render a fade-out, then drops
 * out of the returned list on its own once the grace period elapses.
 *
 * Timeouts are tracked in a ref (not effect-cleanup-on-dependency-change)
 * so an unrelated sender list update can't cancel another sender's
 * already-scheduled removal — only unmounting the component does.
 *
 * Order is stable: each id keeps the slot it was first seen in (oldest
 * first), whether it's currently active or fading out. Departing doesn't
 * move a sender anywhere — it just stops being live in place.
 */
export function useDepartingSenders(senders: Sender[], graceMs = 2500): DisplayedSender[] {
  const [departed, setDeparted] = useState<Record<string, Sender>>({});
  const prevSendersRef = useRef<Sender[]>(senders);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Every id ever seen, in first-seen order. Guarded by `includes` so this
  // is idempotent if the render body runs twice (React StrictMode).
  const orderRef = useRef<string[]>([]);
  for (const sender of senders) {
    if (!orderRef.current.includes(sender.id)) {
      orderRef.current.push(sender.id);
    }
  }

  useEffect(() => {
    const prevSenders = prevSendersRef.current;
    prevSendersRef.current = senders;

    const currentIds = new Set(senders.map((sender) => sender.id));
    const justDeparted = prevSenders.filter((sender) => !currentIds.has(sender.id));
    if (justDeparted.length === 0) return;

    setDeparted((prev) => {
      const next = { ...prev };
      for (const sender of justDeparted) next[sender.id] = sender;
      return next;
    });

    for (const sender of justDeparted) {
      const id = sender.id;
      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(id);
        setDeparted((prev) => {
          if (!(id in prev)) return prev;
          const { [id]: _removed, ...rest } = prev;
          return rest;
        });
      }, graceMs);
      timeoutsRef.current.set(id, timeoutId);
    }
  }, [senders, graceMs]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const timeoutId of timeouts.values()) clearTimeout(timeoutId);
    };
  }, []);

  const activeById = new Map(senders.map((sender) => [sender.id, sender]));

  const result: DisplayedSender[] = [];
  for (const id of orderRef.current) {
    const active = activeById.get(id);
    if (active) {
      result.push({ ...active, isDeparting: false });
    } else if (id in departed) {
      result.push({ ...departed[id], isDeparting: true });
    }
    // else: fully expired past the grace period — omit.
  }
  return result;
}
