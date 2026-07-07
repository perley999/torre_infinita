# Torre Infinita — Resumen del Proyecto

## Estado actual
✅ Juego completo en un solo archivo `Torre_Infinita.html` — ~8.350 líneas  
✅ Versión: **0.8.0** — Cámara Rúnica + Cámara Ancestral + Tutorial Completo

## Decisiones de diseño

### Stack: Vanilla JS + HTML + CSS
- **Por qué**: El juego es 90% estado → render. No necesita routing, componentes anidados, ni gestión de formularios.
- **Patrón clave**: Estado central único + función `render()` que actualiza todo el DOM. Nunca tocar el DOM directamente fuera de render.
- **Excepciones**: `spawnFloat()`, `flashElement()`, y el sistema de debuffs (actualizan DOM directamente por rendimiento).

### Balance centralizado (objeto BALANCE)
- **Decisión**: Todos los números del juego viven en un solo objeto `BALANCE` al inicio del script.
- **Por qué**: Permite re-balancear cambiando un solo lugar sin buscar valores hardcodeados.
- **Estructura actual**:
  - `player` → stats base del héroe
  - `levelUp` → tiered stat gain cada 50 niveles
  - `metaUpgrades` → mejoras permanentes con almas (HP, ATK, DEF, AGI, almas/piso, crítico, bossDmg)
  - `enemy` → stats base, tier scaling, jefes dinámicos P20+
  - `equipment` → drop chances, rarezas, presupuesto logarítmico, maestrías
  - `combat` → fórmula de velocidad, DR, caps, debuffs
  - `souls` → fórmula de recompensa al morir
  - `essence` → esencias (reforja, maximize, reroll)
  - `enhance` → mejora de equipo (+10% por nivel, +1 a +10)
  - `heroArtifact` → árbol de legado del Prestigio (10 nodos)

### Equipamiento con budget logarítmico
- **Decisión**: El budget de stats por pieza usa `budgetBase × log2(floor + 1) × statMult(rareza)` en vez de lineal por piso.
- **Budget base**: 5.
- **Rarezas actuales**: Poco común (×1.0, 1 stat), Raro (×1.5, 2 stats + maestría Nv1), Épico (×2.0, 3 stats + maestría Nv2), Legendario (×3.0, 4 stats + maestría Nv3), Ancestral (×3.0, 4 stats + maestría Nv3 + enhance +15), Mítico (×4.0, 5 stats + maestría Nv4 fija + enhance +15).
- **Maestrías**: 3 por slot, cada una con 4 niveles (Nv4 exclusivo de Mítico).
- **Enhance**: +10% por nivel a TODAS las stats, máximo +10. Bonus stat en +5 y +10.
- **Reforja**: 3🩸 aleatorio, 8🩸 elegido. Reroll de bonus stat: 5🩸.

### Sistema de Esencias (🩸)
- Drop 50% en enemigos normales, 100% en jefes.
- Se usan para Reforjar maestrías, Maximizar equipo (enhance), y Rerolear bonus stat.
- Persisten entre runs.

### Sistema de Runas (🔮 — v0.8.0)
- Condiciones (8): Golpe Crítico, Bajo HP, Golpe Recibido, Enemigo con Debuff, Esquivar, Matar Enemigo, Usar Habilidad, Inicio de Combate.
- Efectos (8): Daño Extra, Escudo, Curación, Aceleración, Cadena de Rayo, Robo de Vida, Explosión de Sangre, Maldición.
- Se fabrican en la Forja con 🔮 Polvo de Runas (Cámara de las Runas) + 💀 Almas.
- Rarezas: S → SS → SSS. Mejora individual por componente.
- Se equipan en slots del personaje.

### Sistema de Prestigio (🪶 — v0.7.0)
- Renacer al piso 100: `🪶 = floor(sqrt(heroLevel) × max(maxFloor, 100) / 100)`.
- Árbol de Legado con 10 nodos: 4 de stats (+3%/nv) y 6 multiplicadores (+5%/nv).
- Abismo Eterno: dungeon de 10 pisos que da 🪶 adicionales.
- Esencias de Legado persisten entre renacimientos.

