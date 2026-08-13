import { X } from "lucide-react";
import type { Sender } from "../sim/sender";
import { colorForId } from "../lib/colors";
import { useDepartingSenders } from "../hooks/useDepartingSenders";

interface SenderLegendProps {
  senders: Sender[];
  onRemove: (id: string) => void;
}

export function SenderLegend({ senders, onRemove }: SenderLegendProps) {
  const displayed = useDepartingSenders(senders);
  // Newest sender first: senders are appended to the end of the live list
  // as they join, so reversing puts the most recent arrival at the top.
  const newestFirst = [...displayed].reverse();

  if (newestFirst.length === 0) {
    return <p className="legend-empty">No active senders. Add one to start the simulation.</p>;
  }

  return (
    <ul className="legend">
      {newestFirst.map((sender) => (
        <li
          key={sender.id}
          className={sender.isDeparting ? "legend-row legend-row-departing" : "legend-row"}
        >
          <span className="swatch" style={{ background: colorForId(sender.id) }} />
          <span className="legend-id">{sender.id}</span>
          <span className="legend-state">{sender.isDeparting ? "departed" : sender.state}</span>
          {!sender.isDeparting && (
            <button
              type="button"
              className="legend-remove-btn"
              onClick={() => onRemove(sender.id)}
              title="Remove"
              aria-label="Remove"
            >
              <X size={13} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
