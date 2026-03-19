const RESET_CONFIG = {
    doubleTapMaxMs: 300,
    resetBehavior: 'center',
    animationDuration: 200
};

let lastTapTimes = new Map();
let lastTapKeys = null;

function getResetValue(channelObj) {
    const type = channelObj.value.type;
    
    switch (RESET_CONFIG.resetBehavior) {
        case 'min':
            return 0;
        case 'center':
        default:
            return 0.5;
    }
}

function resetChannel(channelObj, animate = true) {
    const resetPct = getResetValue(channelObj);
    
    if (animate) {
        channelObj.element.classList.add('reset-animation');
        setTimeout(() => {
            channelObj.element.classList.remove('reset-animation');
        }, RESET_CONFIG.animationDuration);
    }
    
    channelObj.value.setFromPercentage(resetPct);
    
    const sliderArrays = document.querySelectorAll('.slider-array');
    let sliderInstance = null;
    sliderArrays.forEach(array => {
        if (array._sliderInstance) {
            sliderInstance = array._sliderInstance;
        }
    });
    
    if (sliderInstance) {
        sliderInstance.updateChannelDisplay(channelObj);
        
        if (sliderInstance.clearUndoHistory) {
            sliderInstance.clearUndoHistory(channelObj);
        }
    }
}

function isDoubleTap(currentTime, key) {
    if (lastTapKeys === key) {
        const lastTapTime = lastTapTimes.get(key) || 0;
        if (currentTime - lastTapTime <= RESET_CONFIG.doubleTapMaxMs) {
            lastTapTimes.delete(key);
            lastTapKeys = null;
            return true;
        }
    }
    return false;
}

function recordTap(time, key) {
    lastTapTimes.set(key, time);
    lastTapKeys = key;
    
    setTimeout(() => {
        if (lastTapKeys === key) {
            lastTapTimes.delete(key);
            lastTapKeys = null;
        }
    }, RESET_CONFIG.doubleTapMaxMs * 2);
}

function setupResetFunctionality(sliderInstance) {
    let touchStartTimes = new Map();
    
    const sliderArrays = document.querySelectorAll('.slider-array');
    
    sliderArrays.forEach(array => {
        array._sliderInstance = sliderInstance;
        
        array.addEventListener('dblclick', (e) => handleDoubleClick(e, sliderInstance));
    });
    
    sliderArrays.forEach(array => {
        array.addEventListener('touchstart', (e) => {
            e.changedTouches.forEach(touch => {
                const channelEl = touch.target.closest('.channel');
                if (!channelEl) return;
                
                const arrayId = channelEl.closest('.slider-array').id;
                const channelIndex = parseInt(channelEl.dataset.channel);
                const key = `${arrayId}-${channelIndex}`;
                
                touchStartTimes.set(touch.identifier, { key, time: Date.now() });
            });
        }, { passive: true });
        
        array.addEventListener('touchend', (e) => {
            e.changedTouches.forEach(touch => {
                const touchData = touchStartTimes.get(touch.identifier);
                if (!touchData) return;
                
                const { key, time: startTime } = touchData;
                
                if (isDoubleTap(startTime, key)) {
                    const channel = sliderInstance.channels.get(key);
                    if (channel) {
                        resetChannel(channel, true);
                    }
                }
                
                recordTap(startTime, key);
                touchStartTimes.delete(touch.identifier);
            });
        }, { passive: true });
    });
}

function handleDoubleClick(e, sliderInstance) {
    const channelEl = e.target.closest('.channel');
    if (!channelEl) return;
    
    const arrayId = channelEl.closest('.slider-array').id;
    const channelIndex = parseInt(channelEl.dataset.channel);
    const key = `${arrayId}-${channelIndex}`;
    
    const channel = sliderInstance.channels.get(key);
    if (channel) {
        resetChannel(channel, true);
    }
}

export { RESET_CONFIG, setupResetFunctionality, resetChannel, getResetValue };
