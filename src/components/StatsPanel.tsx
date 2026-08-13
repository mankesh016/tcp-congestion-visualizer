import { HelpTip } from "./HelpTip";

interface StatsPanelProps {
  activeSenderCount: number;
  fairnessIndex: number;
  utilizationPercent: number;
  congestionEventCount: number;
  tick: number;
}

export function StatsPanel({
  activeSenderCount,
  fairnessIndex,
  utilizationPercent,
  congestionEventCount,
  tick,
}: StatsPanelProps) {
  const clampedUtilization = Math.min(100, Math.max(0, utilizationPercent));

  return (
    <div className="stats-panel">
      <div className="stat-tile">
        <div className="stat-label">
          Active senders
          <HelpTip text="How many devices are currently connected and using the link." />
        </div>
        <div className="stat-value">{activeSenderCount}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">
          Fairness index
          <HelpTip text="A score from 0 to 1 showing how evenly the link is being shared. 1.0 means everyone gets an equal amount; lower means someone is getting more than their fair share." />
        </div>
        <div className="stat-value">{fairnessIndex.toFixed(3)}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">
          Link utilization
          <HelpTip text="How much of the link's total capacity is being used right now. 100% means it's completely full." />
        </div>
        <div className="stat-value">{clampedUtilization.toFixed(0)}%</div>
        <div className="stat-meter-track">
          <div className="stat-meter-fill" style={{ width: `${clampedUtilization}%` }} />
        </div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">
          Congestion events
          <HelpTip text="How many times the link got overloaded so far, forcing every connected device to slow down at once." />
        </div>
        <div className="stat-value">{congestionEventCount}</div>
      </div>
      <div className="stat-tile">
        <div className="stat-label">
          RTT tick
          <HelpTip text="A simple counter for how much time has passed in the simulation since the last reset." />
        </div>
        <div className="stat-value">{tick}</div>
      </div>
    </div>
  );
}
