* Updated main.js */
import Storage from './storage.js';
import UI from './Ui.js';

class JournalApp {
    constructor() {
        this.storage = new Storage();
        this.ui = new UI();
        
        this.currentEntryId = null;
        this.searchTerm = '';
        this.selectedMood = 'all';
        this.currentFilter = 'all';
        this.currentView = 'entries';
        
        this.init();
    }
    
    init() {
        this.ui.initEventListeners({
            onFormSubmit: () => this.addEntry(),
            onClearForm: () => this.ui.resetForm(),
            onFilterChange: (filter) => this.filterEntries(filter),
            onSearch: (term) => this.searchEntries(term),
            onMoodFilter: (mood) => this.filterByMood(mood),
            onPrint: () => window.print(),
            onExport: () => this.exportEntries(),
            onCloseModal: () => this.closeModal(),
            onDeleteEntry: () => this.deleteEntry(),
            onEditEntry: () => this.editEntry(),
            onOpenEntry: (id) => this.openEntry(id),
            onShareEntry: (id) => this.shareEntry(id),
            onShowDashboard: () => this.showDashboard(),
            onShowEntries: () => this.showEntries(),
            onShowCalendar: () => this.showCalendar(),
            onPeriodChange: (period) => this.updateMoodChart(period),
            onCalendarDateClick: (date) => this.filterByDate(date)
        });
        
        this.renderEntries();
    }
    
    addEntry() {
        const { date, title, content, mood } = this.ui.getFormData();
        
        if (!date || !title || !content) return;
        
        const newEntry = {
            id: Date.now().toString(),
            date,
            title,
            content,
            mood,
            createdAt: new Date().toISOString()
        };
        
        this.storage.addEntry(newEntry);
        this.ui.resetForm();
        this.renderEntries();
        this.ui.scrollToTop();
    }
    
    renderEntries() {
        this.currentView = 'entries';
        this.ui.toggleView('entries');
        const entries = this.filterEntries(this.currentFilter);
        this.ui.renderEntries(entries, {
            filter: this.currentFilter,
            searchTerm: this.searchTerm,
            selectedMood: this.selectedMood
        });
    }
    
    showDashboard() {
        this.currentView = 'dashboard';
        this.ui.toggleView('dashboard');
        this.updateMoodChart('week');
    }
    
    showEntries() {
        this.renderEntries();
    }
    
    showCalendar() {
        this.currentView = 'calendar';
        this.ui.toggleView('calendar');
        const events = this.storage.getCalendarEvents();
        this.ui.renderCalendar(events);
    }
    
    updateMoodChart(period) {
        const moodData = this.storage.getMoodTrends(period);
        this.ui.renderMoodChart(moodData, period);
    }
    
    filterEntries(filter) {
        this.currentFilter = filter;
        let filteredEntries = this.storage.getAllEntries();
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        if (filter === 'today') {
            filteredEntries = filteredEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= today;
            });
        } else if (filter === 'week') {
            filteredEntries = filteredEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= weekAgo;
            });
        } else if (filter === 'month') {
            filteredEntries = filteredEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= monthAgo;
            });
        } else if (filter.startsWith('date:')) {
            const selectedDate = new Date(filter.split('date:')[1]);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filteredEntries = filteredEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= selectedDate && entryDate < nextDay;
            });
        }
        
        if (this.selectedMood !== 'all') {
            filteredEntries = filteredEntries.filter(entry => entry.mood === this.selectedMood);
        }
        
        if (this.searchTerm) {
            filteredEntries = filteredEntries.filter(entry => {
                return entry.title.toLowerCase().includes(this.searchTerm) || 
                       entry.content.toLowerCase().includes(this.searchTerm);
            });
        }
        
        return filteredEntries;
    }
    
    filterByDate(date) {
        this.currentFilter = `date:${date}`;
        this.renderEntries();
    }
    
    searchEntries(term) {
        this.searchTerm = term;
        this.renderEntries();
    }
    
    filterByMood(mood) {
        this.selectedMood = mood;
        this.renderEntries();
    }
    
    openEntry(id) {
        const entry = this.storage.getEntryById(id);
        if (!entry) return;
        
        this.currentEntryId = id;
        this.ui.openEntryModal(entry, this.searchTerm);
    }
    
    closeModal() {
        this.currentEntryId = null;
        this.ui.closeModal();
    }
    
    deleteEntry() {
        if (!this.currentEntryId) return;
        
        if (confirm('Are you sure you want to delete this entry?')) {
            this.storage.deleteEntry(this.currentEntryId);
            if (this.currentView === 'calendar') {
                this.showCalendar();
            } else {
                this.renderEntries();
            }
            this.closeModal();
        }
    }
    
    editEntry() {
        if (!this.currentEntryId) return;
        
        const entry = this.storage.getEntryById(this.currentEntryId);
        if (!entry) return;
        
        this.ui.fillFormWithEntry(entry);
        this.storage.deleteEntry(this.currentEntryId);
        
        this.closeModal();
        this.ui.scrollToForm();
    }
    
    exportEntries() {
        const data = this.storage.exportEntries();
        this.ui.exportData(data);
    }
    
    shareEntry(id) {
        const entry = this.storage.getEntryById(id);
        if (!entry) return;
        
        this.ui.shareEntry(entry);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JournalApp();
});
