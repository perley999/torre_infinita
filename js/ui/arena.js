// arena.js — visual combat arena (emoji sprites, lunge/hurt animations, lifecycle states).
(function() {
  'use strict';
  window.Game = window.Game || {};

        // ─── Arena ────────────────────────────────────────
        const ARENA_EMOJIS = {
            'Slime': '👾', 'Esqueleto': '💀', 'Murciélago': '🦇',
            'Goblin': '👹', 'Araña': '🕷️', 'Fantasma': '👻',
            'Orco': '👿', 'Troll': '🗿',
            'Guardián': '🛡️', 'Señor de la Torre': '👑', 'Dragón': '🐉',
            'Lich': '🧟', 'Titán': '🏔️', 'Demonio': '😈',
            'El Segador': '⚰️', 'El Devorador de Mundos': '🌍',
            'El Primigenio': '👁️', 'El Enterrador': '🪦',
        };
        function getArenaEmoji(name) { return ARENA_EMOJIS[name] || '👾'; }
        function updateArena() {
            const arena = document.getElementById('arena');
            if (!arena || arena.classList.contains('hidden') || !runState.active) return;
            const heroEl = document.getElementById('arena-hero');
            const enemyEl = document.getElementById('arena-enemy');
            if (!heroEl || !enemyEl) return;
            const arenaEmoji = metaState.playerClass ? (CLASS_CONFIG[metaState.playerClass]?.emoji || '🤺') : '🤺';
            heroEl.textContent = arenaEmoji;
            enemyEl.textContent = getArenaEmoji(runState.enemy?.name);
            if (runState.enemy?.isBoss) enemyEl.style.fontSize = '3.4rem';
            else enemyEl.style.fontSize = '';
            arena.className = 'arena ready';
        }
        function arenaLunge(side) {
            const arena = document.getElementById('arena');
            if (!arena || arena.classList.contains('hidden') || !runState.active) return;
            arena.classList.add(side === 'hero' ? 'hero-lunging' : 'enemy-lunging');
            setTimeout(() => arena.classList.remove('hero-lunging', 'enemy-lunging'), 300);
        }
        function arenaHurt(side) {
            const arena = document.getElementById('arena');
            if (!arena || arena.classList.contains('hidden') || !runState.active) return;
            arena.classList.add(side === 'hero' ? 'hero-hurt' : 'enemy-hurt');
            setTimeout(() => arena.classList.remove('hero-hurt', 'enemy-hurt'), 350);
        }
        function arenaEnemyDefeated() {
            const arena = document.getElementById('arena');
            if (!arena || arena.classList.contains('hidden')) return;
            arena.className = 'arena enemy-dead';
        }
        function arenaPlayerDied() {
            const arena = document.getElementById('arena');
            if (!arena || arena.classList.contains('hidden')) return;
            arena.className = 'arena hero-dead';
        }
        function arenaIdle() {
            const arena = document.getElementById('arena');
            if (!arena) return;
            arena.className = 'arena idle';
        }
        function toggleArena() {
            const arena = document.getElementById('arena');
            const btn = document.getElementById('arena-toggle');
            if (!arena || !btn) return;
            arena.classList.toggle('hidden');
            btn.classList.toggle('active');
            try { localStorage.setItem('torre_arena_hidden', arena.classList.contains('hidden') ? '1' : '0'); } catch(e) {}
        }

  Game.arena = { ARENA_EMOJIS, getArenaEmoji, updateArena, arenaLunge, arenaHurt, arenaEnemyDefeated, arenaPlayerDied, arenaIdle, toggleArena };
  window.ARENA_EMOJIS = ARENA_EMOJIS;
  window.getArenaEmoji = getArenaEmoji;
  window.updateArena = updateArena;
  window.arenaLunge = arenaLunge;
  window.arenaHurt = arenaHurt;
  window.arenaEnemyDefeated = arenaEnemyDefeated;
  window.arenaPlayerDied = arenaPlayerDied;
  window.arenaIdle = arenaIdle;
  window.toggleArena = toggleArena;
})();
