import { HelpTip } from "./HelpTip";

interface TunablesPanelProps {
  capacity: number;
  onCapacityChange: (next: number) => void;
  tickIntervalMs: number;
  onTickIntervalChange: (next: number) => void;
  jitter: number;
  onJitterChange: (next: number) => void;
  spawnProbability: number;
  onSpawnProbabilityChange: (next: number) => void;
}

export function TunablesPanel({
  capacity,
  onCapacityChange,
  tickIntervalMs,
  onTickIntervalChange,
  jitter,
  onJitterChange,
  spawnProbability,
  onSpawnProbabilityChange,
}: TunablesPanelProps) {
  return (
    <div className="tunables">
      <label className="tunable">
        <span className="tunable-label">
          <span className="tunable-label-text">
            Link capacity
            <HelpTip text="How much data the shared link can carry at once. If everyone's total usage goes over this, some data gets dropped." />
          </span>
          <span className="tunable-value">{capacity} seg/RTT</span>
        </span>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={capacity}
          onChange={(e) => onCapacityChange(Number(e.target.value))}
        />
      </label>

      <label className="tunable">
        <span className="tunable-label">
          <span className="tunable-label-text">
            Tick interval
            <HelpTip text="How fast the simulation plays. It's just a speed dial — it doesn't change how anything behaves, only how quickly you see it happen." />
          </span>
          <span className="tunable-value">{tickIntervalMs} ms</span>
        </span>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={tickIntervalMs}
          onChange={(e) => onTickIntervalChange(Number(e.target.value))}
        />
      </label>

      <label className="tunable">
        <span className="tunable-label">
          <span className="tunable-label-text">
            Capacity jitter
            <HelpTip text="Makes the link's capacity wobble up and down a little each tick, like real network traffic does. 0% means a perfectly steady link." />
          </span>
          <span className="tunable-value">{Math.round(jitter * 100)}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(jitter * 100)}
          onChange={(e) => onJitterChange(Number(e.target.value) / 100)}
        />
      </label>

      <label className="tunable">
        <span className="tunable-label">
          <span className="tunable-label-text">
            Spawn rate
            <HelpTip text="How often a new device joins the network on its own, when auto-mode is turned on. Higher = new connections show up more often." />
          </span>
          <span className="tunable-value">{Math.round(spawnProbability * 100)}%/tick</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(spawnProbability * 100)}
          onChange={(e) => onSpawnProbabilityChange(Number(e.target.value) / 100)}
        />
      </label>
    </div>
  );
}
