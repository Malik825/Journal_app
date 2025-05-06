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
            onTextToSpeech: () => this.textToSpeech(),
            onAISuggest: () => this.getWritingSuggestions(),
            onSummarize: () => this.summarizeEntry(),
            onGeneratePrompt: () => this.generatePrompt(),
            onTTSToggle: (enabled) => this.toggleTTS(enabled),
            onAIToggle: (enabled) => this.toggleAIFeatures(enabled),
            onVoiceChange: (voice) => this.changeVoice(voice)
        });
        
        // Load settings
        const settings = this.storage.getSettings();
        if (settings.ttsVoice) {
            document.getElementById('voice-select').value = settings.ttsVoice;
        }
        
        this.renderEntries();
    }
    
     // AI Features
     async textToSpeech() {
        if (!this.currentEntryId) return;
        
        const entry = this.storage.getEntryById(this.currentEntryId);
        if (!entry) return;
        
        const settings = this.storage.getSettings();
        if (!settings.ttsEnabled) {
            this.ui.showAIResponse('Text-to-speech is disabled in settings', 'error');
            return;
        }
        
        try {
            const speech = new SpeechSynthesisUtterance();
            speech.text = `${entry.title}. ${entry.content}`;
            
            if (settings.ttsVoice) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.name === settings.ttsVoice);
                if (selectedVoice) {
                    speech.voice = selectedVoice;
                }
            }
            
            window.speechSynthesis.cancel(); // Stop any current speech
            window.speechSynthesis.speak(speech);
        } catch (error) {
            this.ui.showAIResponse('Error with text-to-speech: ' + error.message, 'error');
        }
    }
    async analyzeSentiment(text) {
        // In a real app, you would call an API like:
        // return await fetch('your-sentiment-api', { method: 'POST', body: text })
        // This is a mock implementation for demo purposes
        
        return new Promise(resolve => {
            setTimeout(() => {
                // Simple sentiment analysis based on keywords
                const positiveWords = ['happy', 'joy', 'excited', 'great', 'wonderful'];
                const negativeWords = ['sad', 'angry', 'frustrated', 'bad', 'terrible'];
                
                const positiveCount = positiveWords.filter(word => 
                    text.toLowerCase().includes(word)).length;
                const negativeCount = negativeWords.filter(word => 
                    text.toLowerCase().includes(word)).length;
                
                const score = positiveCount - negativeCount;
                
                resolve({
                    score,
                    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
                    positiveCount,
                    negativeCount
                });
            }, 500);
        });
    }
    async getWritingSuggestions() {
        if (!this.currentEntryId) return;
        
        const entry = this.storage.getEntryById(this.currentEntryId);
        if (!entry) return;
        
        try {
            const sentiment = await this.analyzeSentiment(entry.content);
            
            let suggestion = '';
            if (sentiment.sentiment === 'positive') {
                suggestion = `Your writing has a positive tone. Consider expanding on what made you feel good. 
                What specifically contributed to these positive feelings?`;
            } else if (sentiment.sentiment === 'negative') {
                suggestion = `Your writing has a negative tone. It might help to reflect on: 
                What could improve this situation? What have you learned from this experience?`;
            } else {
                suggestion = `Your writing is neutral. Try to explore deeper: 
                What underlying emotions might be behind these thoughts?`;
            }
            
            this.ui.showAIResponse(`
                <h3 class="font-bold mb-2">Writing Suggestions</h3>
                <p>Based on sentiment analysis (score: ${sentiment.score}):</p>
                <p class="mt-2">${suggestion}</p>
                <p class="mt-2 text-sm">Positive words: ${sentiment.positiveCount}, Negative words: ${sentiment.negativeCount}</p>
            `);
        } catch (error) {
            this.ui.showAIResponse('Error analyzing sentiment: ' + error.message, 'error');
        }
    }
    async getWritingSuggestions() {
        if (!this.currentEntryId) return;
        
        const entry = this.storage.getEntryById(this.currentEntryId);
        if (!entry) return;
        
        try {
            const sentiment = await this.analyzeSentiment(entry.content);
            
            let suggestion = '';
            if (sentiment.sentiment === 'positive') {
                suggestion = `Your writing has a positive tone. Consider expanding on what made you feel good. 
                What specifically contributed to these positive feelings?`;
            } else if (sentiment.sentiment === 'negative') {
                suggestion = `Your writing has a negative tone. It might help to reflect on: 
                What could improve this situation? What have you learned from this experience?`;
            } else {
                suggestion = `Your writing is neutral. Try to explore deeper: 
                What underlying emotions might be behind these thoughts?`;
            }
            
            this.ui.showAIResponse(`
                <h3 class="font-bold mb-2">Writing Suggestions</h3>
                <p>Based on sentiment analysis (score: ${sentiment.score}):</p>
                <p class="mt-2">${suggestion}</p>
                <p class="mt-2 text-sm">Positive words: ${sentiment.positiveCount}, Negative words: ${sentiment.negativeCount}</p>
            `);
        } catch (error) {
            this.ui.showAIResponse('Error analyzing sentiment: ' + error.message, 'error');
        }
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
        const entries = this.filterEntries(this.currentFilter);
        this.ui.renderEntries(entries, {
            filter: this.currentFilter,
            searchTerm: this.searchTerm,
            selectedMood: this.selectedMood
        });
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
        }
        
        // Apply mood filter
        if (this.selectedMood !== 'all') {
            filteredEntries = filteredEntries.filter(entry => entry.mood === this.selectedMood);
        }
        
        // Apply search if there's a search term
        if (this.searchTerm) {
            filteredEntries = filteredEntries.filter(entry => {
                return entry.title.toLowerCase().includes(this.searchTerm) || 
                       entry.content.toLowerCase().includes(this.searchTerm);
            });
        }
        
        return filteredEntries;
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
            this.renderEntries();
            this.closeModal();
        }
    }
    
    editEntry() {
        if (!this.currentEntryId) return;
        
        const entry = this.storage.getEntryById(this.currentEntryId);
        if (!entry) return;
        
        // Fill the form with entry data
        this.ui.fillFormWithEntry(entry);
        
        // Delete the old entry
        this.storage.deleteEntry(this.currentEntryId);
        
        this.closeModal();
        this.ui.scrollToForm();
    }
    
    exportEntries() {
        const data = this.storage.exportEntries();
        this.ui.exportData(data);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JournalApp();
});