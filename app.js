class SliderValue {
    constructor(type, options = {}) {
        this.type = type;
        this.rawValue = 0.5;
        
        switch (type) {
            case 'int':
                this.min = options.min ?? -127;
                this.max = options.max ?? 127;
                break;
            case 'float':
                this.min = options.min ?? -10.0;
                this.max = options.max ?? 10.0;
                this.precision = options.precision ?? 0.1;
                break;
            case 'iterable':
                this.items = options.items ?? ['red', 'green', 'blue', 'yellow', 'purple'];
                break;
            case 'bool':
                break;
        }
    }
    
    setFromPercentage(pct) {
        this.rawValue = Math.max(0, Math.min(1, pct));
    }
    
    getRawPercentage() {
        return this.rawValue;
    }
    
    get() {
        switch (this.type) {
            case 'int':
                const range = this.max - this.min;
                const centered = (this.rawValue - 0.5) * 2;
                const result = Math.round((centered * range) / 2);
                return Math.max(this.min, Math.min(this.max, result));
            case 'float':
                const floatRange = this.max - this.min;
                const centeredFloat = (this.rawValue - 0.5) * 2;
                const floatVal = (centeredFloat * floatRange) / 2;
                return Math.round(floatVal / this.precision) * this.precision;
            case 'iterable':
                const index = Math.round(this.rawValue * (this.items.length - 1));
                return this.items[Math.max(0, Math.min(this.items.length - 1, index))];
            case 'bool':
                return this.rawValue > 0.5;
        }
        return 0;
    }
    
    getDisplay() {
        const val = this.get();
        if (this.type === 'float') {
            return parseFloat(val).toFixed(1);
        }
        return String(val);
    }
}

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
            const channelEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.channel');
            if (!channelEl) return;
            
            const arrayId = channelEl.closest('.slider-array').id;
            const channelIndex = parseInt(channelEl.dataset.channel);
            const key = `${arrayId}-${channelIndex}`;
            
            const channel = this.channels.get(key);
            if (!channel) return;
            
            channel.element.classList.add('active');
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
            
            const deltaY = touch.clientY - touchData.startY;
            const height = channel.element.offsetHeight;
            const deltaPct = -deltaY / height;
            const newRaw = Math.max(0, Math.min(1, touchData.startRaw + deltaPct));
            
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
                channel.element.classList.remove('active');
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
        
        channel.element.classList.add('active');
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
        
        const deltaY = e.clientY - touchData.startY;
        const height = channel.element.offsetHeight;
        const deltaPct = -deltaY / height;
        const newRaw = Math.max(0, Math.min(1, touchData.startRaw + deltaPct));
        
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
    
    updateChannelDisplay(channel) {
        const pct = channel.value.getRawPercentage();
        channel.indicator.style.top = `${(1 - pct) * 100}%`;
        channel.display.textContent = channel.value.getDisplay();
        
        if (channel.value.type === 'bool') {
            const isTrue = pct > 0.5;
            channel.display.style.color = isTrue ? 'var(--active-color)' : 'var(--text-color)';
            channel.display.style.textShadow = isTrue ? '0 0 10px var(--active-color)' : '0 1px 2px rgba(0, 0, 0, 0.5)';
            channel.element.classList.remove('bool-true', 'bool-false');
            channel.element.classList.add(isTrue ? 'bool-true' : 'bool-false');
        } else {
            channel.display.style.color = 'var(--text-color)';
            channel.display.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiTouchSlider();
});
