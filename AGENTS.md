<!-- Estoy usando AGENTS.md -->

# Torre Infinita — AGENTS.md

Contexto completo para trabajar sobre este proyecto. Leer antes de modificar.

**Versión actual**: 0.4.0 · Último tag: `v0.3.0`

---

## Stack

- **Vanilla JS + HTML + CSS** en un solo archivo (`Torre_Infinita.html`)
- Sin build step, sin npm, sin frameworks
- `localStorage` para persistencia
- Responsive, max-width 480px, tema oscuro

---

## Arquitectura

### Patrón: Estado central → render()

```
modificar estado → render() → DOM actualizado
```

NUNCA tocar el DOM directamente fuera de `render()`. La única excepción son los floats animados (`spawnFloat`) y la clase `hit` de `flashElement()`.

### Dos objetos de estado

| Objeto | Persiste | Propósito |
|--------|----------|-----------|
| `metaState` | ✅ localStorage | Almas, equipo, mejoras, jefes intentados, nivel héroe, XP |
| `runState` | ❌ Solo en RAM | Run actual: piso, nivel, enemigo, player, bonuses, timers, **talentos activos** (`talentLevels`), debuffs enemigo |

### Ciclo de vida de una run

```
startRun() → startCombat() → combatTick (cada 100ms)
                                    ↓
                             enemyDefeated()
                              ├─ drop equipo → tryEquip()
                              ├─ ¿piso % 5? → showTalentChoice()
                              │                  ↓
                              │            selectTalent() → closeChoice()
                              │                  ↓
                              └─→ floor++ → checkLevelUp()
                                               ↓
                                         startCombat() (siguiente piso)
                             playerDied() → guarda almas
```

---

## Archivos del proyecto

| Archivo | Propósito |
|---------|-----------|
| `Torre_Infinita.html` | Juego completo (HTML + CSS + JS inline, ~3280 líneas) |
| `README.md` | Docs generales para jugar |
| `PROYECTO.md` | Decisiones de diseño y resumen técnico |
| `PROMPT.md` | Prompt replicable para regenerar desde cero |
| `CHANGELOG.md` | Historial de versiones |
| `AGENTS.md` | Este archivo — contexto para IA |
| `Talentos.md` | Referencia completa de los 37 talentos por bloque |
| `.gitignore` | Ignora archivos de análisis y beta |
| `BETA-GUIA.md` | (gitignored) Guía para testers |
| `ANALIZADOR-PROGRESION.md` | (gitignored) Documentación del analizador |
| `analizador-progresion.html` | (gitignored) Herramienta para simular progresión |

---

## BALANCE — El objeto central (línea 696)

Todos los números del juego viven en `BALANCE`. Cambiar un número aquí recalcula TODO.

### Estructura

```
BALANCE
├── player          → { hp: 100, atk: 10, def: 5, agi: 10 }
├── levelUp         → { xpBase, xpScale, maxLevel, abilityLevels[] }
├── metaUpgrades    → { hp, atk, def, agi, souls, crit, drop }
│   Cada upgrade:
│   { baseCost, scale, percent, flat?, maxLevel?, label, icon }
├── enemy
│   ├── normal      → { hp, atk, def, agi }
│   ├── boss        → { hp, atk, def, agi }
│   ├── tierScale   → { normal, boss } — salto cada 10 pisos
│   ├── subScale    → { normal, boss } — incremental dentro del tier
│   ├── agiScale    → 1.02
│   ├── bossHpMult  → 1.6
│   ├── firstBoss   → { hp: 150, atk: 15, def: 5 } — stats fijos P10
│   └── dynamicBoss → { hpMult, atkMult, defMult } — 1er intento P20+
├── equipment
│   ├── dropBaseChance → 50
│   ├── slots       → [weapon, armor, ring]
│   ├── statPools   → por slot (primarios y secundarios)
│   ├── budgetMult  → multiplicadores por tipo de stat
│   │   ├── crit/lifesteal/dodge/pen/critDmg → 1.5
│   │   ├── hp                              → 1.5
│   │   ├── bossDmg/hpRegen                 → 1.2
│   │   ├── primary (atk/def)               → 1.0
│   │   └── flat (atk/def/agi secundario)   → 0.4
│   ├── rarities[]  → nombre, pesos, statMult
│   └── budgetBase  → 5
├── combat
│   ├── tickMs      → 100
│   ├── speedBase   → 3000ms
│   ├── speedPerAgi → 100ms
│   ├── speedMin    → 750ms
│   ├── minDamage   → 1
│   ├── caps y K    → crit(70/100), dodge(40/80), block(50/100),
│   │                 lifesteal(25/80), pen(50/100), critDmg(600/200),
│   │                 bossDmg(100/150)
│   └── critDmgBase → 50 (% base sobre ×1.5)
├── souls
│   └── baseMult    → 2
```

