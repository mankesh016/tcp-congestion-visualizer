import { CongestionChart } from "./components/CongestionChart";
import { Controls } from "./components/Controls";
import { SenderLegend } from "./components/SenderLegend";
import { StatsPanel } from "./components/StatsPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { TunablesPanel } from "./components/TunablesPanel";
import { useSimulation } from "./hooks/useSimulation";
import { jainsFairnessIndex } from "./lib/fairness";
import "./App.css";

const INITIAL_LINK_CAPACITY = 40;

function App() {
  const sim = useSimulation({
    capacity: INITIAL_LINK_CAPACITY,
    tickIntervalMs: 400,
    initialSenderCount: 1,
  });

  const activeCwnds = sim.network.senders.map((sender) => sender.cwnd);
  const fairness = jainsFairnessIndex(activeCwnds);
  const totalActiveCwnd = activeCwnds.reduce((sum, cwnd) => sum + cwnd, 0);
  const utilizationPercent = (totalActiveCwnd / sim.capacity) * 100;

  return (
    <main className="app">
      <div className="app-header">
        <div>
          <h1 className="title">TCP Congestion Control Visualizer</h1>
          <p className="subtitle">
            Watch AIMD converge every active sender toward an equal share of one shared link, live.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <TunablesPanel
        capacity={sim.capacity}
        onCapacityChange={sim.setCapacity}
        tickIntervalMs={sim.tickIntervalMs}
        onTickIntervalChange={sim.setTickIntervalMs}
        jitter={sim.jitter}
        onJitterChange={sim.setJitter}
        spawnProbability={sim.spawnProbability}
        onSpawnProbabilityChange={sim.setSpawnProbability}
      />

      <StatsPanel
        activeSenderCount={sim.network.senders.length}
        fairnessIndex={fairness}
        utilizationPercent={utilizationPercent}
        congestionEventCount={sim.congestionEventCount}
        tick={sim.tick}
      />

      <div className="chart-row">
        <div className="chart-row-chart">
          <CongestionChart
            history={sim.history}
            senderIds={sim.allSenderIds}
            activeSenderIds={sim.network.senders.map((sender) => sender.id)}
          />
        </div>
        <div className="chart-row-legend">
          <SenderLegend senders={sim.network.senders} onRemove={sim.removeSender} />
        </div>
      </div>

      <Controls
        isRunning={sim.isRunning}
        onPlay={sim.play}
        onPause={sim.pause}
        onStep={sim.step}
        onReset={sim.reset}
        onAddSender={sim.addSender}
        canAddSender={sim.canAddSender}
        autoMode={sim.autoMode}
        onToggleAutoMode={sim.setAutoMode}
      />
    </main>
  );
}

export default App;
