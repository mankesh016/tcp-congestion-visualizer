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
 */
export function step(network: Network): StepResult {
  const grown = network.senders.map(growSender);
  const totalCwnd = grown.reduce((sum, s) => sum + s.cwnd, 0);
  const congestionEvent = totalCwnd > network.config.capacity;
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