---

## Fórmulas clave

### Daño (línea 1093)
```js
calcDamage(atk, def, K = 0.6)
DR = def / (def + atk * K)
dmg = max(1, floor(atk * (1 - DR)))
```
La DEF siempre reduce un porcentaje, nunca anula el daño por completo.

### Velocidad de ataque (línea 1084)
```js
speedToInterval(agi) = max(750, 3000 - (agi * 100))
```

### Crit chance (combate: línea ~1907 / display: línea ~2934)
```js
equipCritPct = (p.critRating || 0) / 13  // rating → % lineal, estilo WoW
rawCrit      = derived.crit + equipCritPct + preciseBonus
totalCrit    = floor(DR(rawCrit, cap=70, K=100)) + masteryCritFlat + critBonus + trinityFlat
```
- **Equipment**: crit rating se convierte con ratio 13. +65 = 5%
- **Golpe Preciso**: +10/15/20 flat pre-DR
- **Trinidad**: +8/12/16 flat pre-DR
- **Meta upgrade crit**: +2%/nivel, se aplica **post-DR** (flat)
- **Maestría Crítica**: +5/10/15 flat, se aplica **post-DR**
- **Base**: 0% (sin mejoras ni equipo, no hay crítico)

### Dodge / Evasión (combate: línea ~1917 / display: línea ~2938)
```js
baseDodge     = floor(dodgeCap * agi / (agi + dodgeK))  // DR desde AGI
equipDodgePct = (p.dodgeRating || 0) / dodgeRatingRatio // rating → %, ratio 5
rawDodge      = baseDodge + equipDodgePct                // suma pre-DR
totalDodge    = floor(DR(rawDodge, cap=40, K=80)) + masteryFlatDodge + reflejosFelinos + trinityFlat
```
- **AGI**: `floor(40 × agi / (agi + 80))` → base
- **Equipo**: dodge rating se convierte con ratio 5 (como crit rating/13)
- **Reflejos Felinos**: +8/12/16 flat **post-DR**
- **Maestría Evasiva** (anillo): +2.5/5/7.5 flat **post-DR**
- **Trinidad**: +8/12/16 flat **post-DR**
- No hay doble DR: equipo pasa por DR una sola vez, como el crítico

### Crit damage (combate: línea ~1770 / display: línea ~2495)
```js
critMult = 1.5 + DR(critDamage, cap=600, K=200) / 100
dmg = floor(dmg * critMult)
```

### Ilvl del equipo (calcIlvl, línea 1629)
```js
return atk×1.0 + def×1.0 + agi×1.0
     + hp×0.4 + crit×0.5 + lifesteal×0.5 + dodge×0.5
     + block×0.4 + critDamage×0.4 + hpRegen×0.4
     + bossDamage×0.3 + pen×0.3
     + maestría(nivel)×3
```
- **ATK/DEF/AGI**: peso ×1.0 — atributos principales
- **CRIT/Lifesteal/Dodge**: peso ×0.5 — secundarios premium
- **HP/Block/Crit DMG/HP REGEN**: peso ×0.4 — secundarios medios
- **Boss DMG/PEN**: peso ×0.3 — secundarios situacionales
- **Maestría**: +3 por nivel de maestría

