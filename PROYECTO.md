# Torre Infinita — Resumen del Proyecto

## Estado actual
✅ MVP funcional en un solo archivo `index.html`

## Decisiones de diseño

### Stack: Vanilla JS + HTML + CSS
- **Por qué**: El juego es 90% estado → render. No necesita routing, componentes anidados, ni gestión de formularios.
- **Patrón clave**: Estado central único + función `render()` que actualiza todo el DOM. Nunca tocar el DOM directamente fuera de render.
- **Cuándo cambiar**: Si agregamos inventario con drag&drop, múltiples pantallas, o animaciones complejas, vale la pena migrar a un framework.

### Balance centralizado (objeto BALANCE)
- **Decisión**: Todos los números del juego viven en un solo objeto `BALANCE` al inicio del script.
- **Por qué**: Permite re-balancear cambiando un solo lugar sin buscar valores hardcodeados. Inspirado en las prácticas de *Idle Idol* y GDC talks sobre idle games.
- **Estructura**:
  - `player` → stats base
  - `levelUp` → flat bonuses por nivel de run (se siente cada subida)
  - `metaUpgrades` → flat mínimo + percentual (escala con el juego)
  - `enemy` → stats base y escalas exponenciales
  - `equipment` → drop chances, rarezas, presupuesto
  - `combat` → fórmula de velocidad, tick rate, daño mínimo
  - `souls` → fórmula de recompensa

### Separación de responsabilidades de stats
- **Niveles de run** = flat (impacto inmediato, siempre se nota)
- **Meta progreso (almas)** = flat mínimo + percentual (early game se siente, late game escala)
- **Equipamiento** = flat + stats propios (ecosistema independiente)

### Combate por velocidad (no turnos alternos)
- **Decisión**: Cada fighter tiene un timer que baja según su velocidad. Cuando llega a 0, ataca y se resetea.
- **Fórmula**: `attackInterval = max(200, 2000 - (speed * 100))` (definida en `BALANCE.combat`)

### Escalado exponencial de enemigos
- **Decisión**: Enemigos normales ×1.10^piso (HP), ×1.08^piso (ATK)
- **Jefes**: Cada 10 pisos, stats base más altos (HP×2) y escaladores ligeramente diferentes
- **Por qué**: Los idle games necesitan números que crecen. Escalado lineal estanca el juego.

### Una sola moneda (almas)
- **Decisión**: Solo almas para meta-progresión. Sin fragmentos, sin lab parts, sin contracts.
- **Por qué**: Mantener foco en el MVP. Se pueden agregar más monedas después si el loop base es divertido.

### Modal tutorial
- **Decisión**: Overlay que aparece la primera vez (detectado con `localStorage`). Botón "?" siempre accesible.
- **Por qué**: No ocupa espacio permanente, no rompe el layout, siempre disponible.

## Estado del juego

### Stats base del jugador
| Stat | Valor |
|------|-------|
| HP | 100 |
| ATK | 10 |
| DEF | 5 |
| SPD | 10 |

### Niveles de run (flat por level up)
| Stat | Bonus por nivel |
|------|-----------------|
| HP | +8 |
| ATK | +2 |
| DEF | +2 |
| AGI | +2 |

### Mejoras permanentes (meta)
| Mejora | Efecto | Costo base | Escala | Cap |
|--------|--------|------------|--------|-----|
| HP | +3 flat + 5% HP | 10 almas | ×1.5 | ∞ |
| ATK | +2 flat + 5% ATK | 10 almas | ×1.5 | ∞ |
| DEF | +1 flat + 5% DEF | 15 almas | ×1.5 | ∞ |
| AGI | +2% AGI | 20 almas | ×1.6 | ∞ |
| Almas/piso | +1 alma/piso | 25 almas | ×1.7 | ∞ |
| Crítico | +2% Crítico | 30 almas | ×1.8 | 15 |
| Drop | +5% Drop | 40 almas | ×2.0 | 10 |

### Enemigos
- 8 nombres rotativos para enemigos normales
- 6 nombres rotativos para jefes
- Stats escalan exponencialmente por piso (ver `BALANCE.enemy`)
- Jefe piso 10: HP 100, ATK 15, DEF 5 (requiere ~4 intentos con mejoras)

## Pendientes / Ideas futuras
- [ ] Persistencia con localStorage (almas y mejoras se pierden al recargar)
- [ ] Sistema de equipo con rarezas (común, raro, épico, legendario)
- [ ] Daño flotante animado
- [ ] Idle real (auto-advance cuando no estás)
- [ ] Múltiples dungeons/torres con efectos diferentes
- [ ] Logros que desbloquean buffs
- [ ] Eventos simples entre pisos (cofre, trampa, descanso)
- [ ] Guardar mejor piso alcanzado (high score)
- [ ] Animaciones de entrada/salida de pisos
- [ ] Sonidos básicos
- [ ] Spreadsheet/calculadora de balance para iterar rápido

## Archivos generados
| Archivo | Propósito |
|---------|-----------|
| `index.html` | Juego completo funcional |
| `PROMPT.md` | Prompt para replicar el MVP con otros modelos |
| `PROYECTO.md` | Este resumen |
