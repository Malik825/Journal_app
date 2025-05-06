class Storage {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    }

    getAllEntries() {
        return this.entries;
    }

    getEntryById(id) {
        return this.entries.find(entry => entry.id === id);
    }

    addEntry(entry) {
        this.entries.unshift(entry);
        this.save();
    }

    updateEntry(id, updatedEntry) {
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries[index] = updatedEntry;
            this.save();
        }
    }

    deleteEntry(id) {
        this.entries = this.entries.filter(entry => entry.id !== id);
        this.save();
    }

    save() {
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
    }

    exportEntries() {
        return {
            journalName: "Mindful Journal",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            entries: this.entries
        };
    }
}

export default Storage;