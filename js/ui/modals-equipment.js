// modals-equipment.js — equipment modals: equip comparison, forja, reforge mastery, maximize.
// Extracted from inline Torre_Infinita.html as part of F4b-2 of the separate-ui-logic refactor.
// All these handlers must stay reachable from the global scope because the HTML body
// uses `onclick="showXxx()"` attributes that evaluate identifiers against the global
// lexical environment. We mirror every function to `window.<name>` at the bottom.
//
// Cross-module dependencies (all resolved at call time via globals):
//   - `metaState`, `runState`, `BALANCE`, `MASTERIES`, `addLog`, `formatNum`,
//     `saveGame`, `render`, `spendEssence`, `checkLevelUp`, `startCombat`,
//     `showDungeonSelection`, `showDungeonComplete`, `showTalentChoice`,
//     `calcIlvl` are looked up on the global object.
//
// `buildEquipPanelHTML` is also referenced from `render()` (line ~1011, which calls
// `renderCharacterScreen()` → `buildEquipPanelHTML`) and from `js/game/classes.js`.
// Both call sites resolve through the global lookup once this module loads.
(function() {
  'use strict';
  window.Game = window.Game || {};

        // ============================================
        // 6c. COMPARACIÓN DE EQUIPO
        // ============================================
        let pendingEquipOldItem = null;
        let pendingEquipNewItem = null;

        function buildEquipPanelHTML(item, useBaseIlvl = false) {
            const rarityClass = `rarity-${item.rarity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;
            const percentStats = ['crit', 'dodge', 'lifesteal', 'pen', 'critDamage', 'bossDamage', 'hpRegen'];
            const statLabels = {
                crit: 'CRIT', dodge: 'EVA', lifesteal: 'Lifesteal',
                pen: 'PEN', critDamage: 'CRIT DMG', bossDamage: 'VS BOSS',
                hpRegen: 'HP REGEN',
            };
            const icons = {
                hp: '❤️', atk: '⚔️', def: '🛡️', agi: '🏃',
                crit: '🎯', dodge: '💨', lifesteal: '🧛',
                pen: '💥', critDamage: '💢', bossDamage: '👑',
                hpRegen: '💚',
            };

            const enhanceBadge = (item.enhance || 0) > 0 ? `<span class="enhance-badge">+${item.enhance}</span>` : '';
            const nameHTML = `<div class="equip-name ${rarityClass}">${item.name}${enhanceBadge}</div>`;
            const rarityHTML = `<div class="equip-stats">${item.rarity} &nbsp;|&nbsp; ilvl ${formatNum(Math.floor(calcIlvl(item, useBaseIlvl)))}</div>`;

            const statLines = Object.entries(item.stats)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => {
                    const label = percentStats.includes(k) ? statLabels[k] : k.toUpperCase();
                    // En comparación base (useBaseIlvl=true): mostrar valor crudo, sin bonus ni azul
                    if (useBaseIlvl) {
                        return `<span class="equip-stat-line">${icons[k] || ''} +${formatNum(v)} ${label}</span>`;
                    }
                    const isBonus = item.bonusStat && item.bonusStat.stat === k;
                    const displayVal = isBonus ? v + item.bonusStat.bonus : v;
                    const cls = isBonus ? 'equip-stat-line has-bonus' : 'equip-stat-line';
                    return `<span class="${cls}">${icons[k] || ''} +${formatNum(displayVal)} ${label}</span>`;
                }).join('');

            const masteryStars = item.mastery ? '⭐'.repeat(item.mastery.level) : '';
            const masteryLine = item.mastery ? `<span class="mastery-line">${masteryStars} ${item.mastery.label}</span>` : '';

            return nameHTML + rarityHTML + statLines + masteryLine;
        }

        function showEquipComparison(oldItem, newItem) {
            pendingEquipOldItem = oldItem;
            pendingEquipNewItem = newItem;

            document.getElementById('equip-compare-old').innerHTML
                = `<div class="equip-compare-header" style="color:#c084fc;font-weight:700;text-align:center;font-size:0.85rem;margin-bottom:6px;">🗡️ Actual</div>`
                + buildEquipPanelHTML(oldItem, true); // useBaseIlvl=true for fair comparison

            document.getElementById('equip-compare-new').innerHTML
                = `<div class="equip-compare-header" style="color:#4ade80;font-weight:700;text-align:center;font-size:0.85rem;margin-bottom:6px;">✨ Nuevo</div>`
                + buildEquipPanelHTML(newItem);

            document.getElementById('equip-compare-overlay').classList.add('visible');
        }

        function resolveEquipComparison(equipNew) {
            document.getElementById('equip-compare-overlay').classList.remove('visible');

            if (equipNew) {
                metaState.equipment[pendingEquipNewItem.slot] = pendingEquipNewItem;
                addLog(`✨ ¡Equipo mejorado! ${pendingEquipNewItem.name}`, 'loot');
            } else {
                addLog(`ℹ️ Te quedaste con tu ${pendingEquipOldItem.name}.`, 'system');
            }
            render();
            saveGame();

            pendingEquipOldItem = null;
            pendingEquipNewItem = null;

            // Training mode: no floor up, no talents, just increment counter
            if (runState.trainingMode) {
                runState.enemiesDefeated++;
                runState.furiaStacks = 0;
                checkLevelUp();
                return;
            }

            // Dungeon mode: continue the dungeon flow
            if (runState.dungeonMode) {
                // Tower mode: continue the wave instead of advancing floor
                if (runState.towerMode) {
                    const enemyPos = runState.towerEnemy || 1;
                    if (enemyPos >= 10) {
                        runState.towerWave = (runState.towerWave || 1) + 1;
                        runState.towerEnemy = 1;
                        addLog(`✅ ¡Oleada ${runState.towerWave - 1} completada!`, 'victory');
                    } else {
                        runState.towerEnemy = enemyPos + 1;
                    }
                    runState.furiaStacks = 0;
                    checkLevelUp();
                    setTimeout(() => {
                        if (!runState.active) return;
                        startCombat();
                    }, 500);
                    return;
                }
                if (runState.floor >= 10) {
                    // Boss was defeated and item comparison done - complete dungeon
                    if (runState.legacyAbyssMode) {
                        addLog('🌌 ¡Abismo Eterno completado!', 'victory');
                        runState.active = false;
                        runState.legacyAbyssMode = false;
                        saveGame();
                        render();
                        showDungeonSelection();
                        return;
                    }
                    addLog('🎉 ¡Mazmorra completada!', 'victory');
                    runState.active = false;
                    const diff = runState.dungeonDifficulty;
                    if (!metaState.dungeon.unlockedLevels.includes(diff)) {
                        metaState.dungeon.unlockedLevels.push(diff);
                    }
                    metaState.dungeon.completedToday = true;
                    saveGame();
                    render();
                    showDungeonComplete();
                    return;
                }
                // Next floor
                runState.floor++;
                runState.furiaStacks = 0;
                checkLevelUp();
                return;
            }

            // Continuar la run (floor++ y checkLevelUp se difirieron)
            const prevFloor = runState.floor;
            runState.floor++;
            runState.furiaStacks = 0;

            // Talento basado en piso (el piso ANTES de incrementar era múltiplo de 5)
            if (prevFloor % 5 === 0) {
                showTalentChoice(prevFloor);
                return;
            }

            checkLevelUp();
        }

        // ─── Forja Modal ─────────────────────────────────
        function showForjaModal() {
            if (!metaState.unlockedReforge) return;
            document.getElementById('forja-overlay').classList.add('visible');
        }

        function closeForjaModal() {
            document.getElementById('forja-overlay').classList.remove('visible');
        }

        // ============================================
        // 7b. RUNAS — MODAL Y ACCIONES UI — moved to js/game/runes.js
        // ============================================
        // ============================================
        // 7c. REFORJA Y MAXIMIZAR
        // ============================================

        // ─── Helpers ──────────────────────────────────
        function getAvailableMasteries(slot, currentId) {
            return (MASTERIES[slot] || []).filter(m => m.id !== currentId);
        }

        function getMaximizeCost(enhanceLevel) {
            return Math.floor(Math.pow(1.5, enhanceLevel));
        }

        function getRandomBonusStat(item) {
            const eligible = Object.entries(item.stats)
                .filter(([, v]) => v > 0)
                .map(([k]) => k);
            if (eligible.length === 0) return null;
            const stat = eligible[Math.floor(Math.random() * eligible.length)];
            const baseVal = item.stats[stat] || 0;
            const enhMult = 1 + (item.enhance || 0) * 0.1;
            const bonus = Math.floor(baseVal * enhMult * 0.25);
            return { stat, bonus };
        }

        // ─── Reforging ────────────────────────────────
        let _reforgeSelectedSlot = null;
        let _reforgeStep = null; // 'slot' | 'mode' | 'choose'

        function showReforgeModal() {
            if (!metaState.unlockedReforge) return;
            _reforgeSelectedSlot = null;
            _reforgeStep = 'slot';
            const content = document.getElementById('reforge-content');
            const slots = ['weapon', 'armor', 'ring'];
            const labels = { weapon: '🗡️ Arma', armor: '🛡️ Armadura', ring: '💍 Anillo' };
            content.innerHTML = `
                <p style="text-align:center;color:#9ca3af;">Seleccioná un slot con maestría para reforjar.</p>
                <div class="reforge-slot-grid">
                    ${slots.map(slot => {
                        const item = metaState.equipment[slot];
                        const hasMastery = item && item.mastery;
                        const disabled = !hasMastery;
                        return `<button class="reforge-slot-btn" ${disabled ? 'disabled' : ''} onclick="selectReforgeSlot('${slot}')">
                            <span class="slot-icon">${labels[slot].split(' ')[0]}</span>
                            <span class="slot-name">${labels[slot].split(' ')[1]}</span>
                            <span class="slot-item">${item ? item.name + ' (' + item.rarity + ')' : 'Vacío'}</span>
                            ${hasMastery ? `<span class="slot-mastery">${'⭐'.repeat(item.mastery.level)} ${item.mastery.label}</span>` : `<span class="no-mastery">Sin maestría</span>`}
                        </button>`;
                    }).join('')}
                </div>`;
            const overlay = document.getElementById('reforge-overlay');
            overlay.classList.add('visible');
        }

        function selectReforgeSlot(slot) {
            const item = metaState.equipment[slot];
            if (!item || !item.mastery) {
                addLog('❌ Solo objetos Raro+ pueden ser reforjados', 'system');
                return;
            }
            // Mythic: mastery is fixed
            if (item.rarity === 'Mítico') {
                const content = document.getElementById('reforge-content');
                content.innerHTML = `
                    <div style="text-align:center;padding:16px;">
                        <div style="font-size:2rem;margin-bottom:8px;">❌</div>
                        <p style="color:#ef4444;font-weight:600;">Maestría fija</p>
                        <p style="color:#9ca3af;font-size:0.85rem;">Los objetos Míticos tienen una maestría imposible de cambiar.</p>
                    </div>
                    <button class="modal-close" onclick="showReforgeModal()" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Volver a slots</button>
                `;
                return;
            }
            _reforgeSelectedSlot = slot;
            _reforgeStep = 'mode';
            const content = document.getElementById('reforge-content');
            const stars = '⭐'.repeat(item.mastery.level);
            content.innerHTML = `
                <div class="reforge-current-mastery">${stars} ${item.mastery.label} (Nv.${item.mastery.level})</div>
                <p style="text-align:center;color:#9ca3af;font-size:0.85rem;">${item.name} — ${item.rarity}</p>
                <div style="display:flex;gap:8px;margin:16px 0;">
                    <button class="choice-btn" onclick="reforgeRandom()" style="flex:1;text-align:center;">
                        <span class="title">🎲 Reforjar aleatorio</span>
                        <span class="desc">3🩸 — Maestría al azar</span>
                    </button>
                    <button class="choice-btn" onclick="reforgeChoose()" style="flex:1;text-align:center;">
                        <span class="title">🎯 Elegir maestría</span>
                        <span class="desc">8🩸 — Seleccionás cuál</span>
                    </button>
                </div>
                <button class="modal-close" onclick="showReforgeModal()" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Volver a slots</button>
            `;
        }

        function reforgeRandom() {
            const slot = _reforgeSelectedSlot;
            const item = metaState.equipment[slot];
            if (!item || !item.mastery) return;
            if (item.rarity === 'Mítico') {
                addLog('❌ No se puede reforejar la maestría de un objeto Mítico', 'system');
                return;
            }
            if (!spendEssence(3)) {
                addLog('❌ No tenés suficientes esencias (3🩸)', 'system');
                return;
            }
            const available = getAvailableMasteries(slot, item.mastery.id);
            if (available.length === 0) {
                addLog('❌ No hay otras maestrías disponibles para este slot', 'system');
                return;
            }
            const picked = available[Math.floor(Math.random() * available.length)];
            item.mastery.id = picked.id;
            item.mastery.label = picked.label;
            addLog(`🎲 Reforjaste ${item.name}: ahora tiene ${picked.label} (Nv.${item.mastery.level})`, 'loot');
            saveGame();
            render();
            closeReforgeModal();
        }

        function reforgeChoose() {
            const slot = _reforgeSelectedSlot;
            const item = metaState.equipment[slot];
            if (!item || !item.mastery) return;
            if (metaState.essence < 8) {
                addLog('❌ No tenés suficientes esencias (8🩸)', 'system');
                return;
            }
            _reforgeStep = 'choose';
            const content = document.getElementById('reforge-content');
            const available = getAvailableMasteries(slot, item.mastery.id);
            content.innerHTML = `
                <p style="text-align:center;color:#9ca3af;font-size:0.85rem;">Elegí una maestría para ${item.name}:</p>
                <div class="mastery-grid">
                    ${available.map(m => `
                        <button class="mastery-btn" onclick="confirmReforge('${m.id}')">
                            <span class="mastery-name">${m.label}</span>
                            <span class="mastery-desc" style="font-size:0.7rem;color:#9ca3af;">${m.desc}</span>
                            <span class="mastery-cost">8🩸</span>
                        </button>
                    `).join('')}
                </div>
                <button class="modal-close" onclick="showReforgeModal()" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Volver a slots</button>
            `;
        }

        function confirmReforge(masteryId) {
            if (!spendEssence(8)) return;
            const slot = _reforgeSelectedSlot;
            const item = metaState.equipment[slot];
            if (!item || !item.mastery) return;
            const masteryDef = MASTERIES[slot].find(m => m.id === masteryId);
            if (!masteryDef) return;
            item.mastery.id = masteryDef.id;
            item.mastery.label = masteryDef.label;
            addLog(`🎯 Reforjaste ${item.name}: ahora tiene ${masteryDef.label} (Nv.${item.mastery.level})`, 'loot');
            saveGame();
            render();
            closeReforgeModal();
        }

        function closeReforgeModal() {
            document.getElementById('reforge-overlay').classList.remove('visible');
            _reforgeSelectedSlot = null;
            _reforgeStep = null;
        }

        // ─── Maximizing ───────────────────────────────
        let _enhanceSelectedSlot = null;

        function showMaximizeModal() {
            if (!metaState.unlockedReforge) return;
            _enhanceSelectedSlot = null;
            const content = document.getElementById('enhance-content');
            const slots = ['weapon', 'armor', 'ring'];
            const labels = { weapon: '🗡️ Arma', armor: '🛡️ Armadura', ring: '💍 Anillo' };
            content.innerHTML = `
                <p style="text-align:center;color:#9ca3af;">Seleccioná un slot para mejorar.</p>
                <div class="reforge-slot-grid">
                    ${slots.map(slot => {
                        const item = metaState.equipment[slot];
                        const disabled = !item;
                        return `<button class="reforge-slot-btn" ${disabled ? 'disabled' : ''} onclick="selectMaximizeSlot('${slot}')">
                            <span class="slot-icon">${labels[slot].split(' ')[0]}</span>
                            <span class="slot-name">${labels[slot].split(' ')[1]}</span>
                            <span class="slot-item">${item ? item.name + ' (' + item.rarity + ')' : 'Vacío'}</span>
                            ${item ? `<span style="font-size:0.75rem;color:#3b82f6;">+${item.enhance || 0}</span>` : ''}
                        </button>`;
                    }).join('')}
                </div>`;
            const overlay = document.getElementById('enhance-overlay');
            overlay.classList.add('visible');
        }

        function getEnhanceCap(rarity) {
            if (rarity === 'Ancestral' || rarity === 'Mítico') return 15;
            return 10;
        }

        function selectMaximizeSlot(slot) {
            const item = metaState.equipment[slot];
            if (!item) return;
            _enhanceSelectedSlot = slot;
            const content = document.getElementById('enhance-content');
            const enhance = item.enhance || 0;
            const maxEnhance = getEnhanceCap(item.rarity);
            const isMax = enhance >= maxEnhance;
            const cost = isMax ? 0 : getMaximizeCost(enhance);
            const stars = item.mastery ? '⭐'.repeat(item.mastery.level) : '';

            // Build stats HTML with enhance multiplier
            const s = item.stats;
            const enhMult = 1 + enhance * 0.1;
            const percentStats = ['crit', 'dodge', 'lifesteal', 'pen', 'critDamage', 'bossDamage', 'hpRegen'];
            const statLabels = { crit: 'CRIT', dodge: 'EVA', lifesteal: 'Lifesteal', pen: 'PEN', critDamage: 'CRIT DMG', bossDamage: 'VS BOSS', hpRegen: 'HP REGEN' };
            const icons = { hp: '❤️', atk: '⚔️', def: '🛡️', agi: '🏃', crit: '🎯', dodge: '💨', lifesteal: '🧛', pen: '💥', critDamage: '💢', bossDamage: '👑', hpRegen: '💚' };
            let statsHtml = '';
            for (const [k, v] of Object.entries(s)) {
                if (v > 0) {
                    const label = percentStats.includes(k) ? statLabels[k] : k.toUpperCase();
                    const enhanced = Math.floor(v * enhMult);
                    const isBonus = item.bonusStat && item.bonusStat.stat === k;
                    const displayVal = isBonus ? enhanced + item.bonusStat.bonus : enhanced;
                    const cls = isBonus ? 'equip-stat-line has-bonus' : 'equip-stat-line';
                    statsHtml += `<span class="${cls}">${icons[k] || ''} +${formatNum(displayVal)} ${label}</span>`;
                }
            }

            content.innerHTML = `
                <div class="enhance-detail">
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:0.8rem;color:#9ca3af;">${item.rarity} ${stars}</div>
                    <div class="enhance-level">+${enhance} / +${maxEnhance} ${isMax ? '<span class="enhance-max">✅ MAX</span>' : ''}</div>
                    <div style="font-size:0.8rem;color:#e0e0e0;margin-top:6px;">${statsHtml}</div>
                </div>
                ${!isMax ? `<div class="enhance-detail"><div class="enhance-cost">Costo: ${cost}🩸</div></div>` : ''}
                <div style="display:flex;gap:8px;margin:12px 0;">
                    ${!isMax ? `<button class="choice-btn" onclick="maximizeItem()" style="flex:1;text-align:center;" ${metaState.essence < cost ? 'disabled' : ''}>
                        <span class="title">⬆️ Maximizar (+1)</span>
                        <span class="desc">${metaState.essence < cost ? '❌ Insuficiente' : cost + '🩸'}</span>
                    </button>` : ''}
                    ${item.bonusStat && enhance >= 5 ? `<button class="choice-btn" onclick="rerollBonusStat()" style="flex:1;text-align:center;" ${metaState.essence < 5 ? 'disabled' : ''}>
                        <span class="title">🔄 Rerolear stat</span>
                        <span class="desc">${metaState.essence < 5 ? '❌ Insuficiente' : '5🩸'}</span>
                    </button>` : ''}
                </div>
                <button class="modal-close" onclick="showMaximizeModal()" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Volver a slots</button>
            `;
        }

        function maximizeItem() {
            const slot = _enhanceSelectedSlot;
            const item = metaState.equipment[slot];
            if (!item) return;
            const enhance = item.enhance || 0;
            const maxEnhance = getEnhanceCap(item.rarity);
            if (enhance >= maxEnhance) {
                addLog(`✅ El objeto ya está al máximo (+${maxEnhance})`, 'system');
                return;
            }
            const cost = getMaximizeCost(enhance);
            if (!spendEssence(cost)) {
                addLog(`❌ No tenés suficientes esencias (${cost}🩸)`, 'system');
                return;
            }
            item.enhance = enhance + 1;

            // Bonus stat at +5, +10, and +15 (for Ancestral/Mythic)
            if (item.enhance === 5) {
                const bonus = getRandomBonusStat(item);
                if (bonus) {
                    item.bonusStat = bonus;
                    addLog(`✨ ${item.name} alcanzó +5! Stat bonus: ${bonus.stat.toUpperCase()} +${formatNum(bonus.bonus)}`, 'loot');
                }
            } else if (item.enhance === 10) {
                if (item.bonusStat) {
                    // Duplica el bonus sobre la MISMA stat: +25% → +50%
                    const stat = item.bonusStat.stat;
                    const baseVal = item.stats[stat] || 0;
                    const enhMult = 1 + (item.enhance || 0) * 0.1;
                    item.bonusStat.bonus = Math.floor(baseVal * enhMult * 0.5);
                    addLog(`✨ ${item.name} alcanzó +10! Stat bonus mejorado: ${item.bonusStat.stat.toUpperCase()} +${formatNum(item.bonusStat.bonus)}`, 'loot');
                }
            } else if (item.enhance === 15 && (item.rarity === 'Ancestral' || item.rarity === 'Mítico')) {
                // Triple bonus at +15: another +25% on top
                if (item.bonusStat) {
                    const stat = item.bonusStat.stat;
                    const baseVal = item.stats[stat] || 0;
                    const enhMult = 1 + (item.enhance || 0) * 0.1;
                    item.bonusStat.bonus = Math.floor(baseVal * enhMult * 0.75);
                    addLog(`✨ ${item.name} alcanzó +15! Stat bonus mejorado: ${item.bonusStat.stat.toUpperCase()} +${formatNum(item.bonusStat.bonus)}`, 'loot');
                }
            }

            addLog(`⬆️ ${item.name} ahora es +${item.enhance}`, 'system');
            saveGame();
            render();
            selectMaximizeSlot(slot);
        }

        function rerollBonusStat() {
            const slot = _enhanceSelectedSlot;
            const item = metaState.equipment[slot];
            if (!item || !item.bonusStat) return;
            if (item.enhance < 5) return;
            if (!spendEssence(5)) {
                addLog('❌ No tenés suficientes esencias (5🩸)', 'system');
                return;
            }
            // Pick a DIFFERENT stat
            const eligible = Object.entries(item.stats)
                .filter(([k, v]) => v > 0 && k !== item.bonusStat.stat)
                .map(([k]) => k);
            if (eligible.length === 0) {
                addLog('❌ No hay otros stats para rerolear', 'system');
                return;
            }
            const stat = eligible[Math.floor(Math.random() * eligible.length)];
            const baseVal = item.stats[stat] || 0;
            const enhMult = 1 + (item.enhance || 0) * 0.1;
            const mult = item.enhance >= 10 ? 0.5 : 0.25;
            const bonus = Math.floor(baseVal * enhMult * mult);
            item.bonusStat = { stat, bonus };
            addLog(`🔄 Bonus stat cambiado a ${stat.toUpperCase()} +${formatNum(bonus)}`, 'loot');
            saveGame();
            render();
            selectMaximizeSlot(slot);
        }

        function closeMaximizeModal() {
            document.getElementById('enhance-overlay').classList.remove('visible');
            _enhanceSelectedSlot = null;
        }

  Game.modalsEquipment = { buildEquipPanelHTML, showEquipComparison, resolveEquipComparison, showForjaModal, closeForjaModal, getAvailableMasteries, getMaximizeCost, getRandomBonusStat, showReforgeModal, selectReforgeSlot, reforgeRandom, reforgeChoose, confirmReforge, closeReforgeModal, showMaximizeModal, getEnhanceCap, selectMaximizeSlot, maximizeItem, rerollBonusStat, closeMaximizeModal };
  window.buildEquipPanelHTML = buildEquipPanelHTML;
  window.showEquipComparison = showEquipComparison;
  window.resolveEquipComparison = resolveEquipComparison;
  window.showForjaModal = showForjaModal;
  window.closeForjaModal = closeForjaModal;
  window.getAvailableMasteries = getAvailableMasteries;
  window.getMaximizeCost = getMaximizeCost;
  window.getRandomBonusStat = getRandomBonusStat;
  window.showReforgeModal = showReforgeModal;
  window.selectReforgeSlot = selectReforgeSlot;
  window.reforgeRandom = reforgeRandom;
  window.reforgeChoose = reforgeChoose;
  window.confirmReforge = confirmReforge;
  window.closeReforgeModal = closeReforgeModal;
  window.showMaximizeModal = showMaximizeModal;
  window.getEnhanceCap = getEnhanceCap;
  window.selectMaximizeSlot = selectMaximizeSlot;
  window.maximizeItem = maximizeItem;
  window.rerollBonusStat = rerollBonusStat;
  window.closeMaximizeModal = closeMaximizeModal;
})();
