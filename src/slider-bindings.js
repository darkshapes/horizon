class SliderBindings {
    constructor(sliderInstance) {
        this.sliderInstance = sliderInstance;
        this.bindings = new Map();
    }
    
    /**
     * Bind a channel to a value source or function.
     * 
     * @param {string} arrayId - The ID of the slider array (e.g., 'array-1')
     * @param {number} channelIndex - The channel index within the array (0-based)
     * @param {any|Function} valueOrBindingFn - Initial value or lazy evaluation function
     * @param {Object} options - Binding configuration options
     * @param {'int'|'float'|'iterable'|'bool'} options.type - Value type
     * @param {number} options.min - Minimum value (for int/float)
     * @param {number} options.max - Maximum value (for int/float)
     * @param {number} options.precision - Decimal precision (for float)
     * @param {string[]} options.items - Array of items (for iterable type)
     * @param {Object} options.labels - Custom labels for display
     * @param {Function} options.onChange - Callback invoked on value change: (newValue, oldValue, channelKey) => void
     * @returns {Object} Binding object with get/set/update methods
     */
    bind(arrayId, channelIndex, valueOrBindingFn, options = {}) {
        const key = `${arrayId}-${channelIndex}`;
        const channel = this.sliderInstance.channels.get(key);
        
        if (!channel) {
            console.warn(`SliderBindings.bind: Channel not found - ${key}`);
            return null;
        }
        
        const {
            type,
            min,
            max,
            precision,
            items,
            labels,
            onChange
        } = options;
        
        if (type) {
            const opts = {};
            if (type === 'int' || type === 'float') {
                opts.min = min ?? (type === 'int' ? -127 : -10.0);
                opts.max = max ?? (type === 'int' ? 127 : 10.0);
                if (precision !== undefined) opts.precision = precision;
            } else if (type === 'iterable') {
                opts.items = items ?? [];
            }
            channel.value = new (this.sliderInstance.SliderValue)(type, opts);
            channel.value.labels = labels;
        }
        
        const binding = {
            key,
            channelKey: key,
            arrayId,
            channelIndex,
            valueSource: typeof valueOrBindingFn === 'function' ? valueOrBindingFn : () => valueOrBindingFn,
            onChange,
            initialValue: valueOrBindingFn,
            lastValue: null,
            
            /**
             * Get the current bound value.
             * If valueSource is a function, it's lazily evaluated.
             * @returns {any} Current value
             */
            get() {
                return typeof this.valueSource === 'function' 
                    ? this.valueSource() 
                    : this.valueSource;
            },
            
            /**
             * Set a new value for the channel.
             * @param {any} newValue - New value to set
             * @returns {Object} This binding
             */
            set(newValue) {
                const oldValue = this.lastValue;
                this.valueSource = newValue;
                this.lastValue = newValue;
                this._notifyChange();
                return this;
            },
            
            /**
             * Update the internal slider value from current source.
             * @returns {Object} This binding
             */
            update() {
                const newValue = this.get();
                const oldValue = this.lastValue;
                this.lastValue = newValue;
                
                if (channel.value.type === 'int') {
                    const range = channel.value.max - channel.value.min;
                    const centered = ((newValue - channel.value.min) / range) * 2 - 1;
                    const pct = (centered / 2) + 0.5;
                    channel.value.setFromPercentage(pct);
                } else if (channel.value.type === 'float') {
                    const range = channel.value.max - channel.value.min;
                    const centered = ((newValue - channel.value.min) / range) * 2 - 1;
                    const pct = (centered / 2) + 0.5;
                    channel.value.setFromPercentage(pct);
                } else if (channel.value.type === 'iterable') {
                    const index = channel.value.items.indexOf(newValue);
                    const validIndex = Math.max(0, Math.min(channel.value.items.length - 1, index));
                    channel.value.setFromPercentage(validIndex / (channel.value.items.length - 1));
                } else if (channel.value.type === 'bool') {
                    channel.value.setFromPercentage(newValue ? 1.0 : 0.0);
                }
                
                this.sliderInstance.updateChannelDisplay(channel);
                this._notifyChange();
                
                return this;
            },
            
            /**
             * Notify onChange callback if provided.
             * @private
             */
            _notifyChange() {
                const currentVal = this.get();
                if (this.onChange && currentVal !== this.lastValue) {
                    this.onChange(currentVal, this.lastValue, this.key);
                }
            }
        };
        
        this.bindings.set(key, binding);
        
        if (typeof valueOrBindingFn === 'function') {
            channel.valueSource = valueOrBindingFn;
        } else if (valueOrBindingFn !== undefined && valueOrBindingFn !== null) {
            binding.update();
        }
        
        return binding;
    }
    
    /**
     * Get an existing binding by array ID and channel index.
     * @param {string} arrayId 
     * @param {number} channelIndex 
     * @returns {Object|undefined}
     */
    get(arrayId, channelIndex) {
        const key = `${arrayId}-${channelIndex}`;
        return this.bindings.get(key);
    }
    
    /**
     * Unbind a channel.
     * @param {string} arrayId 
     * @param {number} channelIndex 
     * @returns {boolean}
     */
    unbind(arrayId, channelIndex) {
        const key = `${arrayId}-${channelIndex}`;
        return this.bindings.delete(key);
    }
    
    /**
     * Clear all bindings.
     */
    clear() {
        this.bindings.clear();
    }
    
    /**
     * Get all bindings as an object.
     * @returns {Object}
     */
    getAll() {
        const result = {};
        for (const [key, binding] of this.bindings) {
            result[key] = binding;
        }
        return result;
    }
}

export { SliderBindings };
