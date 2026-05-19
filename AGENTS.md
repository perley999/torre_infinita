# Torre Infinita — AGENTS.md

Contexto completo para trabajar sobre este proyecto. Leer antes de modificar.

---

## Stack

- **Vanilla JS + HTML + CSS** en un solo archivo (`Torre_Infinita.html` ~1830 líneas)
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
| `metaState` | ✅ localStorage | Almas, equipo, mejoras, jefes intentados |
| `runState` | ❌ Solo en RAM | Run actual: piso, nivel, enemigo, player, bonuses, timers, **habilidades/talentos** |

### Ciclo de vida de una run

```
startRun() → startCombat() → combatTick (cada 100ms)
                                    ↓
                             enemyDefeated() → checkLevelUp()
                                                  ↓
                                          startCombat() (siguiente piso)
                             playerDied() → guarda almas
```

---

## Archivos del proyecto

| Archivo | Propósito |
|---------|-----------|
| `Torre_Infinita.html` | Juego completo (HTML + CSS + JS inline) |
| `README.md` | Docs generales para jugar |
| `PROYECTO.md` | Decisiones de diseño y resumen técnico |
| `PROMPT.md` | Prompt replicable para regenerar desde cero |
| `CHANGELOG.md` | Historial de versiones (0.1.0 → 0.2.2) |
| `BETA-GUIA.md` | Guía para testers |
| `AGENTS.md` | Este archivo — contexto para IA |
| `.gitignore` | Ignora analizador-progresion.html y BETA-GUIA.md |

---

## BALANCE — El objeto central

Todos los números del juego viven en `BALANCE` (línea 605). Cambiar un número aquí recalcula TODO.

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
│   ├── dropBaseChance → 30
│   ├── slots       → [weapon, armor, ring]
│   ├── statPools   → por slot (primarios y secundarios)
│   ├── budgetMult  → multiplicadores por tipo de stat
│   ├── rarities[]  → nombre, pesos, statMult
│   └── budgetBase  → 5
├── combat
│   ├── tickMs      → 100
│   ├── speedBase   → 3000ms
│   ├── speedPerAgi → 100ms
│   ├── speedMin    → 750ms
│   ├── minDamage   → 1
│   └── caps y K    → crit, dodge, block, lifesteal, pen, etc.
└── souls
    └── baseMult    → 2
```

---

## Fórmulas clave

### Daño (línea 894)
```js
calcDamage(atk, def, K = 0.6)
DR = def / (def + atk * K)
dmg = max(1, floor(atk * (1 - DR)))
```
La DEF siempre reduce un porcentaje, nunca anula el daño por completo.

### Velocidad de ataque (línea 885)
```js
intervalo = max(750, 3000 - (agi * 100))
```

### Crit chance (línea ~1238-1242)
```js
equipCritPct = p.critRating / 13          // rating del equipo → % lineal
baseCrit     = derived.crit + equipCritPct // base 0% + equipo
rawCrit      = baseCrit + (Precise ? +15 : 0)
totalCrit    = floor(DR(rawCrit, cap=70, K=100)) + masteryFlatCrit + metaUpgradeCrit
```
- **Equipment**: crit rating se convierte con ratio 13 (estilo WoW). +65 = 5%
- **Precise**: +15 flat pre-DR
- **Meta upgrade**: +2%/nivel, se aplica **post-DR** (flat)
- **Maestría**: +5/10/15 flat, se aplica **post-DR**
- **Base**: 0% (sin mejoras ni equipo, no hay crítico)

### Crit damage (línea 1304-1306)
```js
critMult = 1.5 + DR(critDamage, cap=600, K=200) / 100
dmg = floor(dmg * critMult)  — aplica DESPUÉS de DR
```

### Progresión de enemigos (tier-based, línea 979-1003)
```js
tier = floor((floor - 1) / 10)   // cada 10 pisos = 1 tier
sub = ((floor - 1) % 10) + 1     // posición dentro del tier

