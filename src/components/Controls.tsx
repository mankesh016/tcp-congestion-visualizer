interface ControlsProps {
  isRunning: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onAddSender: () => void;
}

export function Controls({
  isRunning,
  onPlay,
  onPause,
  onStep,
  onReset,
  onAddSender,
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
      <button type="button" onClick={onAddSender}>
        + Add sender
      </button>
    </div>
  );
}
