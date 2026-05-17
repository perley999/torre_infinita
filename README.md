# Torre Infinita

Un idle RPG incremental donde tu héroe asciende por una torre infinita. Combate automático, jefes cada 10 pisos y mejoras permanentes con almas.

## Características

- **Combate automático por velocidad**: Cada fighter ataca según su agilidad, sin turnos.
- **Sistema de niveles**: Sube de nivel durante la run, elige mejoras flat o habilidades especiales.
- **Equipamiento**: Armas, armaduras y anillos con rarezas (Poco común → Legendario).
- **Meta-progresión**: Almas persistentes para mejoras permanentes que escalan con el juego.
- **Balance centralizado**: Todos los números del juego en un solo objeto `BALANCE` para iteración rápida.

## Cómo jugar

1. Abrí `index.html` en tu navegador.
2. Pulsá **Iniciar Run** para comenzar.
3. Tu héroe combate automáticamente. Si muere, ganás almas según el piso alcanzado.
4. Usá las almas para comprar mejoras permanentes.
5. Tras superar el piso 10, se desbloquea el sistema de equipamiento.

## Estructura

```
index.html      → Juego completo (HTML + CSS + JS vanilla)
PROYECTO.md     → Resumen de decisiones de diseño
PROMPT.md       → Prompt para replicar el MVP
README.md       → Este archivo
CHANGELOG.md    → Historial de versiones
```

## Stack

- Vanilla JS + HTML + CSS (sin build step, sin frameworks)
- localStorage para persistencia de tutorial
- Un solo archivo, responsive, max-width 480px

## Balance

Todos los valores del juego están centralizados en el objeto `BALANCE` al inicio del script. Para ajustar dificultad, stats o economía, solo modificá ese objeto.

## Licencia

Sin licencia formal. Usalo para lo que quieras.
