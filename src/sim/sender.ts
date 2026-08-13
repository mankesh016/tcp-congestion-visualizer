export type SenderState = "slow-start" | "congestion-avoidance";

export interface Sender {
  id: string;
  cwnd: number;
  ssthresh: number;
  state: SenderState;
}

export interface CreateSenderOptions {
  initialCwnd?: number;
  ssthresh?: number;
}

export function createSender(
  id: string,
  options: CreateSenderOptions = {},
): Sender {
  return {
    id,
    cwnd: options.initialCwnd ?? 1,
    ssthresh: options.ssthresh ?? Infinity,
    state: "slow-start",
  };
}

/** Advance one RTT: exponential growth during slow start, +1 during congestion avoidance. */
export function growSender(sender: Sender): Sender {
  if (sender.state === "slow-start") {
    const grown = sender.cwnd * 2;
    if (grown >= sender.ssthresh) {
      return { ...sender, cwnd: sender.ssthresh, state: "congestion-avoidance" };
    }
    return { ...sender, cwnd: grown };
  }
  return { ...sender, cwnd: sender.cwnd + 1 };
}

/** Multiplicative decrease on a congestion signal; loss always ends slow start. */
export function applyLoss(sender: Sender): Sender {
  const halved = Math.max(1, Math.floor(sender.cwnd / 2));
  return { ...sender, cwnd: halved, ssthresh: halved, state: "congestion-avoidance" };
}
