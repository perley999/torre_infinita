# Proposal: Prestigio / Renacimiento — Árbol de Artefacto de Héroe

## Intent

Agregar una capa meta de prestigio post-piso-100 que permite reiniciar el progreso a cambio de Legacy Essence (🪶), usada para comprar bonificaciones permanentes en un árbol de artefacto de héroe. Rompe el gameplay lineal infinito y da sentido al placeholder "Abismo del Legado" que ya existe en la UI de mazmorras.

## Scope

### In Scope
- Sistema de renacimiento: botón Renacer, reseteo parcial (almas/esencias/mejoras se reinician; equipo, clase, maxFloor persisten; heroLevel se calcula para Legacy Essence y luego se resetea a 0. Especialización se resetea — se vuelve a elegir al lvl 100. Pasivas de clase clase se re-desbloquean en lvl 50, las de especialización en lvl 100)
- Árbol de artefacto: 10 nodos lineales, 5 niveles c/u, bonos % multiplicativos, costos sqrt
- Legacy Essence (🪶) como moneda de prestigio, cálculo al morir
- Abismo del Legado: dungeon de 10 pisos que otorga Legacy Essence (tercer slot de mazmorra)

### Out of Scope
- Árbol ramificado con prerrequisitos — deferido para expansión futura
- Clases o especializaciones específicas del árbol
- Logros o achievements vinculados al prestigio
- UI tipo character sheet — se usa modal overlay (mismo patrón que reforge/leaderboard)

## Capabilities

### New Capabilities
- `prestige-system`: sistema de renacimiento con Legacy Essence, botón Renacer visible al piso 100, reseteo parcial, cálculo de Legacy Essence en `playerDied()`
- `hero-artifact-tree`: árbol de 10 nodos lineales con 5 niveles c/u, bonos multiplicativos % en `calcPlayerStats()` como capa post-metaUpgrades, costos `floor(5 * sqrt(level))` 🪶
- `legacy-abyss-dungeon`: dungeon de 10 pisos que otorga Legacy Essence como loot, reusa el engine de combate de mazmorras existente

### Modified Capabilities
- `dungeon-system`: el tercer slot de mazmorra ("Abismo del Legado") se desbloquea al alcanzar piso 100, reemplazando el placeholder "Próximamente"

## Approach

Árbol lineal todo-comprable en modal overlay. Fórmula de Legacy Essence al morir: `floor(sqrt(heroLevel) * max(floor, 100) / 100)`. Costos: `floor(5 * sqrt(level))` 🪶. Bonos de 3-5 % por nivel, aplicados como capa multiplicativa final en `calcPlayerStats()` después de metaUpgrades. Abismo del Legado reusa el sistema de mazmorras existente con loot de Legacy Essence en vez de items.

## Affected Areas

| Área | Impacto | Description |
|------|---------|-------------|
| `Torre_Infinita.html` | +300-400 líneas | metaState, saveGame/loadGame, resetGame, BALANCE, calcPlayerStats, render, updateButtons, showDungeonSelection, playerDied, startRun, heroLevel reset |
| `openspec/specs/dungeon-system/spec.md` | Modificado | Slot 3: "Abismo del Legado" desbloqueable al piso 100 |
| `openspec/specs/prestige-system/spec.md` | Nuevo | Spec completo del sistema de renacimiento |
| `openspec/specs/hero-artifact-tree/spec.md` | Nuevo | Spec completo del árbol de artefacto |
| `openspec/specs/legacy-abyss-dungeon/spec.md` | Nuevo | Spec completo del dungeon de Legacy Essence |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Bonos % multiplicativos compuestos desbalancean early-game | Media | Aplicar artifact bonuses como capa final post-metaUpgrades con valores 3-5 % / nivel |
| Migración de save v4→v5 sin datos legacy | Baja | dataVersion bump; defaults: `heroArtifact: {}`, `legacyEssence: 0`, `rebirthCount: 0`, `playerSpec: ''` |
| heroLevel en 0 post-rebirth con pasivas lockeadas | Baja | El juego escala normal, el jugador sube niveles de nuevo. Se elige especialización al lvl 100 como la primera vez. |
| Archivo 336KB + 300-400 líneas = código grande | Media | Secciones con comentarios de bloque, respetar el patrón estado → render |
| Confusión visual 🪶 vs 🩸 | Baja | Emojis distintos, etiquetas claras "Legacy Essence" vs "Esencias de Forja" en UI |

## Rollback Plan

1. Revertir commit con `git revert HEAD`
2. Si hay saves v5 activos tras el revert, forzar recarga con `resetGame()` o restaurar desde backup manual
3. Revertir cambios en `openspec/specs/dungeon-system/spec.md` (volver a "Próximamente" en slot 3)
4. Eliminar carpetas `openspec/specs/prestige-system/`, `hero-artifact-tree/`, `legacy-abyss-dungeon/`

## Dependencias

- Ninguna externa. Todo es vanilla JS + localStorage.

## Success Criteria

- [ ] Renacer reinicia correctamente almas/esencias/mejoras y heroLevel (a 0), pero preserva equipo, clase y maxFloor
- [ ] Especialización se resetea al renacer — se vuelve a elegir al alcanzar lvl 100
- [ ] Legacy Essence se calcula al morir con la fórmula definida y persiste entre runs
- [ ] Árbol de 10 nodos renderiza niveles comprados y costos actuales
- [ ] Bonos del árbol se aplican en `calcPlayerStats()` como capa multiplicativa final
- [ ] Abismo del Legado se desbloquea al piso 100 y otorga Legacy Essence al completarse
- [ ] Saves v4 sin datos de prestigio cargan sin errores (migración automática a v5)
