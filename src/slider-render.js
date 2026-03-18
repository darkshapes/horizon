function updateChannelIndicator(channelObj, pct) {
    channelObj.indicator.style.top = `${(1 - pct) * 100}%`;
}

function updateChannelDisplay(channelObj, value) {
    channelObj.display.textContent = value;
}

function updateBoolVisuals(channelObj, isTrue) {
    const display = channelObj.display;
    const element = channelObj.element;
    
    display.style.color = isTrue ? 'var(--active-color)' : 'var(--text-color)';
    display.style.textShadow = isTrue 
        ? '0 0 10px var(--active-color)' 
        : '0 1px 2px rgba(0, 0, 0, 0.5)';
    
    element.classList.remove('bool-true', 'bool-false');
    element.classList.add(isTrue ? 'bool-true' : 'bool-false');
}

function setActiveState(channelObj, isActive) {
    if (isActive) {
        channelObj.element.classList.add('active');
    } else {
        channelObj.element.classList.remove('active');
    }
}

export { updateChannelIndicator, updateChannelDisplay, updateBoolVisuals, setActiveState };
