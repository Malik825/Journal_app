class Storage {
    constructor() {
        try {
            const storedEntries = localStorage.getItem('journalEntries');
            this.entries = storedEntries ? JSON.parse(storedEntries) : [];
        } catch (e) {
            console.error('Failed to load entries from localStorage:', e);
            alert('Failed to load journal entries. Please check your browser storage settings.');
            this.entries = [];
        }
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
        try {
            localStorage.setItem('journalEntries', JSON.stringify(this.entries));
        } catch (e) {
            console.error('Failed to save entries to localStorage:', e);
            alert('Failed to save your journal entries. Please check your browser storage settings.');
        }
    }

    exportEntries() {
        return {
            journalName: 'Mindful Journal',
            version: '1.0',
            exportedAt: new Date().toISOString(),
            entries: this.entries,
        };
    }

    getMoodTrends(period) {
        const now = new Date();
        const entries = this.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            if (period === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return entryDate >= weekAgo;
            } else if (period === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return entryDate >= monthAgo;
            }
            return true; // 'all' period
        });

        const moodMap = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 };
        const labels = [];
        const data = [];

        // Group by date (daily averages)
        const grouped = entries.reduce((acc, entry) => {
            const date = new Date(entry.date).toLocaleDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(Number(moodMap[entry.mood]));
            return acc;
        }, {});

        // Sort dates and calculate averages
        Object.keys(grouped)
            .sort((a, b) => new Date(a) - new Date(b))
            .forEach(date => {
                labels.push(date);
                const avgMood = grouped[date].reduce((sum, mood) => sum + mood, 0) / grouped[date].length;
                data.push(avgMood);
            });

        return { labels, data };
    }

    getCalendarEvents() {
        return this.entries.map(entry => ({
            id: entry.id,
            title: entry.title,
            start: entry.date,
            allDay: true,
            extendedProps: { mood: entry.mood }
        }));
    }
}

export default Storage;