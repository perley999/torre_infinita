# Prestigio — Torre Infinita

> Sistema de renacimiento que permite resetear el progreso a cambio de 🪶 Esencias de Legado, las cuales se invierten en el Árbol de Artefacto para obtener bonificaciones permanentes.

---

## ¿Cómo funciona el Renacer?

Al alcanzar el **Piso 100** (desbloquea la Forja), se desbloquea también el sistema de **Renacer**. Desde el menú, el jugador puede "renacer" para reiniciar su run, pero conservando ciertos progresos.

### Fórmula de Esencias de Legado

Al confirmar el Renacer, las 🪶 Esencias de Legado se calculan **antes** de cualquier reset:

```
🪶 = floor(sqrt(nivelHéroe) × max(pisoMaxAlcanzado, 100) / 100)
```

- **nivelHéroe**: nivel del héroe al momento de renacer
- **pisoMaxAlcanzado**: mejor piso histórico (`metaState.maxFloor`)
- **Mínimo**: 100 pisos (incluso si el jugador murió antes)

### ¿Qué se conserva?

| Se conserva | Se pierde |
|-------------|-----------|
| 🗡️ Equipo completo | 💀 Almas |
| 🏛️ Clase elegida | 🩸 Esencias normales |
| 🪶 Esencias de Legado | ⬆️ Mejoras permanentes (todas a nivel 0) |
| 🌳 Árbol de Artefacto | 👤 Nivel de héroe (vuelve a 0) |
| 📊 Mejor piso histórico | 📖 Especialización |
| 🏆 Leaderboard | 🏛️ Bonificaciones de clase |

---

## 🪶 Esencias de Legado

Moneda premium del sistema de Prestigio. Se obtienen de dos fuentes:

| Fuente | Cantidad | Condiciones |
|--------|----------|-------------|
| **Renacer** | `floor(sqrt(hl) × max(mf, 100) / 100)` | Solo al renacer, se multiplican por Ciclo del Legado |
| **Abismo del Legado** | `floor(sqrt(nivelHéroe) × numPiso / 5)` | Dungeon de 10 pisos, piso 10 = ×2 |

### Abismo del Legado

- Dungeon independiente con 10 pisos
- Mini-boss en piso 5, boss en piso 10
- **3 intentos gratuitos por día** (se pueden comprar más con almas)
- Las 🪶 del Abismo **NO** se multiplican por Ciclo del Legado

---

## 🌳 Árbol de Artefacto

Los nodos del artefacto se compran con 🪶 Esencias de Legado. Cada nodo tiene múltiples niveles y el costo crece con la fórmula:

```
costo = floor(5 × sqrt(nivelSiguiente))
```

### Nodos del Árbol

#### ⚔️ Estadísticas Ancestrales (×3% por nivel)

| Nodo | Efecto | Descripción |
|------|--------|-------------|
| ⚔️ **Fuerza Ancestral** | +3% ATK por nivel | Aumenta el daño base del héroe |
| 🛡️ **Coraza Ancestral** | +3% DEF por nivel | Aumenta la defensa base del héroe |
| ❤️ **Vitalidad Ancestral** | +3% HP por nivel | Aumenta los puntos de vida base |
| 🏃 **Pasos Ancestrales** | +3% AGI por nivel | Aumenta la agilidad (velocidad de ataque + evasion) |

#### 📈 Multiplicadores Globales (×5% por nivel)

| Nodo | Efecto | Descripción |
|------|--------|-------------|
| 💍 **Herencia del Equipo** | +5% a TODAS las stats | Multiplicador global sobre HP, ATK, DEF y AGI (incluye equipo). Se aplica como capa multiplicativa encima de todo lo demás |
| 💥 **Talento Innato** | +5% daño de DoTs y efectos | Aumenta el daño de sangrados, venenos, quemaduras, y todos los efectos derivados de talentos |
| 📖 **Sabiduría Eterna** | +5% XP ganada | Multiplica toda la experiencia obtenida durante la run |
| 🍀 **Fortuna del Héroe** | +5% chance de drop | Aumenta la probabilidad de obtener equipo de los enemigos |
| 🪶 **Ciclo del Legado** | +5% esencias de legado al Renacer | Multiplica las 🪶 obtenidas al renacer (NO afecta las del Abismo) |
| 💀 **Voluntad del Héroe** | +5% almas obtenidas | Multiplica todas las almas ganadas en la run |

### Orden de aplicación de los multiplicadores

Los bonus del árbol se aplican en `calcPlayerStats()` en este orden:

1. **Stat Ancestrales** (Fuerza/Coraza/Vitalidad/Pasos) — multiplican stats individuales
2. **Herencia del Equipo** — multiplicador global ×5% sobre todas las stats
3. **Talento Innato** — multiplica daño de DoTs y efectos de talentos
4. **Sabiduría Eterna** — multiplica XP
5. **Fortuna del Héroe** — multiplica drops
6. **Ciclo del Legado** — multiplica esencias de legado al renacer
7. **Voluntad del Héroe** — multiplica almas

---

## Ejemplo de progreso

Un jugador con 5 niveles en cada nodo del árbol tendría:

| Nodo | Bonus total |
|------|-------------|
| Fuerza Ancestral | +15% ATK |
| Coraza Ancestral | +15% DEF |
| Vitalidad Ancestral | +15% HP |
| Pasos Ancestrales | +15% AGI |
| Herencia del Equipo | +25% todas las stats |
| Talento Innato | +25% daño DoTs |
| Sabiduría Eterna | +25% XP |
| Fortuna del Héroe | +25% drops |
| Ciclo del Legado | +25% 🪶 al renacer |
| Voluntad del Héroe | +25% almas |

---

## Persistencia

- **Se guarda**: `metaState.heroArtifact` ({ nodes, legacyEssence, rebirthCount })
- **Key**: `torre_infinita_save_v1`
- **Migración**: saves v4 sin `heroArtifact` se migran con defaults: `heroArtifact: { nodes: {}, legacyEssence: 0, rebirthCount: 0 }`
