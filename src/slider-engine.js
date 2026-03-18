const GESTURE_CONFIG = {
    pointerPrecision: 1.0
};

function detectChannelFromPoint(x, y) {
    const channelEl = document.elementFromPoint(x, y)?.closest('.channel');
    if (!channelEl) return null;
    
    const arrayId = channelEl.closest('.slider-array').id;
    const channelIndex = parseInt(channelEl.dataset.channel);
    return { arrayId, channelIndex, element: channelEl };
}

function calculateDeltaY(currentY, startY, elementHeight) {
    const deltaY = currentY - startY;
    const deltaPct = -deltaY / elementHeight;
    return deltaPct;
}

function clampToRange(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}

export { GESTURE_CONFIG, detectChannelFromPoint, calculateDeltaY, clampToRange };
