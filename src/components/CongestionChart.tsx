import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationSnapshot } from "../hooks/simulationReducer";
import { colorForId } from "../lib/colors";

interface CongestionChartProps {
  history: SimulationSnapshot[];
  senderIds: string[];
  /** Ids currently active; ids in `senderIds` but not here are kept on the plot but dropped from the legend below it. */
  activeSenderIds: string[];
  /** Once history exceeds this many ticks, only the most recent window is shown (scrolls forward). */
  windowSize?: number;
}

export function CongestionChart({
  history,
  senderIds,
  activeSenderIds,
  windowSize = 50,
}: CongestionChartProps) {
  const activeSenderIdSet = new Set(activeSenderIds);
  // Slicing before mapping keeps this O(windowSize) per render instead of
  // O(history length) — matters once a long-running auto-mode session has
  // accumulated thousands of ticks.
  const data = history.slice(-windowSize).map((snapshot) => ({
    tick: snapshot.tick,
    fairShare: snapshot.fairShare,
    ...snapshot.cwnds,
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="tick" label={{ value: "RTT tick", position: "insideBottom", offset: -4 }} />
        <YAxis
          allowDecimals={false}
          label={{ value: "cwnd (segments)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="fairShare"
          name="Fair share (C/N)"
          stroke="#888"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={false}
          isAnimationActive={false}
        />
        {senderIds.map((id) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={colorForId(id)}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            legendType={activeSenderIdSet.has(id) ? "line" : "none"}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
