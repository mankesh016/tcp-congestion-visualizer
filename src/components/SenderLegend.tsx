import type { Sender } from "../sim/sender";
import { colorForId } from "../lib/colors";

interface SenderLegendProps {
  senders: Sender[];
  onRemove: (id: string) => void;
}

export function SenderLegend({ senders, onRemove }: SenderLegendProps) {
  if (senders.length === 0) {
    return <p className="legend-empty">No active senders. Add one to start the simulation.</p>;
  }

  return (
    <ul className="legend">
      {senders.map((sender) => (
        <li key={sender.id} className="legend-row">
          <span className="swatch" style={{ background: colorForId(sender.id) }} />
          <span className="legend-id">{sender.id}</span>
          <span className="legend-state">{sender.state}</span>
          <span className="legend-cwnd">cwnd {sender.cwnd.toFixed(0)}</span>
          <button type="button" onClick={() => onRemove(sender.id)}>
            remove
          </button>
        </li>
      ))}
    </ul>
  );
}
