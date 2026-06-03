# Tasks: Prestigio / Renacimiento

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Single PR (all phases) | PR 1 | ~350 lines, bajo 800, sin split |

## Phase 1: Estado y Persistencia (Foundation)

- [x] 1.1 Add `BALANCE.heroArtifact` block (10 nodes, costBase: 5) after `BALANCE.dungeon` (~line 1276)
- [x] 1.2 Extend `metaState` (~line 1303): add `heroArtifact` ({nodes: {}, legacyEssence: 0, rebirthCount: 0}), `hasRebirthed: false`, `dungeon.attemptsTodayLegacy: 0`
- [x] 1.3 Add v4→v5 migration block in `loadGame()` after v3→v4 (~line 1413): populate heroArtifact nodes, hasRebirthed, attemptsTodayLegacy
- [x] 1.4 Serialize new fields in `saveGame()` (~line 1341) and reset in `resetGame()` (~line 1446)

## Phase 2: Renacer (prestige-system)

- [x] 2.1 Add CSS for `.action-btn.rebirth` (gold gradient) and `.rebirth-modal` preview styles (~line 708 area)
- [x] 2.2 Add HTML `<button class="action-btn rebirth" id="btn-rebirth">🪶 Renacer</button>` in action-bar (~line 976)
- [x] 2.3 Wire `updateButtons()` (~line 5580): show btn-rebirth when `unlockedReforge && !runState.active && !hasRebirthed`
- [x] 2.4 `showRebirthModal()`: calc `floor(sqrt(heroLevel) * max(maxFloor,100)/100)` × `(1+0.05*cicloLevel)`, preview 🪶 gain + list losses, Confirm/Cancel buttons
- [x] 2.5 `performRebirth()`: add 🪶 to `legacyEssence`, increment `rebirthCount`, reset souls/essence/upgrades/heroLevel/heroXp/heroBonuses/playerSpec, preserve equipment/class/maxFloor/heroArtifact/leaderboard, set `hasRebirthed=true`, saveGame, close modal
- [x] 2.6 Add `metaState.hasRebirthed=false` in `startRun()` (~line 5075 area)

## Phase 3: Árbol de Artefacto (hero-artifact-tree)

- [x] 3.1 Add CSS for `.artifact-tree-grid` (2-col), `.artifact-node`, `.artifact-max`, `.artifact-btn` (~line 708 area)
- [x] 3.2 Add HTML modal overlay `#artifact-overlay` with dynamic content (same pattern as rebirth modal)
- [x] 3.3 `showArtifactTree()`: render 10 nodes from BALANCE.heroArtifact — name, level (0-5), cost `floor(5*sqrt(lvl+1))`, "MAX" + disabled at level 5
- [x] 3.4 `buyArtifactNode(id)`: validate `legacyEssence >= cost`, deduct, increment node level, saveGame, re-render tree
- [x] 3.5 Add artifact bonus layer in `calcPlayerStats()` (~after line ~2038): multiply ATK/DEF/HP/AGI by respective node bonuses; apply `herencia_equipo` as global multiplier; `sabiduria_eterna` to XP gain; `fortuna_heroe` to drop rate; `voluntad_heroe` to souls gain; `talento_innato` as talentDmgMult in processDebuffs
- [x] 3.6 Add "🌟 Árbol de Artefacto" button in forja modal content

## Phase 4: Abismo del Legado (legacy-abyss-dungeon)

- [x] 4.1 Update `showDungeonSelection()` (~line 5195): slot 3 renders "Abismo del Legado" (selectable) when `unlockedReforge`, else "Próximamente" (locked)
- [x] 4.2 `startLegacyAbyssRun()`: check `attemptsTodayLegacy` (3 free/day, soul cost formula for extras), setup `runState` with `dungeonMode=true` + `legacyAbyssMode=true`, 10-floor loop with mini-boss at 5, boss at 10
- [x] 4.3 Add legacy essence reward in `enemyDefeated()` (~line 3752 dungeonMode block): on floor completion award `floor(sqrt(heroLevel)*floorNum/5)` 🪶, boss floor 10 = double, NOT multiplied by Ciclo del Legado
- [x] 4.4 Wire `playerDied()` for legacy abyss: existing dungeonMode path (~line 3951) already returns to dungeon selection — added legacyAbyssMode reset

## Phase 5: Verificación

- [x] 5.1 `node --check` syntax validation passed
- [ ] 5.2 Manual: rebirth formula (heroLevel 25, maxFloor 120 → 6 🪶), reset/preservation, multiple rebirths
- [ ] 5.3 Manual: artifact tree — purchase node to level 5 (costs 5/7/8/10/11), "MAX" state, insufficient essence message
- [ ] 5.4 Manual: legacy abyss — visibility pre/post-100, 10-floor completion, independent attempt counter, 🪶 drops
- [ ] 5.5 Manual: migration — load v4 save, verify defaults populate without errors
- [ ] 5.6 Manual: edge cases — rebirth at heroLevel 0 / maxFloor < 100 (0 🪶), specialization re-select at level 100
