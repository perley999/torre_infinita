// utilities.js — formatNum, addLog, spawnFloat, flashElement, etc.
// Extracted from Torre_Infinita.html (F2 core extraction).
(function() {
  'use strict';
  window.Game = window.Game || {};
// Formatea números ≥1000 a notación k (ej: 1234 → 1.2k)
function formatNum(n) {
    if (n >= 1000000000) {
        return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return String(n);
}

function addLog(text, type = '') {
    const log = document.getElementById('combat-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + type;
    entry.textContent = text;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 50) log.removeChild(log.firstChild);
}

function flashElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 300);
}

// Trigger attacking effect on a fighter card
function triggerAttackEffect(attackerId) {
    const el = document.getElementById(attackerId);
    if (!el) return;
    el.classList.add('attacking');
    setTimeout(() => el.classList.remove('attacking'), 400);
}

// Float lane queues: track active floats per lane per container
const _floatQueues = {};

function spawnFloat(containerId, text, type, lane) {
    const container = document.getElementById(containerId);
    const el = document.createElement('div');
    el.className = `float-num ${type}`;
    el.textContent = text;

    // Determine lane: explicit param > type-based default
    if (!lane) {
        if (type === 'heal') {
            lane = 'left';
        } else if (type === 'miss' || type === 'block') {
            lane = 'right';
        } else {
            lane = 'center'; // normal, crit
        }
    }

    el.classList.add(`float-${lane}`);

    // Queue management: offset position if lane is busy
    const queueKey = `${containerId}-${lane}`;
    if (!_floatQueues[queueKey]) _floatQueues[queueKey] = 0;
    const queueIndex = _floatQueues[queueKey];
    _floatQueues[queueKey]++;

    // Each queued float starts slightly higher
    const baseTop = 40;
    const topOffset = queueIndex * 12;
    el.style.top = `${baseTop - topOffset}%`;

    container.appendChild(el);

    // Release queue slot after animation completes
    setTimeout(() => {
        el.remove();
        _floatQueues[queueKey] = Math.max(0, _floatQueues[queueKey] - 1);
    }, 1400);
}


  // Expose to namespace and global scope
  Game.utilities = {
    formatNum: formatNum,
    addLog: addLog,
    flashElement: flashElement,
    triggerAttackEffect: triggerAttackEffect,
    spawnFloat: spawnFloat
  };
  window.formatNum = formatNum;
  window.addLog = addLog;
  window.flashElement = flashElement;
  window.triggerAttackEffect = triggerAttackEffect;
  window.spawnFloat = spawnFloat;
})();