// codex.js — talent/class/mastery/rune/prestige codex modal.
(function() {
  'use strict';
  window.Game = window.Game || {};

        // Talent Codex
        function showCodex() {
            document.getElementById('codex-content').innerHTML = buildCodexHTML();
            document.getElementById('codex-overlay').classList.add('visible');
        }

        function closeCodex() {
            document.getElementById('codex-overlay').classList.remove('visible');
        }

        function buildCodexHTML() {
            const blocks = [
                { icon: '🏛️', name: 'Clases', isClasses: true },
                { icon: '⚡', name: 'Talentos', isTalents: true },
                { icon: '⭐', name: 'Maestrías', isMasteries: true },
                { icon: '🔮', name: 'Runas', isRunes: true },
                { icon: '🪶', name: 'Prestigio', isPrestige: true },
            ];

            const keyLabels = {
                chance: '% prob', hits: ' golpes',
                dmgMult: '× daño', flatCrit: ' crítico',
                threshold: ' umbral HP', mult: '× daño', dmgBonus: '% daño',
                dmgTaken: '% daño recibido', everyN: ' cada N golpes',
                penPct: '% PEN', perHit: '%/golpe', maxStack: ' máx stacks',
                dmgPct: '% daño', dmgPctPerTick: '% HP/tick', ticks: ' ticks',
                vulnPct: '% vulnerabilidad', duration: 's', defReductionPct: '% DEF',
                slowPct: '% ralentización', perTick: '%/tick',
                shieldPct: '% HP máx escudo',
                dmgReduction: '% reducción', selfDmgPenalty: '% daño propio',
                flatDodge: ' dodge', hpBonus: '% HP', speedPenalty: '% velocidad',
                reduction: '% reducción', per5Floors: '%/5 pisos', maxDr: '% máx',
                healPct: '% cura', flatLifesteal: '% lifesteal', hpPctPer2s: '% HP/2s',
                statBonus: '% stats', perBoss: '%/boss', flatEach: ' cada stat',
                extraTicks: ' ticks extra', atkReductionPct: '% ATK',
            };

            let html = '';
            for (let bi = 0; bi < blocks.length; bi++) {
                const block = blocks[bi];
                html += `<div class="codex-block">`;
                html += `<div class="codex-block-title" onclick="toggleCodexBlock(${bi})">`;
                html += `<span>${block.icon} ${block.name}</span>`;
                html += `<span class="arrow">▶</span>`;
                html += `</div>`;
                html += `<div class="codex-block-body" id="codex-body-${bi}">`;
                if (block.isClasses) {
                    // Render classes
                    const _hl = runState.level || 0;
                    for (const cls of Object.values(CLASS_CONFIG)) {
                        const cPassive = CLASS_PASSIVES[cls.id];
                        const v50 = cPassive ? cPassive.eval(50) : null;
                        const v100 = cPassive ? cPassive.eval(100) : null;
                        const v500 = cPassive ? cPassive.eval(500) : null;
                        const formatPassiveVals = (v) => {
                            if (!v) return '—';
                            return Object.entries(v).map(([k, val]) => {
                                if (k === 'mult') return `×${val.toFixed(2)}`;
                                if (k === 'speedPct') return `+${val}% vel`;
                                if (k === 'dodgePct') return `+${val}% eva`;
                                if (k === 'lifestealPct') return `+${val}% ls`;
                                if (k === 'dotDmgPct') return `+${val}% DoT`;
                                if (k === 'bonusDmg') return `+${val}%`;
                                return `${k}: ${val}`;
                            }).join(' · ');
                        };
                        html += `<div class="codex-talent" style="border-left: 3px solid ${cls.color}; padding-left: 10px; margin-bottom: 10px;">`;
                        html += `<div class="codex-talent-name" style="color:${cls.color};">${cls.emoji} ${cls.name}</div>`;
                        html += `<div style="font-size:0.7rem;color:#9ca3af;margin:2px 0 4px 0;">
                            ❤️+${cls.statPerLevel.hp}/nv · ⚔️+${cls.statPerLevel.atk}/nv · 🛡️+${cls.statPerLevel.def}/nv · 🏃+${cls.statPerLevel.agi}/nv
                        </div>`;
                        // Class passive
                        if (cPassive) {
                            html += `<div class="codex-talent" style="margin-top:4px;">`;
                            html += `<div class="codex-talent-name" style="font-size:0.8rem;color:#fbbf24;">${cls.emoji} ${cPassive.name}</div>`;
                            html += `<div class="codex-talent-desc" style="font-size:0.7rem;">${cPassive.desc}</div>`;
                            html += `<div class="codex-talent-levels" style="font-size:0.7rem;">
                                <span><b>Nv.50:</b> ${formatPassiveVals(v50)}</span>
                                <span><b>Nv.100:</b> ${formatPassiveVals(v100)}</span>
                                <span><b>Nv.500:</b> ${formatPassiveVals(v500)}</span>
                            </div></div>`;
                        }
                        // Specializations
                        const specs = SPECIALIZATIONS[cls.id] || [];
                        for (const spec of specs) {
                            const sp = SPEC_PASSIVES[spec.id];
                            const sv100 = sp ? sp.eval(100) : null;
                            const sv500 = sp ? sp.eval(500) : null;
                            const formatSpecVals = (v) => {
                                if (!v) return '—';
                                return Object.entries(v).map(([k, val]) => {
                                    if (typeof val === 'number') return `${k}: ${val.toFixed(2)}`;
                                    return `${k}: ${val}`;
                                }).join(' · ');
                            };
                            html += `<div class="codex-talent" style="margin-top:4px;padding-left:8px;border-left:1px dashed #3a3a5a;">`;
                            html += `<div class="codex-talent-name" style="font-size:0.8rem;color:#a78bfa;">⚡ ${spec.name}</div>`;
                            html += `<div class="codex-talent-desc" style="font-size:0.7rem;">${spec.desc}</div>`;
                            if (sp) {
                                html += `<div class="codex-talent-levels" style="font-size:0.7rem;">
                                    <span><b>Nv.100:</b> ${formatSpecVals(sv100)}</span>
                                    <span><b>Nv.500:</b> ${formatSpecVals(sv500)}</span>
                                </div>`;
                            }
                            html += `</div>`;
                        }
                        html += `</div>`;
                    }
                } else if (block.isMasteries) {
                    // Render masteries by slot
                    const slotIcons = { weapon: '🗡️', armor: '🛡️', ring: '💍' };
                    const slotNames = { weapon: 'Arma', armor: 'Armadura', ring: 'Anillo' };
                    const masteryLabels = {
                        crit_mastery: '% crítico', vampiric: '% lifesteal', fury: ' cada N golpes',
                        block_mastery: '% bloqueo', regen_mastery: '% HP', tough_mastery: '% reducción',
                        dodge_mastery: '% evasión', pen_mastery: '% PEN', fortune_mastery: '% duplicar',
                    };
                    for (const [slotKey, masteries] of Object.entries(MASTERIES)) {
                        html += `<div class="codex-talent" style="border-left: 3px solid #3a3a5a; padding-left: 10px;">`;
                        html += `<div class="codex-talent-name">${slotIcons[slotKey]} ${slotNames[slotKey]}</div>`;
                        for (const m of masteries) {
                            html += `<div class="codex-talent" style="margin-top: 6px;">`;
                            html += `<div class="codex-talent-name" style="font-size: 0.85rem;">${m.label}</div>`;
                            html += `<div class="codex-talent-desc">${m.desc}</div>`;
                            html += `<div class="codex-talent-levels">`;
                            const vals = m.values || m.thresholds;
                            const label = masteryLabels[m.id] || '';
                            const prefix = m.thresholds ? 'Cada ' : '+';
                            for (let i = 0; i < vals.length; i++) {
                                html += `<span><b>Nv.${i + 1}:</b> ${prefix}${vals[i]}${label}</span>`;
                            }
                            html += `</div></div>`;
                        }
                        html += `</div>`;
                    }
                } else if (block.isTalents) {
                    const talentCategories = [
                        { icon: '⚔️', name: 'Ofensivo', pool: TALENT_POOL.ofensivo },
                        { icon: '🛡️', name: 'Defensivo', pool: TALENT_POOL.defensivo },
                        { icon: '💀', name: 'Estado', pool: TALENT_POOL.estado },
                        { icon: '💚', name: 'Sustain', pool: TALENT_POOL.sustain },
                        { icon: '👑', name: 'Heroico', pool: TALENT_POOL.heroico },
                    ];
                    for (let ci = 0; ci < talentCategories.length; ci++) {
                        const cat = talentCategories[ci];
                        const catId = `codex-tcat-${bi}-${ci}`;
                        html += `<div class="codex-block" style="border: none; margin-bottom: 4px;">`;
                        html += `<div class="codex-block-title" onclick="toggleCodexTalentCat('${catId}')" style="font-size:0.85rem;padding:6px 10px;border-left:3px solid #3a3a5a;">`;
                        html += `<span>${cat.icon} ${cat.name}</span>`;
                        html += `<span class="arrow">▶</span>`;
                        html += `</div>`;
                        html += `<div class="codex-block-body" id="${catId}">`;
                        for (const t of cat.pool) {
                            html += `<div class="codex-talent" style="margin-top:6px;">`;
                            html += `<div class="codex-talent-name">${t.label}</div>`;
                            html += `<div class="codex-talent-desc">${t.desc}</div>`;
                            html += `<div class="codex-talent-levels">`;
                            for (let i = 0; i < t.levels.length; i++) {
                                const lvl = t.levels[i];
                                const parts = Object.entries(lvl).map(([k, v]) => {
                                    const label = keyLabels[k] || k;
                                    return `${v}${label}`;
                                }).join(' · ');
                                html += `<span><b>Nv.${i + 1}:</b> ${parts}</span>`;
                            }
                            html += `</div>`;
                            if (t.note) html += `<div class="codex-talent-note">${t.note}</div>`;
                            html += `</div>`;
                        }
                        html += `</div></div>`;
                    }
                } else if (block.isRunes) {
                    // Render rune conditions and effects
                    const runeCondId = `codex-runes-cond-${bi}`;
                    const runeEffId = `codex-runes-eff-${bi}`;
                    html += `<div class="codex-block" style="border:none;margin-bottom:4px;">
                        <div class="codex-block-title" onclick="toggleCodexTalentCat('${runeCondId}')" style="font-size:0.85rem;padding:6px 10px;border-left:3px solid #a78bfa;">
                            <span>⚡ Condiciones</span>
                            <span class="arrow">▶</span>
                        </div>
                        <div class="codex-block-body" id="${runeCondId}">
                            <div style="font-size:0.7rem;color:#6b7280;margin-bottom:6px;">Se activan cuando se cumple la condición en combate.</div>`;
                    for (const c of RUNE_CONDITIONS) {
                        html += `<div class="codex-talent" style="margin-top:6px;">
                            <div class="codex-talent-name">${c.label}</div>
                            <div class="codex-talent-desc">${c.desc} — Valores: ${c.values.join('/')}<span style="color:#9ca3af;font-size:0.65rem;"> (S/SS/SSS)</span></div>
                        </div>`;
                    }
                    html += `</div></div>`;

                    html += `<div class="codex-block" style="border:none;margin-bottom:4px;">
                        <div class="codex-block-title" onclick="toggleCodexTalentCat('${runeEffId}')" style="font-size:0.85rem;padding:6px 10px;border-left:3px solid #a78bfa;">
                            <span>✨ Efectos</span>
                            <span class="arrow">▶</span>
                        </div>
                        <div class="codex-block-body" id="${runeEffId}">
                            <div style="font-size:0.7rem;color:#6b7280;margin-bottom:6px;">Se aplican al activarse la condición.</div>`;
                    for (const e of RUNE_EFFECTS) {
                        html += `<div class="codex-talent" style="margin-top:6px;">
                            <div class="codex-talent-name">${e.label}</div>
                            <div class="codex-talent-desc">${e.desc} — Valores: ${e.values.join('/')}<span style="color:#9ca3af;font-size:0.65rem;"> (S/SS/SSS)</span></div>
                        </div>`;
                    }
                    html += `</div></div>`;
                } else if (block.isPrestige) {
                    // Render prestige artifact tree
                    const artifactNodes = BALANCE.heroArtifact.nodes;
                    const artifact = metaState.heroArtifact || { nodes: {}, legacyEssence: 0, rebirthCount: 0 };
                    const nodeLevels = artifact.nodes || {};
                    const legacyEssence = artifact.legacyEssence || 0;
                    const rebirthCount = artifact.rebirthCount || 0;

                    // Header with current essence
                    html += `<div class="codex-talent" style="border-left: 3px solid #fbbf24; padding-left: 10px; margin-bottom: 12px;">
                        <div class="codex-talent-name" style="color:#fbbf24; font-size:0.95rem;">🪶 Esencias de Legado: ${formatNum(legacyEssence)}</div>
                        <div class="codex-talent-desc" style="font-size:0.75rem;">Renacimientos realizados: ${rebirthCount}</div>
                        <div class="codex-talent-desc" style="font-size:0.7rem; color:#9ca3af; margin-top:4px;">
                            Fórmula al renacer: floor(sqrt(nivelHéreo) × max(pisoMax, 100) / 100)
                        </div>
                    </div>`;

                    // Stat nodes (ancestrales)
                    const statNodes = artifactNodes.filter(n => ['fuerza_ancestral','coraza_ancestral','vitalidad_ancestral','pasos_ancestrales'].includes(n.id));
                    const multNodes = artifactNodes.filter(n => !['fuerza_ancestral','coraza_ancestral','vitalidad_ancestral','pasos_ancestrales'].includes(n.id));

                    html += `<div class="codex-block" style="border: none; margin-bottom: 4px;">`;
                    html += `<div class="codex-block-title" onclick="toggleCodexTalentCat('codex-prestige-stats')" style="font-size:0.85rem;padding:6px 10px;border-left:3px solid #fbbf24;">`;
                    html += `<span>⚔️ Estadísticas Ancestrales</span>`;
                    html += `<span class="arrow">▶</span>`;
                    html += `</div>`;
                    html += `<div class="codex-block-body" id="codex-prestige-stats">`;
                    for (const n of statNodes) {
                        const lvl = nodeLevels[n.id] || 0;
                        const isFlat = n.flatBonus !== undefined;
                        const statName = isFlat ? (n.id === 'vitalidad_ancestral' ? 'HP' : n.id === 'pasos_ancestrales' ? 'AGI' : n.id === 'fuerza_ancestral' ? 'ATK' : 'DEF') : '';
                        let bonusText = '';
                        if (isFlat) {
                            const total = lvl * n.flatBonus;
                            bonusText = `+${formatNum(total)} ${statName} planos`;
                        } else {
                            const pct = lvl * n.bonus * 100;
                            bonusText = `+${pct.toFixed(0)}%`;
                        }
                        const costNext = Math.floor(5 * Math.sqrt(lvl + 1));
                        html += `<div class="codex-talent" style="margin-top:6px;">
                            <div class="codex-talent-name">${n.label}</div>
                            <div class="codex-talent-desc">${isFlat ? `+${formatNum(n.flatBonus)} ${statName}/nivel — ` : `+${(n.bonus * 100).toFixed(0)}% por nivel — `}Bonificación actual: ${bonusText}</div>
                            <div class="codex-talent-levels">
                                <span><b>Nivel actual:</b> ${lvl}${isFlat ? '' : '/5'}</span>
                                <span><b>Siguiente costo:</b> 🪶${costNext}</span>
                            </div>
                        </div>`;
                    }
                    html += `</div></div>`;

                    // Multiplier nodes
                    html += `<div class="codex-block" style="border: none; margin-bottom: 4px;">`;
                    html += `<div class="codex-block-title" onclick="toggleCodexTalentCat('codex-prestige-mult')" style="font-size:0.85rem;padding:6px 10px;border-left:3px solid #a78bfa;">`;
                    html += `<span>📈 Multiplicadores Globales</span>`;
                    html += `<span class="arrow">▶</span>`;
                    html += `</div>`;
                    html += `<div class="codex-block-body" id="codex-prestige-mult">`;
                    for (const n of multNodes) {
                        const lvl = nodeLevels[n.id] || 0;
                        const bonusPct = lvl * n.bonus * 100;
                        const costNext = Math.floor(5 * Math.sqrt(lvl + 1));
                        let effect = '';
                        if (n.id === 'herencia_equipo') effect = '+5% a TODAS las stats (HP/ATK/DEF/AGI)';
                        else if (n.id === 'talento_innato') effect = '+5% daño de DoTs y efectos de talentos';
                        else if (n.id === 'sabiduria_eterna') effect = '+5% XP ganada';
                        else if (n.id === 'fortuna_heroe') effect = '+5% chance de drop de equipo';
                        else if (n.id === 'ciclo_legado') effect = '+5% 🪶 esencias al Renacer';
                        else if (n.id === 'voluntad_heroe') effect = '+5% almas obtenidas';
                        html += `<div class="codex-talent" style="margin-top:6px;">
                            <div class="codex-talent-name">${n.label}</div>
                            <div class="codex-talent-desc">${effect} — Bonificación actual: +${bonusPct.toFixed(0)}%</div>
                            <div class="codex-talent-levels">
                                <span><b>Nivel actual:</b> ${lvl}</span>
                                <span><b>Siguiente costo:</b> 🪶${costNext}</span>
                            </div>
                        </div>`;
                    }
                    html += `</div></div>`;
                }
                html += `</div></div>`;
            }
            return html;
        }

        function toggleCodexBlock(idx) {
            const title = document.querySelectorAll('.codex-block-title')[idx];
            const body = document.getElementById(`codex-body-${idx}`);
            title.classList.toggle('open');
            body.classList.toggle('open');
        }

        function toggleCodexTalentCat(id) {
            const title = document.querySelector(`.codex-block-title[onclick*="'${id}'"]`);
            const body = document.getElementById(id);
            if (title) title.classList.toggle('open');
            if (body) body.classList.toggle('open');
        }

  Game.codex = { showCodex, closeCodex, buildCodexHTML, toggleCodexBlock, toggleCodexTalentCat };
  window.showCodex = showCodex;
  window.closeCodex = closeCodex;
  window.buildCodexHTML = buildCodexHTML;
  window.toggleCodexBlock = toggleCodexBlock;
  window.toggleCodexTalentCat = toggleCodexTalentCat;
})();
