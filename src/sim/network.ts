import { applyLoss, growSender, type Sender } from "./sender";

export interface NetworkConfig {
  /** Total packets/RTT the shared bottleneck link can carry. */
  capacity: number;
}

export interface Network {
  config: NetworkConfig;
  senders: Sender[];
}

export interface StepResult {
  network: Network;
  congestionEvent: boolean;
  totalCwnd: number;
}

export function createNetwork(capacity: number, senders: Sender[] = []): Network {
  return { config: { capacity }, senders };
}

/**
 * Advance one RTT for every sender. If the combined window exceeds link
 * capacity, the loss is treated as a synchronized signal: every sender
 * halves its window in the same tick. This is the standard assumption
 * behind AIMD's fairness-convergence property.
 *
 * `capacityOverride` lets a caller model a bottleneck whose *realized*
 * capacity fluctuates tick to tick (cross-traffic, jitter) without
 * mutating the network's stored nominal capacity — that value stays the
 * stable "dial" a user sets, while the congestion check for this one tick
 * uses the override instead.
 */
export function step(network: Network, capacityOverride?: number): StepResult {
  const capacity = capacityOverride ?? network.config.capacity;
  const grown = network.senders.map(growSender);
  const totalCwnd = grown.reduce((sum, s) => sum + s.cwnd, 0);
  const congestionEvent = totalCwnd > capacity;
  const senders = congestionEvent ? grown.map(applyLoss) : grown;

  return {
    network: { ...network, senders },
    congestionEvent,
    totalCwnd,
  };
}

export function addSender(network: Network, sender: Sender): Network {
  return { ...network, senders: [...network.senders, sender] };
}

export function removeSender(network: Network, id: string): Network {
  return { ...network, senders: network.senders.filter((s) => s.id !== id) };
}
