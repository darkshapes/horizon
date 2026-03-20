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
    
    getRaw() {
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

export { SliderValue };
