## Exploration: Prestigio / Renacimiento — Árbol de Artefacto de Héroe

### Current State

**No prestige system exists today.** El progreso es lineal: subís pisos → ganás almas → comprás mejoras permanentes → subís más pisos. Después del piso 100 (forja + mazmorra desbloqueados), no hay una nueva capa meta.

**Sistemas existentes que interactuarían:**

| Sistema | Estado | Relevancia |
|---------|--------|------------|
| Mejoras Permanentes (`metaUpgrades`) | % multiplicativo global (5%/nivel HP/ATK/DEF, 2% AGI) | El árbol de artefacto sería otra capa % que se multiplica DESPUÉS |
| Equipo + Forja | Full: 3 slots, rarezas, enhance, maestrías, bonus stat | **Persiste** en rebirth, pero esencias (🩸) se resetean |
| Clases | 4 clases (nivel 50), especializaciones (nivel 100) | Persisten, pasivas requieren nivel 50+ |
| Talentos | 37 talentos, se eligen cada 5 pisos, reset al morir | No cambian con rebirth |
| Mazmorras | Torre de los Ancestros (piso 100+), daily attempts | "Abismo del Legado" ya está como placeholder 🔒 |
| Hero Level | Persiste entre runs, tiered bonuses cada 50 niveles | Se usa para calcular Legacy Essence |
| Esencias (🩸) | Drop 50% normal, 100% jefe. Usadas en forja | Decisión pendiente: ¿resetear? |

**Placeholder existente** — en `showDungeonSelection()` (línea 5196):
```html
<div class="dungeon-slot locked">
    <span class="slot-title">🔒 Abismo del Legado</span>
    <span class="slot-desc">Próximamente</span>
</div>
```

Esto confirma que el sistema de Legado siempre estuvo planeado.

### Affected Areas

- `Torre_Infinita.html` (~5917 líneas, 336KB) — todo el código está en un solo archivo
- **metaState** (línea 1284) — necesita: `heroArtifact: {}`, `legacyEssence: 0`, `rebirthCount: 0`, `totalRunTime: 0`
- **saveGame / loadGame** (líneas 1321/1357) — nuevos campos; `dataVersion` a v5 con migración
- **resetGame** (línea 1446) — reset selectivo (no todo se borra igual)
- **BALANCE** (línea 1148) — nuevas entradas: `artifactNodes[]`, `legacyEssence: { formula }`
- **calcPlayerStats** (línea 1936) — aplicar multiplicadores del árbol de artefacto como capa FINAL post-metaUpgrades
- **render** (línea 5323) — UI del árbol (modal overlay)
- **updateButtons** (línea 5580) — botón "🏛️ Renacer" en action bar
- **showDungeonSelection** (línea 5152) — desbloquear "Abismo del Legado"
- **playerDied** (línea 3909) — calcular Legacy Essence al morir
- **startRun** (línea 5030) — aplicar bonuses del árbol al iniciar run
- **Pantalla de personaje** (línea 4552) — posible lugar para mostrar bonuses pasivos

### Approaches

#### 1. Árbol lineal todo-comprable (RECOMENDADO)

Grilla simple de 10 nodos, cada uno con 5 niveles. Sin ramificaciones ni prerrequisitos más allá del conteo total de renacimientos o piso alcanzado.

| Aspecto | Detalle |
|---------|---------|
| UI | Modal overlay tipo reforge/leaderboard, grilla de 10 cards |
| Costos | `floor(5 * sqrt(level))` 🪶 por nivel — curva sqrt estándar |
| Nodos | Los 10 del diseño previo (Fuerza Ancestral, Coraza Ancestral, etc.) |
| Niveles | 5 por nodo, cada nivel +3% ~ +5% multiplicativo |

**Pros**: Más simple, fácil de balancear, funciona en 480px de ancho, intuitivo.
**Contras**: Menos profundidad estratégica.
**Esfuerzo**: ~250-350 líneas nuevas.

#### 2. Árbol ramificado con ramas exclusivas

Nodos con prerrequisitos, ramas que fuerzan decisiones, posiblemente ramas por clase.

**Pros**: Más estratégico, ramas específicas por clase posibles.
**Contras**: UI compleja en mobile, difícil de balancear, migración de save más compleja.
**Esfuerzo**: ~450-600 líneas.

#### 3. Decisión de reset de esencias (🩸)

| Opción | Qué pasa | Tradeoff |
|--------|----------|----------|
| Resetear todo | Almas + esencias + mejoras se reinician | Clásico, clean slate. Sacrificás forja post-rebirth. |
| Mantener esencias | Solo almas/mejoras se resetean | Menos doloroso, podés forjar post-rebirth. |
| **Resetear esencias pero mantener equipo** | El equipo físico persiste | Recomendado — las esencias son parte del sacrificio. |

### Recommendation

1. **Árbol lineal todo-comprable** con 10 nodos, 5 niveles cada uno
2. **Legacy Essence (🪶)** como moneda de prestigio, fórmula:
   ```
   legacyEssence = floor(sqrt(heroLevel) * max(floor, 100) / 100)
   ```
   La dungeon "Abismo del Legado" da pequeñas cantidades adicionales al completarse.
3. **Cada nodo** da bonus multiplicativo que se aplica en `calcPlayerStats()` como capa final sobre todo lo flat (después de metaUpgrades)
4. **Costos**: `floor(5 * sqrt(nivel_actual))` 🪶 por nivel (escala sqrt)
5. **Qué se resetee al renacer**:
   - ❌ Almas (💀) → 0
   - ❌ Esencias (🩸) → 0
   - ❌ Mejoras permanentes → nivel 0
   - ❌ Talentos → reset (obvio, mueren igual)
   - ✅ Equipo → persiste completo (con enhance, maestrías, bonus stat)
   - ✅ Clase + especialización → persisten
   - ✅ Hero Level + XP → persisten
   - ✅ maxFloor → persiste
   - ✅ Leaderboard entries → persisten
6. **Desbloqueo**: Piso 100 alcanzado (mismo gate que forja + mazmorra)

### Risks

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Balance**: % multiplicativo compuesto con metaUpgrades puede snowballear | Media | Aplicar artifact bonuses DESPUÉS de metaUpgrades en calcPlayerStats, con valores pequeños (3-5%/nivel, 5 niveles max = 15-25%) |
| **Migración de save**: saves v4 sin `heroArtifact` | Baja | dataVersion → v5, defaults: `heroArtifact: {}`, `legacyEssence: 0`, `rebirthCount: 0` |
| **Código**: 336KB + ~300-400 líneas más | Media | El archivo ya es grande, pero es mantenible con las secciones claras. |
| **Confusión de moneda**: Legacy Essence (🪶) vs Esencias (🩸) | Baja | Usar nombres y emojis distintos en UI |
| **Overpower post-rebirth**: la primera rebirth da muy poca Legacy Essence, pero después escala | Media | La curva sqrt naturalmente limita el farming excesivo. Monitorear en playtesting. |

### Ready for Proposal

**Yes.** El diseño de Engram #198 es sólido y el placeholder "Abismo del Legado" confirma que era un feature planeado. El approach de árbol lineal todo-comprable minimiza complejidad técnica y de UI.

Próximo paso recomendado: `sdd-propose` con el alcance completo de nodos, costos, y comportamiento de reset.
