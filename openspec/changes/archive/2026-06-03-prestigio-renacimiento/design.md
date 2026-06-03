# Design: Prestigio / Renacimiento

## Technical Approach

Extender `metaState` y `BALANCE` con datos del árbol de artefacto. `performRebirth()` resetea progreso parcial y otorga Legacy Essence. Bonos de artefacto se aplican como capa multiplicativa final en `calcPlayerStats()`. Abismo del Legado reusa el engine de mazmorras con contador de intentos separado. Todo el UI vía modal overlays (mismo patrón que reforge/leaderboard).

## Architecture Decisions

### Decision: heroArtifact vive en metaState

**Choice**: `metaState.heroArtifact.nodes[10]` + `legacyEssence` + `rebirthCount`
**Rationale**: Persiste entre runs, mismo patrón que campos existentes de metaState. Fácil de serializar en saveGame/loadGame.

### Decision: Legacy Essence se calcula al confirmar Renacer, NO al morir

**Choice**: `showRebirthModal()` calcula la fórmula y muestra preview; `performRebirth()` finaliza la suma
**Alternativa rechazada**: calcular en `playerDied()` y almacenar temporalmente
**Rationale**: La spec especifica cálculo en confirmación de Renacer. Evita recálculo en muertes múltiples. UX más clara: el jugador ve lo que va a ganar antes de confirmar.

### Decision: performRebirth() dedicada vs resetGame() parcial

**Choice**: Función nueva de ~40 líneas que resetea/preserva explícitamente cada campo
**Rationale**: Más seguro que modificar `resetGame()`. Código auto-documentado. Fácil de mantener si cambian los campos a resetear.

### Decision: Intentos independientes para Abismo del Legado

**Choice**: `metaState.dungeon.attemptsTodayLegacy` separado de `attemptsToday`
**Rationale**: La spec requiere pools de intentos gratis independientes. Misma fórmula de costo para extras: `500 × 2^(n-4)`.

### Decision: One rebirth per run via flag

**Choice**: `metaState.hasRebirthed` se setea true en rebirth, se resetea false en `startRun()`
**Rationale**: Ciclo de vida limpio. Botón oculto post-rebirth hasta que arranque una nueva run (y termine, quedando idle).

### Decision: Config de nodos del árbol en BALANCE

**Choice**: `BALANCE.heroArtifact.nodes[]` con id, label, bonusPerLevel, icon
**Rationale**: Single source of truth. Consistente con patrón existente (BALANCE.metaUpgrades, BALANCE.enemy, etc.).

### Decision: Artefacto `herencia_equipo` como multiplicador total

**Choice**: Se aplica como multiplicador global post-metaUpgrades (como los demás nodos de stats)
**Rationale**: Equipment y base stats ya están sumados antes de metaUpgrades. Aplicar solo a la porción de equipment requeriría separar contabilidad, añadiendo complejidad innecesaria. El efecto práctico es equivalente.

## Data Flow

```
Idle (no run, unlockedReforge, !hasRebirthed)
  → Botón "🪶 Renacer" visible
    → click → showRebirthModal()
      → calc: floor(sqrt(heroLevel) * max(maxFloor,100) / 100)
      → apply Ciclo del Legado: amount *= (1 + 0.05 * nodeLevel)
      → mostrar resumen (ganancia 🪶 + pérdidas)
      → Confirmar → performRebirth()
        → metaState.heroArtifact.legacyEssence += amount
        → metaState.heroArtifact.rebirthCount++
        → reset: souls=0, essence=0, upgrades.each.level=0, heroLevel=0, heroXp=0
        → reset: heroBonuses={hp:0,atk:0,def:0,agi:0}, playerSpec=null
        → preserve: equipment, playerClass, maxFloor, heroArtifact, leaderboard
        → metaState.hasRebirthed = true
        → saveGame(), render(), close modal

Idle (unlockedReforge)
  → Botón "🌟 Árbol de Artefacto"
    → click → showArtifactTree()
      → modal overlay con grilla de 10 nodos
      → cada nodo: nombre, nivel actual (0-5), costo próximo nivel, botón comprar
      → click comprar → buyArtifactNode(id)
        → check legacyEssence >= floor(5 * sqrt(nextLevel))
        → deduct, increment node level
        → saveGame(), re-render tree

Abismo del Legado
  → showDungeonSelection() renderiza slot 3 como seleccionable
    → click → startLegacyAbyssRun()
      → check attemptsTodayLegacy, deduct if paid
      → set runState.dungeonMode + runState.legacyAbyssMode = true
      → mismo combat engine que Torre de los Ancestros
    → enemyDefeated() check legacyAbyssMode → awards 🪶:
      - floor completion: floor(sqrt(heroLevel) * floorNum / 5)
      - boss floor 10: double amount
    → playerDied() en dungeon → return a dungeon selection
```

## File Changes

| File | Action | Descripción |
|------|--------|-------------|
| `Torre_Infinita.html` | Modificar | +350 líneas: metaState fields, BALANCE.heroArtifact, calcPlayerStats layer, 4 funciones nuevas, updateButtons, showDungeonSelection slot 3, playerDied soul mult, startRun hasRebirthed reset, saveGame/loadGame v4→v5, CSS tree modal + renacer button |

