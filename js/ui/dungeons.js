// dungeons.js — dungeon selection + complete modals (presentation).
// Extracted from js/game/dungeons.js (F4c-3, separate-ui-logic refactor).
(function() {
  'use strict';
  window.Game = window.Game || {};

        function showDungeonSelection() {
            checkDungeonDailyReset();
            checkDungeonLegacyDailyReset();
            checkDungeonAncestralReset();
            const content = document.getElementById('dungeon-content');
            const d = BALANCE.dungeon.dailyAttempts;
            const totalRemaining = Math.max(0, d - metaState.dungeon.attemptsTodayAncestral)
                                 + Math.max(0, d - metaState.dungeon.attemptsToday)
                                 + Math.max(0, d - metaState.dungeon.attemptsTodayLegacy);

            // Helper: paid cost for extra attempts
            const paidCostAncestral = BALANCE.dungeon.soulCostBase * Math.pow(BALANCE.dungeon.soulCostMult, Math.max(0, metaState.dungeon.attemptsTodayAncestral - d));
            const paidCostRune = BALANCE.dungeon.soulCostBase * Math.pow(BALANCE.dungeon.soulCostMult, Math.max(0, metaState.dungeon.attemptsToday - d));

            function slotPaidInfo(remaining, cost) {
                return remaining <= 0 ? `<span class="slot-paid">🪙 Próximo: ${formatNum(cost)} 💀</span>` : '';
            }

            content.innerHTML = `
                <div class="dungeon-attempts">Intentos restantes: <span>${totalRemaining}</span> / ${d * 3}</div>
                <div class="dungeon-slot-grid">
                    ${metaState.unlockedReforge ? `
                    <div class="dungeon-slot" onclick="startTowerRun()">
                        <span class="slot-title">🏰 Cámara Ancestral</span>
                        <span class="slot-desc">Oleadas infinitas — Recompensa: equipo</span>
                        <span class="slot-status">${Math.max(0, d - metaState.dungeon.attemptsTodayAncestral)}/${d} intentos hoy</span>
                        ${slotPaidInfo(d - metaState.dungeon.attemptsTodayAncestral, paidCostAncestral)}
                    </div>
                    <div class="dungeon-slot" onclick="startRuneChamberRun()">
                        <span class="slot-title">🔮 Cámara Rúnica</span>
                        <span class="slot-desc">Oleadas infinitas — Recompensa: 🔮 Polvo de Runas</span>
                        <span class="slot-status">${Math.max(0, d - metaState.dungeon.attemptsToday)}/${d} intentos hoy</span>
                        ${slotPaidInfo(d - metaState.dungeon.attemptsToday, paidCostRune)}
                    </div>
                    <div class="dungeon-slot" onclick="startLegacyAbyssRun()">
                        <span class="slot-title">🌌 Abismo Eterno</span>
                        <span class="slot-desc">10 pisos — Recompensa: 🪶 Esencias de Legado</span>
                        <span class="slot-status">${Math.max(0, d - metaState.dungeon.attemptsTodayLegacy)}/${d} intentos hoy</span>
                    </div>
                    ` : `
                    <div class="dungeon-slot locked">
                        <span class="slot-title">🔒 Cámara Ancestral</span>
                        <span class="slot-desc">Alcanzá el piso 100 para desbloquear</span>
                    </div>
                    <div class="dungeon-slot locked">
                        <span class="slot-title">🔒 Cámara Rúnica</span>
                        <span class="slot-desc">Alcanzá el piso 100 para desbloquear</span>
                    </div>
                    <div class="dungeon-slot locked">
                        <span class="slot-title">🔒 Abismo Eterno</span>
                        <span class="slot-desc">Alcanzá el piso 100 para desbloquear</span>
                    </div>
                    `}
                </div>
            `;
            document.getElementById('dungeon-overlay').classList.add('visible');
        }

        function closeDungeonSelection() {
            document.getElementById('dungeon-overlay').classList.remove('visible');
        }

        function showDungeonComplete() {
            const diff = runState.dungeonDifficulty;
            const content = document.getElementById('dungeon-complete-content');
            const nextUnlocked = diff + 1;
            content.innerHTML = `
                <p style="text-align:center;color:#4ade80;font-size:1.1rem;font-weight:600;">
                    🎉 ¡Completaste la Mazmorra N${diff}!
                </p>
                <p style="text-align:center;color:#9ca3af;margin-top:8px;">
                    ${metaState.dungeon.unlockedLevels.includes(diff)
                        ? '✔️ Mazmorra completada nuevamente.'
                        : `🔓 Mazmorra N${nextUnlocked} desbloqueada.`}
                </p>
            `;
            document.getElementById('dungeon-complete-overlay').classList.add('visible');
        }

        function closeDungeonComplete() {
            document.getElementById('dungeon-complete-overlay').classList.remove('visible');
            runState.dungeonMode = false;
            runState.dungeonDifficulty = 0;
            render();
            updateButtons();
            showDungeonSelection();
        }

  // Expose public API
  Game.dungeons = {
    showDungeonSelection: showDungeonSelection,
    closeDungeonSelection: closeDungeonSelection,
    showDungeonComplete: showDungeonComplete,
    closeDungeonComplete: closeDungeonComplete
  };

  // Temporary window bridges for inline code that still references these directly
  window.showDungeonSelection = showDungeonSelection;
  window.closeDungeonSelection = closeDungeonSelection;
  window.showDungeonComplete = showDungeonComplete;
  window.closeDungeonComplete = closeDungeonComplete;
})();