hp = base * tierScale^tier * subScale^(sub-1)
atk = base * tierScale^tier * subScale^(sub-1)
def = base * tierScale^tier * subScale^(sub-1)
```
Los jefes tienen escalado dinámico en el PRIMER intento (P20+): las stats del jefe se fijan en función de las stats del jugador y se guardan para reuso.

### Almas al morir (línea 1448)
```js
souls = floor(piso * 2 + piso * upgrade_almas.level * 1)
souls *= (1 + DR(soulBonus, cap=100, K=200) / 100)
```

### Diminishing Returns (línea 1007)
```js
DR(raw, cap, K) = cap * (raw / (raw + K))
```

### Presupuesto de equipo (línea 1033-1046)
```js
budget = 5 * log2(piso + 1) * statMult(rareza)
```


---

## Convenciones de código

### Secciones del JS (en orden)

```
1.  BALANCE (objeto central)
2.  Estado (metaState + runState)
2b. Persistencia (localStorage)
3.  Constantes (nombres, pools, maestrías)
4.  Cálculos (daño, stats, equipo, ilvl)
5.  Equipamiento (generación, tryEquip)
6.  Combate (startCombat, combatTick)
6b. Comparación de equipo (modales)
7.  Controles (startRun, restartRun, buyUpgrade)
8.  Render y UI
```

### Nombres

- `metaState` → progreso persistente (almas, equipo, mejoras)
- `runState` → estado de la run actual
- `p` → `runState.player` (abreviado en combatTick)
- `e` → `runState.enemy`
- `u` → `metaState.upgrades[key]`
- `BALANCE` → mayúsculas sostenidas, objeto global

### Funciones principales

- `calcPlayerStats()` → calcula stats finales del jugador desde fuentes flat + % (NO modifica runState)
- `startCombat()` → llama calcPlayerStats(), setea runState.player, genera enemigo, arranca loop
- `combatTick()` → tick de combate (100ms), ataque de jugador y enemigo
- `render()` → actualiza TODO el DOM desde metaState + runState
- `calcEnemyStats(floor, playerStats, isFirstBossAttempt)` → stats de enemigo con tier scaling + dynamic boss

---

## Sistema de equipo

### Slots y stats

| Slot | Stat primario | Stats secundarios posibles |
|------|--------------|---------------------------|
| Arma | ATK | CRIT, Lifesteal, PEN, CRIT DMG, Boss DMG |
| Armadura | DEF | HP, Dodge, HP REGEN, Thorns |
| Anillo | HP/ATK/DEF/AGI | Cualquiera (incluye repetidos de primarios) |

### Rarezas

| Rareza | statMult | # stats | Maestría |
|--------|----------|---------|----------|
| Poco común | 1.0 | 1 | ❌ |
| Raro | 1.5 | 1-2 | ❌ |
| Épico | 2.0 | 2 | ✅ |
| Legendario | 3.0 | 3 | ✅ |

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

## Habilidades (niveles 5, 10, 15, 20)

| Nivel | Habilidad | Efecto |
|-------|-----------|--------|
| 5 | Golpe Doble | 15% atacar 2 veces |
| 5 | Primer Golpe | +25% daño primer ataque |
| 5 | Sangrado | 10% aplicar 3 dmg/tick ×3 |
| 10 | Contraataque | 20% devolver 50% daño |
| 10 | Escudo Vital | +10% HP máx al entrar |
| 10 | Golpe Preciso | Aumenta la prob. de golpe crítico (+15 flat pre-DR) |
| 15 | Golpe Brutal | 10% daño ×3 |
| 15 | Ejecución | Daño ×2 si enemigo <20% HP |
| 15 | Frenesí Pasivo | +20% velocidad ataque |
| 20 | Frenesí | 10% atacar 3 veces |
| 20 | Dominio | +15% todos los stats |
| 20 | Imparable | -25% daño recibido, +30% velocidad |

---

## Stats derivados

Se calculan con diminishing returns: `DR(raw, cap, K) = cap × raw / (raw + K)`

| Stat | Fuente | Cap | K |
|------|--------|:---:|:---:|
| Crit chance | equipo(ratio 13) + Precise → DR → + maestría + meta upgrade | 70% | 100 |
| Dodge | DR(agi) | 40% | 80 |
| Block | DR(def) | 50% | 100 |
| PEN | equipo + maestría | 50% | 100 |
| Crit DMG | equipo + 50% base | 600% | 200 |
| Boss DMG | equipo | 100% | 150 |
| Thorns | equipo | 100% | 150 |
| Lifesteal | equipo + maestría | 25% | 80 |
| HP REGEN | equipo | ~15% | 150 |
| Soul Bonus | equipo | 100% | 200 |

---

## Persistencia (localStorage)

**Key**: `torre_infinita_save_v1`

**Qué se guarda**: almas, maxFloor, equipo, upgrades (solo level), bossAttempted[], bossStats{}.

**Qué NO se guarda**: habilidades/talentos (se resetean cada run, viven en `runState.abilities`).

**Cuándo se guarda**: al comprar mejora, al morir, al equipar, al capturar boss stats.

**resetGame()**: borra todo (metaState + runState + localStorage).

---

## Bugs conocidos / Edge cases

1. **NaN% en stats antes de iniciar run**: `runState.player` no incluye `critRating`, `dodgeMult`, etc. hasta que se llama `startCombat()`. `render()` en página cargada muestra `NaN%` para crit/dodge/lifesteal porque `p.critRating` es `undefined`.
2. **Display de crit al equipar**: `resolveEquipComparison()` llama `render()` ANTES de `startCombat()`, mostrando crit con equipo viejo por 1 frame. Se corrige en el render siguiente.
3. **Jefe P10 no tiene boss guardado**: `firstBoss` usa stats fijas, no se guarda en `bossStats` para evitar confusión con el sistema dinámico de P20+.
4. **Maestría Furiosa**: el contador se resetea solo al hacer el ataque que da el proc. No hay timeout del contador entre pisos.

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
A: `calcDamage()` línea 894. Es DR relativa: `def / (def + atk × 0.6)`.

**Q: ¿Dónde se define el crit chance total?**
A: Líneas ~1238-1242 (combate) y ~1654-1658 (display). Son la misma fórmula.

**Q: ¿Cómo se aplica el % de meta upgrades?**
A: `calcPlayerStats()` línea ~913 — el % es un multiplicador GLOBAL sobre todas las fuentes flat (base + run + equipo), se aplica al final de la suma. El upgrade de crit es excepción: se aplica flat **post-DR**, igual que la maestría.

**Q: ¿Dónde se guarda el progreso?**
A: `saveGame()` línea 739. Key: `torre_infinita_save_v1`.

**Q: ¿Cómo escalan los enemigos?**
A: Por tier (cada 10 pisos) + sub-escala dentro del tier. Línea 979.

**Q: ¿Qué hace tryEquip cuando el item es mejor?**
A: Muestra el modal de comparación en lugar de equipar automáticamente. Línea 1095.
