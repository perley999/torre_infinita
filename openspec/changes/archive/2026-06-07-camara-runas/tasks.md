# Tasks: Cámara de las Runas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 800–1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (data+persist) → PR 2 (fabricate+equip+combat) → PR 3 (dungeon+UI) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Phase 1: Datos + BALANCE + Pools

- [x] 1.1 Agregar `BALANCE.runas` con pools condiciones/efectos, costos y enhanceMult
- [x] 1.2 Crear `RUNE_CONDITIONS[8]` y `RUNE_EFFECTS[10]` (patrón TALENT_POOL)
- [x] 1.3 Agregar `metaState.equipment[slot].runas`, `runePowder`, `runeInventory`
- [x] 1.4 Agregar `runState.runeBuffs`, `runState.runeCooldowns`

## Phase 2: Fabricación + Enhance + Reroll + Upgrade

- [x] 2.1 `fabricateRune(poolType)`: 10🔮+100💀, random del pool, guarda en runeInventory
- [x] 2.2 `enhanceRune(slot)`: +1 nivel, floor(1.5^n)🔮, +8% effect value
- [x] 2.3 `rerollRune(slot, mode)`: random 3🔮+30💀 | choose 8🔮+80💀, enhance a +0
- [x] 2.4 `upgradeRuneRarity(slot)`: S→SS (25🔮+250💀) | SS→SSS (100🔮+1000💀)
- [x] 2.5 `getRuneEffectValue(effectId, rarity, enhance)`: valor escalado

## Phase 3: Equipar + Validación

- [x] 3.1 `equipRune(slot, conditionId, effectId)`: asigna, remueve de inventory
- [x] 3.2 `unequipRune(slot)`: remueve runa, vuelve a runeInventory
- [x] 3.3 `validateRuneCombination()`: rechaza combinación duplicada entre piezas
- [x] 3.4 Render slots de runa en CharacterScreen debajo de stats (post-100)

## Phase 4: Combat Integration

- [x] 4.1 `checkRuneConditions(p, e, tickCount)`: evaluar 8 condiciones en combatTick
- [x] 4.2 `applyRuneEffect()`: aplicar bleed/ATK×N/shield/heal/vuln/slows/steal/DEF/atkSpd
- [x] 4.3 Integrar en `combatTick`: checkConditions + procesar runeBuffs (expiry, cooldowns)
- [x] 4.4 Integrar en `calcPlayerStats`: Avalancha, Coraza, Ímpetu desde runeBuffs
- [x] 4.5 Chequeo Cosecha en `enemyDefeated` con cooldown por rareza

## Phase 5: Cámara de las Runas

- [x] 5.1 `startRuneChamberRun()`: oleadas 1v1 infinitas, 0.5s entre waves, boss cada 10
- [x] 5.2 `awardRunePowder(wave, bosses)`: floor(wave/3)+floor(wave/5)+bosses×2 🔮
- [x] 5.3 `showDungeonSelection`: slot 3 dinámico según unlockedReforge
- [x] 5.4 Integrar con intentos diarios compartidos (metaState.dungeon)

## Phase 6: UI

- [x] 6.1 Tab "Runas" en forja: fabricar, mejorar, rerolear, upgrade rareza
- [x] 6.2 Mostrar 🔮 en header junto a 💀 y 🩸
- [x] 6.3 Modales de confirmación para acciones de runas con costos
- [x] 6.4 Botones equipar/unequip desde CharacterScreen

## Phase 7: Persistencia

- [x] 7.1 Serializar runas, runePowder, runeInventory en saveGame()
- [x] 7.2 Deserializar en loadGame() con migración v5→v6
- [x] 7.3 Defaults en resetGame() / initNewSave()
- [x] 7.x Verify rune dungeon attempts counter works with existing daily reset system
- [x] 7.x Verify save/load properly restores runeCooldowns, runeBuffs (or reset on load)

## Implementation Evolution Notes

### Reroll system (task 2.3) — REMOVED
The `rerollRune(slot, mode)` system was removed by user request. No reroll functionality exists in the final implementation. The cost tables and UI for rerolling were never built.

### Enhance and Rarity Upgrade (tasks 2.2, 2.4) — REFACTORED
The original combined `enhanceRune(slot)` and `upgradeRuneRarity(slot)` were replaced by individual component-level operations:
- **Inventory level**: `enhanceRuneInInventory(key)`, `upgradeRuneRarityByKey(key)` — for runes not equipped
- **Equipped level**: `enhanceRuneEquipped(slot)`, `upgradeRuneRarityEquipped(slot)` — for runes on gear

This separation was necessary because runes exist in two contexts (inventory vs equipped) and each needs independent state management. The `inventoryKey` pattern was introduced to reference runes in `runeInventory`.

### Other tasks
All remaining tasks (Phase 1, 3, 4, 5, 6, 7) were completed as specified. Total: 26 tasks, 25 implemented + 1 removed.
