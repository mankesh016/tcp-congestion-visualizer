interface ControlsProps {
  isRunning: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onAddSender: () => void;
  canAddSender: boolean;
  autoMode: boolean;
  onToggleAutoMode: (next: boolean) => void;
}

export function Controls({
  isRunning,
  onPlay,
  onPause,
  onStep,
  onReset,
  onAddSender,
  canAddSender,
  autoMode,
  onToggleAutoMode,
}: ControlsProps) {
  return (
    <div className="controls">
      <button type="button" onClick={isRunning ? onPause : onPlay}>
        {isRunning ? "Pause" : "Play"}
      </button>
      <button type="button" onClick={onStep} disabled={isRunning}>
        Step
      </button>
      <button type="button" onClick={onReset}>
        Reset
      </button>
      <button type="button" onClick={onAddSender} disabled={!canAddSender}>
        + Add sender
      </button>
      <label className="auto-mode-toggle">
        <input
          type="checkbox"
          checked={autoMode}
          onChange={(e) => onToggleAutoMode(e.target.checked)}
        />
        Auto-manage senders
      </label>
    </div>
  );
}