### Combate por velocidad (no turnos alternos)
- **Decisión**: Cada fighter tiene un timer que baja según su velocidad. Cuando llega a 0, ataca y se resetea.
- **Fórmula**: `attackInterval = max(750, 3000 - (agi × 100))`.
- **DR en stats**: crit (70/100), dodge (40/80), block (50/100), lifesteal (25/80), pen (50/100), critDmg (600/200), bossDmg (100/150).

### Escalado de enemigos (tier-based)
- **Decisión**: Enemigos escalan por tier (cada 10 pisos) + sub-escala dentro del tier.
- **Jefes**: Piso 10 con stats fijas. P20+ con escalado dinámico basado en stats del jugador.

### Cuatro monedas
- **💀 Almas**: moneda principal para mejoras permanentes.
- **🩸 Esencias**: moneda secundaria para mejora de equipo (reforja, enhance).
- **🔮 Polvo de Runas**: moneda del sistema de Runas (Cámara Rúnica).
- **🪶 Esencias de Legado**: moneda premium del sistema de Prestigio.

## Estado del juego actual

### Stats base del jugador
| Stat | Valor |
|------|-------|
| HP | 100 |
| ATK | 10 |
| DEF | 5 |
| AGI | 10 |

### Sistema de Clases (v0.5.0)
4 clases con stats por nivel de héroe, pasivas que escalan, y 3 especializaciones c/u (12 total):
- ⚔️ Guerrero (Fuerza) — tanque, daño por escudo, daño cada 5 golpes
- 🔮 Brujo (Sombras) — DoTs, alma, daño por debuff
- 🗡️ Pícaro (Agilidad) — crítico, combo, evasión
- 🧘 Monje (Equilibrio) — velocidad, curación, daño por velocidad

Ver `Clases.md` para detalle de las 12 especializaciones y sus pasivas.

### Sistema de Talentos (37 talentos)
5 bloques: Ofensivo (10), Defensivo (10), Estado (7), Sustain (5), Heroico (5).  
3 niveles cada uno. Se eligen cada 5 pisos (opción heroica adicional cada 20).

Ver `Talentos.md` para la referencia completa con valores por nivel.

### Mazmorras (v0.6.0+)
- **🏰 Cámara Ancestral**: oleadas infinitas — drops de equipo Ancestral y Mítico. Intentos diarios separados.
- **🔮 Cámara Rúnica** (v0.8.0): oleadas infinitas — recompensa 🔮 Polvo de Runas. Intentos diarios separados.
- **🌌 Abismo Eterno** (v0.7.0): 10 pisos — recompensa 🪶 Esencias de Legado. Escala con `maxFloor`. Intentos diarios separados.

Cada mazmorra tiene su propio pool de intentos, independiente de la Torre principal.

### Persistencia
- **localStorage** key: `torre_infinita_save_v1`
- dataVersion v5 con migraciones automáticas al cargar.

### Enemigos
- 8 nombres rotativos para enemigos normales.
- 6 nombres rotativos para jefes.
- Jefe P10 con stats fijas: HP 150, ATK 15, DEF 5.
- Jefes P20+ con escalado dinámico basado en stats del jugador (primer intento). Stats se guardan en `metaState.bossStats` para reuso en reintentos.

---

## Referencia técnica

Detalle de implementación, fórmulas y estructuras. Las decisiones de
alto nivel están arriba; esta sección es para implementación.

### Estructura de `BALANCE`

Objeto global con todos los números del juego. Editar un valor acá
recalcula todo lo que dependa de él.

```
BALANCE
├── player          → { hp: 100, atk: 10, def: 5, agi: 10 }
├── levelUp         → { xpBase, xpScale, maxLevel, abilityLevels[] }
├── metaUpgrades    → { hp, atk, def, agi, souls, crit, drop, ... }
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
├── essence
│   ├── dropChance  → 50% (normales)
│   ├── bossAlways  → 1 (jefes siempre dan 1)
│   ├── reforgeRandom → 3
│   ├── reforgeChoose → 8
│   └── rerollBonus   → 5
├── enhance
│   ├── maxLevel    → 10
│   ├── scale       → 1.5 (cost = floor(1.5^enhance))
│   └── multPerLevel → 0.1 (10% por nivel)
└── heroArtifact
    └── (Árbol de Legado del Prestigio — 10 nodos)
```

