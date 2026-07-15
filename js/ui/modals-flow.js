// modals-flow.js — flow modals: training, death recap, rebirth, artifact tree, leaderboard, tutorial.
// Extracted from inline Torre_Infinita.html as part of F4b-1 of the separate-ui-logic refactor.
// All these handlers must stay reachable from the global scope because the HTML body
// uses `onclick="showXxx()"` attributes that evaluate identifiers against the global
// lexical environment. We mirror every function to `window.<name>` at the bottom.
//
// Cross-module dependencies (all resolved at call time via globals):
//   - `metaState`, `runState`, `BALANCE`, `addLog`, `formatNum`, `saveGame`,
//     `render`, `updateButtons`, `startCombat`, `formatRunTime` are looked up
//     on the global object. `formatRunTime` is intentionally kept inline in
//     Torre_Infinita.html because it is also used by js/game/combat.js; both
//     references resolve through the global lookup at call time.
(function() {
  'use strict';

        // --- Training Mode Functions ---
        function showTrainingModal() {
            if (!metaState.unlockedTraining) return;
            const overlay = document.getElementById('training-overlay');
            const slider = document.getElementById('training-slider');
            const minFloor = 30;
            const maxFloor = Math.max(minFloor, metaState.maxFloor - 1);
            slider.min = minFloor;
            slider.max = maxFloor;
            slider.value = maxFloor;
            document.getElementById('training-min-label').textContent = minFloor;
            document.getElementById('training-max-label').textContent = maxFloor;
            updateTrainingSlider();
            overlay.classList.add('visible');
        }

        function closeTrainingModal() {
            document.getElementById('training-overlay').classList.remove('visible');
        }

        function updateTrainingSlider() {
            const val = document.getElementById('training-slider').value;
            document.getElementById('training-floor-value').textContent = `Piso ${val}`;
        }

        function startTraining() {
            if (runState.active) return;
            const floor = parseInt(document.getElementById('training-slider').value);
            closeTrainingModal();

            runState.active = true;
            runState.trainingMode = true;
            runState.legacyAbyssMode = false;
            runState.trainingFloor = floor;
            runState.floor = floor;
            runState.enemiesDefeated = 0;
            runState.level = metaState.heroLevel;
            runState.xp = metaState.heroXp;
            runState.xpToNext = BALANCE.levelUp.xpScale * (runState.level || 1);
            runState.runBonuses = { ...metaState.heroBonuses };
            runState.abilities = [];
runState.talentLevels = {};
             runState.hasRevived = false;
runState.furiaStacks = 0;
             runState.critMasteryCounter = 0;
             runState.runeTapCounter = 0;
             runState.golpeBonus = 0;
             runState.spellShieldCounter = 0;
             runState.segundoAlientoUsed = false;
            runState.bossesKilledThisRun = 0;
            runState.enemyDebuffs = [];
            runState.vitalShield = 0;
            runState.shieldMax = 0;
            runState.piedraShield = { amount: 0, ticksLeft: 0 };
            document.getElementById('combat-log').innerHTML = '';
            addLog(`🏋️ Entrenamiento iniciado — Piso ${floor}`, 'system');
            startCombat();
            updateButtons();
        }

        // ============================================
        // DEATH RECAP MODAL
        // ============================================
        function showRecap() {
            document.getElementById('recap-overlay').classList.add('visible');
            renderRecapTab('dmg');
        }

        function closeRecap() {
            document.getElementById('recap-overlay').classList.remove('visible');
        }

        function switchRecapTab(tab) {
            document.querySelectorAll('.recap-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.recap-tab[data-tab="${tab}"]`).classList.add('active');
            renderRecapTab(tab);
        }

        function renderRecapTab(tab) {
            const recap = runState.recap;
            if (!recap) return;
            const container = document.getElementById('recap-content');
            const tl = runState.talentLevels || {};
            const lvl = (id) => { const v = tl[id] || 0; return v > 0 ? ` (Nv.${v})` : ''; };
            let html = '';

            if (tab === 'dmg') {
                const items = [
                    ['Auto-ataques', recap.dmg.normal],
                    ['Críticos', recap.dmg.crit],
                    ['Multiataque' + lvl('multiataque'), recap.dmg.multiataque],
                    ['Primer Golpe' + lvl('primer_golpe'), recap.dmg.primer_golpe],
                    ['Golpe Rápido' + lvl('golpe_rapido'), recap.dmg.golpe_rapido],
                    ['Furia Creciente' + lvl('furia_creciente'), recap.dmg.furia_creciente],
                    ['Golpe Brutal' + lvl('golpe_brutal'), recap.dmg.golpe_brutal],
                    ['Ejecución' + lvl('ejecucion'), recap.dmg.ejecucion],
                    ['Cañón de Cristal' + lvl('canon_cristal'), recap.dmg.canon_cristal],
                    ['Maestría Furiosa', recap.dmg.furia_mastery],
                    ['Sangre Fría' + lvl('sangre_fria'), recap.dmg.sangre_fria],
                    ['Daño vs Boss', recap.dmg.boss_dmg],
                    ['Maestro Elemental' + lvl('maestro_elemental'), recap.dmg.maestro_elemental],
                    ['Eco de Combate' + lvl('eco_combate'), recap.dmg.eco_combate],
                    ['Contraataque' + lvl('contraataque'), recap.dmg.contraataque],
                    ['Hemorragia (DoT)' + lvl('hemorragia'), recap.dmg.hemorragia],
                    ['Hoja Tóxica (DoT)' + lvl('hoja_toxica'), recap.dmg.hoja_toxica],
                    ['Furia Ardiente' + lvl('furia_ardiente'), recap.dmg.furia_ardiente],
                ];
                const total = items.reduce((s, [, v]) => s + v, 0);
                const shown = items.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
                if (shown.length === 0) {
                    html = '<div class="recap-row" style="justify-content:center;color:#9ca3af;padding:12px;">No infligiste daño</div>';
                } else {
                    shown.forEach(([label, val]) => {
                        html += `<div class="recap-row"><span class="label">${label}</span><span class="value">${val.toLocaleString()}</span></div>`;
                    });
                    html += `<div class="recap-row recap-total"><span class="label">Total</span><span class="value">${total.toLocaleString()}</span></div>`;
                }
            } else if (tab === 'mitigation') {
                const items = [
                    ['DEF (reducción)', recap.mitigation.def],
                    ['Bloqueo (50%)', recap.mitigation.block],
                    ['Piel de Piedra' + lvl('piel_piedra'), recap.mitigation.piedra_shield],
                    ['Escudo Vital' + lvl('escudo_vital'), recap.mitigation.vital_shield],
                    ['Indestructible' + lvl('indestructible'), recap.mitigation.indestructible],
                    ['Fortaleza' + lvl('fortaleza'), recap.mitigation.fortaleza],
                    ['Escudo Mágico' + lvl('escudo_magico'), recap.mitigation.escudo_magico],
                    ['Veterano Batalla' + lvl('veterano_batalla'), recap.mitigation.veterano],
                    ['Maestría Resistente', recap.mitigation.resistente],
                    ['Evasión (daño evitado)', recap.mitigation.dodge_dmg],
                    ['Golpes esquivados', recap.mitigation.dodge_hits],
                    ['Cañón de Cristal (+recibido)' + lvl('canon_cristal'), recap.mitigation.canon_recibido],
                ];
                const shown = items.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
                if (shown.length === 0) {
                    html = '<div class="recap-row" style="justify-content:center;color:#9ca3af;padding:12px;">No recibiste daño</div>';
                } else {
                    shown.forEach(([label, val]) => {
                        html += `<div class="recap-row"><span class="label">${label}</span><span class="value">${val.toLocaleString()}</span></div>`;
                    });
                    html += `<div class="recap-row recap-total"><span class="label">Daño crudo total</span><span class="value">${recap.mitigation.total_raw.toLocaleString()}</span></div>`;
                    html += `<div class="recap-row recap-total"><span class="label">Daño recibido final</span><span class="value">${recap.mitigation.total_taken.toLocaleString()}</span></div>`;
                }
            } else if (tab === 'heal') {
                const items = [
                    ['Lifesteal (ataques)', recap.heal.lifesteal],
                    ['Toque Rúnico' + lvl('toque_runico'), recap.heal.toque_runico],
                    ['Regeneración' + lvl('regeneracion'), recap.heal.regeneracion],
                    ['HP Regen (equipo)', recap.heal.hp_regen],
                    ['Segundo Aliento' + lvl('segundo_aliento'), recap.heal.segundo_aliento],
                    ['Lifesteal (DoTs)', recap.heal.dot_lifesteal],
                    ['Lifesteal (Eco)', recap.heal.echo_lifesteal],
                    ['Lifesteal (Contraataque)', recap.heal.counter_lifesteal],
                ];
                const total = items.reduce((s, [, v]) => s + v, 0);
                const shown = items.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
                if (shown.length === 0) {
                    html = '<div class="recap-row" style="justify-content:center;color:#9ca3af;padding:12px;">No te curaste</div>';
                } else {
                    shown.forEach(([label, val]) => {
                        html += `<div class="recap-row"><span class="label">${label}</span><span class="value">${val.toLocaleString()}</span></div>`;
                    });
                    html += `<div class="recap-row recap-total"><span class="label">Total curado</span><span class="value">${total.toLocaleString()}</span></div>`;
                }
            }

            container.innerHTML = html;
        }

        // ============================================
        // 7b. PRESTIGIO / RENACIMIENTO
        // ============================================

        function showRebirthModal() {
            if (runState.active || !metaState.unlockedReforge || metaState.hasRebirthed) return;
            const hl = metaState.heroLevel;
            const mf = metaState.maxFloor;
            const nodeLevel = metaState.heroArtifact.nodes.ciclo_legado || 0;
            const cicloMult = 1 + 0.05 * nodeLevel;
            const baseAmount = Math.floor(Math.sqrt(hl) * Math.max(mf, 100) / 100);
            const totalAmount = Math.floor(baseAmount * cicloMult);

            // Build preview HTML
            let losses = '';
            const lossItems = [
                '💀 Almas: se perderán todas',
                '🩸 Esencias: se perderán todas',
                '⬆️ Mejoras permanentes: todas a nivel 0',
                `👤 Nivel de héroe: ${hl} → 0`,
                '📖 Especialización: se reiniciará',
                '🏛️ Bonificaciones de clase: se reiniciarán',
            ];
            for (const item of lossItems) {
                losses += `<div class="loss-item">❌ ${item}</div>`;
            }

            let preserved = '';
            const preservedItems = [
                '🗡️ Equipo intacto',
                '🏛️ Clase preservada',
                '🏆 Piso máximo preservado',
                `🪶 Esencias de legado acumuladas: ${formatNum(metaState.heroArtifact.legacyEssence)}`,
                '🌟 Árbol de artefacto intacto',
                '🏅 Leaderboard preservado',
            ];
            for (const item of preservedItems) {
                preserved += `<div class="preserved-item">✅ ${item}</div>`;
            }

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay visible';
            overlay.id = 'rebirth-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) closeRebirthModal(); };
            overlay.innerHTML = `
                <div class="modal" onclick="event.stopPropagation()">
                    <h2>🪶 Renacer</h2>
                    <p style="text-align:center;color:#9ca3af;">¿Estás seguro de que querés renacer?<br>Esta acción no se puede deshacer.</p>
                    <div class="rebirth-preview">
                        <div class="gain">
                            🪶 +${formatNum(totalAmount)} Esencias de Legado
                            ${nodeLevel > 0 ? `<br><span style="font-size:0.7rem;color:#d97706;">(Ciclo del Legado ×${(1 + 0.05 * nodeLevel).toFixed(2)})</span>` : ''}
                        </div>
                        <div class="losses">
                            <div class="loss-title">📉 Se perderá:</div>
                            ${losses}
                        </div>
                        <div class="preserved">
                            <div class="preserved-title">💪 Se preserva:</div>
                            ${preserved}
                        </div>
                    </div>
                    <div class="rebirth-buttons">
                        <button class="cancel-btn" onclick="closeRebirthModal()">❌ Cancelar</button>
                        <button class="confirm-btn" onclick="performRebirth()">🪶 Renacer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        function closeRebirthModal() {
            const el = document.getElementById('rebirth-overlay');
            if (el) el.remove();
        }

        function performRebirth() {
            const hl = metaState.heroLevel;
            const mf = metaState.maxFloor;
            const nodeLevel = metaState.heroArtifact.nodes.ciclo_legado || 0;
            const cicloMult = 1 + 0.05 * nodeLevel;
            const baseAmount = Math.floor(Math.sqrt(hl) * Math.max(mf, 100) / 100);
            const totalAmount = Math.floor(baseAmount * cicloMult);

            // Sumar esencias de legado
            metaState.heroArtifact.legacyEssence += totalAmount;
            metaState.heroArtifact.rebirthCount++;

            // Resetear progreso parcial
            metaState.souls = 0;
            metaState.essence = 0;
            for (const key of Object.keys(metaState.upgrades)) {
                metaState.upgrades[key].level = 0;
            }
            metaState.heroLevel = 0;
            metaState.heroXp = 0;
            metaState.heroBonuses = { hp: 0, atk: 0, def: 0, agi: 0 };
            metaState.playerSpec = null;

            // Preservar: equipment, class, maxFloor, heroArtifact, leaderboard
            // (already preserved — these are never reset here)

            metaState.hasRebirthed = true;
            saveGame();
            closeRebirthModal();
            addLog(`🪶 ¡Renaciste! Obtuviste ${formatNum(totalAmount)} Esencias de Legado.`, 'victory');
            render();
            updateButtons();
        }

        // ============================================
        // 7c. ÁRBOL DE LEGADO
        // ============================================

        function showArtifactTree() {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay visible';
            overlay.id = 'artifact-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) closeArtifactTree(); };

            let nodesHTML = '';
            for (const n of BALANCE.heroArtifact.nodes) {
                const currentLevel = metaState.heroArtifact.nodes[n.id] || 0;
                const isFlat = n.flatBonus !== undefined;
                const maxed = isFlat ? false : currentLevel >= 5;
                const nextLevel = currentLevel + 1;
                const cost = maxed ? 0 : Math.floor(5 * Math.sqrt(nextLevel));
                const canAfford = !maxed && metaState.heroArtifact.legacyEssence >= cost;

                let bonusText = '';
                if (currentLevel > 0) {
                    if (isFlat) {
                        const total = currentLevel * n.flatBonus;
                        const statName = n.id === 'vitalidad_ancestral' ? 'HP' : n.id === 'pasos_ancestrales' ? 'AGI' : n.id === 'fuerza_ancestral' ? 'ATK' : 'DEF';
                        bonusText = `(+${formatNum(total)} ${statName})`;
                    } else {
                        const pct = (n.bonus * currentLevel * 100).toFixed(0);
                        bonusText = `(+${pct}%)`;
                    }
                }

                nodesHTML += `
                    <div class="artifact-node">
                        <span class="node-icon">${n.label.split(' ')[0]}</span>
                        <span class="node-name">${n.label.split(' ').slice(1).join(' ')}</span>
                        <span class="node-level">Nv.${currentLevel}${isFlat ? '' : '/5'} ${bonusText}</span>
                        ${maxed
                            ? `<span class="node-max">✅ MAX</span>`
                            : `<span class="node-cost">🪶 ${cost}</span>
                               <button class="artifact-btn" ${canAfford ? '' : 'disabled'} onclick="buyArtifactNode('${n.id}')">
                                    ${canAfford ? '⬆️ Mejorar' : metaState.heroArtifact.legacyEssence < cost ? '❌ Insuficiente' : '✅ MAX'}
                               </button>`
                        }
                    </div>
                `;
            }

            overlay.innerHTML = `
                <div class="modal" onclick="event.stopPropagation()" style="max-width:440px;">
                    <h2>🌟 Árbol de Legado</h2>
                    <p style="text-align:center;color:#9ca3af;font-size:0.85rem;">
                        🪶 Esencias de Legado: <span style="color:#fbbf24;font-weight:600;">${formatNum(metaState.heroArtifact.legacyEssence)}</span>
                    </p>
                    <div class="artifact-tree-grid">
                        ${nodesHTML}
                    </div>
                    <button class="modal-close" onclick="closeArtifactTree()">Cerrar</button>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        function closeArtifactTree() {
            const el = document.getElementById('artifact-overlay');
            if (el) el.remove();
        }

        function buyArtifactNode(id) {
            const currentLevel = metaState.heroArtifact.nodes[id] || 0;
            const nodeDef = BALANCE.heroArtifact.nodes.find(n => n.id === id);
            const isFlat = nodeDef && nodeDef.flatBonus !== undefined;
            const maxLevel = isFlat ? Infinity : 5;
            if (currentLevel >= maxLevel) return;
            const nextLevel = currentLevel + 1;
            const cost = Math.floor(5 * Math.sqrt(nextLevel));
            if (metaState.heroArtifact.legacyEssence < cost) {
                addLog('❌ Esencias de Legado insuficientes', 'system');
                closeArtifactTree();
                return;
            }
            metaState.heroArtifact.legacyEssence -= cost;
            metaState.heroArtifact.nodes[id] = nextLevel;
            saveGame();
            addLog(`🌟 ${nodeDef ? nodeDef.label : id} mejorado a nivel ${nextLevel}!`, 'loot');
            closeArtifactTree();
            showArtifactTree();
        }

        // ============================================
        // 7e. LEADERBOARD
        // ============================================
        function showLeaderboard() {
            const container = document.getElementById('leaderboard-content');
            const lb = metaState.leaderboard;
            if (lb.length === 0) {
                container.innerHTML = '<div class="leaderboard-empty">Todavía no hay entradas</div>';
            } else {
                let html = '<table class="leaderboard-table">';
                html += '<tr><th>#</th><th>Nombre</th><th>Clase</th><th>Nv</th><th>Piso</th><th>Tiempo</th></tr>';
                for (let i = 0; i < lb.length; i++) {
                    const e = lb[i];
                    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
                    // Find class emoji for leaderboard entry
                    let lbEmoji = '🤺';
                    if (e.class) {
                        for (const cls of Object.values(CLASS_CONFIG)) {
                            if (cls.name === e.class) { lbEmoji = cls.emoji; break; }
                        }
                    }
                    html += `<tr>
                        <td class="rank ${rankClass}">${i + 1}</td>
                        <td class="name">${e.name}</td>
                        <td>${lbEmoji} ${e.class}</td>
                        <td>${e.heroLevel}</td>
                        <td>${e.maxFloor}</td>
                        <td class="time">${e.runTime}</td>
                    </tr>`;
                }
                html += '</table>';
                container.innerHTML = html;
            }
            document.getElementById('leaderboard-overlay').classList.add('visible');
        }

        function closeLeaderboard() {
            document.getElementById('leaderboard-overlay').classList.remove('visible');
        }

        function showTutorial() { document.getElementById('tutorial-overlay').classList.add('visible'); }
        function toggleAdvancedStats() {
            const content = document.getElementById('advanced-stats-content');
            const label = document.getElementById('advanced-toggle-label');
            if (content.style.display === 'none') {
                content.style.display = 'flex';
                label.textContent = '▲ Stats avanzados';
            } else {
                content.style.display = 'none';
                label.textContent = '▼ Stats avanzados';
            }
        }
        function closeTutorial() {
            document.getElementById('tutorial-overlay').classList.remove('visible');
            localStorage.setItem('torre_tutorial_seen', 'true');
        }

  Game.modalsFlow = { showTrainingModal, closeTrainingModal, updateTrainingSlider, startTraining, showRecap, closeRecap, switchRecapTab, renderRecapTab, showRebirthModal, closeRebirthModal, performRebirth, showArtifactTree, closeArtifactTree, buyArtifactNode, showLeaderboard, closeLeaderboard, showTutorial, closeTutorial, toggleAdvancedStats };
  window.showTrainingModal = showTrainingModal;
  window.closeTrainingModal = closeTrainingModal;
  window.updateTrainingSlider = updateTrainingSlider;
  window.startTraining = startTraining;
  window.showRecap = showRecap;
  window.closeRecap = closeRecap;
  window.switchRecapTab = switchRecapTab;
  window.renderRecapTab = renderRecapTab;
  window.showRebirthModal = showRebirthModal;
  window.closeRebirthModal = closeRebirthModal;
  window.performRebirth = performRebirth;
  window.showArtifactTree = showArtifactTree;
  window.closeArtifactTree = closeArtifactTree;
  window.buyArtifactNode = buyArtifactNode;
  window.showLeaderboard = showLeaderboard;
  window.closeLeaderboard = closeLeaderboard;
  window.showTutorial = showTutorial;
  window.closeTutorial = closeTutorial;
  window.toggleAdvancedStats = toggleAdvancedStats;
})();