### Progresión de enemigos — tier-based (calcEnemyStats, línea 1203)
```js
tier = floor((floor - 1) / 10)   // cada 10 pisos = 1 tier
sub  = ((floor - 1) % 10) + 1    // posición dentro del tier

hp  = base * tierScale^tier * subScale^(sub-1)
atk = base * tierScale^tier * subScale^(sub-1)
def = base * tierScale^tier * subScale^(sub-1)
```
Los jefes tienen escalado dinámico en el PRIMER intento (P20+): las stats del jefe se calculan en función de las stats del jugador y se guardan en `bossStats` para reuso en intentos posteriores. El jefe P10 (`firstBoss`) usa stats fijas.

### Almas al morir (línea ~2421)
```js
souls = floor(piso * baseMult + piso * upgrade_almas.level * upgrade_almas.flat)
```
- Las almas se calculan **una sola vez al morir**, basado en el piso alcanzado (no se acumulan por enemigo)
- Cada piso derrotado muestra las almas que habría dado en el log de combate, solo como referencia visual
- **Maestría Afortunada** (anillo): 10/20/30% de chance de duplicar las almas
- **Training mode**: base solamente, 25% del valor, sin mejoras permanentes

### Diminishing Returns (línea 1373)
```js
DR(raw, cap, K) = cap * (raw / (raw + K))
```

### Presupuesto de equipo (línea 1411)
```js
budget = floor(budgetBase * log2(piso + 1) * statMult(rareza))
// budgetBase = 5
```

---

## Convenciones de código

### Secciones del JS (en orden)

```
1.  BALANCE (objeto central)                    — línea   696
2.  Estado (metaState + runState + localStorage) — línea   834
3.  Constantes y Pools de Talentos               — línea   938
    (ENEMY_NAMES, BOSS_NAMES, TALENT_POOL, helpers)
4.  Cálculos (daño, speed, stats, equipo, ilvl)  — línea  1084
5.  Generación de equipo (generateItem)           — línea  1396
6.  Combate (startCombat, combatTick, calcEnemyStats)
    ├── Debuffs (clearDebuffs, applyDebuff, processDebuffs) — ~1234
    ├── combatTick()                              — línea  1617
    └── enemyDefeated() / playerDied()            — línea  2062
7.  Talentos (showTalentChoice, selectTalent)     — línea  2177
8.  Comparación de equipo (modales)               — línea  2349
9.  Controles (startRun, restartRun, buyUpgrade)  — línea  2381
10. Render y UI (render)                          — línea  2447
```

### Nombres

- `metaState` → progreso persistente (almas, equipo, mejoras, nivel héroe)
- `runState` → estado de la run actual
- `p` → `runState.player` (abreviado en combatTick)
- `e` → `runState.enemy`
- `u` → `metaState.upgrades[key]`
- `tl` → `runState.talentLevels`
- `t(id)` → `tl[id] || 0` (nivel del talento, 0 = no elegido)
- `BALANCE` → mayúsculas sostenidas, objeto global

### Funciones principales

- `calcPlayerStats()` → calcula stats finales del jugador desde fuentes flat + % + talentos (NO modifica runState)
- `calcEnemyStats(floor, playerStats, isFirstBossAttempt)` → stats de enemigo con tier scaling + dynamic boss
- `calcDamage(atk, def, K=0.6)` → daño con DR relativa
- `startCombat()` → llama calcPlayerStats(), setea runState.player, genera enemigo, arranca loop
- `combatTick()` → tick de combate (100ms), ataque de jugador y enemigo, debuffs
- `showTalentChoice(floor)` → presenta 3 opciones (ofensivo, defensivo, estado/sustain) + heroico cada 20 pisos
- `selectTalent(id, level)` → asigna talento y cierra modal
- `enemyDefeated()` → XP, drop, talento cada 5 pisos, floor++
- `playerDied()` → cálculo de almas, guardado
- `render()` → actualiza TODO el DOM desde metaState + runState

---

## Sistema de talentos

Reemplaza el antiguo sistema de habilidades fijas. 37 talentos en 5 bloques, 3 niveles cada uno.

