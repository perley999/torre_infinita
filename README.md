# Torre Infinita

Un idle RPG incremental donde tu héroe asciende por una torre infinita. Combate automático, jefes cada 10 pisos, clases, talentos, equipo y un sistema de Prestigio completo.

## Características

- **Combate automático por velocidad**: Cada fighter ataca según su agilidad, con diminishing returns en todas las stats.
- **37 Talentos**: 5 bloques (Ofensivo, Defensivo, Estado, Sustain, Heroico), 3 niveles cada uno. Se eligen cada 5 pisos.
- **Sistema de Clases**: 4 clases (Guerrero, Brujo, Pícaro, Monje) con 12 especializaciones y pasivas escalables.
- **Equipamiento**: Armas, armaduras y anillos con 6 rarezas (Poco común → Mítico), maestrías, enhance y bonus stats.
- **Mazmorras**: Cámara Ancestral (drops exclusivos), Cámara Rúnica (🔮 polvo de runas) y Abismo Eterno (🪶 esencias de legado).
- **Prestigio**: Renacer al piso 100 para obtener 🪶 Esencias de Legado e invertir en el Árbol de Legado.
- **Meta-progresión**: 💀 Almas para mejoras permanentes, 🩸 Esencias para mejora de equipo, 🔮 Polvo de Runas para runas, 🪶 Esencias de Legado para el árbol de Prestigio.
- **Balance centralizado**: Todos los números del juego en un solo objeto `BALANCE`.

## Cómo jugar

1. Abrí `Torre_Infinita.html` en tu navegador.
2. Pulsá **Iniciar Run** para comenzar.
3. Tu héroe combate automáticamente. Si muere, ganás almas según el piso alcanzado.
4. Usá las almas para comprar mejoras permanentes.
5. Al piso 10 se desbloquea el equipamiento, al 30 el training, al 100 la forja y el renacer.

## Archivos del proyecto

| Archivo | Propósito |
|---------|-----------|
| `Torre_Infinita.html` | Juego completo (HTML + CSS + JS vanilla) |
| `Talentos.md` | Referencia de los 37 talentos |
| `Clases.md` | Referencia de clases y especializaciones |
| `Maestrias.md` | Referencia de maestrías de equipo |
| `Runas.md` | Documentación del sistema de Runas |
| `Prestigio.md` | Documentación del sistema de Prestigio |
| `PROYECTO.md` | Decisiones de diseño y resumen técnico |
| `CHANGELOG.md` | Historial de versiones |
| `AGENTS.md` | Contexto para IA |

## Stack

- Vanilla JS + HTML + CSS (sin build step, sin frameworks)
- localStorage para persistencia de juego
- Un solo archivo, responsive, max-width 480px, tema oscuro

## Licencia

Sin licencia formal. Usalo para lo que quieras.
