# Proposal: Cámara de las Runas

## Intent

Reemplazar el slot "Próximamente" de la Cámara de las Runas con un sistema de runas (runewords) + su dungeon. Contenido endgame que se desbloquea al piso 100 para dar personalización lateral y un dungeon con recompensa propia.

## Scope

### In Scope
- Runewords: 2 slots/pieza (Condición⬆️ + Efecto⬇️), 8 condiciones, 10 efectos
- Rarezas S / SS / SSS con enhance caps distintos
- Fabricación con 🔮 Polvo + 💀 Almas
- Enhance y subida de rareza (S→SS→SSS)
- Rerolleo (aleatorio/elegir, costo en 🔮)
- Cámara de las Runas: oleadas infinitas 1vs1, jefe cada 10, escala con poder del jugador, recompensa solo 🔮
- Integración con sistema de mazmorras (3 intentos/día, unlock piso 100)
- UI: runas en personaje + forja

### Out of Scope
- Sinergias entre piezas
- Rarezas más allá de SSS

## Capabilities

### New Capabilities
- `rune-system`: Fabricación, equipamiento (2 slots/pieza), rarezas S/SS/SSS, enhance, rerolleo, combinaciones únicas por pieza
- `dungeon-camara-runas`: Oleadas infinitas, escalado por poder del jugador, jefe cada 10, recompensa 🔮

### Modified Capabilities
- `dungeon-system`: Slot 3 pasa de "Próximamente" a seleccionable al alcanzar piso 100

## Approach

Agregar a `metaState.equipment[slot].runas = { condition, effect }` y `runState` tracking de procs de condición. Efectos se aplican como buffs/debuffs en combatTick. La cámara sigue patrón de dungeons existentes pero sin pisos fijos ni drops de equipo — solo 🔮.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `metaState` | Modified | +runas por pieza, +runeInventory, +runePowder |
| `runState` | Modified | +runeProcs, +temporary buffs |
| `BALANCE` | Modified | +BALANCE.runas (condiciones, efectos, costos) |
| `combatTick` | Modified | Chequear condiciones y disparar efectos |
| `renderCharacterScreen` | Modified | Sección de runas equipadas |
| `showForjaModal` | Modified | Botón de Runas |
| `showDungeonSelection` | Modified | Slot 3 dinámico |
| `saveGame/loadGame` | Modified | Persistir runas y 🔮 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Balance desviado | Med | Valores planos en BALANCE, fácil de tunear |
| Performance en oleadas | Bajo | Mismo combatTick existente |
| Conflicto maestrías | Bajo | Efectos corren en runState separado |

## Rollback Plan

Revertir metaState/runState/BALANCE, restaurar slot 3 a "Próximamente". Commit reversible único.

## Dependencies

Ninguna. Todo en `Torre_Infinita.html`.

## Success Criteria

- [ ] Slot 3 seleccionable al piso 100
- [ ] Runas fabricables, equipables, mejorables y reroleables desde forja
- [ ] Efectos se disparan en combate según condición
- [ ] Cámara produce 🔮 al progresar oleadas
- [ ] Save/load persiste runas, 🔮 y progreso del dungeon
