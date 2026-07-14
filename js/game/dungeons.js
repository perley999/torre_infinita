// dungeons.js — dungeon system: selection, daily reset, run initialization, wave/enemy logic.
// Consolidated from 4 sections in Torre_Infinita.html (F3 game logic).
(function() {
  'use strict';
  window.Game = window.Game || {};

// ============================================
        // DUNGEON FUNCTIONS
        // ============================================

        function checkDungeonDailyReset() {
            const today = new Date().toISOString().split('T')[0];
            if (metaState.dungeon.lastAttemptDate !== today) {
                metaState.dungeon.attemptsToday = 0;
                metaState.dungeon.attemptsTodayLegacy = 0;
                metaState.dungeon.attemptsTodayAncestral = 0;
                metaState.dungeon.lastAttemptDate = today;
                metaState.dungeon.completedToday = false;
                saveGame();
            }
        }

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

        function startDungeonRun(difficulty) {
            if (runState.active) return;
            checkDungeonDailyReset();

            // Check attempts
            if (metaState.dungeon.attemptsToday >= BALANCE.dungeon.dailyAttempts) {
                // Paid attempt
                const paidCost = BALANCE.dungeon.soulCostBase * Math.pow(BALANCE.dungeon.soulCostMult, metaState.dungeon.attemptsToday - BALANCE.dungeon.dailyAttempts);
                if (metaState.souls < paidCost) {
                    addLog(`❌ No tenés suficientes almas para la mazmorra (${paidCost} 💀)`, 'system');
                    return;
                }
                metaState.souls -= paidCost;
                addLog(`🪙 Pagaste ${paidCost} 💀 por un intento extra.`, 'system');
            }

            metaState.dungeon.attemptsToday++;
            metaState.dungeon.currentDifficulty = difficulty;
            metaState.dungeon.currentFloor = 0;
            saveGame();
            closeDungeonSelection();

            // Setup run state
            arenaIdle();
            runState.active = true;
            runState.floor = 1;
            runState.dungeonMode = true;
            runState.dungeonDifficulty = difficulty;
            runState.trainingMode = false;
            runState.enemiesDefeated = 0;
            runState.level = metaState.heroLevel;
            runState.xp = metaState.heroXp;
            runState.xpToNext = BALANCE.levelUp.xpScale * (runState.level || 1);
            runState.runBonuses = { ...metaState.heroBonuses };
            if (metaState.playerClass) {
                const cb = calcularClassBonuses(runState.level, metaState.playerClass);
                runState.runBonuses.hp += cb.hp;
                runState.runBonuses.atk += cb.atk;
                runState.runBonuses.def += cb.def;
                runState.runBonuses.agi += cb.agi;
            }
            runState.characterScreenActive = false;
            runState.classHits = 0;
            runState.firstHitDone = false;
            runState.nextHitMult = 1;
            runState.dodgeStreak = 0;
            runState.attackCounter = 0;
            runState.demonHits = 0;
            runState.demonActive = false;
            runState.demonHitsLeft = 0;
            runState.classComboStacks = 0;
            runState.abilities = [];
            runState.talentLevels = {};
            runState.hasRevived = false;
            runState.furiaStacks = 0;
            runState.critMasteryCounter = 0;
            runState.runeTapCounter = 0;
            runState.reflejoBonus = 0;
            runState.spellShieldCounter = 0;
            runState.segundoAlientoUsed = false;
            runState.bossesKilledThisRun = 0;
            runState.enemyDebuffs = [];
            runState.vitalShield = 0;
            runState.shieldMax = 0;
            runState.piedraShield = { amount: 0, ticksLeft: 0 };
            metaState.hasRebirthed = false;
            runState.runStartTime = Date.now();
            runState.recap = initRecap();
            document.getElementById('combat-log').innerHTML = '';
            addLog(`🏰 Mazmorra N${difficulty} iniciada.`, 'system');
            startCombat();
            updateButtons();
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

// ============================================
        // 7d. ABISMO ETERNO
        // ============================================

        function checkDungeonLegacyDailyReset() {
            const today = new Date().toISOString().split('T')[0];
            if (metaState.dungeon.lastAttemptDate !== today) {
                metaState.dungeon.attemptsTodayLegacy = 0;
                metaState.dungeon.lastAttemptDate = today;
                saveGame();
            }
        }

        // ============================================
        // 7e. CÁMARA ANCESTRAL
        // ============================================

        function checkDungeonAncestralReset() {
            const today = new Date().toISOString().split('T')[0];
            if (metaState.dungeon.lastAttemptDate !== today) {
                metaState.dungeon.attemptsTodayAncestral = 0;
                metaState.dungeon.lastAttemptDate = today;
                saveGame();
            }
        }

        function startLegacyAbyssRun() {
            if (runState.active) return;
            checkDungeonLegacyDailyReset();

            // Hardcap: 3 attempts per day, no paid extras
            if (metaState.dungeon.attemptsTodayLegacy >= BALANCE.dungeon.dailyAttempts) {
                addLog('❌ Ya usaste todos los intentos del Abismo Eterno hoy. ¡Volvé mañana!', 'system');
                return;
            }

            metaState.dungeon.attemptsTodayLegacy++;
            metaState.dungeon.currentDifficulty = 0;
            metaState.dungeon.currentFloor = 0;
            saveGame();
            closeDungeonSelection();

            // Setup run state for Legacy Abyss
            arenaIdle();
            runState.active = true;
            runState.floor = 1;
            runState.dungeonMode = true;
            runState.legacyAbyssMode = true;
            runState.dungeonDifficulty = 0;
            runState.trainingMode = false;
            runState.enemiesDefeated = 0;
            runState.level = metaState.heroLevel;
            runState.xp = metaState.heroXp;
            runState.xpToNext = BALANCE.levelUp.xpScale * (runState.level || 1);
            runState.runBonuses = { ...metaState.heroBonuses };
            if (metaState.playerClass) {
                const cb = calcularClassBonuses(runState.level, metaState.playerClass);
                runState.runBonuses.hp += cb.hp;
                runState.runBonuses.atk += cb.atk;
                runState.runBonuses.def += cb.def;
                runState.runBonuses.agi += cb.agi;
            }
            runState.characterScreenActive = false;
            runState.classHits = 0;
            runState.firstHitDone = false;
            runState.nextHitMult = 1;
            runState.dodgeStreak = 0;
            runState.attackCounter = 0;
            runState.demonHits = 0;
            runState.demonActive = false;
            runState.demonHitsLeft = 0;
            runState.classComboStacks = 0;
            runState.abilities = [];
            runState.talentLevels = {};
            runState.hasRevived = false;
            runState.furiaStacks = 0;
            runState.critMasteryCounter = 0;
            runState.runeTapCounter = 0;
            runState.reflejoBonus = 0;
            runState.spellShieldCounter = 0;
            runState.segundoAlientoUsed = false;
            runState.bossesKilledThisRun = 0;
            runState.enemyDebuffs = [];
            runState.vitalShield = 0;
            runState.shieldMax = 0;
            runState.piedraShield = { amount: 0, ticksLeft: 0 };
            runState.runStartTime = Date.now();
            runState.recap = initRecap();
            document.getElementById('combat-log').innerHTML = '';
            addLog(`🌌 Abismo Eterno iniciado.`, 'system');
            startCombat();
            updateButtons();
        }

        // ════════════════════════════════════════════════
        // CÁMARA RÚNICA
        // ════════════════════════════════════════════════

        function startRuneChamberRun() {
            if (runState.active) return;
            checkDungeonDailyReset();

            // Same attempt pool as regular dungeons
            if (metaState.dungeon.attemptsToday >= BALANCE.dungeon.dailyAttempts) {
                const paidCost = BALANCE.dungeon.soulCostBase * Math.pow(BALANCE.dungeon.soulCostMult, metaState.dungeon.attemptsToday - BALANCE.dungeon.dailyAttempts);
                if (metaState.souls < paidCost) {
                    addLog(`❌ No tenés suficientes almas para la Cámara (${paidCost} 💀)`, 'system');
                    return;
                }
                metaState.souls -= paidCost;
                addLog(`🪙 Pagaste ${paidCost} 💀 por un intento extra.`, 'system');
            }

            metaState.dungeon.attemptsToday++;
            metaState.dungeon.currentDifficulty = 0;
            metaState.dungeon.currentFloor = 0;
            saveGame();
            closeDungeonSelection();

            // Setup run state for Rune Chamber
            arenaIdle();
            runState.runeBuffs = [];
            runState.runeCooldowns = {};
            runState.runeConditionsTick = 0;
            runState.active = true;
            runState.floor = 1;
            runState.dungeonMode = true;
            runState.runeChamberMode = true;
            runState.legacyAbyssMode = false;
            runState.dungeonDifficulty = 0;
            runState.trainingMode = false;
            runState.enemiesDefeated = 0;
            runState.level = metaState.heroLevel;
            runState.xp = metaState.heroXp;
            runState.xpToNext = BALANCE.levelUp.xpScale * (runState.level || 1);
            runState.runBonuses = { ...metaState.heroBonuses };
            if (metaState.playerClass) {
                const cb = calcularClassBonuses(runState.level, metaState.playerClass);
                runState.runBonuses.hp += cb.hp;
                runState.runBonuses.atk += cb.atk;
                runState.runBonuses.def += cb.def;
                runState.runBonuses.agi += cb.agi;
            }
            runState.characterScreenActive = false;
            runState.classHits = 0;
            runState.firstHitDone = false;
            runState.nextHitMult = 1;
            runState.dodgeStreak = 0;
            runState.attackCounter = 0;
            runState.demonHits = 0;
            runState.demonActive = false;
            runState.demonHitsLeft = 0;
            runState.classComboStacks = 0;
            runState.abilities = [];
            runState.talentLevels = {};
            runState.hasRevived = false;
            runState.furiaStacks = 0;
            runState.critMasteryCounter = 0;
            runState.runeTapCounter = 0;
            runState.reflejoBonus = 0;
            runState.spellShieldCounter = 0;
            runState.segundoAlientoUsed = false;
            runState.bossesKilledThisRun = 0;
            runState.enemyDebuffs = [];
            runState.vitalShield = 0;
            runState.shieldMax = 0;
            runState.piedraShield = { amount: 0, ticksLeft: 0 };
            runState.runeWave = 1;
            runState.runeAccumulatedPowder = 0;
            runState.runeChamberBosses = 0;
            runState.runStartTime = Date.now();
            runState.recap = initRecap();
            document.getElementById('combat-log').innerHTML = '';
            addLog(`🔮 Cámara Rúnica iniciada.`, 'system');
            startCombat();
            updateButtons();
        }

        // ============================================
        // CÁMARA ANCESTRAL (Wave-based)
        // ============================================
        function startTowerRun() {
            if (runState.active) return;
            checkDungeonAncestralReset();

            // Separate attempt pool
            if (metaState.dungeon.attemptsTodayAncestral >= BALANCE.dungeon.dailyAttempts) {
                const paidCost = BALANCE.dungeon.soulCostBase * Math.pow(BALANCE.dungeon.soulCostMult, metaState.dungeon.attemptsTodayAncestral - BALANCE.dungeon.dailyAttempts);
                if (metaState.souls < paidCost) {
                    addLog(`❌ No tenés suficientes almas para la Cámara Ancestral (${paidCost} 💀)`, 'system');
                    return;
                }
                metaState.souls -= paidCost;
                addLog(`🪙 Pagaste ${paidCost} 💀 por un intento extra.`, 'system');
            }

            metaState.dungeon.attemptsTodayAncestral++;
            metaState.dungeon.currentDifficulty = 0;
            metaState.dungeon.currentFloor = 0;
            saveGame();
            closeDungeonSelection();

            // Setup run state
            arenaIdle();
            runState.active = true;
            runState.floor = 1;
            runState.dungeonMode = true;
            runState.towerMode = true;
            runState.runeChamberMode = false;
            runState.legacyAbyssMode = false;
            runState.dungeonDifficulty = 0;
            runState.trainingMode = false;
            runState.enemiesDefeated = 0;
            runState.level = metaState.heroLevel;
            runState.xp = metaState.heroXp;
            runState.xpToNext = BALANCE.levelUp.xpScale * (runState.level || 1);
            runState.runBonuses = { ...metaState.heroBonuses };
            if (metaState.playerClass) {
                const cb = calcularClassBonuses(runState.level, metaState.playerClass);
                runState.runBonuses.hp += cb.hp;
                runState.runBonuses.atk += cb.atk;
                runState.runBonuses.def += cb.def;
                runState.runBonuses.agi += cb.agi;
            }
            runState.characterScreenActive = false;
            runState.classHits = 0;
            runState.firstHitDone = false;
            runState.nextHitMult = 1;
            runState.dodgeStreak = 0;
            runState.attackCounter = 0;
            runState.demonHits = 0;
            runState.demonActive = false;
            runState.demonHitsLeft = 0;
            runState.classComboStacks = 0;
            runState.abilities = [];
            runState.talentLevels = {};
            runState.hasRevived = false;
            runState.furiaStacks = 0;
            runState.critMasteryCounter = 0;
            runState.runeTapCounter = 0;
            runState.reflejoBonus = 0;
            runState.spellShieldCounter = 0;
            runState.segundoAlientoUsed = false;
            runState.bossesKilledThisRun = 0;
            runState.enemyDebuffs = [];
            runState.vitalShield = 0;
            runState.shieldMax = 0;
            runState.piedraShield = { amount: 0, ticksLeft: 0 };
            runState.towerWave = 1;
            runState.towerEnemy = 1;
            runState.runStartTime = Date.now();
            runState.recap = initRecap();
            document.getElementById('combat-log').innerHTML = '';
            addLog(`🏰 Cámara Ancestral iniciada.`, 'system');
            startCombat();
            updateButtons();
        }

        function calcRuneChamberEnemyStats(waveNumber, playerStats) {
            // Scale enemy based on player power + wave progression
            // Wave 1: ~50% of player stats
            // Wave 10: ~100% of player stats
            // Wave 50: ~300% of player stats
            // Boss every 10 waves: 1.5x stats
            const isBoss = waveNumber % 10 === 0;
            const waveMult = 0.5 + (waveNumber - 1) * 0.05; // 0.5 at wave 1, 1.0 at wave 11, 2.5 at wave 41
            const bossMult = isBoss ? 1.5 : 1.0;
            const mult = waveMult * bossMult;

            return {
                hp: Math.max(50, Math.floor(playerStats.maxHp * mult * (isBoss ? 2.0 : 1.0))),
                atk: Math.max(5, Math.floor(playerStats.atk * mult)),
                def: Math.max(1, Math.floor(playerStats.def * mult)),
                agi: Math.max(5, Math.floor(playerStats.agi * Math.max(0.8, mult))),
                isBoss: isBoss,
                maxHp: Math.max(50, Math.floor(playerStats.maxHp * mult * (isBoss ? 2.0 : 1.0))),
            };
        }

        function awardRunePowder(wave, bosses) {
            // 1🔮 cada 3 oleadas, +1🔮 cada 5, +2🔮 bono jefe
            let powder = Math.floor(wave / 3) + Math.floor(wave / 5) + bosses * 2;
            return Math.max(0, powder);
        }

  Game.dungeons = {
    checkDungeonDailyReset: checkDungeonDailyReset,
    showDungeonSelection: showDungeonSelection,
    closeDungeonSelection: closeDungeonSelection,
    startDungeonRun: startDungeonRun,
    showDungeonComplete: showDungeonComplete,
    closeDungeonComplete: closeDungeonComplete,
    checkDungeonLegacyDailyReset: checkDungeonLegacyDailyReset,
    startLegacyAbyssRun: startLegacyAbyssRun,
    checkDungeonAncestralReset: checkDungeonAncestralReset,
    startRuneChamberRun: startRuneChamberRun,
    startTowerRun: startTowerRun,
    calcRuneChamberEnemyStats: calcRuneChamberEnemyStats,
    awardRunePowder: awardRunePowder
  };

  window.checkDungeonDailyReset = checkDungeonDailyReset;
  window.showDungeonSelection = showDungeonSelection;
  window.closeDungeonSelection = closeDungeonSelection;
  window.startDungeonRun = startDungeonRun;
  window.showDungeonComplete = showDungeonComplete;
  window.closeDungeonComplete = closeDungeonComplete;
  window.checkDungeonLegacyDailyReset = checkDungeonLegacyDailyReset;
  window.startLegacyAbyssRun = startLegacyAbyssRun;
  window.checkDungeonAncestralReset = checkDungeonAncestralReset;
  window.startRuneChamberRun = startRuneChamberRun;
  window.startTowerRun = startTowerRun;
  window.calcRuneChamberEnemyStats = calcRuneChamberEnemyStats;
  window.awardRunePowder = awardRunePowder;
})();
