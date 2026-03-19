const KEYBOARD_CONFIG = {
    stepSize: 0.05,
    fineStepSize: 0.01,
    percentageSteps: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
};

function setupKeyboardAccessibility(sliderInstance) {
    let activeArrayIndex = 0;
    let activeChannelIndex = 0;
    
    function getActiveChannel() {
        const arrays = Array.from(document.querySelectorAll('.slider-array'));
        if (!arrays[activeArrayIndex]) return null;
        
        const array = arrays[activeArrayIndex];
        const channels = Array.from(array.querySelectorAll('.channel'));
        if (!channels[activeChannelIndex]) return null;
        
        const channelEl = channels[activeChannelIndex];
        const arrayId = array.id;
        const key = `${arrayId}-${activeChannelIndex}`;
        return sliderInstance.channels.get(key);
    }
    
    function setActiveChannel(arrayIndex, channelIndex) {
        const arrays = Array.from(document.querySelectorAll('.slider-array'));
        if (!arrays[arrayIndex]) return;
        
        const array = arrays[arrayIndex];
        const channels = Array.from(array.querySelectorAll('.channel'));
        
        arrays.forEach((arr, idx) => {
            arr.querySelectorAll('.channel').forEach(ch => {
                ch.setAttribute('tabindex', '-1');
                ch.setAttribute('aria-hidden', 'true');
            });
        });
        
        activeArrayIndex = arrayIndex;
        activeChannelIndex = channelIndex;
        
        if (channels[channelIndex]) {
            channels[channelIndex].setAttribute('tabindex', '0');
            channels[channelIndex].setAttribute('aria-hidden', 'false');
            channels[channelIndex].focus();
        }
    }
    
    function updateARIA(channelObj, value) {
        const el = channelObj.element;
        const type = channelObj.value.type;
        
        el.setAttribute('role', 'slider');
        
        if (type === 'bool') {
            const isTrue = value > 0.5;
            el.setAttribute('aria-checked', isTrue ? 'true' : 'false');
            el.setAttribute('aria-valuenow', isTrue ? '1' : '0');
            el.setAttribute('aria-valuemin', '0');
            el.setAttribute('aria-valuemax', '1');
        } else if (type === 'int' || type === 'float') {
            const rawPct = value;
            const min = channelObj.value.min;
            const max = channelObj.value.max;
            const range = max - min;
            const centered = (rawPct - 0.5) * 2;
            const actualVal = (centered * range) / 2 + min;
            
            const displayVal = type === 'float' ? 
                Math.round(actualVal / channelObj.value.precision) * channelObj.value.precision :
                Math.round((centered * range) / 2);
            
            el.setAttribute('aria-valuenow', String(displayVal));
            el.setAttribute('aria-valuemin', String(min));
            el.setAttribute('aria-valuemax', String(max));
        } else if (type === 'iterable') {
            const index = Math.round(value * (channelObj.value.items.length - 1));
            const validIndex = Math.max(0, Math.min(channelObj.value.items.length - 1, index));
            el.setAttribute('aria-valuenow', String(validIndex + 1));
            el.setAttribute('aria-valuemin', '1');
            el.setAttribute('aria-valuemax', String(channelObj.value.items.length));
        }
        
        const displayName = channelObj.value.getDisplay();
        el.setAttribute('aria-label', `Channel ${activeChannelIndex + 1}, type ${type}, value ${displayName}`);
    }
    
    function handleKeyboardInput(e, channelObj) {
        const key = e.key;
        const currentPct = channelObj.value.getRawPercentage();
        let newPct = currentPct;
        
        switch (key) {
            case 'ArrowUp':
                newPct = Math.min(1, currentPct + KEYBOARD_CONFIG.stepSize);
                e.preventDefault();
                break;
            case 'ArrowDown':
                newPct = Math.max(0, currentPct - KEYBOARD_CONFIG.stepSize);
                e.preventDefault();
                break;
            case 'Home':
                newPct = 0;
                e.preventDefault();
                break;
            case 'End':
                newPct = 1;
                e.preventDefault();
                break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                const numIndex = parseInt(key);
                if (numIndex === 0) {
                    newPct = 0;
                } else {
                    newPct = KEYBOARD_CONFIG.percentageSteps[numIndex - 1] || (numIndex / 10);
                }
                e.preventDefault();
                break;
            default:
                if (key === 'Tab') {
                    handleTabNavigation(e);
                    return;
                }
                return;
        }
        
        if (newPct !== currentPct) {
            channelObj.value.setFromPercentage(newPct);
            sliderInstance.updateChannelDisplay(channelObj);
            updateARIA(channelObj, newPct);
            if (sliderInstance.saveHistoryEntry) {
                sliderInstance.saveHistoryEntry(channelObj);
            }
        }
    }
    
    function handleTabNavigation(e) {
        const arrays = Array.from(document.querySelectorAll('.slider-array'));
        const currentArray = arrays[activeArrayIndex];
        if (!currentArray) return;
        
        const channels = Array.from(currentArray.querySelectorAll('.channel'));
        const channelCount = channels.length;
        
        if (e.shiftKey) {
            if (activeChannelIndex > 0) {
                activeChannelIndex--;
            } else if (activeArrayIndex > 0) {
                activeArrayIndex--;
                activeChannelIndex = channelCount - 1;
            }
        } else {
            if (activeChannelIndex < channelCount - 1) {
                activeChannelIndex++;
            } else if (activeArrayIndex < arrays.length - 1) {
                activeArrayIndex++;
                activeChannelIndex = 0;
            }
        }
        
        setActiveChannel(activeArrayIndex, activeChannelIndex);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.slider-array')) {
            const channel = getActiveChannel();
            if (channel) {
                handleKeyboardInput(e, channel);
            }
        }
    });
    
    const sliderArrays = document.querySelectorAll('.slider-array');
    sliderArrays.forEach((array, arrayIndex) => {
        array.addEventListener('click', (e) => {
            const channelEl = e.target.closest('.channel');
            if (channelEl) {
                const channelIndex = parseInt(channelEl.dataset.channel);
                setActiveChannel(arrayIndex, channelIndex);
            }
        });
    });
    
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('channel')) {
            const array = e.target.closest('.slider-array');
            const channelIndex = parseInt(e.target.dataset.channel);
            activeChannelIndex = channelIndex;
            activeArrayIndex = Array.from(sliderArrays).indexOf(array);
        }
    });
    
    sliderArrays.forEach((array, arrayIndex) => {
        const channels = array.querySelectorAll('.channel');
        channels.forEach((channel) => {
            channel.setAttribute('tabindex', '-1');
            channel.setAttribute('aria-hidden', 'true');
        });
    });
    
    if (sliderArrays.length > 0) {
        const firstChannels = sliderArrays[0].querySelectorAll('.channel');
        if (firstChannels.length > 0) {
            firstChannels[0].setAttribute('tabindex', '0');
            firstChannels[0].setAttribute('aria-hidden', 'false');
        }
    }
}

export { KEYBOARD_CONFIG, setupKeyboardAccessibility };