## Interfaces / Contracts

```js
// -- metaState additions (línea ~1284) --
metaState.heroArtifact = {
    nodes: {
        fuerza_ancestral: 0, coraza_ancestral: 0, vitalidad_ancestral: 0,
        pasos_ancestrales: 0, talento_innato: 0, herencia_equipo: 0,
        sabiduria_eterna: 0, fortuna_heroe: 0, ciclo_legado: 0,
        voluntad_heroe: 0,
    },
    legacyEssence: 0,
    rebirthCount: 0,
};
metaState.hasRebirthed = false;

// -- dungeon additions (línea ~1303) --
metaState.dungeon.attemptsTodayLegacy = 0;

// -- BALANCE additions (línea ~1148) --
BALANCE.heroArtifact = {
    nodes: [
        { id: 'fuerza_ancestral',  label: '⚔️ Fuerza Ancestral',  bonus: 0.03 },
        { id: 'coraza_ancestral',  label: '🛡️ Coraza Ancestral',   bonus: 0.03 },
        { id: 'vitalidad_ancestral', label: '❤️ Vitalidad Ancestral', bonus: 0.03 },
        { id: 'pasos_ancestrales',  label: '🏃 Pasos Ancestrales',  bonus: 0.03 },
        { id: 'talento_innato',    label: '💥 Talento Innato',     bonus: 0.05 },
        { id: 'herencia_equipo',   label: '💍 Herencia del Equipo', bonus: 0.05 },
        { id: 'sabiduria_eterna',  label: '📖 Sabiduría Eterna',   bonus: 0.05 },
        { id: 'fortuna_heroe',     label: '🍀 Fortuna del Héroe',  bonus: 0.05 },
        { id: 'ciclo_legado',      label: '🪶 Ciclo del Legado',    bonus: 0.05 },
        { id: 'voluntad_heroe',    label: '💀 Voluntad del Héroe',  bonus: 0.05 },
    ],
    costBase: 5,  // floor(5 * sqrt(level))
};

// -- New functions --
function performRebirth()       → void   // Resetea progreso, otorga 🪶
function showArtifactTree()     → void   // Modal overlay del árbol
function buyArtifactNode(id)    → void   // Compra nivel de nodo
function startLegacyAbyssRun()  → void   // Inicia run de Abismo del Legado
```

## Testing Strategy

| Layer | Qué testear | Approach |
|-------|-------------|----------|
| Syntax | Todo el código nuevo | `node --check Torre_Infinita.html` |
| Rebirth | Fórmula, resets, persistence | Manual: llegar a 100+, anotar heroLevel/maxFloor, renacer, verificar valores |
| Artifact tree | Compra, costo, MAX state | Manual: comprar nodos en varios niveles, verificar costo `floor(5*sqrt(lvl))` |
| Dungeon | Slot 3 unlock, drops 🪶, attempts | Manual: check slot antes/después de 100, correr dungeon, verificar 🪶 |
| Migration | v4 → v5 | Manual: cargar save viejo, verificar defaults |
| Edge cases | rebirth con heroLevel 0, maxFloor < 100 | Manual: forzar escenario, verificar fórmula da 0 🪶 |
| Edge cases | Múltiples rebirths | Manual: renacer, startRun, morir, renacer de nuevo |

## Migration / Rollout

dataVersion v4 → v5 en `loadGame()` (después de bloque v3→v4, línea ~1413):

```js
if (metaState.dataVersion < 5) {
    metaState.heroArtifact = {
        nodes: {}, legacyEssence: 0, rebirthCount: 0,
    };
    for (const n of BALANCE.heroArtifact.nodes) {
        metaState.heroArtifact.nodes[n.id] = 0;
    }
    metaState.hasRebirthed = false;
    if (!metaState.dungeon.attemptsTodayLegacy) {
        metaState.dungeon.attemptsTodayLegacy = 0;
    }
    metaState.dataVersion = 5;
    needsMigration = true;
}
```

Sin feature flags. Commit único. Rollback = `git revert HEAD` + reset manual de save si datos v5 corrompen.

## Open Questions

- [ ] **Ciclo del Legado**: +5% por nivel — ¿multiplicar antes o después de sumar al total acumulado? **Decisión**: aplicar como multiplicador del monto calculado en rebirth ANTES de sumar a `metaState.heroArtifact.legacyEssence`. Esto es consistente con "Legacy Essence gained (rebirth only)".
- [ ] **Botón Renacer**: ¿desaparece o se deshabilita post-rebirth? **Decisión**: desaparece (no se renderiza en updateButtons). Misma estrategia que botón Mazmorra pre-floor-100.
- [ ] **Abismo del Legado**: ¿drops de 🪶 en cada muerte de enemigo o solo al completar piso? **Decisión**: solo al completar piso (enemyDefeated → floor completion check). Consistente con la fórmula de la spec que usa `floorNum`.
- [ ] **Talento Innato**: +5% talent damage por nivel — ¿aplica a DoTs, a golpes especiales, o a ambos? **Decisión**: aplicar como multiplicador en `processDebuffs()` para daño de DoTs. Efectos tipo Furia Ardiente, Eco, y Contraataque también se benefician. Se almacena como `talentDmgMult` en el objeto retornado por `calcPlayerStats()`.