### Fórmulas

**Daño** (`calcDamage`):
```js
DR = def / (def + atk * K)     // K = 0.6
dmg = max(1, floor(atk * (1 - DR)))
```
La DEF siempre reduce un porcentaje, nunca anula el daño por completo.

**Velocidad de ataque** (`speedToInterval`):
```js
interval = max(750, 3000 - (agi * 100))
```

**Diminishing Returns** (genérica):
```js
DR(raw, cap, K) = cap * (raw / (raw + K))
```

**Crit chance** (combate y display son la misma fórmula):
```js
equipCritPct = (p.critRating || 0) / 13  // rating → % lineal
rawCrit      = derived.crit + equipCritPct + preciseBonus
totalCrit    = floor(DR(rawCrit, cap=70, K=100))
              + masteryCritFlat + critBonus + trinityFlat
```
- Equipment: ratio 13. +65 = 5%.
- Golpe Preciso: +10/15/20 flat pre-DR.
- Trinidad: +8/12/16 flat pre-DR.
- Meta upgrade crit: +2%/nivel, post-DR (flat).
- Maestría Crítica: +5/10/15 flat, post-DR.
- Base: 0%.

**Dodge / Evasión**:
```js
baseDodge     = floor(40 * agi / (agi + 80))        // DR desde AGI
equipDodgePct = (p.dodgeRating || 0) / 5            // rating → %
rawDodge      = baseDodge + equipDodgePct
totalDodge    = floor(DR(rawDodge, cap=40, K=80))
              + masteryFlatDodge + reflejosFelinos + trinityFlat
```
- Equipo pasa por DR una sola vez (no hay doble DR).
- Reflejos Felinos: +8/12/16 flat post-DR.
- Maestría Evasiva: +2.5/5/7.5 flat post-DR.

**Crit damage**:
```js
critMult = 1.5 + DR(critDamage, cap=600, K=200) / 100
dmg = floor(dmg * critMult)
```

**Ilvl del equipo** (`calcIlvl`):
```js
return atk*1.0 + def*1.0 + agi*1.0
     + hp*0.4 + crit*0.5 + lifesteal*0.5 + dodge*0.5
     + block*0.4 + critDamage*0.4 + hpRegen*0.4
     + bossDamage*0.3 + pen*0.3
     + maestria(nivel)*3
```
- Primarios (ATK/DEF/AGI): peso ×1.0.
- Secundarios premium (CRIT/Lifesteal/Dodge): peso ×0.5.
- Secundarios medios (HP/Block/Crit DMG/HP REGEN): peso ×0.4.
- Secundarios situacionales (Boss DMG/PEN): peso ×0.3.
- Maestría: +3 por nivel.

**Progresión de enemigos** (`calcEnemyStats`, tier-based):
```js
tier = floor((floor - 1) / 10)   // cada 10 pisos = 1 tier
sub  = ((floor - 1) % 10) + 1    // posición dentro del tier

stat = base * tierScale^tier * subScale^(sub-1)
```
Jefes P20+ con escalado dinámico: stats se calculan en función de las
stats del jugador en el primer intento y se guardan en
`metaState.bossStats` para reuso. Jefe P10 usa stats fijas.

**Almas al morir**:
```js
souls = floor(piso * baseMult + piso * upgrade_almas.level * upgrade_almas.flat)
```
- Se calculan una sola vez al morir (no se acumulan por enemigo).
- Maestría Afortunada (anillo): 10/20/30% chance de duplicar.
- Training mode: base solamente, 25% del valor, sin mejoras permanentes.

**Presupuesto de equipo**:
```js
budget = floor(budgetBase * log2(piso + 1) * statMult(rareza))
// budgetBase = 5
```

**Enhance multiplier** (`calcPlayerStats`):
```js
enhMult = 1 + (item.enhance || 0) * 0.1
// Cada nivel = +10% a TODAS las stats del item (multiplicativo)
// Bonus stat se suma DESPUÉS del multiplicador
```

**Costo de mejora** (`getMaximizeCost`):
```js
cost = Math.floor(1.5^enhance)  // 0→1: 1, 1→2: 1, 2→3: 2, 3→4: 3, ...
```

