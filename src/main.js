import { SliderValue } from './slider-values.js';
import { detectChannelFromPoint, calculateDeltaY, clampToRange } from './slider-engine.js';
import { updateChannelIndicator, updateChannelDisplay, updateBoolVisuals, setActiveState } from './slider-render.js';

class MultiTouchSlider {
    constructor() {
        this.channels = new Map();
        this.activeTouches = new Map();
        this.initChannels();
        this.setupEventListeners();
    }
    
    initChannels() {
        const channelElements = document.querySelectorAll('.channel');
        channelElements.forEach((el, index) => {
            const arrayId = el.closest('.slider-array').id;
            const channelIndex = parseInt(el.dataset.channel);
            const type = el.dataset.type;
            const key = `${arrayId}-${channelIndex}`;
            
            let options = {};
            if (type === 'int') {
                options = { min: -127, max: 127 };
            } else if (type === 'float') {
                options = { min: -10.0, max: 10.0, precision: 0.1 };
            } else if (type === 'iterable') {
                options = { items: ['red', 'green', 'blue', 'yellow', 'purple'] };
            }
            
            const channelObj = {
                element: el,
                display: el.querySelector('.channel-display'),
                indicator: el.querySelector('.channel-indicator'),
                value: new SliderValue(type, options),
                startY: null
            };
            
            if (type === 'bool') {
                channelObj.element.classList.add('bool-false');
            }
            
            this.channels.set(key, channelObj);
            this.updateChannelDisplay(channelObj);
        });
    }
    
    setupEventListeners() {
        const sliderArrays = document.querySelectorAll('.slider-array');
        
        sliderArrays.forEach(array => {
            array.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            array.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            array.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            array.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
            
            array.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
            document.addEventListener('pointermove', (e) => this.handlePointerMove(e));
            document.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        });
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        e.changedTouches.forEach(touch => {
            const detected = detectChannelFromPoint(touch.clientX, touch.clientY);
            if (!detected) return;
            
            const { arrayId, channelIndex, element: channelEl } = detected;
            const key = `${arrayId}-${channelIndex}`;
            
            const channel = this.channels.get(key);
            if (!channel) return;
            
            setActiveState(channel, true);
            this.activeTouches.set(touch.identifier, {
                key,
                startY: touch.clientY,
                startRaw: channel.value.getRawPercentage()
            });
        });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        e.changedTouches.forEach(touch => {
            const touchData = this.activeTouches.get(touch.identifier);
            if (!touchData) return;
            
            const channel = this.channels.get(touchData.key);
            if (!channel) return;
            
            const deltaPct = calculateDeltaY(touch.clientY, touchData.startY, channel.element.offsetHeight);
            const newRaw = clampToRange(touchData.startRaw + deltaPct);
            
            channel.value.setFromPercentage(newRaw);
            this.updateChannelDisplay(channel);
        });
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        e.changedTouches.forEach(touch => {
            const touchData = this.activeTouches.get(touch.identifier);
            if (!touchData) return;
            
            const channel = this.channels.get(touchData.key);
            if (channel) {
                setActiveState(channel, false);
            }
            this.activeTouches.delete(touch.identifier);
        });
    }
    
    handlePointerDown(e) {
        const channelEl = e.target.closest('.channel');
        if (!channelEl || e.pointerType === 'touch') return;
        
        const arrayId = channelEl.closest('.slider-array').id;
        const channelIndex = parseInt(channelEl.dataset.channel);
        const key = `${arrayId}-${channelIndex}`;
        
        const channel = this.channels.get(key);
        if (!channel) return;
        
        setActiveState(channel, true);
        channel.element.setPointerCapture(e.pointerId);
        this.activeTouches.set(e.pointerId, {
            key,
            startY: e.clientY,
            startRaw: channel.value.getRawPercentage(),
            element: channel.element
        });
    }
    
    handlePointerMove(e) {
        const touchData = this.activeTouches.get(e.pointerId);
        if (!touchData || e.pointerType === 'touch') return;
        
        const channel = this.channels.get(touchData.key);
        if (!channel) return;
        
        const deltaPct = calculateDeltaY(e.clientY, touchData.startY, channel.element.offsetHeight);
        const newRaw = clampToRange(touchData.startRaw + deltaPct);
        
        channel.value.setFromPercentage(newRaw);
        this.updateChannelDisplay(channel);
    }
    
    handlePointerUp(e) {
        const touchData = this.activeTouches.get(e.pointerId);
        if (!touchData) return;
        
        const element = touchData.element;
        if (element) {
            element.classList.remove('active');
            element.releasePointerCapture(e.pointerId);
        }
        this.activeTouches.delete(e.pointerId);
    }
    
    updateChannelDisplay(channelObj) {
        const pct = channelObj.value.getRawPercentage();
        updateChannelIndicator(channelObj, pct);
        updateChannelDisplay(channelObj, channelObj.value.getDisplay());
        
        if (channelObj.value.type === 'bool') {
            const isTrue = pct > 0.5;
            updateBoolVisuals(channelObj, isTrue);
        } else {
            channelObj.display.style.color = 'var(--text-color)';
            channelObj.display.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiTouchSlider();
});

export { MultiTouchSlider };
