# Design: Equipo Ancestral / Mítico + Mazmorra

## Technical Approach

Extend existing patterns (`BALANCE`, `generateItem`, `render`, `updateButtons`, modal overlays) in `Torre_Infinita.html`. Dungeon reuses `runState` for combat but stores persistent progress (clear level, attempts, daily reset) in `metaState.dungeon`. No new files.

## Architecture Decisions

### Decision: State structure — where does dungeon progress live?

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `runState` (RAM only) | Progress lost on refresh/respawn | ❌ |
| `metaState.dungeon` | Persists, survives death, same save/load pattern | ✅ |

**Rationale**: Dungeon unlock (clear level), daily attempts, and N-level must survive game sessions. New `metaState.dungeon` sub-object:

```js
metaState.dungeon = {
  unlockedLevels: [],     // [1, 2, 3, ...] — cleared N levels
  attemptsToday: 0,       // counter for daily attempts
  lastAttemptDate: '',    // "2026-06-02" for daily reset
  currentDifficulty: 0,   // 0 = not in dungeon, N = current level
  currentFloor: 0,        // 1-10
  completedToday: false,  // true if cleared today (resets daily)
};
```

### Decision: Dungeon combat — new system or reuse?

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New parallel combat loop | Double maintenance, testing burden | ❌ |
| Reuse `runState` with dungeon flag | Same `combatTick`, `enemyDefeated`, `playerDied` paths | ✅ |

**Rationale**: The existing combat loop is generic — it reads `runState.floor`, `runState.enemy`, `runState.player`. Adding a `runState.dungeonMode = true` flag lets us reuse everything: `startCombat()`, `combatTick()`, `enemyDefeated()`, `calcEnemyStats()`. Only differences: floor caps at 10, miniboss at P5, drop tables change, no talent choices, death returns to dungeon selection.

### Decision: Daily attempt tracking

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Game clock (performance.now) | Dies on refresh | ❌ |
| localStorage timestamp (date string) | Compare `today()` vs saved `lastAttemptDate` — simple | ✅ |

**Rationale**: Store `date` string (`"2026-06-02"`). On dungeon entry, compare with today. If different, reset `attemptsToday = 0`. Pure date comparison, no timezone math.

### Decision: N-level scaling

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Custom scaling formula | Duplicates enemy math | ❌ |
| Reuse `calcEnemyStats` with `floor = 100 + (N-1) * 10` | Same tier math, same formula | ✅ |

**Rationale**: N1 = P100, N2 = P110, N3 = P120... Pass `dungeonFloorEquivalent = 100 + (difficulty - 1) * 10` to `calcEnemyStats`. This gives us tier scaling (P100→P110 = +1 tier), sub-scale, and dynamic boss behavior for free.

### Decision: Drop system for dungeon

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Extend existing `weights` arrays | Rarities array has 4 entries, can add 2 more | ✅ |
| Separate dungeon drop table | Duplicate logic | ❌ |

**Rationale**: Add `dungeonWeights` field to each rarity entry. Normal enemies use a boss-like table. A `isDungeon` param in `generateItem()` switches to dungeon weights. Ancestral/Mythic only appear in dungeon runs.

### Decision: Ancestral/Mythic generation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `generateDungeonItem()` function | Duplicates 90% of `generateItem()` | ❌ |
| Extend `generateItem()` with optional overrides | Max stats via boolean flag, rarity → budget → stat count | ✅ |

**Rationale**: Add `ancestral`/`mythic` to `BALANCE.equipment.rarities` with `statMult: 3.0` / `4.0`. New field `statCount: 4` / `5` overrides the switch. New flag `maxStats: true` sets stats at 100% budget (no variance). Both roll random mastery — Ancestral Nv3 reforjeable, Mythic Nv4 fixed and blocks reforging.

### Decision: Mastery level 4

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `valuesNv4` to each mastery | Clear, extends existing `values: [5,10,15]` pattern | ✅ |

**Rationale**: Each MASTERIES entry gets `values: [5, 10, 15, 20]` instead of `[5, 10, 15]`. Mythic uses `level: 4`. The reforge modal checks `item.rarity === 'Mítico'` to disable reforge. All combat code already reads `masteryDef.values[mastery.level - 1]` — the index 3 naturally maps to Nv4.

### Decision: Main menu button placement

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Separate section above action bar | Breaks layout flow | ❌ |
| After Forja in the button row | Consistent, visible when unlockedReforge | ✅ |

**Rationale**: New `<button class="action-btn" id="btn-dungeon">🏰 Mazmorra</button>` after `btn-character`. `updateButtons()` shows it only when `metaState.unlockedReforge && !runState.active`. Same enable/disable pattern as Forja.

### Decision: Dungeon selection UI

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New overlay modal | Same pattern as choice/reforge/leaderboard | ✅ |
| Separate page/view | Inconsistent, too heavy | ❌ |

**Rationale**: Modal overlay (`dungeon-overlay`) shows 3 dungeon slots as a grid. Slot 1 = "Torre de los Ancestros" (clickable), slots 2-3 = "Próximamente 🔒" (disabled). Shows current N-level, free/paid attempts remaining.

### Decision: Dungeon run UI

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Dedicated dungeon HUD | Same info as normal mode, just different floor display | ❌ |
| Reuse existing HUD + floor indicator | Works with current combat UI | ✅ |

**Rationale**: The existing `runState.floor` shows 1-10. The `boss-indicator` already handles boss floors. Add a small "🏰 Mazmorra N1" badge near the floor display when `runState.dungeonMode`.

## Data Flow

```
Main menu "🏰 Mazmorra"
  → showDungeonSelection() [modal]
    → check daily attempts (reset if new day)
    → show N-level, attempts left
    → click "Torre de los Ancestros"
      → deduct soul cost if paid attempt
      → startDungeonRun(difficulty)
        → runState.dungeonMode = true
        → runState.dungeonDifficulty = N
        → startCombat() [reused]
          → calcEnemyStats(100+(N-1)*10, ...)
          → combatTick() [reused]
          → enemyDefeated() [modified]
            → dungeon: check floor 1-10
            → P5 = miniboss, P10 = final boss
            → calcdrop() with dungeon tables
            → P10 clear → unlock N+1, close run
          → playerDied() → return to dungeon selection
```

## File Changes

| File | Action | Description |
|------|--------|------------|
| `Torre_Infinita.html` | Modify | Add rarities, mastery Nv4, dungeon state, UI, logic. ~300-400 lines new. |

## Open Questions

- [ ] **Daily reset timezone**: Date string uses browser's local time. Should this use UTC for consistency? Decision: use local time — offline game, no server sync needed.
- [ ] (resolved) Ancestral mastery is random and reforjeable — no choice needed.
- [ ] **Soul cost for extra attempts**: Formula `500 × 2^(n-4)`. Should there be a cap? Propose no cap — natural scaling makes it prohibitive at high attempts.