| Bloque | Cantidad | ¿Cuándo aparece? |
|--------|:--------:|------------------|
| ⚔️ Ofensivo | 10 | Siempre (1 opción) |
| 🛡️ Defensivo | 10 | Siempre (1 opción) |
| 💀 Estado | 7 | Combinado con Sustain (1 opción) |
| 💚 Sustain | 5 | Combinado con Estado (1 opción) |
| 👑 Heroico | 5 | Solo cada 20 pisos (opción extra) |

- Se eligen cada **5 pisos** (5, 10, 15, 20...)
- Opción heroica adicional en pisos **20, 40, 60...**
- Se puede subir un talento hasta nivel 3 eligiéndolo de nuevo
- Se resetean completamente al morir o reiniciar (`runState.talentLevels = {}`)

Ver `Talentos.md` para la referencia completa con valores por nivel.

---

## Sistema de equipo

### Slots y stats

| Slot | Stat primario | Stats secundarios posibles |
|------|--------------|---------------------------|
| Arma | ATK | CRIT, Lifesteal, PEN, CRIT DMG, Boss DMG |
| Armadura | DEF | HP, Dodge, HP REGEN |
| Anillo | HP/ATK/DEF/AGI | Cualquiera (incluye repetidos de primarios) |

### Rarezas

| Rareza | statMult | Stats totales | Maestría | Drop normal | Drop boss |
|--------|:--------:|:-------:|:--------:|:-----------:|:---------:|
| Poco común | 1.0 | 1 | ❌ | 70% | 0% |
| Raro | 1.5 | 2 | ✅ niv 1 | 25% | 65% |
| Épico | 2.0 | 3 | ✅ niv 2 | 5% | 30% |
| Legendario | 3.0 | 4 | ✅ niv 3 | 0% | 5% |

### Maestrías (pasivas de equipo)

| Slot | Maestría | Efecto |
|------|----------|--------|
| Arma | Crítica | +5/10/15 crit chance flat |
| Arma | Vampírica | +5/7.5/10 lifesteal flat |
| Arma | Furiosa | Cada 7/5/3 golpes, daño ×2 |
| Armadura | Bloqueo | +2.5/5/7.5 block flat |
| Armadura | Regenerativa | +5/10/15 HP planos cada 2s |
| Armadura | Resistente | Reduce 5/10/15% daño cada 5 golpes |
| Anillo | Evasiva | +2.5/5/7.5 dodge flat |
| Anillo | Perforante | +5/7.5/10 PEN flat |
| Anillo | Afortunada | 10/20/30% chance de duplicar almas |

---

## Stats derivados

Se calculan con diminishing returns: `DR(raw, cap, K) = cap × raw / (raw + K)`

| Stat | Fuente | Cap | K |
|------|--------|:---:|:---:|
| Crit chance | equipo(ratio 13) + Golpe Preciso + Trinidad → DR → + maestría + meta upgrade | 70% | 100 |
| Dodge | DR(agi + equipo/ratio5) + maestría + Reflejos Felinos + Trinidad | 40% | 80 |
| Block | DR(def + Trinidad + maestría) | 50% | 100 |
| PEN | equipo + maestría + Golpe Penetrante (%) | 50% | 100 |
| Crit DMG | equipo + 50% base | 600% | 200 |
| Boss DMG | equipo | 100% | 150 |
| Lifesteal | DR(equipo) + maestría (flat) + Asalto Vampírico (flat) | 25% | 80 |
| HP REGEN | equipo | ~15% | 150 |

---

## Sistema de debuffs (DoTs y estado)

Los debuffs se aplican al enemigo mediante talentos de estado. Viven en `runState.enemyDebuffs[]`.

