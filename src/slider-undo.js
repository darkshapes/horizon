const UNDO_CONFIG = {
    maxHistory: 50,
    undoShortcut: 'z',
    redoShortcut: 'z'
};

class UndoManager {
    constructor(sliderInstance) {
        this.sliderInstance = sliderInstance;
        this.history = new Map();
        this.redoStack = new Map();
        this.init();
    }

    init() {
        this.sliderInstance.channels.forEach((channel, key) => {
            this.history.set(key, []);
            this.redoStack.set(key, []);
        });
    }

    push(key, oldValue, newValue) {
        if (oldValue === newValue) return;

        const history = this.history.get(key);
        if (history) {
            if (history.length >= UNDO_CONFIG.maxHistory) {
                history.shift();
            }
            history.push({ oldValue, newValue, timestamp: Date.now() });
            this.redoStack.set(key, []);
        }
    }

    undo(key) {
        const history = this.history.get(key);
        if (!history || history.length === 0) return null;

        const entry = history.pop();
        if (entry) {
            this.redoStack.get(key).push(entry);
            return { oldValue: entry.oldValue, newValue: entry.oldValue };
        }
        return null;
    }

    redo(key) {
        const redoStack = this.redoStack.get(key);
        if (!redoStack || redoStack.length === 0) return null;

        const entry = redoStack.pop();
        if (entry) {
            this.history.get(key).push({
                oldValue: entry.oldValue,
                newValue: entry.newValue,
                timestamp: Date.now()
            });
            return { oldValue: entry.newValue, newValue: entry.newValue };
        }
        return null;
    }

    canUndo(key) {
        const history = this.history.get(key);
        return history && history.length > 0;
    }

    canRedo(key) {
        const redoStack = this.redoStack.get(key);
        return redoStack && redoStack.length > 0;
    }

    clear(key) {
        this.history.set(key, []);
        this.redoStack.set(key, []);
    }

    clearAll() {
        this.history.forEach((_, key) => {
            this.history.set(key, []);
            this.redoStack.set(key, []);
        });
    }
}

function setupUndoRedo(sliderInstance) {
    const undoManager = new UndoManager(sliderInstance);
    sliderInstance.undoManager = undoManager;

    sliderInstance.saveHistoryEntry = function(channelObj) {
        const key = Array.from(this.channels.entries())
            .find(([, c]) => c === channelObj)?.[0];
        if (!key) return;

        const channel = this.channels.get(key);
        const currentPct = channel.value.getRawPercentage();
        const history = undoManager.history.get(key);
        if (history && history.length > 0) {
            const lastEntry = history[history.length - 1];
            undoManager.push(key, lastEntry.newValue, currentPct);
        } else {
            undoManager.push(key, 0, currentPct);
        }
    };

    sliderInstance.undoLastChange = function(channelObj) {
        const key = Array.from(this.channels.entries())
            .find(([, c]) => c === channelObj)?.[0];
        if (!key) return false;

        const result = undoManager.undo(key);
        if (!result) return false;

        channelObj.value.setFromPercentage(result.newValue);
        this.updateChannelDisplay(channelObj);
        
        if (this.updateUndoRedoIndicator) {
            const canUndo = undoManager.canUndo(key);
            const canRedo = undoManager.canRedo(key);
            this.updateUndoRedoIndicator(channelObj, canUndo, canRedo);
        }
        
        return true;
    };

    sliderInstance.redoLastChange = function(channelObj) {
        const key = Array.from(this.channels.entries())
            .find(([, c]) => c === channelObj)?.[0];
        if (!key) return false;

        const result = undoManager.redo(key);
        if (!result) return false;

        channelObj.value.setFromPercentage(result.newValue);
        this.updateChannelDisplay(channelObj);
        
        if (this.updateUndoRedoIndicator) {
            const canUndo = undoManager.canUndo(key);
            const canRedo = undoManager.canRedo(key);
            this.updateUndoRedoIndicator(channelObj, canUndo, canRedo);
        }
        
        return true;
    };

    sliderInstance.canUndo = function(channelObj) {
        const key = Array.from(this.channels.entries())
            .find(([, c]) => c === channelObj)?.[0];
        return undoManager.canUndo(key);
    };

    sliderInstance.canRedo = function(channelObj) {
        const key = Array.from(this.channels.entries())
            .find(([, c]) => c === channelObj)?.[0];
        return undoManager.canRedo(key);
    };

    sliderInstance.clearUndoHistory = function(channelObj) {
        const key = Array.from(this.channels.entries())
            .find(([, c]) => c === channelObj)?.[0];
        if (key) {
            undoManager.clear(key);
        }
    };

    const handleUndoRedo = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === UNDO_CONFIG.undoShortcut) {
            e.preventDefault();
            const arrays = Array.from(document.querySelectorAll('.slider-array'));
            const channelEl = document.activeElement;
            
            if (channelEl && channelEl.classList.contains('channel')) {
                const arrayId = channelEl.closest('.slider-array').id;
                const channelIndex = parseInt(channelEl.dataset.channel);
                const key = `${arrayId}-${channelIndex}`;
                const channel = sliderInstance.channels.get(key);
                
                if (channel) {
                    if (e.shiftKey || e.altKey) {
                        sliderInstance.redoLastChange(channel);
                    } else {
                        sliderInstance.undoLastChange(channel);
                    }
                }
            }
        }
    };

    document.addEventListener('keydown', handleUndoRedo);
}

export { UNDO_CONFIG, setupUndoRedo };
