// character.js — class/spec selection modals, character screen, rune section.
// Extracted from js/game/classes.js (F4c-1, separate-ui-logic refactor).
(function() {
  'use strict';
  window.Game = window.Game || {};

  let _pendingNewClass = null;

  // --- Modal: Class Selection (level 50) ---
  function showClassSelection() {
    runState.pendingChoice = 'class';
    const overlay = document.getElementById('choice-overlay');
    document.getElementById('choice-title').textContent = '🏛️ Elige tu Clase';
    document.getElementById('choice-desc').textContent = 'Has alcanzado el nivel 50. Elige una clase para potenciar tus stats por nivel.';
    const grid = document.getElementById('choice-grid');
    grid.innerHTML = '';
    for (const cls of Object.values(CLASS_CONFIG)) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.style.borderLeft = `4px solid ${cls.color}`;
      const passive = CLASS_PASSIVES[cls.id];
      const pv = passive ? passive.eval(50) : {};
      const pDesc = passive ? Object.entries(pv).map(([k, v]) => {
        if (k === 'mult') return `×${v.toFixed(2)}`;
        if (k === 'speedPct') return `${v}% vel`;
        if (k === 'dodgePct') return `${v}% eva`;
        if (k === 'lifestealPct') return `${v}% lifesteal`;
        if (k === 'dotDmgPct') return `${v}% DoT`;
        if (k === 'bonusDmg') return `+${v}%`;
        return `${k}:${v}`;
      }).join(' ') : '';
      btn.innerHTML = `
        <span class="title" style="color:${cls.color}">${cls.emoji} ${cls.name}</span>
        <span class="desc">❤️+${cls.statPerLevel.hp}/nv ⚔️+${cls.statPerLevel.atk}/nv 🛡️+${cls.statPerLevel.def}/nv 🏃+${cls.statPerLevel.agi}/nv</span>
        <span class="desc" style="color:#fbbf24;font-size:0.75rem;">${passive ? passive.name + ': ' + passive.desc : ''}</span>
      `;
      btn.onclick = () => {
        metaState.playerClass = cls.id;
        metaState.playerSpec = null;
        if (runState.active) {
          const cb = calcularClassBonuses(runState.level, cls.id);
          const prevCb = calcularClassBonuses(runState.level, null);
          runState.runBonuses.hp += cb.hp;
          runState.runBonuses.atk += cb.atk;
          runState.runBonuses.def += cb.def;
          runState.runBonuses.agi += cb.agi;
          metaState.heroBonuses = { ...runState.runBonuses };
        }
        addLog(`🏛️ ¡${cls.name} seleccionado! La pasiva ${passive ? passive.name : ''} está activa.`, 'system');
        document.getElementById('choice-overlay').classList.remove('visible');
        runState.pendingChoice = null;
        if (runState.level >= 100 && !metaState.playerSpec) {
          saveGame();
          showSpecSelection();
        } else {
          saveGame();
          render();
          updateButtons();
        }
      };
      grid.appendChild(btn);
    }
    overlay.classList.add('visible');
  }

  // --- Modal: Spec Selection (level 100) ---
  function showSpecSelection() {
    if (!metaState.playerClass) {
      addLog('❌ Necesitás elegir una clase primero (nivel 50) antes de especializarte.', 'system');
      checkLevelUp();
      return;
    }
    runState.pendingChoice = 'spec';
    const overlay = document.getElementById('choice-overlay');
    document.getElementById('choice-title').textContent = '⚡ Elige tu Especialización';
    document.getElementById('choice-desc').textContent = `Has alcanzado el nivel 100. Especializá a tu ${getClassName(metaState.playerClass)}.`;
    const grid = document.getElementById('choice-grid');
    grid.innerHTML = '';
    const specs = SPECIALIZATIONS[metaState.playerClass] || [];
    for (const spec of specs) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      const passive = SPEC_PASSIVES[spec.id];
      const pv = passive ? passive.eval(100) : {};
      const pDesc = passive ? Object.entries(pv).map(([k, v]) => {
        if (typeof v === 'number') return `${k}: ${v.toFixed(2)}`;
        return `${k}:${v}`;
      }).join(' · ') : '';
      btn.innerHTML = `
        <span class="title">${spec.name}</span>
        <span class="desc">${spec.desc}</span>
        <span class="desc" style="color:#fbbf24;font-size:0.75rem;">${passive ? passive.name + ': ' + pDesc : ''}</span>
      `;
      btn.onclick = () => {
        metaState.playerSpec = spec.id;
        addLog(`⚡ Especialización: ${spec.name} activada.`, 'system');
        document.getElementById('choice-overlay').classList.remove('visible');
        runState.pendingChoice = null;
        saveGame();
        render();
        updateButtons();
      };
      grid.appendChild(btn);
    }
    overlay.classList.add('visible');
  }

  // --- Modal: Change Spec ---
  function showSpecChangeConfirm() {
    if (!metaState.playerClass || !metaState.playerSpec) {
      addLog('❌ Necesitás tener clase y especialización para cambiarla.', 'system');
      return;
    }
    const overlay = document.getElementById('choice-overlay');
    document.getElementById('choice-title').textContent = '⚡ Cambiar Especialización';
    const cost = Math.floor(metaState.souls * 0.1);
    const grid = document.getElementById('choice-grid');
    grid.innerHTML = '';
    document.getElementById('choice-desc').innerHTML = `
      Especialización actual: ⚡ ${getSpecName(metaState.playerSpec)}<br>
      Costo: ${formatNum(cost)} 💀 (10% de tus almas)<br>
      Elegí una nueva especialización:
    `;
    const specs = SPECIALIZATIONS[metaState.playerClass] || [];
    for (const spec of specs) {
      if (spec.id === metaState.playerSpec) continue;
      const passive = SPEC_PASSIVES[spec.id];
      const pv = passive ? passive.eval(Math.max(100, runState.level)) : {};
      const pDesc = passive ? Object.entries(pv).map(([k, v]) => {
        if (typeof v === 'number') return `${k}: ${v.toFixed(2)}`;
        return `${k}: ${v}`;
      }).join(' · ') : '';
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `
        <span class="title">${spec.name}</span>
        <span class="desc">${spec.desc}</span>
        <span class="desc" style="color:#fbbf24;font-size:0.75rem;">${passive ? passive.name + ': ' + pDesc : ''}</span>
      `;
      btn.onclick = () => {
        document.getElementById('choice-title').textContent = '⚠️ Confirmar Cambio';
        document.getElementById('choice-desc').innerHTML = `
          ¿Cambiar de <strong>${getSpecName(metaState.playerSpec)}</strong> a <strong>${spec.name}</strong>?<br>
          Costo: ${formatNum(cost)} 💀<br>
          ${cost > 0 ? `Te quedarán ${formatNum(metaState.souls - cost)} 💀` : ''}
        `;
        grid.innerHTML = `
          <button class="choice-btn" onclick="Game.character.confirmSpecChange('${spec.id}')">
            <span class="title" style="color:#4ade80;">✅ Sí, cambiar a ${spec.name}</span>
          </button>
          <button class="choice-btn" onclick="Game.character.showSpecChangeConfirm()">
            <span class="title" style="color:#9ca3af;">🔙 Volver</span>
          </button>
        `;
      };
      grid.appendChild(btn);
    }
    const backBtn = document.createElement('button');
    backBtn.className = 'choice-btn';
    backBtn.style.cssText = 'background:transparent;border:1px solid #4a4a6a;border-radius:8px;padding:10px;cursor:pointer;color:#9ca3af;text-align:center;margin-top:8px;';
    backBtn.textContent = '🔙 Volver';
    backBtn.onclick = () => {
      document.getElementById('choice-overlay').classList.remove('visible');
      runState.pendingChoice = null;
      if (runState.characterScreenActive) renderCharacterScreen();
    };
    grid.appendChild(backBtn);
    overlay.classList.add('visible');
  }

  function confirmSpecChange(newSpec) {
    if (!metaState.playerClass || !metaState.playerSpec) return;
    const cost = Math.floor(metaState.souls * 0.1);
    metaState.souls -= cost;
    metaState.playerSpec = newSpec;
    addLog(`⚡ Especialización cambiada a ${getSpecName(newSpec)}.`, 'system');
    const overlay = document.getElementById('choice-overlay');
    if (overlay) overlay.classList.remove('visible');
    runState.pendingChoice = null;
    saveGame();
    render();
    if (runState.characterScreenActive) renderCharacterScreen();
  }

  // --- Modal: Change Class ---
  function showClassChangeConfirm() {
    if (!metaState.playerClass) {
      addLog('❌ Aún no tenés clase seleccionada.', 'system');
      return;
    }
    const overlay = document.getElementById('choice-overlay');
    document.getElementById('choice-title').textContent = '🔄 Cambiar de Clase';
    const cost = Math.floor(metaState.souls * 0.5);
    const grid = document.getElementById('choice-grid');
    grid.innerHTML = '';
    document.getElementById('choice-desc').innerHTML = `
      Clase actual: ${CLASS_CONFIG[metaState.playerClass]?.emoji || ''} ${getClassName(metaState.playerClass)}<br>
      Costo: ${formatNum(cost)} 💀 (50% de tus almas)<br>
      Elegí una nueva clase:
    `;
    for (const cls of Object.values(CLASS_CONFIG)) {
      if (cls.id === metaState.playerClass) continue;
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.style.borderLeft = `4px solid ${cls.color}`;
      btn.innerHTML = `
        <span class="title" style="color:${cls.color}">${cls.emoji} ${cls.name}</span>
        <span class="desc">❤️+${cls.statPerLevel.hp}/nv ⚔️+${cls.statPerLevel.atk}/nv 🛡️+${cls.statPerLevel.def}/nv 🏃+${cls.statPerLevel.agi}/nv</span>
      `;
      btn.onclick = () => {
        _pendingNewClass = cls.id;
        document.getElementById('choice-title').textContent = '⚠️ Confirmar Cambio';
        document.getElementById('choice-desc').innerHTML = `
          ¿Cambiar de ${getClassName(metaState.playerClass)} a <strong style="color:${cls.color}">${cls.emoji} ${cls.name}</strong>?<br>
          Costo: ${formatNum(cost)} 💀<br>
          ${cost > 0 ? `Te quedarán ${formatNum(metaState.souls - cost)} 💀` : ''}
        `;
        grid.innerHTML = `
          <button class="choice-btn" onclick="Game.character.confirmClassChange('${cls.id}')">
            <span class="title" style="color:#4ade80;">✅ Sí, cambiar a ${cls.name}</span>
          </button>
          <button class="choice-btn" onclick="Game.character.cancelClassChange()">
            <span class="title" style="color:#ef4444;">❌ Cancelar</span>
          </button>
        `;
      };
      grid.appendChild(btn);
    }
    const backBtn = document.createElement('button');
    backBtn.className = 'choice-btn';
    backBtn.style.cssText = 'background:transparent;border:1px solid #4a4a6a;border-radius:8px;padding:10px;cursor:pointer;color:#9ca3af;text-align:center;margin-top:8px;';
    backBtn.textContent = '🔙 Volver';
    backBtn.onclick = () => {
      document.getElementById('choice-overlay').classList.remove('visible');
      runState.pendingChoice = null;
      if (runState.characterScreenActive) renderCharacterScreen();
    };
    grid.appendChild(backBtn);
    overlay.classList.add('visible');
  }

  function confirmClassChange(newClass) {
    const cost = Math.floor(metaState.souls * 0.5);
    metaState.souls -= cost;
    metaState.playerClass = newClass;
    metaState.playerSpec = null;
    addLog(`🔄 Clase cambiada a ${getClassName(newClass)}.`, 'system');
    const overlay = document.getElementById('choice-overlay');
    if (overlay) overlay.classList.remove('visible');
    runState.pendingChoice = null;
    if (runState.active) {
      const tiered = calcTieredBonuses(runState.level);
      const cbNew = calcularClassBonuses(runState.level, newClass);
      runState.runBonuses = {
        hp: tiered.hp + cbNew.hp,
        atk: tiered.atk + cbNew.atk,
        def: tiered.def + cbNew.def,
        agi: tiered.agi + cbNew.agi,
      };
      metaState.heroBonuses = { ...runState.runBonuses };
    }
    saveGame();
    render();
  }

  function cancelClassChange() {
    _pendingNewClass = null;
    const overlay = document.getElementById('choice-overlay');
    if (overlay) overlay.classList.remove('visible');
    runState.pendingChoice = null;
  }

  // --- Character Screen ---
  function showCharacterScreen() {
    runState.characterScreenActive = true;
    render();
    setTimeout(renderCharacterScreen, 50);
  }

  function closeCharacterScreen() {
    runState.characterScreenActive = false;
    const existing = document.getElementById('char-screen-overlay');
    if (existing) existing.remove();
    render();
  }

  function renderCharacterScreen() {
    const game = document.getElementById('game');
    const existing = document.getElementById('char-screen-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'char-screen-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:#0a0a12;z-index:999;overflow-y:auto;';
    const p = runState.player;
    const classColor = metaState.playerClass ? (CLASS_CONFIG[metaState.playerClass]?.color || '#3b82f6') : '#3b82f6';
    const emoji = metaState.playerClass ? (CLASS_CONFIG[metaState.playerClass]?.emoji || '🤺') : '🤺';
    const className = metaState.playerClass ? getClassName(metaState.playerClass) : 'Héroe';

    let html = `
      <h2 style="color:${classColor};margin:0 0 16px 0;">${emoji} ${metaState.playerName} — ${className}</h2>
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:16px;border:2px solid ${classColor};margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#9ca3af;">Nivel ${runState.level}</span>
          <span style="color:#fbbf24;">🏛️ ${className}</span>
          ${metaState.playerSpec ? `<span style="color:#a78bfa;">⚡ ${getSpecName(metaState.playerSpec)}</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
          <div style="background:#111118;border-radius:8px;padding:8px;border:1px solid #2a2a4a;">
            <div style="font-size:0.7rem;color:#9ca3af;margin-bottom:4px;">❤️ HP</div>
            <div style="font-weight:700;font-size:1.1rem;color:#ef4444;">${formatNum(p.maxHp)}</div>
            <div style="font-size:0.6rem;color:#6b7280;">
              Base ${formatNum(BALANCE.player.hp)} | Nv ${formatNum(runState.runBonuses.hp)} | Eq ${formatNum(calcEqStat('hp'))}
              ${metaState.playerClass ? `| Clase ${formatNum(calcularClassBonuses(runState.level, metaState.playerClass).hp)}` : ''}
            </div>
          </div>
          <div style="background:#111118;border-radius:8px;padding:8px;border:1px solid #2a2a4a;">
            <div style="font-size:0.7rem;color:#9ca3af;margin-bottom:4px;">⚔️ ATK</div>
            <div style="font-weight:700;font-size:1.1rem;color:#f59e0b;">${formatNum(p.atk)}</div>
            <div style="font-size:0.6rem;color:#6b7280;">
              Base ${formatNum(BALANCE.player.atk)} | Nv ${formatNum(runState.runBonuses.atk)} | Eq ${formatNum(calcEqStat('atk'))}
              ${metaState.playerClass ? `| Clase ${formatNum(calcularClassBonuses(runState.level, metaState.playerClass).atk)}` : ''}
            </div>
          </div>
          <div style="background:#111118;border-radius:8px;padding:8px;border:1px solid #2a2a4a;">
            <div style="font-size:0.7rem;color:#9ca3af;margin-bottom:4px;">🛡️ DEF</div>
            <div style="font-weight:700;font-size:1.1rem;color:#3b82f6;">${formatNum(p.def)}</div>
            <div style="font-size:0.6rem;color:#6b7280;">
              Base ${formatNum(BALANCE.player.def)} | Nv ${formatNum(runState.runBonuses.def)} | Eq ${formatNum(calcEqStat('def'))}
              ${metaState.playerClass ? `| Clase ${formatNum(calcularClassBonuses(runState.level, metaState.playerClass).def)}` : ''}
            </div>
          </div>
          <div style="background:#111118;border-radius:8px;padding:8px;border:1px solid #2a2a4a;">
            <div style="font-size:0.7rem;color:#9ca3af;margin-bottom:4px;">🏃 AGI</div>
            <div style="font-weight:700;font-size:1.1rem;color:#10b981;">${formatNum(p.agi)}</div>
            <div style="font-size:0.6rem;color:#6b7280;">
              Base ${formatNum(BALANCE.player.agi)} | Nv ${formatNum(runState.runBonuses.agi)} | Eq ${formatNum(calcEqStat('agi'))}
              ${metaState.playerClass ? `| Clase ${formatNum(calcularClassBonuses(runState.level, metaState.playerClass).agi)}` : ''}
            </div>
          </div>
        </div>
      </div>
      <div style="background:#1a1a2e;border-radius:12px;padding:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
        <h3 style="color:#a78bfa;font-size:0.95rem;margin-bottom:8px;">📊 Stats Derivadas</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:0.7rem;">
          <span>🎯 CRIT <b style="color:#ef4444;">${document.getElementById('player-crit')?.textContent || '0%'}</b></span>
          <span>🛡️ BLOQ <b style="color:#3b82f6;">${document.getElementById('player-block')?.textContent || '0%'}</b></span>
          <span>💨 EVA <b style="color:#10b981;">${document.getElementById('player-dodge')?.textContent || '0%'}</b></span>
          <span>💥 PEN <b style="color:#a78bfa;">${document.getElementById('player-pen')?.textContent || '0%'}</b></span>
          <span>💢 CRIT DMG <b style="color:#ef4444;">${document.getElementById('player-crit-dmg')?.textContent || '+50%'}</b></span>
          <span>👑 VS BOSS <b style="color:#f59e0b;">${document.getElementById('player-boss-dmg')?.textContent || '+0%'}</b></span>
          <span>💚 REGEN <b style="color:#22c55e;">${document.getElementById('player-hp-regen')?.textContent || '0%'}</b></span>
          <span>🧛 LIFESTEAL <b style="color:#22c55e;">${document.getElementById('player-lifesteal')?.textContent || '0%'}</b></span>
        </div>
      </div>
      ${!metaState.unlockedEquipment ? `
      <div style="background:#1a1a2e;border-radius:12px;padding:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
        <h3 style="color:#a78bfa;font-size:0.95rem;margin-bottom:8px;">🎒 Equipo</h3>
        <div style="font-size:0.85rem;color:#6b7280;text-align:center;padding:16px;">🔒 Se desbloquea tras superar el piso 10</div>
      </div>
      ` : `
      <div style="background:#1a1a2e;border-radius:12px;padding:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
        <h3 style="color:#a78bfa;font-size:0.95rem;margin-bottom:8px;">🎒 Equipo <span style="font-size:0.7rem;color:#6b7280;font-weight:400;">(click para reforjar/maximizar)</span></h3>
        <div class="equip-slots">
          ${['weapon', 'armor', 'ring'].map(slot => {
            const item = metaState.equipment[slot];
            const icons = { weapon: '🗡️', armor: '🛡️', ring: '💍' };
            if (!item) return `<div class="equip-slot ${slot}">${icons[slot]} Vacío</div>`;
            const rarityClass = item.rarity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
            const panelHTML = buildEquipPanelHTML(item);
            return `<div class="equip-slot ${slot} filled rarity-${rarityClass}" style="cursor:pointer;" onclick="showMaximizeModal()">${panelHTML}</div>`;
          }).join('')}
        </div>
      </div>
      `}
      ${metaState.unlockedReforge ? renderRuneCharacterSection() : ''}
      <div style="background:#1a1a2e;border-radius:12px;padding:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
        <h3 style="color:#a78bfa;font-size:0.95rem;margin-bottom:8px;">⚡ Pasivas</h3>`;

    const classPassive = metaState.playerClass ? CLASS_PASSIVES[metaState.playerClass] : null;
    if (classPassive) {
      const vals = classPassive.eval(runState.level);
      const valStr = Object.entries(vals).map(([k, v]) => {
        if (k === 'mult') return `×${v.toFixed(2)}`;
        if (k === 'speedPct') return `${v}% vel`;
        if (k === 'dodgePct') return `${v}% eva`;
        if (k === 'lifestealPct') return `${v}% lifesteal`;
        if (k === 'dotDmgPct') return `${v}% DoT`;
        if (k === 'bonusDmg') return `+${v}%`;
        return `${k}: ${typeof v === 'number' ? v.toFixed(1) : v}`;
      }).join(' · ');
      html += `<div style="padding:8px 0;border-bottom:1px solid #2a2a4a;">
        <div style="font-weight:600;color:#fbbf24;font-size:0.85rem;">${CLASS_CONFIG[metaState.playerClass]?.emoji} ${classPassive.name}</div>
        <div style="font-size:0.75rem;color:#9ca3af;">${classPassive.desc}</div>
        <div style="font-size:0.7rem;color:#60a5fa;">Actual: ${valStr}</div>
      </div>`;
    }
    if (metaState.playerSpec) {
      const specPassive = SPEC_PASSIVES[metaState.playerSpec];
      if (specPassive) {
        const vals = specPassive.eval(Math.max(100, runState.level));
        const valStr = Object.entries(vals).map(([k, v]) => {
          if (typeof v === 'number') return `${k}: ${v.toFixed(2)}`;
          return `${k}: ${v}`;
        }).join(' · ');
        html += `<div style="padding:8px 0;border-bottom:1px solid #2a2a4a;">
          <div style="font-weight:600;color:#a78bfa;font-size:0.85rem;">⚡ ${specPassive.name} <span style="color:#9ca3af;font-weight:400;">(${getSpecName(metaState.playerSpec)})</span></div>
          <div style="font-size:0.75rem;color:#9ca3af;">${specPassive.desc}</div>
          <div style="font-size:0.7rem;color:#60a5fa;">Actual: ${valStr}</div>
        </div>`;
      }
    } else if (metaState.playerClass) {
      html += `<div style="padding:8px 0;color:#6b7280;font-size:0.8rem;">Sin especialización activa. Alcanzá el nivel 100 para elegir una.</div>`;
    } else {
      html += `<div style="padding:8px 0;color:#6b7280;font-size:0.8rem;">Sin clase activa. Alcanzá el nivel 50 para elegir una.</div>`;
    }

    html += `</div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        ${metaState.playerClass && metaState.playerSpec ? `<button onclick="Game.character.showSpecChangeConfirm()" style="flex:1;min-width:120px;background:transparent;border:1px solid #a78bfa;color:#a78bfa;border-radius:8px;padding:10px;cursor:pointer;font-weight:600;">⚡ Cambiar especialización</button>` : ''}
        ${metaState.playerClass ? `<button onclick="Game.character.showClassChangeConfirm()" style="flex:1;min-width:120px;background:transparent;border:1px solid #ef4444;color:#ef4444;border-radius:8px;padding:10px;cursor:pointer;font-weight:600;">🔄 Cambiar clase</button>` : ''}
        <button onclick="Game.character.closeCharacterScreen()" style="flex:1;min-width:120px;background:#3b82f6;color:white;border:none;border-radius:8px;padding:10px;cursor:pointer;font-weight:600;">🔙 Volver</button>
      </div>
    `;
    overlay.innerHTML = `<div style="max-width:480px;margin:0 auto;padding:20px;">${html}</div>`;
    document.body.appendChild(overlay);
  }

  function calcEqStat(stat) {
    let total = 0;
    for (const slot of ['weapon', 'armor', 'ring']) {
      const item = metaState.equipment[slot];
      if (item && item.stats[stat]) {
        const enhMult = 1 + (item.enhance || 0) * 0.1;
        let val = Math.floor(item.stats[stat] * enhMult);
        if (item.bonusStat && item.bonusStat.stat === stat) val += item.bonusStat.bonus;
        total += val;
      }
    }
    return total;
  }

  function renderRuneCharacterSection() {
    const slots = ['weapon', 'armor', 'ring'];
    const slotIcons = { weapon: '🗡️', armor: '🛡️', ring: '💍' };
    const slotLabels = { weapon: 'Arma', armor: 'Armadura', ring: 'Anillo' };

    const hasInventory = Object.keys(metaState.runeInventory).length > 0;
    let hasAnyRuna = false;
    let runeHTML = '';
    for (const slot of slots) {
      const item = metaState.equipment[slot];
      if (item && item.runas && item.runas.conditionId) {
        hasAnyRuna = true;
        const rn = item.runas;
        const condDef = findRuneCondition(rn.conditionId);
        const effDef = findRuneEffect(rn.effectId);
        const maxEnh = getRuneMaxEnhance(rn.rarity);
        const isMax = rn.enhance >= maxEnh;
        runeHTML += `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin-bottom:4px;background:#111118;border-radius:8px;border:1px solid #2a2a4a;">
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.8rem;">${slotIcons[slot]} ${slotLabels[slot]}</div>
              <div style="font-size:0.7rem;color:#9ca3af;">
                ⚡ ${condDef ? condDef.label : '?'} → ✨ ${effDef ? effDef.label : '?'}
                <span class="rarity-${rn.rarity}" style="font-weight:600;">${rn.rarity}+${rn.enhance}</span>
                ${isMax ? ' <span style="color:#4ade80;">✅ MAX</span>' : ''}
              </div>
              <div style="font-size:0.6rem;color:#6b7280;margin-top:2px;">
                ${condDef ? condDef.desc : ''} → ${effDef ? effDef.desc : ''}
              </div>
            </div>
            <button class="rune-action-btn danger" onclick="Game.character.doUnequipRune('${slot}')" style="font-size:0.7rem;">Desequipar</button>
          </div>
        `;
      }
    }

    for (const slot of slots) {
      const item = metaState.equipment[slot];
      if (!item || (item.runas && item.runas.conditionId)) continue;
      const label = `${slotIcons[slot]} ${slotLabels[slot]}`;
      runeHTML += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin-bottom:4px;background:#111118;border-radius:8px;border:1px solid #2a2a4a;opacity:0.6;">
          <div style="flex:1;">
            <div style="font-weight:600;font-size:0.8rem;">${label}</div>
            <div style="font-size:0.7rem;color:#6b7280;">Sin runa</div>
          </div>
          <button onclick="Game.runes.showRuneEquipPicker('${slot}')" style="background:transparent;border:1px solid #60a5fa;color:#60a5fa;border-radius:6px;padding:3px 10px;font-size:0.7rem;cursor:pointer;" ${hasInventory ? '' : 'disabled title="No tenés runas en inventario"'}>🔮 Equipar</button>
        </div>
      `;
      if (hasInventory) hasAnyRuna = true;
    }

    return `
      <div style="background:#1a1a2e;border-radius:12px;padding:12px;border:1px solid #2a2a4a;margin-bottom:12px;">
        <h3 style="color:#a78bfa;font-size:0.95rem;margin-bottom:8px;">🔮 Runas</h3>
        ${hasAnyRuna ? runeHTML : '<div style="font-size:0.8rem;color:#6b7280;text-align:center;padding:8px;">No tenés runas equipadas. Conseguilas en la <b style="color:#a78bfa;cursor:pointer;" onclick="Game.character.closeCharacterScreen();Game.dungeons.showDungeonSelection()">🔮 Cámara Rúnica</b>.</div>'}
        <div style="margin-top:8px;text-align:center;">
          <button onclick="Game.runes.showRuneModal()" style="background:transparent;border:1px solid #3b82f6;color:#60a5fa;border-radius:6px;padding:4px 12px;font-size:0.75rem;cursor:pointer;">🔮 Gestionar Runas</button>
        </div>
      </div>
    `;
  }

  function doUnequipRune(slot) {
    unequipRune(slot);
    if (runState.characterScreenActive) {
      setTimeout(renderCharacterScreen, 50);
    }
  }

  // Expose public API
  Game.character = {
    showClassSelection: showClassSelection,
    showSpecSelection: showSpecSelection,
    showSpecChangeConfirm: showSpecChangeConfirm,
    confirmSpecChange: confirmSpecChange,
    showClassChangeConfirm: showClassChangeConfirm,
    confirmClassChange: confirmClassChange,
    cancelClassChange: cancelClassChange,
    showCharacterScreen: showCharacterScreen,
    closeCharacterScreen: closeCharacterScreen,
    renderCharacterScreen: renderCharacterScreen,
    calcEqStat: calcEqStat,
    renderRuneCharacterSection: renderRuneCharacterSection,
    doUnequipRune: doUnequipRune
  };

  // Temporary window bridges for inline code that still references these directly
  window.showClassSelection = showClassSelection;
  window.showSpecSelection = showSpecSelection;
  window.showSpecChangeConfirm = showSpecChangeConfirm;
  window.confirmSpecChange = confirmSpecChange;
  window.showClassChangeConfirm = showClassChangeConfirm;
  window.confirmClassChange = confirmClassChange;
  window.cancelClassChange = cancelClassChange;
  window.showCharacterScreen = showCharacterScreen;
  window.closeCharacterScreen = closeCharacterScreen;
  window.renderCharacterScreen = renderCharacterScreen;
  window.calcEqStat = calcEqStat;
  window.renderRuneCharacterSection = renderRuneCharacterSection;
  window.doUnequipRune = doUnequipRune;
})();
