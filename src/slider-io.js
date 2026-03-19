const IO_VERSION = '1.0';

class SliderIO {
    constructor(sliderInstance) {
        this.sliderInstance = sliderInstance;
        this.presets = new Map();
        this.loadPresetsFromStorage();
    }
    
    loadPresetsFromStorage() {
        const stored = localStorage.getItem('slider-presets');
        if (stored) {
            try {
                const presets = JSON.parse(stored);
                presets.forEach((preset, name) => {
                    this.presets.set(name, preset);
                });
            } catch (e) {
                console.error('Failed to load presets from localStorage:', e);
            }
        }
    }
    
    /**
     * Export current slider values state as JSON.
     * @param {string} [presetName] - Optional name to save as preset in localStorage
     * @returns {Object} Export object with version, timestamp, and channel states
     */
    export(presetName) {
        const exportData = {
            version: IO_VERSION,
            exportedAt: new Date().toISOString(),
            channels: {}
        };
        
        this.sliderInstance.channels.forEach((channel, key) => {
            exportData.channels[key] = {
                type: channel.value.type,
                rawPercentage: channel.value.getRawPercentage(),
                display: channel.value.getDisplay(),
                raw: channel.value.getRaw(),
                options: {
                    min: channel.value.min,
                    max: channel.value.max,
                    precision: channel.value.precision,
                    items: channel.value.items ? [...channel.value.items] : undefined
                }
            };
        });
        
        if (presetName) {
            this.savePreset(presetName, exportData);
        }
        
        return exportData;
    }
    
    /**
     * Export as formatted JSON string.
     * @param {string} [presetName] - Optional name to save as preset
     * @param {number} [spaces] - JSON indentation spaces (default: 2)
     * @returns {string} JSON string
     */
    exportAsJSON(presetName, spaces = 2) {
        const data = this.export(presetName);
        return JSON.stringify(data, null, spaces);
    }
    
    /**
     * Import configuration from JSON object or string.
     * @param {Object|string} data - Import data as object or JSON string
     * @returns {Object} Result with success status and imported channel count
     */
    import(data) {
        let importData;
        
        try {
            if (typeof data === 'string') {
                importData = JSON.parse(data);
            } else {
                importData = data;
            }
        } catch (e) {
            console.error('Failed to parse import data:', e);
            return { success: false, error: 'Invalid JSON' };
        }
        
        if (!importData.channels || typeof importData.channels !== 'object') {
            console.error('Import data missing channels object');
            return { success: false, error: 'Invalid format: missing channels' };
        }
        
        let importedCount = 0;
        
        for (const [key, channelData] of Object.entries(importData.channels)) {
            const channel = this.sliderInstance.channels.get(key);
            if (!channel) {
                console.warn(`Channel not found: ${key}`);
                continue;
            }
            
            if (channelData.rawPercentage !== undefined) {
                if (channelData.options) {
                    if (channelData.options.min !== undefined) channel.value.min = channelData.options.min;
                    if (channelData.options.max !== undefined) channel.value.max = channelData.options.max;
                    if (channelData.options.precision !== undefined) channel.value.precision = channelData.options.precision;
                    if (channelData.options.items !== undefined) channel.value.items = [...channelData.options.items];
                }
                
                channel.value.setFromPercentage(channelData.rawPercentage);
                this.sliderInstance.updateChannelDisplay(channel);
                importedCount++;
            }
        }
        
        return {
            success: true,
            importedCount,
            version: importData.version || 'unknown',
            exportedAt: importData.exportedAt
        };
    }
    
    /**
     * Import from file input element.
     * @param {HTMLInputElement} fileInput - File input element
     * @returns {Promise<Object>} Import result
     */
    importFromFile(fileInput) {
        return new Promise((resolve) => {
            const file = fileInput.files[0];
            if (!file) {
                resolve({ success: false, error: 'No file selected' });
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = this.import(e.target.result);
                resolve(result);
            };
            reader.onerror = () => {
                resolve({ success: false, error: 'Failed to read file' });
            };
            reader.readAsText(file);
        });
    }
    
    /**
     * Save current state as a named preset in localStorage.
     * @param {string} name - Preset name
     * @param {Object} [data] - Export data (if not provided, exports current state)
     * @returns {boolean} Success status
     */
    savePreset(name, data) {
        if (!data) {
            data = this.export();
        }
        
        data.presetName = name;
        this.presets.set(name, data);
        
        try {
            const presetsObj = {};
            this.presets.forEach((value, key) => {
                presetsObj[key] = value;
            });
            localStorage.setItem('slider-presets', JSON.stringify(presetsObj));
            return true;
        } catch (e) {
            console.error('Failed to save preset to localStorage:', e);
            return false;
        }
    }
    
    /**
     * Load a preset from localStorage by name.
     * @param {string} name - Preset name
     * @returns {Object} Import result
     */
    loadPreset(name) {
        const preset = this.presets.get(name);
        if (!preset) {
            return { success: false, error: `Preset not found: ${name}` };
        }
        return this.import(preset);
    }
    
    /**
     * List all saved preset names.
     * @returns {string[]} Array of preset names
     */
    listPresets() {
        return Array.from(this.presets.keys());
    }
    
    /**
     * Delete a preset from localStorage.
     * @param {string} name - Preset name
     * @returns {boolean} True if deleted
     */
    deletePreset(name) {
        if (!this.presets.has(name)) {
            return false;
        }
        
        this.presets.delete(name);
        
        try {
            const presetsObj = {};
            this.presets.forEach((value, key) => {
                presetsObj[key] = value;
            });
            localStorage.setItem('slider-presets', JSON.stringify(presetsObj));
            return true;
        } catch (e) {
            console.error('Failed to update localStorage after preset delete:', e);
            return false;
        }
    }
    
    /**
     * Download export as JSON file.
     * @param {string} [filename] - Download filename (default: 'slider-export.json')
     */
    download(filename = 'slider-export.json') {
        const json = this.exportAsJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * Setup slider I/O functionality.
 * @param {MultiTouchSlider} sliderInstance - The slider instance
 * @returns {SliderIO} Configured SliderIO instance
 */
function setupSliderIO(sliderInstance) {
    const io = new SliderIO(sliderInstance);
    
    sliderInstance.exportConfig = (presetName) => io.export(presetName);
    sliderInstance.exportAsJSON = (presetName, spaces) => io.exportAsJSON(presetName, spaces);
    
    sliderInstance.importConfig = (data) => io.import(data);
    sliderInstance.importFromFile = (fileInput) => io.importFromFile(fileInput);
    
    return io;
}

export { SliderIO, setupSliderIO };
