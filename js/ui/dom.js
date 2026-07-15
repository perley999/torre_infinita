// ui/dom.js — pure DOM helpers for the action bar and other UI bits.
// Created as part of F4b-4a cleanup to host `updateButtons` outside
// the inline HTML script. All other UI state mutations still go
// through `render()`.
(function() {
  'use strict';
  window.Game = window.Game || {};

        function updateButtons() {
            const start = document.getElementById('btn-start');
            const restart = document.getElementById('btn-restart');
            const training = document.getElementById('btn-training');
            const forge = document.getElementById('btn-forge');
            const dungeon = document.getElementById('btn-dungeon');
            const character = document.getElementById('btn-character');
            const rebirth = document.getElementById('btn-rebirth');

            if (runState.trainingMode) {
                // ── Training mode ──────────────────────────────
                start.style.display = 'none';
                restart.style.display = 'none';
                training.style.display = 'flex';
                training.textContent = '⏹️ Terminar';
                training.className = 'action-btn training';
                training.onclick = endTraining;
                training.disabled = false;
                forge.style.display = 'flex';
                forge.disabled = true;
                dungeon.style.display = 'none';
                character.disabled = true;
                rebirth.style.display = 'none';
            } else if (runState.active) {
                // ── Run active ─────────────────────────────────
                start.style.display = 'none';
                restart.style.display = 'flex';
                restart.disabled = false;
                training.style.display = 'flex';
                training.textContent = '🏋️ Training';
                training.className = 'action-btn training';
                training.onclick = showTrainingModal;
                training.disabled = true;
                forge.style.display = 'flex';
                forge.disabled = true;
                dungeon.style.display = 'none';
                character.disabled = true;
                rebirth.style.display = 'none';
            } else {
                // ── Idle — no run ──────────────────────────────
                start.style.display = 'flex';
                start.disabled = false;
                restart.style.display = 'none';
                training.style.display = 'flex';
                training.textContent = '🏋️ Training';
                training.className = 'action-btn training';
                training.onclick = showTrainingModal;
                training.disabled = !metaState.unlockedTraining;
                forge.style.display = 'flex';
                forge.disabled = !metaState.unlockedReforge;
                dungeon.style.display = metaState.unlockedReforge ? 'flex' : 'none';
                dungeon.disabled = !metaState.unlockedReforge;
                character.disabled = false;
                rebirth.style.display = (metaState.unlockedReforge && !metaState.hasRebirthed) ? 'flex' : 'none';
            }
        }

  Game.dom = { updateButtons: updateButtons };
  window.updateButtons = updateButtons;
})();
