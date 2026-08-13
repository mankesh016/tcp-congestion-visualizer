import { Pause, Play, Plus, RotateCcw, StepForward, Wand2 } from "lucide-react";

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

const ICON_SIZE = 15;

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
        {isRunning ? <Pause size={ICON_SIZE} /> : <Play size={ICON_SIZE} />}
        {isRunning ? "Pause" : "Play"}
      </button>
      <button type="button" onClick={onStep} disabled={isRunning}>
        <StepForward size={ICON_SIZE} />
        Step
      </button>
      <button type="button" onClick={onReset}>
        <RotateCcw size={ICON_SIZE} />
        Reset
      </button>
      <button type="button" onClick={onAddSender} disabled={!canAddSender}>
        <Plus size={ICON_SIZE} />
        Add sender
      </button>
      <label className="auto-mode-toggle">
        <input
          type="checkbox"
          checked={autoMode}
          onChange={(e) => onToggleAutoMode(e.target.checked)}
        />
        <Wand2 size={ICON_SIZE} />
        Auto-manage senders
      </label>
    </div>
  );
}
