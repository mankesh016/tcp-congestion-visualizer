# 📡 TCP Congestion Control Visualizer

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-bundler-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Vitest](https://img.shields.io/badge/Vitest-tested-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Last commit](https://img.shields.io/github/last-commit/mankesh016/tcp-congestion-visualizer)](https://github.com/mankesh016/tcp-congestion-visualizer/commits)

Watch TCP's congestion control **actually work**, live in your browser — no
packet captures, no textbook diagrams. Several senders share one link, each
following the same simple rules independently, and you watch fairness
*emerge* with nobody in charge.

## 🚦 The problem it solves

A network link can carry only so much data at once. Nobody's directing
traffic — every device decides its own sending rate, alone, with no view of
what anyone else is doing. Too fast, and the link jams for everyone.
**Congestion control** is the self-imposed pacing rule that stops that from
happening.

It's easy to mix up with a similarly-named mechanism, so worth pinning down:

| | Flow control | Congestion control |
|---|---|---|
| **Protects** | the *receiver* | the *network* |
| **Limited by** | receiver's buffer size (`rwnd`) | how much the link can carry (`cwnd`) |
| **Answers** | "Can the receiver keep up?" | "Can the *network* keep up?" |
| **Signal** | receiver advertises its window | inferred from packet loss / delay |

The actual send rate is `min(rwnd, cwnd)`. This project visualizes only the
`cwnd` half — the part with no fixed answer, decided on the fly.

## 🐣 Slow start: probing a target you can't see

A new connection has no idea how much room is available, so it starts small
and **doubles `cwnd` every round-trip** — 1, 2, 4, 8, 16, 32, 64... — until a
loss tells it "too far." Fast enough to not waste time, cautious enough to
not blow up the link on the first guess.

## 🤔 Why not just binary-search for the exact number?

> *This is the question that kicked off this whole project.*

Say doubling gets you to 64, and 128 overshoots. The tempting next move:
binary-search your way to the exact ceiling —

```
64 + 32 = 96   ✅
96 + 16 = 112  ❌
96 +  8 = 104  ❌
96 +  4 = 100  ❌
96 +  2 = 98   ✅
96 +  1 = 99   ✅  →  found it: 99
```

Clean, fast, and it finds an exact number. So why doesn't TCP do this?

**Because there is no fixed number to find.** "Capacity" isn't a constant —
it's *whatever's left over* after every other device sharing the link does
its own thing, and that shifts continuously as senders join and leave.
Binary-searching converges beautifully on a target that's already stale by
the time you land on it.

TCP's actual answer — **AIMD** (Additive Increase, Multiplicative
Decrease) — stops trying to *solve for* the ceiling at all. Instead:

- **Additive increase**: creep up by a small, fixed amount every round-trip
- **Multiplicative decrease**: the instant you overshoot, cut speed in half — immediately, no fine-tuning

It's a *continuous* feel-your-way-forward strategy for a target that never
holds still — not a one-time search for a target that does.

The payoff is bigger than robustness, though: because **every** sender runs
the exact same rule, and a congestion event cuts **everyone** by the same
proportion at once, the gap between any two competing senders shrinks a
little on every single cycle. That's a mathematically provable convergence
to a fair, equal share — a property a private binary search, run
independently by each device with no idea the others exist, simply doesn't
have. That emergent fairness is the whole reason this project exists.

<details>
<summary>😈 What if a sender just... doesn't back off?</summary>

<br>

Nothing in the network *enforces* AIMD — it's a voluntary convention every
well-behaved stack chooses to follow. A sender that ignores loss signals
and keeps blasting away grabs more than its share at everyone else's
expense; the fairness this project demonstrates only holds when every
participant plays by the same rules. This simulation assumes they all do.

</details>

## 👀 What you'll see

- Each sender's **slow start** ramp, live
- The **AIMD sawtooth** — steady climb, sudden halving, repeat
- A dashed **fair-share line** (`capacity ÷ active senders`) and a
  **Jain's Fairness Index** showing how close everyone currently is to it
- Senders joining and leaving — manually, or on auto-mode — and the system
  re-converging every single time

## 🚀 Running it

```bash
npm install
npm run dev     # dev server
npm test        # unit tests (Vitest)
npm run build   # typecheck + production build
```

## 🧪 Model notes

A teaching model, not a packet-level simulator: time moves in RTT ticks
(one tick = one round-trip for every sender at once), a congestion event is
a **synchronized** signal — every active sender halves on the same tick,
which is exactly what makes the fair-share line and Jain's index
meaningful — and `cwnd` is unitless "segments," not bytes.

<details>
<summary>🗂️ Project structure</summary>

<br>

```
src/
  sim/            Pure TCP engine (no React) — sender state machine, shared-link model
  hooks/          Reducer + React hook driving the simulation loop
  components/     Chart, controls, stats, and sender legend UI
  lib/            Small pure helpers — color assignment, fairness index
```

`sim/` and `hooks/` are fully unit-tested independent of the UI.

</details>
