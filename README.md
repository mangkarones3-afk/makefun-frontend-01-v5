# makefun-frontend-01-v5

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/mangkarones3-afk/makefun-frontend-01-v5/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/mangkarones3-afk/makefun-frontend-01-v5/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Wispboard — a live make.fun client whose first load is a bare shell: one HTML file of 352 bytes gzipped that carries nothing but a root element and a boot script. The frame, the stylesheet and every view arrive by `import()` after it. The split board puts the live bounty list beside the selected bounty's detail pane — facts grid, rewards at the live pot, a phase timeline (Opened → Now → Deadline → Results by) — and the bounty pages, windowed leaderboards and public profiles are each one hash-route away. All reads go through an ETag-revalidated cache with in-flight dedupe, views are patched in place rather than rebuilt, and the status strip on every view paints the evidence: requests made, ETag-unchanged reads, cache hits and rows actually drawn.

## Run it

```sh
node serve.ts        # preview the app at http://localhost:8095
node main.ts         # assemble the scored dossier into /output
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ram1fzcx&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
