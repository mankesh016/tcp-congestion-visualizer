import { CongestionChart } from "./components/CongestionChart";
import { Controls } from "./components/Controls";
import { SenderLegend } from "./components/SenderLegend";
import { useSimulation } from "./hooks/useSimulation";
import { jainsFairnessIndex } from "./lib/fairness";
import "./App.css";

const LINK_CAPACITY = 40;

function App() {
  const sim = useSimulation({
    capacity: LINK_CAPACITY,
    tickIntervalMs: 400,
    initialSenderCount: 1,
  });

  const activeSenderIds = sim.network.senders.map((sender) => sender.id);
  const fairness = jainsFairnessIndex(sim.network.senders.map((sender) => sender.cwnd));

  return (
    <main className="app">
      <h1>TCP Congestion Control Visualizer</h1>
      <p className="subtitle">
        Shared link capacity: {LINK_CAPACITY} segments/RTT · {activeSenderIds.length} active
        sender{activeSenderIds.length === 1 ? "" : "s"} · tick {sim.tick} · fairness index{" "}
        {fairness.toFixed(3)}
      </p>

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

      <CongestionChart history={sim.history} senderIds={sim.allSenderIds} />

      <SenderLegend senders={sim.network.senders} onRemove={sim.removeSender} />
    </main>
  );
}

export default App;
