# Design: Cámara de las Runas

## Technical Approach

Extender el patrón `estado central → render()` con dos pools de runas (condiciones + efectos) al estilo `TALENT_POOL`. Las runas viven en `metaState.equipment[slot].runas` y se evalúan en `combatTick`. Efectos temporales (Avalancha, Coraza, Ímpetu) se modelan como buffs en `runState` que `calcPlayerStats` consume. La Cámara reusa el sistema de dungeons (oleadas 1v1, boss cada 10, intentos compartidos) y llama `awardRunePowder()` al terminar.

## Architecture Decisions

### Decision: Runas en equipo, no inventario separado

| Opción | Tradeoff |
|--------|----------|
| `metaState.equipment[slot].runas = {conditionId, effectId, enhance, rarity}` | Sigue el patrón existente `item.mastery`, evita otro nivel de anidamiento |
| Array global `metaState.runas[]` con slot reference | Más complejo de serializar, requiere validación extra |

**Decisión**: Anidado en cada item. La UI de personaje ya itera `equipment[slot]`, las runas aparecen naturalmente.

### Decision: Efectos con duración como buffs en runState

Efectos que modifican stats (Avalancha, Coraza, Ímpetu) se representan como `{effectId, expireTick, value}` en `runState.runeBuffs[]` y `calcPlayerStats` los itera para aplicar multiplicadores temporales.

### Decision: Combinaciones únicas por pieza

Al equipar una runa, se recorre `metaState.equipment` completo. Si otra pieza ya tiene esa misma combinación `(conditionId, effectId)`, se rechaza. La validación está en `validateRuneCombination()`.

### Decision: Cámara como dungeon slot 3 reutilizando sistema de oleadas

En vez de un modal nuevo, la Cámara usa el mismo loop `startDungeonRun` pero con flag `runeChamberMode`. El reward es `awardRunePowder()` en vez de equipo. El slot 3 en `showDungeonSelection()` cambia de locked a clickable condicionalmente.

## Data Flow

```
Fabricar:  Forja "Runas" → seleccionar pool → gastar 10🔮+100💀    → random runa guardada en metaState
             → no guarda en equipo, queda en "runas fabricadas" como pool para equipar
             └─→ realmente: va directo a mano (equip slot)

Equipar:   CharacterScreen → click slot runa → elegir de runas fabricadas → validateRuneCombination()
             → asigna a metaState.equipment[slot].runas → saveGame() → render()

Combat:    combatTick() → checkRuneConditions()
             → condición cumple? → applyRuneEffect()
               → efecto temporario → push a runState.runeBuffs[]
               → efecto instantáneo (Cortar/Marca/Pulso/Osmosis) → ejecuta inmediato

Render:    render() → iterar equipment → mostrar runas debajo de stats de pieza
```

## Data Structures

```js
// En metaState — persistente
metaState.runeInventory = {
  // runas fabricadas no equipadas, key = `${conditionId}_${effectId}`
  // value: { conditionId, effectId, enhance: 0, rarity: 'S' }
}

metaState.equipment[slot].runas = {
  conditionId: 'golpe_seco', // id de condición
  effectId: 'cortar',        // id de efecto
  enhance: 0,                // nivel de mejora (0-10)
  rarity: 'S',               // S | SS | SSS
}

metaState.runePowder = 0     // 🔮

// En runState — volátil por run
runState.runeBuffs = [
  { effectId: 'avalancha', expireTick: 30, value: 1.5 }, // 3s = 30 ticks
  { effectId: 'coraza', expireTick: 40, value: 0.40 },
]
runState.runeCooldowns = { cosecha: 0 } // ms restantes
```

## Interfaces

```js
// Rune pools (constantes globales, patrón TALENT_POOL)
const RUNE_CONDITIONS = [ /* 8 condiciones con id, label, desc, niveles S/SS/SSS */ ]
const RUNE_EFFECTS   = [ /* 10 efectos con id, label, desc, niveles S/SS/SSS */ ]

// Core
function checkRuneConditions(p, e, tickCount)     // evaluar condiciones en combatTick
function applyRuneEffect(p, e, effectId, rarity, enhance, tickCount)  // disparar efecto
function getRuneEffectValue(effectId, rarity, enhance) // valor escalado por rareza+enhance

// Fabricación y equipo
function fabricateRune(poolType)   // poolType: 'condition' | 'effect'; 10🔮+100💀
function equipRune(slot, conditionId, effectId)    // asignar runa a slot
function unequipRune(slot)                         // quitar runa
function validateRuneCombination(conditionId, effectId, slot) // unique check

// Mejora
function enhanceRune(slot)           // +1 nivel, floor(1.5^n)🔮
function rerollRune(slot, mode)      // random(3🔮+30💀) o choose(8🔮+80💀)
function upgradeRuneRarity(slot)     // S→SS (25🔮+250💀) o SS→SSS (100🔮+1000💀)

// Dungeon
function startRuneChamberRun()       // inicia run modo cámaras
function awardRunePowder(wave, bosses) // calcula reward: floor(wave/3)+floor(wave/5)+bosses×2
```

## File Changes

| Ubicación | Acción | Descripción |
|-----------|--------|-------------|
| `BALANCE` (~1311) | Modificar | Agregar `BALANCE.runas` con pools de condiciones/efectos, costos de enhance/reroll/upgrade, enhanceMult por nivel |
| `metaState` (~1463) | Modificar | Agregar `equipment[slot].runas = null`, `runePowder`, `runeInventory` |
| `runState` (~1712) | Modificar | Agregar `runeBuffs: []`, `runeCooldowns: {}` |
| `Constantes` (~1835) | Crear | Agregar `RUNE_CONDITIONS[8]` y `RUNE_EFFECTS[10]` (patrón TALENT_POOL) |
| `calcPlayerStats` (~2163) | Modificar | Integrar buffs de runa: Avalancha (ATK×N), Coraza (+%DEF), Ímpetu (+%atkSpd) |
| `combatTick` (~2917) | Modificar | Llamar `checkRuneConditions` cada tick; procesar `runeBuffs` (decrementar timers, remover expirados) |
| `enemyDefeated` (~4023) | Modificar | Insertar chequeo de condición Cosecha (post-kill cooldown) |
| `render` (~5664) | Modificar | Mostrar runas en CharacterScreen debajo de stats de cada pieza; mostrar 🔮 en header |
| `showDungeonSelection` (~5483) | Modificar | Slot 3 dinámico: locked si no unlockedReforge, clickable si sí |
| `startDungeonRun` (~5553) | Modificar | Branch para `runeChamberMode` (oleadas infinitas, reward rune powder) |
| `showForjaModal` (~6316) | Modificar | Agregar tab "Runas" con fabricar, mejorar, rerolear, upgrade de rareza |
| `saveGame`/`loadGame` (~1512) | Modificar | Serializar/deserializar runas, runePowder con migración v5→v6 |
