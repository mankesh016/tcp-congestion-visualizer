# TCP Congestion Control Visualizer

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-bundler-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Vitest](https://img.shields.io/badge/Vitest-tested-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Last commit](https://img.shields.io/github/last-commit/mankesh016/tcp-congestion-visualizer)](https://github.com/mankesh016/tcp-congestion-visualizer/commits)

An interactive, browser-based visualization of TCP congestion control — slow
start, congestion avoidance (AIMD), and the fairness convergence property
that emerges when multiple flows share one bottleneck link.

Senders can be added and removed manually, or the simulation can auto-manage
a churning population of them (random arrivals, random departures), so you
can watch the network settle back toward an equal share every time the
population changes.

## Running it

```bash
npm install
npm run dev     # start the dev server
npm test        # run the unit test suite (Vitest)
npm run build   # typecheck + production build
```

## What it shows

- **Slow start** — a new sender's window (`cwnd`) doubles every simulated
  RTT tick until it hits its threshold or a loss event ends it early.
- **Congestion avoidance (AIMD)** — after slow start ends, `cwnd` grows by
  +1 per tick (additive increase) and halves on a congestion signal
  (multiplicative decrease), producing the classic sawtooth.
- **Fairness convergence** — a dashed reference line tracks the theoretical
  fair share (`capacity / active sender count`) live on the chart, and a
  **Jain's Fairness Index** stat (`(Σx)² / (n·Σx²)`, 1.0 = perfectly equal)
  quantifies how close the active senders are to that line at any moment —
  even senders that joined much later than others.
- **Sliding chart window** — the chart shows the full run for the first 50
  ticks, then scrolls to show only the most recent 50, like a live monitor.
- **Departed senders keep their history** — removing or expiring a sender
  doesn't erase its line; it simply stops extending at the tick it left.

## The model (and its simplifications)

The simulation is intentionally a simplified teaching model, not a packet-level
network simulator:

- **Time is quantized into RTT ticks.** One "tick" = one round-trip time for
  every sender simultaneously. There's no per-flow RTT variation, no packet
  loss inside a tick, no reordering.
- **Congestion is a synchronized signal.** When the combined `cwnd` of all
  active senders exceeds the link's capacity, *every* sender halves its
  window on that same tick. This is the standard assumption behind the
  textbook proof that AIMD converges to fairness — it's why the fair-share
  line and Jain's index are meaningful here, not just decorative.
- **Capacity jitter perturbs the check, not the dial.** The "Capacity
  jitter" slider makes the *realized* capacity fluctuate tick to tick
  (modeling cross-traffic on the link), but the nominal capacity you set
  stays fixed — only that tick's congestion check uses the perturbed value.
- **No bytes, no real time.** `cwnd` is unitless "segments"; the "Tick
  interval" slider only controls playback speed, not anything in the model.
  "Throughput" (shown per sender as "sent") is a cumulative segment count,
  not a bytes/sec rate.
- **A sender's lifespan is either manual or a random duration.** Auto-mode
  senders are assigned a random lifespan (15–40 ticks) when spawned; there's
  no notion of "finished transferring N bytes."

## Project structure

```
src/
  sim/                 Pure TCP simulation engine (no React, no UI)
    sender.ts           Single-sender state machine (slow start / AIMD / loss)
    network.ts           Shared-link model: grow all senders, detect + apply
                         synchronized congestion loss
  hooks/
    simulationReducer.ts Pure reducer: one atomic state transition per tick
                         (growth, loss, history, stats). All randomness is
                         decided by the caller and passed in as action data,
                         so the reducer itself is deterministic and testable.
    useSimulation.ts      React hook: tick loop, auto-mode spawn/despawn
                         decisions, exposes tunables (capacity, speed,
                         jitter, spawn rate) to the UI
  components/
    CongestionChart.tsx   Multi-line chart (Recharts) + fair-share reference line
    Controls.tsx          Play/pause/step/reset, auto-mode toggle
    TunablesPanel.tsx     Capacity / tick interval / jitter / spawn-rate sliders
    StatsPanel.tsx        Live aggregate stats (fairness index, utilization, etc.)
    SenderLegend.tsx       Per-sender live state, window size, and total sent
  lib/
    colors.ts             Deterministic id -> color (stable across joins/leaves)
    fairness.ts            Jain's Fairness Index
```

Every module under `sim/` and `hooks/` has a matching `*.test.ts` file —
the simulation and state-transition logic are fully unit-tested independent
of the UI.