**Bonus stat** (`getRandomBonusStat`):
```js
bonus = floor(valorStatBase * enhMult * 0.25)  // +25% del valor con enhance
```
- Se otorga al alcanzar `enhance = 5` y `enhance = 10`.
- Se puede rerolear por 5🩸 (cambia a otro stat no-cero).

### Tabla de rarezas

| Rareza | statMult | Stats | Maestría | Drop normal | Drop boss |
|--------|:--------:|:-----:|:--------:|:-----------:|:---------:|
| Poco común | 1.0 | 1 (pri) | ❌ | 70% | 0% |
| Raro | 1.5 | 2 (pri+1sec) | ✅ niv 1 | 25% | 65% |
| Épico | 2.0 | 3 (pri+2sec) | ✅ niv 2 | 5% | 30% |
| Legendario | 3.0 | 4 (pri+3sec) | ✅ niv 3 | 0% | 5% |
| Ancestral | 3.0 | 5 (pri+4sec, ×1.1/×1.2) | ✅ niv 3 | — | rates Cámara Ancestral |
| Mítico | 4.0 | 5 (pri+4sec, ×1.1/×1.2) | ✅ niv 4 fija | — | rates Cámara Ancestral |

### Slots y stats

| Slot | Primario | Secundarios posibles |
|------|----------|---------------------|
| Arma | ATK | CRIT, Lifesteal, PEN, CRIT DMG, Boss DMG |
| Armadura | DEF | HP, Dodge, HP REGEN |
| Anillo | HP/ATK/DEF/AGI | Cualquiera (incluye repetidos de primarios) |

Maestrías por slot: ver `Maestrias.md`.

### Reforja y Maximizar

Sistema de mejora de equipo, se desbloquea al alcanzar el piso 100
(`metaState.unlockedReforge`). Moneda: 🩸 esencias.

**Reforjar (Reforging)** — reemplazar la maestría de un item equipado
(solo Raro+):

| Modo | Costo | Mecánica |
|------|:-----:|----------|
| Aleatorio | 3🩸 | Maestría al azar del pool del slot |
| Elegir | 8🩸 | Grilla de maestrías disponibles para elegir |

La maestría nueva hereda el nivel de la anterior (no se resetea a 1).

**Maximizar (Enhancing)** — subir `enhance` de +0 a +10:

```
costo = floor(1.5^enhance_actual)
```

| De | A | Costo |
|----|---|:-----:|
| +0 | +1 | 1🩸 |
| +1 | +2 | 1🩸 |
| +2 | +3 | 2🩸 |
| ... | ... | ... |
| +9 | +10 | 38🩸 |

Cada nivel otorga +10% a TODAS las stats del item (multiplicativo).

**Bonus stat** — al alcanzar `enhance = 5` y `enhance = 10`, el item
obtiene un stat bonus aleatorio de sus stats no-cero. El bonus es +25%
del valor base del stat (incluyendo el multiplicador de enhance). Se
muestra en azul (`#60a5fa`). Se puede rerolear por 5🩸.

### Diminishing Returns por stat

Cada stat pasa por DR con un cap y K específicos:

| Stat | Cap | K |
|------|:---:|:---:|
| Crit chance | 70% | 100 |
| Dodge | 40% | 80 |
| Block | 50% | 100 |
| PEN | 50% | 100 |
| Crit DMG | 600% | 200 |
| Boss DMG | 100% | 150 |
| Lifesteal | 25% | 80 |
| HP REGEN | ~15% | 150 |

### Sistema de debuffs

Los debuffs se aplican al enemigo mediante talentos de estado. Viven
en `runState.enemyDebuffs[]`. Funciones clave: `clearDebuffs()` (al
derrotar enemigo), `applyDebuff(def)` (respetando `maxStack`),
`processDebuffs()` (cada tick de combate).

| Talento | ID | Tipo | Efecto |
|---------|----|------|--------|
| Hemorragia | `hemorragia` | `dot` | Sangrado: daño por tick, acumulable ×3 |
| Hoja Tóxica | `hoja_toxica` | `dot` | Veneno: DoT + reduce % DEF |
| Marca de Muerte | `marca_muerte` | `vulnerability` | +% daño recibido multiplicativo |
| Furia Ardiente | `quemadura` | `burn` | DoT de fuego 1s + reduce ATK del enemigo |
| Desgaste | `desgaste` | `stat_drain` | Cada 3s pierde % ATK/DEF acumulativo |

