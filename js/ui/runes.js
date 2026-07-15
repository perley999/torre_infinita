// runes.js — rune modal handlers (presentation).
// Extracted from js/game/runes.js (F4c-4, separate-ui-logic refactor).
(function() {
  'use strict';
  window.Game = window.Game || {};

  // ─── Modal state ──────────────────────────────────────
  let _runeModalStep = null; // 'main' | 'equip'
  let _runeEquipSlot = null;
  let _runePickSlot = null;      // slot destino
  let _runePickCond = null;      // conditionId elegido
  let _runePickEff = null;       // effectId elegido

  // ─── Main modal ───────────────────────────────────────
  function showRuneModal() {
    if (!metaState.unlockedReforge) return;
    _runeModalStep = 'main';
    _runeEquipSlot = null;
    renderRuneModal();
    document.getElementById('rune-overlay').classList.add('visible');
  }

  function closeRuneModal() {
    document.getElementById('rune-overlay').classList.remove('visible');
    _runeModalStep = null;
    _runeEquipSlot = null;
  }

  function renderRuneModal() {
    const content = document.getElementById('rune-content');

    if (_runeModalStep === 'equip') {
      content.innerHTML = renderRuneEquipPicker();
      return;
    }

    const slots = ['weapon', 'armor', 'ring'];
    const slotIcons = { weapon: '🗡️', armor: '🛡️', ring: '💍' };
    const slotLabels = { weapon: 'Arma', armor: 'Armadura', ring: 'Anillo' };

    // ── Section 1: Fabricar ──────────────────────
    const fabricarHTML = `
        <div class="rune-section">
            <h3>🔨 Fabricar Runa</h3>
            <div class="desc">Elegí fabricar una Condición o un Efecto. La runa se guarda en tu inventario para equipar después.</div>
            <div class="rune-fabricate-row">
                <div class="rune-fab-btn" onclick="showFabricateConfirm('condition')">
                    <span class="fab-icon">⚡</span>
                    <span class="fab-label">Condición</span>
                    <span class="fab-cost">10🔮 + 100💀</span>
                </div>
                <div class="rune-fab-btn" onclick="showFabricateConfirm('effect')">
                    <span class="fab-icon">✨</span>
                    <span class="fab-label">Efecto</span>
                    <span class="fab-cost">10🔮 + 100💀</span>
                </div>
            </div>
        </div>
    `;

    // ── Section 2: Mejorar (Enhance) — solo efectos ────
    let enhanceHTML = '';
    for (const slot of slots) {
      const item = metaState.equipment[slot];
      if (!item || !item.runas || !item.runas.conditionId) continue;
      const rn = item.runas;
      const effDef = findRuneEffect(rn.effectId);
      const effRarity = rn.effRarity || rn.rarity;
      const effEnh = rn.effEnhance ?? rn.enhance;
      const maxEnh = getRuneMaxEnhance(effRarity);
      const isMax = effEnh >= maxEnh;
      const cost = isMax ? 0 : Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, effEnh));
      const canEnhance = !isMax && metaState.runePowder >= cost;
      enhanceHTML += `
        <div class="rune-slot-row">
            <div class="rune-info">
                <div class="rune-name">${slotIcons[slot]} ${slotLabels[slot]} ✨</div>
                <div class="rune-detail">
                    ${effDef ? effDef.label : '?'} <span class="rarity-${effRarity}">${effRarity}+${effEnh}</span>
                </div>
                <div style="font-size:0.6rem;color:#6b7280;margin-top:1px;">
                    ${effDef ? effDef.desc : ''}
                </div>
            </div>
            <div class="rune-actions">
                ${isMax
                  ? `<span style="color:#4ade80;font-size:0.7rem;">✅ MAX</span>`
                  : `<button class="rune-action-btn primary" onclick="enhanceEffectInSlot('${slot}');renderRuneModal();" ${canEnhance ? '' : 'disabled'}>
                    +1 (${cost}🔮)
                   </button>`
                }
            </div>
        </div>
      `;
    }
    if (!enhanceHTML) {
      enhanceHTML = `<div class="rune-empty">No hay efectos equipados para mejorar. Mejorálos desde el inventario o equipá runas primero.</div>`;
    }
    const mejorarHTML = `
        <div class="rune-section">
            <h3>⬆️ Mejorar Efecto</h3>
            <div class="desc">Subí el nivel de mejora de un efecto equipado (+8% poder por nivel).</div>
            ${enhanceHTML}
        </div>
    `;

    // ── Section 3: Subir Rareza (individual) ──────
    let upgradeHTML = '';
    for (const slot of slots) {
      const item = metaState.equipment[slot];
      if (!item || !item.runas || !item.runas.conditionId) continue;
      const rn = item.runas;
      const condDef = findRuneCondition(rn.conditionId);
      const effDef = findRuneEffect(rn.effectId);
      const condRarity = rn.condRarity || rn.rarity;
      const effRarity = rn.effRarity || rn.rarity;

      // ── Condición ──
      let condTarget, condUpgCost;
      if (condRarity === 'S') {
        condTarget = 'SS';
        condUpgCost = BALANCE.runas.rarityConfig.SS?.upgradeCost;
      } else if (condRarity === 'SS') {
        condTarget = 'SSS';
        condUpgCost = BALANCE.runas.rarityConfig.SSS?.upgradeCost;
      }
      if (condTarget) {
        const curMaxEnh = getRuneMaxEnhance(condRarity);
        const enhTotal = calcCumulativeEnhanceCost(curMaxEnh);
        const totalPowder = enhTotal + (condUpgCost?.powder ?? 0);
        const canAffordCond = condUpgCost && metaState.runePowder >= totalPowder && metaState.souls >= condUpgCost.souls;
        upgradeHTML += `
            <div class="rune-slot-row">
                <div class="rune-info">
                    <div class="rune-name">${slotIcons[slot]} ${slotLabels[slot]} ⚡</div>
                    <div class="rune-detail">
                        ${condDef ? condDef.label : '?'} <span class="rarity-${condRarity}">${condRarity}</span>
                    </div>
                    <div style="font-size:0.6rem;color:#6b7280;margin-top:1px;">
                        ${condDef ? condDef.desc : ''}
                    </div>
                </div>
                <div class="rune-actions">
                    <button class="rune-action-btn primary" onclick="upgradeConditionInSlot('${slot}');renderRuneModal();" ${canAffordCond ? '' : 'disabled'}>
                        → ${condTarget} (${totalPowder}🔮+${condUpgCost?.souls ?? 0}💀)
                    </button>
                </div>
            </div>
        `;
      }

      // ── Efecto ──
      let effTarget, effUpgCost, requireMax;
      if (effRarity === 'S') {
        effTarget = 'SS';
        effUpgCost = BALANCE.runas.rarityConfig.SS?.upgradeCost;
        requireMax = getRuneMaxEnhance('S');
      } else if (effRarity === 'SS') {
        effTarget = 'SSS';
        effUpgCost = BALANCE.runas.rarityConfig.SSS?.upgradeCost;
        requireMax = getRuneMaxEnhance('SS');
      }
      if (effTarget) {
        const effEnh = rn.effEnhance ?? rn.enhance;
        const meetsReq = effEnh >= requireMax;
        const canAffordEff = effUpgCost && metaState.runePowder >= effUpgCost.powder && metaState.souls >= effUpgCost.souls;
        upgradeHTML += `
            <div class="rune-slot-row">
                <div class="rune-info">
                    <div class="rune-name">${slotIcons[slot]} ${slotLabels[slot]} ✨</div>
                    <div class="rune-detail">
                        ${effDef ? effDef.label : '?'} <span class="rarity-${effRarity}">${effRarity}+${effEnh}</span>
                        ${meetsReq ? '' : `<span style="color:#ef4444;font-size:0.7rem;"> (requiere +${requireMax})</span>`}
                    </div>
                    <div style="font-size:0.6rem;color:#6b7280;margin-top:1px;">
                        ${effDef ? effDef.desc : ''}
                    </div>
                </div>
                <div class="rune-actions">
                    ${effUpgCost ? `<button class="rune-action-btn primary" onclick="upgradeEffectInSlot('${slot}');renderRuneModal();" ${(meetsReq && canAffordEff) ? '' : 'disabled'}>
                        → ${effTarget} (${effUpgCost.powder}🔮+${effUpgCost.souls}💀)
                    </button>` : ''}
                </div>
            </div>
        `;
      }
    }
    if (!upgradeHTML) {
      upgradeHTML = `<div class="rune-empty">No hay runas elegibles para subir de rareza.</div>`;
    }
    const upgradeSectionHTML = `
        <div class="rune-section">
            <h3>⬆️ Subir Rareza</h3>
            <div class="desc">Mejorá la rareza de condición o efecto. La condición paga costo acumulado (sin enhance). El efecto requiere máximo +enhance de su rareza actual y se resetea a +0.</div>
            ${upgradeHTML}
        </div>
    `;

    // ── Section 4: Inventario ────────────────────
    const invKeys = Object.keys(metaState.runeInventory);
    let invHTML = '';
    const conds = {};
    const effs = {};
    for (const key of invKeys) {
      const r = metaState.runeInventory[key];
      if (r.conditionId) conds[key] = r;
      if (r.effectId) effs[key] = r;
    }
    const condKeys = Object.keys(conds);
    const effKeys = Object.keys(effs);
    if (condKeys.length > 0 || effKeys.length > 0) {
      invHTML = `<div class="rune-section">
        <h3>📦 Inventario</h3>
        <div class="desc">Runas disponibles. Equipalas desde la pantalla de personaje.</div>`;
      if (condKeys.length > 0) {
        invHTML += `<div style="font-size:0.75rem;color:#9ca3af;margin-bottom:4px;">⚡ Condiciones:</div>`;
        for (const key of condKeys) {
          const r = conds[key];
          const def = findRuneCondition(r.conditionId);
          const isSss = r.rarity === 'SSS';
          let actionBtn = '';
          if (isSss) {
            actionBtn = `<span style="color:#4ade80;font-size:0.65rem;">✅ MAX</span>`;
          } else {
            const targetRarity = r.rarity === 'S' ? 'SS' : 'SSS';
            const currentMax = getRuneMaxEnhance(r.rarity);
            const enhanceTotal = calcCumulativeEnhanceCost(currentMax);
            const upgCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
            if (upgCost) {
              const totalPowder = enhanceTotal + upgCost.powder;
              actionBtn = `<button class="rune-action-btn primary" style="font-size:0.65rem;padding:2px 8px;" onclick="upgradeConditionRarity('${key}');renderRuneModal();">⬆️ ${targetRarity} (${totalPowder}🔮)</button>`;
            }
          }
          invHTML += `<div class="rune-inv-item" style="display:block;width:100%;margin:0 0 4px 0;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:600;font-size:0.75rem;">${def ? def.label : '?'} <span class="rarity-${r.rarity}">${r.rarity}</span></div>
                ${actionBtn}
            </div>
            <div style="font-size:0.65rem;color:#6b7280;">${def ? def.desc : ''}</div>
          </div>`;
        }
      }
      if (effKeys.length > 0) {
        invHTML += `<div style="font-size:0.75rem;color:#9ca3af;margin-top:4px;margin-bottom:4px;">✨ Efectos:</div>`;
        for (const key of effKeys) {
          const r = effs[key];
          const def = findRuneEffect(r.effectId);
          const maxEnh = getRuneMaxEnhance(r.rarity);
          const isMax = r.enhance >= maxEnh;
          const isSss = r.rarity === 'SSS';
          let actionBtn = '';
          if (isSss) {
            actionBtn = `<span style="color:#4ade80;font-size:0.65rem;">✅ MAX</span>`;
          } else if (!isMax) {
            const cost = Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, r.enhance));
            const canAfford = metaState.runePowder >= cost;
            actionBtn = `<button class="rune-action-btn primary" style="font-size:0.65rem;padding:2px 8px;" ${canAfford ? '' : 'disabled'} onclick="enhanceEffectInInventory('${key}');renderRuneModal();">+1 (${cost}🔮)</button>`;
          } else {
            // At max enhance, can upgrade rarity
            const targetRarity = r.rarity === 'S' ? 'SS' : 'SSS';
            const upgCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
            if (upgCost) {
              const canAffordUpg = metaState.runePowder >= upgCost.powder && metaState.souls >= upgCost.souls;
              actionBtn = `<button class="rune-action-btn primary" style="font-size:0.65rem;padding:2px 8px;" ${canAffordUpg ? '' : 'disabled'} onclick="upgradeEffectInInventory('${key}');renderRuneModal();">⬆️ ${targetRarity} (${upgCost.powder}🔮+${upgCost.souls}💀)</button>`;
            }
          }
          invHTML += `<div class="rune-inv-item" style="display:block;width:100%;margin:0 0 4px 0;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:600;font-size:0.75rem;">${def ? def.label : '?'} <span class="rarity-${r.rarity}">${r.rarity}+${r.enhance}</span></div>
                ${actionBtn}
            </div>
            <div style="font-size:0.65rem;color:#6b7280;">${def ? def.desc : ''}</div>
          </div>`;
        }
      }
      invHTML += `</div>`;
    }

    content.innerHTML = fabricarHTML + mejorarHTML + upgradeSectionHTML + invHTML;
  }

  // ─── Confirmación: Fabricar ───────────────────
  function showFabricateConfirm(poolType) {
    const cost = BALANCE.runas.fabricateCost;
    const label = poolType === 'condition' ? '⚡ Condición' : '✨ Efecto';
    const canAfford = metaState.runePowder >= cost.powder && metaState.souls >= cost.souls;

    // Check if there are any unowned runes of this type
    const ownedIds = new Set();
    for (const r of Object.values(metaState.runeInventory)) {
      if (poolType === 'condition' && r.conditionId) ownedIds.add(r.conditionId);
      if (poolType === 'effect' && r.effectId) ownedIds.add(r.effectId);
    }
    for (const slot of ['weapon', 'armor', 'ring']) {
      const item = metaState.equipment[slot];
      if (item && item.runas && item.runas.conditionId) {
        if (poolType === 'condition') ownedIds.add(item.runas.conditionId);
        if (poolType === 'effect') ownedIds.add(item.runas.effectId);
      }
    }
    const pool = poolType === 'condition' ? RUNE_CONDITIONS : RUNE_EFFECTS;
    const available = pool.filter(e => !ownedIds.has(e.id));
    const noMore = available.length === 0;
    const poolLabel = poolType === 'condition' ? 'condiciones' : 'efectos';

    const content = document.getElementById('rune-content');
    content.innerHTML = `
        <div class="rune-confirm-box">
            <div class="confirm-question">¿Fabricar ${label}?</div>
            <div class="confirm-cost">Costo: ${cost.powder}🔮 + ${cost.souls}💀</div>
            ${noMore ? `<div style="color:#ef4444;font-size:0.8rem;margin-bottom:8px;">❌ Ya tenés todas las ${poolLabel} disponibles.</div>` : ''}
            ${!canAfford && !noMore ? `<div style="color:#ef4444;font-size:0.8rem;margin-bottom:8px;">❌ No tenés suficientes recursos</div>` : ''}
            <div class="confirm-btns">
                <button class="btn-confirm" onclick="doFabricate('${poolType}')" ${(canAfford && !noMore) ? '' : 'disabled'}>✅ Fabricar</button>
                <button class="btn-cancel" onclick="renderRuneModal()">❌ Cancelar</button>
            </div>
        </div>
    `;
  }

  function doFabricate(poolType) {
    fabricateRune(poolType);
    renderRuneModal();
  }

  // ─── Equipar: selector manual de condición + efecto ──
  function showRuneEquipPicker(slot) {
    _runePickSlot = slot;
    _runePickCond = null;
    _runePickEff = null;
    _runeModalStep = 'equip';
    renderRuneModal();
    document.getElementById('rune-overlay').classList.add('visible');
  }

  function renderRuneEquipPicker() {
    const slotLabels = { weapon: '🗡️ Arma', armor: '🛡️ Armadura', ring: '💍 Anillo' };
    const invEntries = Object.entries(metaState.runeInventory);
    const condEntries = invEntries.filter(([, r]) => r.conditionId);
    const effEntries = invEntries.filter(([, r]) => r.effectId);

    // Step: pick condition
    if (!_runePickCond) {
      let html = `<p style="text-align:center;color:#9ca3af;font-size:0.85rem;margin-bottom:10px;">Paso 1: Elegí una Condición para ${slotLabels[_runePickSlot] || _runePickSlot}</p>`;
      if (condEntries.length === 0) {
        html += `<p style="text-align:center;color:#ef4444;font-size:0.8rem;">❌ No tenés condiciones en el inventario. Fabricá una en "🔮 Runas".</p>`;
      } else {
        for (const [key, r] of condEntries) {
          const def = findRuneCondition(r.conditionId);
          html += `<button class="rune-inv-item block" onclick="_runePickCond='${r.conditionId}';renderRuneModal();" style="padding:8px 10px;">
            <div style="font-weight:600;font-size:0.75rem;">⚡ ${def ? def.label : r.conditionId} <span class="rarity-${r.rarity}">${r.rarity}+${r.enhance}</span></div>
            <div style="font-size:0.65rem;color:#6b7280;margin-top:2px;">${def ? def.desc : ''}</div>
          </button>`;
        }
      }
      html += `<br><button class="modal-close" onclick="closeRuneModal()" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Cancelar</button>`;
      return html;
    }

    // Step: pick effect
    if (!_runePickEff) {
      const condDef = findRuneCondition(_runePickCond);
      let html = `<p style="text-align:center;color:#9ca3af;font-size:0.85rem;margin-bottom:10px;">Paso 2: Elegí un Efecto para ${condDef ? condDef.label : _runePickCond}</p>`;
      if (effEntries.length === 0) {
        html += `<p style="text-align:center;color:#ef4444;font-size:0.8rem;">❌ No tenés efectos en el inventario. Fabricá uno en "🔮 Runas".</p>`;
      } else {
        for (const [key, r] of effEntries) {
          const def = findRuneEffect(r.effectId);
          const isDuplicate = !isRuneCombinationUnique(_runePickCond, r.effectId, _runePickSlot);
          if (isDuplicate) continue; // skip combos already used
          html += `<button class="rune-inv-item block" onclick="_runePickEff='${r.effectId}';renderRuneModal();" style="padding:8px 10px;">
            <div style="font-weight:600;font-size:0.75rem;">✨ ${def ? def.label : r.effectId} <span class="rarity-${r.rarity}">${r.rarity}+${r.enhance}</span></div>
            <div style="font-size:0.65rem;color:#6b7280;margin-top:2px;">${def ? def.desc : ''}</div>
          </button>`;
        }
      }
      html += `<br><button class="modal-close" onclick="_runePickCond=null;renderRuneModal();" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Volver</button>`;
      return html;
    }

    // Step: confirm
    const condDef = findRuneCondition(_runePickCond);
    const effDef = findRuneEffect(_runePickEff);
    // Find actual inventory items to get rarity/enhance
    const condInvEntry = Object.entries(metaState.runeInventory).find(([, r]) => r.conditionId === _runePickCond);
    const effInvEntry = Object.entries(metaState.runeInventory).find(([, r]) => r.effectId === _runePickEff);
    const condRuna = condInvEntry ? condInvEntry[1] : null;
    const effRuna = effInvEntry ? effInvEntry[1] : null;
    // Use the better rarity/enhance from both pieces
    const rarityOrder = { 'S': 0, 'SS': 1, 'SSS': 2 };
    let finalRarity = 'S', finalEnhance = 0;
    if (condRuna && effRuna) {
      finalRarity = rarityOrder[condRuna.rarity] >= rarityOrder[effRuna.rarity] ? condRuna.rarity : effRuna.rarity;
      finalEnhance = Math.max(condRuna.enhance, effRuna.enhance);
    } else if (condRuna) {
      finalRarity = condRuna.rarity; finalEnhance = condRuna.enhance;
    } else if (effRuna) {
      finalRarity = effRuna.rarity; finalEnhance = effRuna.enhance;
    }

    return `
        <div class="rune-confirm-box">
            <p style="text-align:center;color:#9ca3af;font-size:0.85rem;margin-bottom:10px;">Confirmar equipamiento</p>
            <div style="text-align:center;font-size:0.9rem;margin-bottom:2px;">
                ⚡ ${condDef ? condDef.label : '?'} → ✨ ${effDef ? effDef.label : '?'}
            </div>
            <div style="text-align:center;font-size:0.65rem;color:#6b7280;margin-bottom:6px;">
                ${condDef ? condDef.desc : ''} → ${effDef ? effDef.desc : ''}
            </div>
            <div style="text-align:center;font-size:0.75rem;color:#60a5fa;margin-bottom:10px;">
                Rareza: ${finalRarity} | Enhance: +${finalEnhance}
            </div>
            <div class="confirm-btns">
                <button class="btn-confirm" onclick="confirmManualEquip('${_runePickSlot}', '${_runePickCond}', '${_runePickEff}')">✅ Equipar</button>
                <button class="btn-cancel" onclick="_runePickEff=null;renderRuneModal();">← Volver</button>
            </div>
        </div>
    `;
  }

  function confirmManualEquip(slot, conditionId, effectId) {
    const item = metaState.equipment[slot];
    if (!item) {
      addLog(`❌ No hay equipo en ${slot}`, 'system');
      closeRuneModal();
      return;
    }

    // Find inventory items
    const condKey = Object.keys(metaState.runeInventory).find(k => metaState.runeInventory[k].conditionId === conditionId);
    const effKey = Object.keys(metaState.runeInventory).find(k => metaState.runeInventory[k].effectId === effectId);
    if (!condKey || !effKey) {
      addLog(`❌ Runa no encontrada en inventario`, 'system');
      closeRuneModal();
      return;
    }

    const condRuna = metaState.runeInventory[condKey];
    const effRuna = metaState.runeInventory[effKey];

    // Check unique combination
    if (!isRuneCombinationUnique(conditionId, effectId, slot)) {
      addLog(`❌ Esta combinación de runa ya está equipada en otra pieza`, 'system');
      return;
    }

    // Determine final rarity/enhance (best of both)
    const rarityOrder = { 'S': 0, 'SS': 1, 'SSS': 2 };
    const finalRarity = rarityOrder[condRuna.rarity] >= rarityOrder[effRuna.rarity] ? condRuna.rarity : effRuna.rarity;
    const finalEnhance = Math.max(condRuna.enhance, effRuna.enhance);

    // Remove from inventory
    delete metaState.runeInventory[condKey];
    delete metaState.runeInventory[effKey];

    // Assign to equipment — store individual component states
    item.runas = {
      conditionId: conditionId,
      effectId: effectId,
      rarity: finalRarity,
      enhance: finalEnhance,
      condRarity: condRuna.rarity || 'S',
      effRarity: effRuna.rarity || 'S',
      effEnhance: effRuna.enhance || 0,
    };

    saveGame();
    render();
    const condDef = findRuneCondition(conditionId);
    const effDef = findRuneEffect(effectId);
    addLog(`🔮 Runa equipada: ${condDef ? condDef.label : '?'} → ${effDef ? effDef.label : '?'}`, 'loot');

    _runeModalStep = null;
    _runePickSlot = null;
    _runePickCond = null;
    _runePickEff = null;
    closeRuneModal();
    if (runState.characterScreenActive) {
      setTimeout(renderCharacterScreen, 50);
    }
  }

  function cancelRuneEquip() {
    _runeModalStep = 'main';
    _runeEquipSlot = null;
    renderRuneModal();
  }

  // Expose public API
  Game.runes = {
    showRuneModal: showRuneModal,
    closeRuneModal: closeRuneModal,
    renderRuneModal: renderRuneModal,
    showFabricateConfirm: showFabricateConfirm,
    doFabricate: doFabricate,
    showRuneEquipPicker: showRuneEquipPicker,
    renderRuneEquipPicker: renderRuneEquipPicker,
    confirmManualEquip: confirmManualEquip,
    cancelRuneEquip: cancelRuneEquip
  };

  // Temporary window bridges for inline code
  window.showRuneModal = showRuneModal;
  window.closeRuneModal = closeRuneModal;
  window.renderRuneModal = renderRuneModal;
  window.showFabricateConfirm = showFabricateConfirm;
  window.doFabricate = doFabricate;
  window.showRuneEquipPicker = showRuneEquipPicker;
  window.renderRuneEquipPicker = renderRuneEquipPicker;
  window.confirmManualEquip = confirmManualEquip;
  window.cancelRuneEquip = cancelRuneEquip;
  window._runePickCond = _runePickCond;
  window._runePickEff = _runePickEff;
})();
