// ui/render.js — main render() function, the single source of DOM truth.
// Created as part of F4b-4b to host the render() function outside the
// inline HTML script. The init code (loadGame, retro-check, first render
// call) remains in the HTML <script> block.
(function() {
  'use strict';
  window.Game = window.Game || {};

        function render() {
            try {
            // Training mode header
            if (runState.trainingMode) {
                document.getElementById('floor-number').textContent = `🏋️ Entrenamiento — Piso ${runState.floor}`;
                document.getElementById('boss-indicator').style.display = 'none';
            } else if (runState.dungeonMode) {
                const diff = runState.dungeonDifficulty;
                if (runState.runeChamberMode) {
                    const wave = runState.runeWave || 1;
                    const isBossWave = wave % 10 === 0;
                    document.getElementById('floor-number').textContent = `🔮 Cámara Rúnica — Oleada ${wave}`;
                    const bossEl = document.getElementById('boss-indicator');
                    if (isBossWave) {
                        bossEl.textContent = '☠️ JEFE';
                        bossEl.style.display = 'block';
                    } else {
                        bossEl.style.display = 'none';
                    }
                } else if (runState.legacyAbyssMode) {
                    document.getElementById('floor-number').textContent = `🌌 Abismo Eterno — Piso ${runState.floor}`;
                    const bossEl = document.getElementById('boss-indicator');
                    if (runState.floor === 10) {
                        bossEl.textContent = '☠️ BOSS FINAL';
                        bossEl.style.display = 'block';
                    } else if (runState.floor === 5) {
                        bossEl.textContent = '⚠️ MINIBOSS';
                        bossEl.style.display = 'block';
                    } else {
                        bossEl.style.display = 'none';
                    }
                } else if (runState.towerMode) {
                    const wave = runState.towerWave || 1;
                    const enemyPos = runState.towerEnemy || 1;
                    document.getElementById('floor-number').textContent = `🏰 Cámara Ancestral — Oleada ${wave} · Enemigo ${enemyPos}/10`;
                    const bossEl = document.getElementById('boss-indicator');
                    if (enemyPos === 10) {
                        bossEl.textContent = '☠️ JEFE';
                        bossEl.style.display = 'block';
                    } else if (enemyPos === 5) {
                        bossEl.textContent = '⚠️ MINIBOSS';
                        bossEl.style.display = 'block';
                    } else {
                        bossEl.style.display = 'none';
                    }
                } else {
                    document.getElementById('floor-number').textContent = `🏰 Mazmorra N${diff} — Piso ${runState.floor}`;
                    const bossEl = document.getElementById('boss-indicator');
                    if (runState.floor === 10) {
                        bossEl.textContent = '☠️ BOSS';
                        bossEl.style.display = 'block';
                    } else if (runState.floor === 5) {
                        bossEl.textContent = '⚠️ MINIBOSS';
                        bossEl.style.display = 'block';
                    } else {
                        bossEl.style.display = 'none';
                    }
                }
            } else {
                document.getElementById('floor-number').textContent = `Piso ${runState.floor}`;
                document.getElementById('boss-indicator').style.display = runState.floor % 10 === 0 ? 'block' : 'none';
                document.getElementById('boss-indicator').textContent = '⚔️ JEFE';
            }
            
            // Player — class colors and emoji
            const classColor = metaState.playerClass ? (CLASS_CONFIG[metaState.playerClass]?.color || '#3b82f6') : '#3b82f6';
            const classEmoji = metaState.playerClass ? (CLASS_CONFIG[metaState.playerClass]?.emoji || '🤺') : '🤺';
            document.getElementById('player-name').textContent = `${classEmoji} ${metaState.playerName}`;
            document.getElementById('player-name').style.color = classColor;
            document.getElementById('player-level').textContent = `Nivel ${runState.level}`;
            document.getElementById('player-level').style.background = classColor;
            document.getElementById('player-card').style.borderColor = classColor;
            const xpPct = (runState.xp / runState.xpToNext) * 100;
            document.getElementById('player-xp-bar').style.width = xpPct + '%';
            
            const p = runState.player;
            const pPct = p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 100;
            const totalShield = (runState.vitalShield || 0) + (runState.piedraShield?.amount || 0);
            const hasShield = totalShield > 0;
            if (hasShield) {
                // Show shield percentage on blue bar, shield amount only in text
                const shieldPct = runState.shieldMax > 0 ? Math.max(0, (totalShield / runState.shieldMax) * 100) : 100;
                document.getElementById('player-hp-bar').style.width = shieldPct + '%';
                document.getElementById('player-hp-trail').style.width = shieldPct + '%';
                document.getElementById('player-hp-bar').className = 'hp-bar shield';
                const baseHp = Math.max(0, p.hp - totalShield);
                document.getElementById('player-hp-text').textContent = `${formatNum(baseHp)} +${formatNum(totalShield)}🛡️`;
            } else {
                // Normal HP display
                document.getElementById('player-hp-bar').style.width = pPct + '%';
                document.getElementById('player-hp-trail').style.width = pPct + '%';
                document.getElementById('player-hp-bar').className = 'hp-bar' + (pPct <= 25 ? ' low' : pPct <= 50 ? ' mid' : '');
                document.getElementById('player-hp-text').textContent = `${formatNum(Math.max(0, p.hp))} / ${formatNum(p.maxHp)}`;
            }
            const derived = getDerivedStats(p.atk, p.def, p.agi);
            document.getElementById('player-atk').textContent = formatNum(p.atk);
            document.getElementById('player-def').textContent = formatNum(p.def);
            document.getElementById('player-agi').textContent = formatNum(p.agi);
            // Equipment crit rating converts to % with ratio 13 (linear conversion)
            const equipCritPct = (p.critRating || 0) / 13;
            const tl = runState.talentLevels || {};
            const t = (id) => tl[id] || 0;
            let preciseBonus = 0;
            if (t('golpe_preciso') > 0) {
                preciseBonus = TALENT_POOL.ofensivo.find(x => x.id === 'golpe_preciso').levels[t('golpe_preciso') - 1].flatCrit;
            }
            let trinityFlat = 0;
            if (t('trinidad') > 0) {
                trinityFlat = TALENT_POOL.heroico.find(x => x.id === 'trinidad').levels[t('trinidad') - 1].flatEach;
            }
            const rawCrit = derived.crit + equipCritPct + preciseBonus;
            const critBonus = metaState.upgrades.crit.level * metaState.upgrades.crit.percent * 100;
            const totalCrit = Math.floor(diminishingReturns(rawCrit, BALANCE.combat.critCap, BALANCE.combat.critK)) + (runState.masteryFlatCrit || 0) + critBonus + trinityFlat;
            const equipDodgePct = (p.dodgeRating || 0) / BALANCE.combat.dodgeRatingRatio;
            const rawDodge = derived.dodge + equipDodgePct;
            let dodgeFlat = (runState.masteryFlatDodge || 0) + trinityFlat;
            if (t('reflejos_felinos') > 0) {
                dodgeFlat += TALENT_POOL.defensivo.find(x => x.id === 'reflejos_felinos').levels[t('reflejos_felinos') - 1].flatDodge;
            }
            // Monk Flujo de Chi dodge bonus
            let renderMonkDodge = 0;
            if (metaState.playerClass === 'monk' && metaState.heroLevel >= 50) {
                renderMonkDodge = getClassPassiveValue('flujo_chi', 'dodgePct', metaState.heroLevel) || 0;
            }
            const totalDodge = Math.floor(diminishingReturns(rawDodge, BALANCE.combat.dodgeCap, BALANCE.combat.dodgeK)) + dodgeFlat + renderMonkDodge;
            const totalBlock = Math.floor(diminishingReturns(derived.block, BALANCE.combat.blockCap, BALANCE.combat.blockK)) + (runState.masteryFlatBlock || 0) + trinityFlat;
            const baseLS = diminishingReturns((p.lifesteal || 0), BALANCE.combat.lifestealCap, BALANCE.combat.lifestealK);
            let totalLifesteal = Math.min(baseLS + (runState.masteryFlatLifesteal || 0), BALANCE.combat.lifestealCap);
            if (t('asalto_vampirico') > 0) {
                const av = TALENT_POOL.sustain.find(x => x.id === 'asalto_vampirico').levels[t('asalto_vampirico') - 1];
                totalLifesteal = Math.min(totalLifesteal + av.flatLifesteal, BALANCE.combat.lifestealCap);
            }

            document.getElementById('player-crit').textContent = totalCrit + '%';
            document.getElementById('player-block').textContent = totalBlock + '%';
            document.getElementById('player-dodge').textContent = totalDodge + '%';

            // Advanced stats with diminishing returns
            let penFlat = (runState.masteryFlatPen || 0);
            if (t('golpe_penetrante') > 0) {
                penFlat += TALENT_POOL.ofensivo.find(x => x.id === 'golpe_penetrante').levels[t('golpe_penetrante') - 1].penPct;
            }
            const penMetaBonus = metaState.upgrades.pen.level * metaState.upgrades.pen.percent * 100;
            const effPen = diminishingReturns((p.pen || 0), BALANCE.combat.penCap, BALANCE.combat.penK) + penFlat + penMetaBonus;
            const effCritDmg = diminishingReturns((p.critDamage || 0), BALANCE.combat.critDmgCap, BALANCE.combat.critDmgK);
            const critDmgBonus = metaState.upgrades.critDmg.level * metaState.upgrades.critDmg.percent * 100;
            const effBossDmg = diminishingReturns((p.bossDamage || 0), BALANCE.combat.bossDmgCap, BALANCE.combat.bossDmgK)
                + (metaState.upgrades.bossDmg.level * metaState.upgrades.bossDmg.percent * 100);
            const effHpRegen = diminishingReturns((p.hpRegen || 0), 15, 150)
                + (runState.masteryFlatRegen || 0); // Maestría Regenerativa: flat post-DR

            document.getElementById('player-pen').textContent = effPen.toFixed(1) + '%';
            document.getElementById('player-crit-dmg').textContent = '+' + (BALANCE.combat.critDmgBase + effCritDmg + critDmgBonus).toFixed(1) + '%';
            document.getElementById('player-boss-dmg').textContent = '+' + effBossDmg.toFixed(1) + '%';
            document.getElementById('player-hp-regen').textContent = effHpRegen.toFixed(1) + '%';
            document.getElementById('player-lifesteal').textContent = totalLifesteal.toFixed(1) + '%';

            // Enemy
            const e = runState.enemy;
            if (e) {
                const ePct = Math.max(0, (e.hp / e.maxHp) * 100);
                document.getElementById('enemy-hp-bar').style.width = ePct + '%';
                document.getElementById('enemy-hp-trail').style.width = ePct + '%';
                document.getElementById('enemy-hp-bar').className = 'hp-bar' + (ePct <= 25 ? ' low' : ePct <= 50 ? ' mid' : '');
                document.getElementById('enemy-hp-text').textContent = `${formatNum(Math.max(0, e.hp))} / ${formatNum(e.maxHp)}`;
                document.getElementById('enemy-name').textContent = `${e.isBoss ? '👑' : '👹'} ${e.name}`;
                document.getElementById('enemy-atk').textContent = formatNum(e.atk);
                document.getElementById('enemy-def').textContent = formatNum(e.def);
                document.getElementById('enemy-agi').textContent = formatNum(e.agi);
                document.getElementById('enemy-card').className = 'fighter enemy' + (e.isBoss ? ' boss' : '');
            }

            // T16 — Render enemy debuffs
            const debuffsContainer = document.getElementById('enemy-debuffs');
            if (debuffsContainer) {
                const debuffIcons = {
                    hemorragia: '🩸', hoja_toxica: '☠️', marca_muerte: '💀',
                    quemadura: '🔥', desgaste: '📉',
                };
                const debuffNames = {
                    hemorragia: 'Sangrado', hoja_toxica: 'Tóxico', marca_muerte: 'Vulnerabilidad',
                    quemadura: 'Quemadura', desgaste: 'Desgaste',
                };
                const hasFrozen = (runState.frozenTicks || 0) > 0;
                const hasBlind = !!runState.enemyBlinded;
                const hasSlow = (runState.enemySlowTicks || 0) > 0;
                if (runState.enemyDebuffs.length > 0 || hasFrozen || hasBlind || hasSlow) {
                    let html = '';
                    for (const db of runState.enemyDebuffs) {
                        const icon = debuffIcons[db.id] || '⚡';
                        const name = debuffNames[db.id] || db.id;
                        const pct = db.duration > 0 ? Math.max(0, (db.ticksLeft / db.duration) * 100) : 0;
                        const extra = db.type === 'stat_drain' && db.stack ? ` x${db.stack}` : '';
                        html += `<div class="debuff-badge ${db.type}">`;
                        html += `<span class="debuff-icon">${icon}</span>`;
                        html += `<span class="debuff-name">${name}${extra}</span>`;
                        html += `<div class="debuff-bar"><div class="debuff-bar-fill" style="width:${pct}%"></div></div>`;
                        html += `</div>`;
                    }
                    // Golpe Cegador: blind state (no duration, consumed on next attack)
                    if (hasBlind) {
                        html += `<div class="debuff-badge blind">`;
                        html += `<span class="debuff-icon">👁️</span>`;
                        html += `<span class="debuff-name">Cegado</span>`;
                        html += `<div class="debuff-bar"><div class="debuff-bar-fill" style="width:100%"></div></div>`;
                        html += `</div>`;
                    }
                    // Golpe Helado: frozen state with duration bar
                    if (hasFrozen) {
                        const frozenPct = (runState.frozenTicks / 20) * 100;
                        html += `<div class="debuff-badge freeze">`;
                        html += `<span class="debuff-icon">❄️</span>`;
                        html += `<span class="debuff-name">Congelado</span>`;
                        html += `<div class="debuff-bar"><div class="debuff-bar-fill" style="width:${frozenPct}%"></div></div>`;
                        html += `</div>`;
                    }
                    // Toque Helado: slow state with duration bar
                    if (hasSlow) {
                        const slowMax = t('toque_helado') > 0
                            ? TALENT_POOL.estado.find(x => x.id === 'toque_helado').levels[t('toque_helado') - 1].duration * 10
                            : 80;
                        const slowPct = (runState.enemySlowTicks / slowMax) * 100;
                        html += `<div class="debuff-badge slow">`;
                        html += `<span class="debuff-icon">🧊</span>`;
                        html += `<span class="debuff-name">Ralentizado</span>`;
                        html += `<div class="debuff-bar"><div class="debuff-bar-fill" style="width:${slowPct}%"></div></div>`;
                        html += `</div>`;
                    }
                    debuffsContainer.innerHTML = html;
                } else {
                    debuffsContainer.innerHTML = '';
                }
            }

            // Active talents display
            const talentsRow = document.getElementById('talents-row');
            const talentKeys = Object.keys(tl);
            if (talentKeys.length === 0) {
                talentsRow.innerHTML = '';
            } else {
                talentsRow.innerHTML = talentKeys.map(id => {
                    const talent = findTalent(id);
                    if (!talent) return '';
                    const level = tl[id];
                    const icon = talent.icon || POOL_ICONS[talent.pool] || '❓';
                    return `<div class="talent-badge" data-pool="${talent.pool}"><span class="talent-icon">${icon}</span><span class="talent-name">${talent.label}</span><span class="talent-level">Lv.${level}</span></div>`;
                }).join('');
            }

            // Training mode counter
            const trainingCounter = document.getElementById('training-counter');
            if (runState.trainingMode) {
                trainingCounter.style.display = 'block';
                document.getElementById('training-enemies-count').textContent = formatNum(runState.enemiesDefeated);
            } else {
                trainingCounter.style.display = 'none';
            }

            document.getElementById('souls-count').textContent = formatNum(metaState.souls);
            document.getElementById('essence-count').textContent = formatNum(metaState.essence);
            const legacyDisplay = document.getElementById('legacy-essence-display');
            const legacyCount = document.getElementById('legacy-essence-count');
            if (legacyDisplay && legacyCount) {
                const hasLegacy = metaState.heroArtifact?.legacyEssence > 0 || metaState.unlockedReforge;
                legacyDisplay.style.display = hasLegacy ? 'inline' : 'none';
                legacyCount.textContent = formatNum(metaState.heroArtifact?.legacyEssence || 0);
            }
            const runePowderDisplay = document.getElementById('rune-powder-display');
            const runePowderCount = document.getElementById('rune-powder-count');
            if (runePowderDisplay && runePowderCount) {
                const hasPowder = metaState.runePowder > 0 || metaState.unlockedReforge;
                runePowderDisplay.style.display = hasPowder ? 'inline' : 'none';
                runePowderCount.textContent = formatNum(metaState.runePowder || 0);
            }

            // Accumulated stats from leveling
            const r = runState.runBonuses;
            document.getElementById('acc-hp').textContent = `+${formatNum(r.hp)}`;
            document.getElementById('acc-atk').textContent = `+${formatNum(r.atk)}`;
            document.getElementById('acc-def').textContent = `+${formatNum(r.def)}`;
            document.getElementById('acc-agi').textContent = `+${formatNum(r.agi)}`;

            // Upgrades
            const grid = document.getElementById('upgrade-grid');
            grid.innerHTML = '';
            for (const [key, u] of Object.entries(metaState.upgrades)) {
                const isMaxed = u.maxLevel && u.level >= u.maxLevel;
                const cost = isMaxed ? 'MAX' : getUpgradeCost(key);
                const levelText = u.maxLevel ? `Nvl: ${u.level}/${u.maxLevel}` : `Nvl: ${u.level}`;
                
                // Calcular acumulado
                let cumulative = '';
                if (u.level > 0) {
                    const parts = [];
                    if (u.flat) parts.push(`+${u.flat * u.level}`);
                    if (u.percent) parts.push(`+${Math.round(u.percent * u.level * 100)}%`);
                    cumulative = parts.length ? ` (${parts.join(' ')})` : '';
                }
                
                const btn = document.createElement('button');
                btn.className = 'upgrade-btn';
                btn.disabled = isMaxed || metaState.souls < cost;
                btn.onclick = () => !isMaxed && buyUpgrade(key);
                btn.innerHTML = `<span>${u.icon} ${u.label}</span><span class="level">${levelText}${cumulative}</span><span class="cost">${isMaxed ? '✅ MAX' : `💀 ${formatNum(cost)}`}</span>`;
                grid.appendChild(btn);
            }
            // Update character screen overlay if active
            if (runState.characterScreenActive && document.getElementById('char-screen-overlay')) {
                renderCharacterScreen();
            }
            } catch(e) { console.error('❌ Render error:', e, e.stack); }
        }

  Game.render = { render: render };
  window.render = render;
})();