### Persistencia detallada

**Key**: `torre_infinita_save_v1`

**Se guarda en `metaState` y persiste**:
almas, esencias, maxFloor, equipo (con `enhance` y `bonusStat`),
upgrades (solo level), `unlockedReforge`, `bossAttempted[]`,
`bossStats{}`, heroLevel, heroXp, heroBonuses, playerName,
leaderboard[].

**NO se guarda**: `talentLevels` (se resetea cada run), debuffs
activos, `runState` completo (excepto lo que persiste via metaState).

**Cuándo se guarda** (`saveGame()`): al comprar mejora, al morir, al
equipar, al capturar boss stats, al subir de nivel.

**`resetGame()`**: borra todo (`metaState` + `runState` + localStorage).

### Funciones principales (cheat sheet)

- `calcPlayerStats()` — stats finales del jugador desde fuentes flat +
  % + talentos. NO modifica `runState`.
- `calcEnemyStats(floor, playerStats, isFirstBossAttempt)` — stats de
  enemigo con tier scaling + dynamic boss.
- `calcDamage(atk, def, K=0.6)` — daño con DR relativa.
- `startCombat()` — llama `calcPlayerStats()`, setea `runState.player`,
  genera enemigo, arranca loop.
- `combatTick()` — tick de combate (100ms), ataque de jugador y
  enemigo, debuffs.
- `showTalentChoice(floor)` — presenta opciones de talento + heroico
  cada 20 pisos.
- `selectTalent(id, level)` — asigna talento y cierra modal.
- `enemyDefeated()` — XP, drop, talento cada 5 pisos, `floor++`.
- `playerDied()` — cálculo de almas, leaderboard entry, guardado.
- `render()` — actualiza TODO el DOM desde `metaState` + `runState`.
- `spendEssence(amount)` — descuenta esencias, `saveGame()`, `render()`.
  Retorna `false` si insuficiente.
- `showReforgeModal()` / `selectReforgeSlot(slot)` / `reforgeRandom()`
  / `reforgeChoose()` / `confirmReforge(id)` — flujo de reforja.
- `showMaximizeModal()` / `selectMaximizeSlot(slot)` / `maximizeItem()`
  / `rerollBonusStat()` — flujo de maximize.
- `getMaximizeCost(enhance)` — `Math.floor(1.5^enhance)`.
- `getRandomBonusStat(item)` — elige stat no-cero aleatorio, calcula
  bonus.
- `getAvailableMasteries(slot, currentId)` — filtra `MASTERIES[slot]`
  excluyendo la actual.
- `formatRunTime(ms)` — formatea ms a "Xm Ys" / "Xs".


## Pendientes / Ideas futuras
- [x] 🔒 Cámara Rúnica — tercer dungeon ✅
- [ ] Recompensas AFK / offline
- [ ] Segunda capa de Prestige (Transcender)
- [ ] Habilidades activas / Barra de Rage
- [ ] Mascotas / Compañeros
- [ ] Eventos temporales / Temporadas
- [ ] Torre del Caos (segundo modo)
- [ ] Reroll de stats (Psiónico)
- [ ] Daño flotante animado
- [ ] Logros que desbloquean buffs
- [ ] Eventos entre pisos (cofre, trampa, descanso)
- [ ] Animaciones de entrada/salida de pisos
- [ ] Sonidos básicos
- [ ] Spreadsheet/calculadora de balance

## Archivos generados
| Archivo | Propósito |
|---------|-----------|
| `Torre_Infinita.html` | Juego completo funcional |
| `Talentos.md` | Referencia de los 37 talentos |
| `Clases.md` | Referencia de clases y especializaciones |
| `Maestrias.md` | Referencia de maestrías de equipo |
| `Runas.md` | Documentación del sistema de Runas |
| `Prestigio.md` | Documentación del sistema de Prestigio |
| `PROMPT.md` | Prompt para replicar el MVP con otros modelos |
| `PROYECTO.md` | Este resumen |
| `README.md` | Documentación general |
| `CHANGELOG.md` | Historial de versiones |
| `AGENTS.md` | Contexto para IA |
