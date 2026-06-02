# Tasks: Equipo Ancestral / Mítico + Mazmorra

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~330-370 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation — BALANCE + Data Changes

- [x] 1.1 Add `Ancestral` (statMult 3.0, statCount 4, maxStats, Nv3 mastery reforjeable) and `Mítico` (statMult 4.0, statCount 5, maxStats, Nv4 fixed) to `BALANCE.equipment.rarities[]` with `dungeonWeights` field
- [x] 1.2 Extend each MASTERIES entry `values` array from 3 to 4 entries with Nv4 values (+20 crit, +15% vamp, 2-hit fury, +10% block, +15% regen, +20% tough, +10% dodge, +15% pen, +40% fortune)
- [x] 1.3 Add `BALANCE.dungeon` config: `maxFloors: 10`, `dailyAttempts: 3`, `soulCostBase: 500`, `soulCostMult: 2`, drop rate tables per N-level for boss/miniboss/normal
- [x] 1.4 Remove HP from `BALANCE.equipment.statPools.ring.primary` and `.secondary`

## Phase 2: Core Logic — Generation, Drops, Combat

- [x] 2.1 Extend `generateItem(floor, isBoss, isDungeon)` with Ancestral/Mythic: maxStats flag skips variance, statCount overrides numSecondary, Nv4 mastery for Mythic, mastery fixed flag
- [x] 2.2 Add dungeon drop function: weights per N-level (97/2/1/0/0 at N1→85/10/5/0/0 at N9+), miniboss 60% chance, normal 5% (always Legendario)
- [x] 2.3 Add `runState.dungeonMode` and `runState.dungeonDifficulty` flags; modify `startCombat()` to pass `calcEnemyStats(100 + (N-1)*10)` and skip boss capture
- [x] 2.4 Modify `enemyDefeated()` for dungeon mode: cap at 10 floors, P5=miniboss, P10=final boss→reward+unlock, no talent choices, use dungeon drops
- [x] 2.5 Modify `playerDied()` for dungeon mode: return to dungeon selection (no souls/leaderboard/essence)
- [x] 2.6 Change enhance cap to 15 for Ancestral/Mythic items, bonus stat at +5/+10/+15 (was +5/+10)
- [x] 2.7 Block reforging on Mythic items in `selectReforgeSlot()` and `reforgeRandom()`
- [x] 2.8 Add daily attempt check: compare `lastAttemptDate` vs today, reset `attemptsToday`, deduct souls for paid attempts (`500 × 2^(n-4)`)

## Phase 3: UI — Buttons, Modals, Display

- [x] 3.1 Add `<button id="btn-dungeon">🏰 Mazmorra</button>` after btn-character in HTML; add to `updateButtons()` (visible when `unlockedReforge && !runState.active`)
- [x] 3.2 Add dungeon-selection modal overlay HTML (`<div class="modal-overlay" id="dungeon-overlay">`) with 3 slots (1 active "Torre de los Ancestros", 2 locked "Próximamente")
- [x] 3.3 Implement `showDungeonSelection()`, `startDungeonRun(difficulty)`, `closeDungeonSelection()` — show N-level, attempts remaining, soul cost for paid runs
- [x] 3.4 Add "🏰 Mazmorra Nx" badge near floor display in `render()` when `runState.dungeonMode`
- [x] 3.5 Add CSS for dungeon modal grid, slot cards, locked overlay styling

## Phase 4: Persistence + Polish

- [x] 4.1 Add `metaState.dungeon` to `saveGame()`: `unlockedLevels[]`, `attemptsToday`, `lastAttemptDate`, `completedToday`
- [x] 4.2 Add `metaState.dungeon` to `loadGame()` with `??` fallbacks and `dataVersion` migration
- [x] 4.3 Add `metaState.dungeon` reset in `resetGame()`
- [x] 4.4 Verify: Ancestral/Mythic never drop in normal mode, Mythic reforge blocked, N+1 unlocks on P10 clear, daily reset works
