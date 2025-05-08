/* Updated storage.js */
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

    getMoodTrends(period = 'week') {
        const moodData = {
            labels: [],
            data: []
        };

        const now = new Date();
        const entries = this.getAllEntries().sort((a, b) => new Date(a.date) - new Date(b.date));

        if (period === 'day') {
            // Aggregate by hour for the last 24 hours
            const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            for (let i = 0; i < 24; i++) {
                const hourStart = new Date(start.getTime() + i * 60 * 60 * 1000);
                const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
                const hourEntries = entries.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= hourStart && entryDate < hourEnd;
                });
                const avgMood = hourEntries.length > 0
                    ? hourEntries.reduce((sum, entry) => sum + parseInt(entry.mood), 0) / hourEntries.length
                    : null;
                moodData.labels.push(hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                moodData.data.push(avgMood);
            }
        } else if (period === 'month') {
            // Aggregate by day for the last 30 days
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            for (let i = 0; i < 30; i++) {
                const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                const dayEntries = entries.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= dayStart && entryDate < dayEnd;
                });
                const avgMood = dayEntries.length > 0
                    ? dayEntries.reduce((sum, entry) => sum + parseInt(entry.mood), 0) / dayEntries.length
                    : null;
                moodData.labels.push(dayStart.toLocaleDateString());
                moodData.data.push(avgMood);
            }
        } else {
            // Aggregate by week (default: last 4 weeks)
            const start = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                const weekEntries = entries.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= weekStart && entryDate < weekEnd;
                });
                const avgMood = weekEntries.length > 0
                    ? weekEntries.reduce((sum, entry) => sum + parseInt(entry.mood), 0) / weekEntries.length
                    : null;
                moodData.labels.push(`Week ${i + 1}`);
                moodData.data.push(avgMood);
            }
        }

        return moodData;
    }
}

export default Storage;