| Talento | ID debuff | Tipo | Efecto |
|---------|-----------|------|--------|
| Hemorragia | `hemorragia` | `dot` | Sangrado: daño por tick, acumulable ×3 |
| Hoja Tóxica | `hoja_toxica` | `dot` | Veneno: DoT + reduce % DEF |
| Marca de Muerte | `marca_muerte` | `vulnerability` | +% daño recibido multiplicativo |
| Furia Ardiente | `quemadura` | `burn` | DoT de fuego 1s + chance de quemar: reduce ATK del enemigo |
| Desgaste | `desgaste` | `stat_drain` | Cada 3s pierde % ATK/DEF acumulativo |

Funciones:
- `clearDebuffs()` — limpia todos los debuffs (se llama al derrotar enemigo)
- `applyDebuff(def)` — agrega un debuff si no se excede `maxStack`
- `processDebuffs()` — procesa DoTs, vulnerabilidad, drenaje de stats (se llama cada tick)

---

## Persistencia (localStorage)

**Key**: `torre_infinita_save_v1`

**Qué se guarda**: almas, maxFloor, equipo, upgrades (solo level), bossAttempted[], bossStats{}, heroLevel, heroXp, heroBonuses.

**Qué NO se guarda**: talentos/talentLevels (se resetean cada run), debuffs activos, runState (excepto lo que persiste en metaState).

**Cuándo se guarda** (`saveGame()`, línea 834): al comprar mejora, al morir, al equipar, al capturar boss stats, al subir de nivel.

**resetGame()** (línea 888): borra todo (metaState + runState + localStorage).

---

## Bugs conocidos / Edge cases

1. **Display de crit al equipar**: `resolveEquipComparison()` llama `render()` ANTES de `startCombat()`, mostrando crit con equipo viejo por 1 frame. Se corrige en el render siguiente.
2. **Jefe P10 no tiene boss guardado**: `firstBoss` usa stats fijas, no se guarda en `bossStats` para evitar confusión con el sistema dinámico de P20+.
3. **Maestría Furiosa**: el contador se resetea solo al hacer el ataque que da el proc. No hay timeout del contador entre pisos.
4. **Piel de Piedra con escudo activo**: si el nuevo escudo es mayor, se reemplaza; si no, solo refresca la duración (3s).

---

## Skills del proyecto

Este proyecto usa **Gentle SDD** (Spec-Driven Development) para cambios estructurados:
- `/sdd-init` → inicializa contexto SDD
- `/sdd-new` → nueva propuesta de cambio
- `/sdd-ff` → fast-forward planning
- `/sdd-apply` → implementa tareas
- `/sdd-verify` → valida contra specs

Ver `AGENTS.md` del workspace o la skill registry para más detalles.

---

## Preguntas frecuentes para IA

**Q: ¿Dónde está la fórmula de daño?**
A: `calcDamage()` línea 1093. Es DR relativa: `def / (def + atk × 0.6)`.

**Q: ¿Dónde se define el crit chance total?**
A: Líneas ~1636-1661 (combate) y ~2468-2481 (display). Son la misma fórmula.

**Q: ¿Cómo se aplica el % de meta upgrades?**
A: `calcPlayerStats()` — el % es un multiplicador GLOBAL sobre todas las fuentes flat (base + run + equipo), se aplica al final de la suma. El upgrade de crit es excepción: se aplica flat **post-DR**, igual que la maestría.

**Q: ¿Dónde se guarda el progreso?**
A: `saveGame()` línea 834. Key: `torre_infinita_save_v1`.

**Q: ¿Cómo escalan los enemigos?**
A: Por tier (cada 10 pisos) + sub-escala dentro del tier. `calcEnemyStats()` línea 1203.

**Q: ¿Qué hace tryEquip cuando el item es mejor?**
A: Muestra el modal de comparación en lugar de equipar automáticamente. `tryEquip()` línea 1459.

**Q: ¿Cómo funciona el sistema de talentos actual?**
A: 37 talentos en 5 pools (ofensivo, defensivo, estado, sustain, heroico). Se eligen cada 5 pisos, 3 niveles cada uno. Ver `Talentos.md`.

**Q: ¿Qué diferencia hay entre talento y maestría?**
A: Los talentos son pasivas que se eligen durante la run cada 5 pisos. Las maestrías vienen del equipo (item.mastery) y persisten entre runs.
