const WHEEL_CONFIG = {
    stepSize: 0.025,
    fineStepSize: 0.0025,
    hoverClass: 'wheel-hover',
    activityClass: 'wheel-active',
    debounceMs: 80
};

let lastWheelTime = 0;
let lastHoveredChannel = null;

function setupWheelAccessibility(sliderInstance) {
    const sliderArrays = document.querySelectorAll('.slider-array');
    
    sliderArrays.forEach(array => {
        array.addEventListener('wheel', (e) => handleWheel(e, sliderInstance));
        array.addEventListener('mouseenter', (e) => handleMouseEnter(e, sliderInstance));
        array.addEventListener('mouseleave', (e) => handleMouseLeave(e, sliderInstance));
        array.addEventListener('mousemove', (e) => handleMouseMove(e, sliderInstance));
    });
}

function detectChannelFromMouse(e) {
    const channels = Array.from(e.target.closest('.slider-array').querySelectorAll('.channel'));
    const arrayRect = e.target.closest('.slider-array').getBoundingClientRect();
    
    for (const channel of channels) {
        const rect = channel.getBoundingClientRect();
        const channelTop = rect.top - arrayRect.top;
        const channelBottom = rect.bottom - arrayRect.top;
        const mouseInArrayY = e.clientY - arrayRect.top;
        
        if (mouseInArrayY >= channelTop && mouseInArrayY <= channelBottom) {
            const arrayId = e.target.closest('.slider-array').id;
            const channelIndex = parseInt(channel.dataset.channel);
            return { arrayId, channelIndex, element: channel };
        }
    }
    
    return null;
}

function handleWheel(e, sliderInstance) {
    e.preventDefault();
    
    const detected = detectChannelFromMouse(e);
    if (!detected) return;
    
    const { arrayId, channelIndex, element: channelEl } = detected;
    const key = `${arrayId}-${channelIndex}`;
    const channel = sliderInstance.channels.get(key);
    
    if (!channel) return;
    
    const now = Date.now();
    if (now - lastWheelTime < WHEEL_CONFIG.debounceMs) {
        return;
    }
    
    const isFineTuning = e.ctrlKey || e.metaKey;
    const stepSize = isFineTuning ? WHEEL_CONFIG.fineStepSize : WHEEL_CONFIG.stepSize;
    
    const wheelDelta = -e.deltaY;
    const stepCount = Math.sign(wheelDelta);
    
    const currentPct = channel.value.getRawPercentage();
    const newPct = Math.max(0, Math.min(1, currentPct + stepCount * stepSize));
    
    if (newPct !== currentPct) {
        channel.value.setFromPercentage(newPct);
        sliderInstance.updateChannelDisplay(channel);
        if (sliderInstance.saveHistoryEntry) {
            sliderInstance.saveHistoryEntry(channel);
        }
        
        channelEl.classList.add(WHEEL_CONFIG.activityClass);
        clearTimeout(channelEl._wheelTimeout);
        channelEl._wheelTimeout = setTimeout(() => {
            channelEl.classList.remove(WHEEL_CONFIG.activityClass);
        }, 150);
    }
    
    lastWheelTime = now;
}

function handleMouseEnter(e, sliderInstance) {
    const detected = detectChannelFromMouse(e);
    if (detected) {
        const { element: channelEl } = detected;
        channelEl.classList.add(WHEEL_CONFIG.hoverClass);
        lastHoveredChannel = channelEl;
    }
}

function handleMouseLeave(e, sliderInstance) {
    const channelEl = e.target.closest('.channel');
    if (channelEl) {
        channelEl.classList.remove(WHEEL_CONFIG.hoverClass);
    }
    lastHoveredChannel = null;
}

function handleMouseMove(e, sliderInstance) {
    const detected = detectChannelFromMouse(e);
    if (detected) {
        const { element: channelEl } = detected;
        if (lastHoveredChannel && lastHoveredChannel !== channelEl) {
            lastHoveredChannel.classList.remove(WHEEL_CONFIG.hoverClass);
        }
        if (!channelEl.classList.contains(WHEEL_CONFIG.hoverClass)) {
            channelEl.classList.add(WHEEL_CONFIG.hoverClass);
        }
        lastHoveredChannel = channelEl;
    } else if (lastHoveredChannel) {
        lastHoveredChannel.classList.remove(WHEEL_CONFIG.hoverClass);
        lastHoveredChannel = null;
    }
}

export { WHEEL_CONFIG, setupWheelAccessibility };
