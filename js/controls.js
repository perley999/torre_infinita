// controls.js — control-flow handlers (startRun, endTraining,
// restartRun, buyUpgrade). Extracted from inline HTML as part of
// F4a/F4b-4a cleanup. The implicit dependency on the `var combatLoop`
// leaked from combat-tick.js is now an explicit read via
// `window.combatLoop` (set in combat-tick.js).
(function() {
  'use strict';

        function startRun() {
            if (runState.active) return;
            arenaIdle();
            runState.active = true; runState.floor = 1;
            runState.trainingMode = false;
            runState.dungeonMode = false;
            runState.legacyAbyssMode = false;
            runState.dungeonDifficulty = 0;
            runState.trainingFloor = 30;
            runState.enemiesDefeated = 0;
            runState.level = metaState.heroLevel;
            runState.xp = metaState.heroXp;
            runState.xpToNext = BALANCE.levelUp.xpScale * (runState.level || 1);
            runState.runBonuses = { ...metaState.heroBonuses };
            // Añadir class bonuses si hay clase
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
            runState.classComboStacks = 0;
            runState.demonActive = false;
            runState.demonHitsLeft = 0;
            runState.abilities = []; // Talentos se resetean cada run
            runState.talentLevels = {}; // Progreso de talentos se resetea cada run
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
            runState.runeBuffs = [];
            runState.runeCooldowns = {};
            runState.runeConditionsTick = 0;
            if (runState.enemy && runState.enemy._runeQuebrantarOrigDef !== undefined) {
                runState.enemy.def = runState.enemy._runeQuebrantarOrigDef;
                delete runState.enemy._runeQuebrantarOrigDef;
            }
            metaState.hasRebirthed = false;
            runState.runStartTime = Date.now();
            runState.recap = initRecap();
            document.getElementById('combat-log').innerHTML = '';
            addLog('🗼 Nueva run iniciada', 'system');
            startCombat();
            // Si el jugador tiene nivel 50+ y no eligió clase, mostramos selección
            if (runState.level >= 50 && !metaState.playerClass && !runState.trainingMode) {
                showClassSelection();
                return;
            }
            // Si tiene clase pero no especialización y nivel >= 100, mostramos selección
            if (runState.level >= 100 && metaState.playerClass && !metaState.playerSpec && !runState.trainingMode) {
                showSpecSelection();
                return;
            }
            updateButtons();
        }

        function endTraining() {
            if (!runState.trainingMode) return;
            if (window.combatLoop) clearInterval(window.combatLoop);
            window.combatLoop = null;
            runState.active = false;

            const killed = runState.enemiesDefeated;
            if (killed > 0) {
                const soulsPerEnemy = Math.floor(runState.trainingFloor * BALANCE.souls.baseMult * 0.25);
                let totalSouls = soulsPerEnemy * killed;
                // Maestría Afortunada: chance de duplicar almas
                if (runState.masteryFortuneChance > 0 && Math.random() * 100 < runState.masteryFortuneChance) {
                    totalSouls = Math.floor(totalSouls * 2);
                    addLog('🍀 ¡Maestría Afortunada duplica las almas!', 'loot');
                }
                metaState.souls += totalSouls;
                addLog(`✅ Entrenamiento terminado. Enemigos derrotados: ${killed}. +${formatNum(totalSouls)} almas.`, 'victory');
            } else {
                addLog('✅ Entrenamiento terminado. No derrotaste ningún enemigo.', 'system');
            }

            runState.trainingMode = false;
            runState.enemiesDefeated = 0;
            render();
            saveGame();
            updateButtons();
        }

        function restartRun() {
            // Award accumulated rune powder before clearing state (manual dungeon exit)
            if (runState.runeChamberMode && (runState.runeAccumulatedPowder || 0) > 0) {
                metaState.runePowder += runState.runeAccumulatedPowder;
                addLog(`🔮 Cámara terminada. Ganaste ${runState.runeAccumulatedPowder} Polvo de Runas.`, 'loot');
                saveGame();
            }
            arenaIdle();
            if (window.combatLoop) clearInterval(window.combatLoop);
            runState.active = false; runState.floor = 1; runState.enemy = null;
            runState.trainingMode = false;
            runState.dungeonMode = false;
            runState.legacyAbyssMode = false;
            runState.dungeonDifficulty = 0;
            runState.trainingFloor = 30;
            runState.enemiesDefeated = 0;
            runState.furyCounter = 0;
            runState.toughCounter = 0;
            runState.abilities = []; // Talentos se resetean al reiniciar
            runState.talentLevels = {}; // Progreso de talentos se resetea al reiniciar
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
            runState.runeBuffs = [];
            runState.runeCooldowns = {};
            runState.runeConditionsTick = 0;
            runState.recap = initRecap();
            runState.level = 0;
            runState.xp = 0;
            runState.xpToNext = BALANCE.levelUp.xpBase;
            runState.runBonuses = { hp: 0, atk: 0, def: 0, agi: 0 };
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
            document.getElementById('combat-log').innerHTML = '';
            addLog('🔄 Run reiniciada', 'system');
            render(); updateButtons();
        }

        function buyUpgrade(key) {
            const u = metaState.upgrades[key];
            if (u.maxLevel && u.level >= u.maxLevel) return;
            const cost = getUpgradeCost(key);
            if (metaState.souls < cost) return;
            metaState.souls -= cost; metaState.upgrades[key].level++;
            addLog(`⬆️ Mejora: ${metaState.upgrades[key].label} (Nv ${metaState.upgrades[key].level})`, 'system');
            render();
            saveGame();
        }

  Game.controls = Game.controls || {};
  Game.controls.endTraining = endTraining;
  Game.controls.restartRun = restartRun;
  window.endTraining = endTraining;
  window.restartRun = restartRun;
  window.startRun = startRun;
  window.buyUpgrade = buyUpgrade;
})();
