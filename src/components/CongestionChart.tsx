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
}

export function CongestionChart({ history, senderIds }: CongestionChartProps) {
  const data = history.map((snapshot) => ({
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
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
