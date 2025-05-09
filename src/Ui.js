
/* Updated Ui.js */
class UI {
    constructor() {
        this.form = document.getElementById('journal-form');
        this.entriesContainer = document.getElementById('entries-container');
        this.noEntries = document.getElementById('no-entries');
        this.filterSelect = document.getElementById('filter-select');
        this.searchInput = document.getElementById('search-input');
        this.clearBtn = document.getElementById('clear-btn');
        this.printBtn = document.getElementById('print-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.modal = document.getElementById('entry-modal');
        this.closeModalBtn = document.getElementById('close-modal');
        this.deleteEntryBtn = document.getElementById('delete-entry');
        this.editEntryBtn = document.getElementById('edit-entry');
        this.modalTitle = document.getElementById('modal-title');
        this.modalContent = document.getElementById('modal-content');
        this.moodFilterButtons = document.querySelectorAll('.mood-filter-btn');
        this.dashboardBtn = document.getElementById('dashboard-btn');
        this.entriesBtn = document.getElementById('entries-btn');
        this.calendarBtn = document.getElementById('calendar-btn');
        this.entriesView = document.getElementById('entries-view');
        this.dashboardView = document.getElementById('dashboard-view');
        this.calendarView = document.getElementById('calendar-view');
        this.periodSelect = document.getElementById('period-select');
        this.moodChartCanvas = document.getElementById('mood-chart');
        this.calendarContainer = document.getElementById('calendar');
        this.moodChart = null;
        this.calendar = null;
        this.onOpenEntry = null;
    }

    initEventListeners({
        onFormSubmit,
        onClearForm,
        onFilterChange,
        onSearch,
        onMoodFilter,
        onPrint,
        onExport,
        onCloseModal,
        onDeleteEntry,
        onEditEntry,
        onOpenEntry,
        onShowDashboard,
        onShowEntries,
        onShowCalendar,
        onPeriodChange,
        onCalendarDateClick
    }) {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            onFormSubmit();
        });
        this.onOpenEntry = onOpenEntry;

        this.clearBtn.addEventListener('click', () => {
            onClearForm();
        });

        this.filterSelect.addEventListener('change', () => {
            onFilterChange(this.filterSelect.value);
        });

        this.searchInput.addEventListener('input', (e) => {
            onSearch(e.target.value.trim().toLowerCase());
        });

        this.moodFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.moodFilterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                onMoodFilter(button.dataset.mood);
            });
        });

        document.querySelector('.mood-filter-btn[data-mood="all"]').classList.add('active');

        this.printBtn.addEventListener('click', () => {
            onPrint();
        });

        this.exportBtn.addEventListener('click', () => {
            onExport();
        });

        this.closeModalBtn.addEventListener('click', () => onCloseModal());
        this.deleteEntryBtn.addEventListener('click', () => onDeleteEntry());
        this.editEntryBtn.addEventListener('click', () => onEditEntry());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                onCloseModal();
            }
        });

        this.dashboardBtn.addEventListener('click', () => onShowDashboard());
        this.entriesBtn.addEventListener('click', () => onShowEntries());
        this.calendarBtn.addEventListener('click', () => onShowCalendar());
    }

    toggleView(view) {
        if (view === 'entries') {
            this.entriesView.classList.remove('hidden');
            this.dashboardView.classList.add('hidden');
            this.calendarView.classList.add('hidden');
            this.entriesBtn.classList.add('bg-teal-600', 'text-white');
            this.entriesBtn.classList.remove('bg-white', 'text-gray-800');
            this.dashboardBtn.classList.add('bg-white', 'text-gray-800');
            this.dashboardBtn.classList.remove('bg-teal-600', 'text-white');
            this.calendarBtn.classList.add('bg-white', 'text-gray-800');
            this.calendarBtn.classList.remove('bg-teal-600', 'text-white');
        } else if (view === 'dashboard') {
            this.entriesView.classList.add('hidden');
            this.dashboardView.classList.remove('hidden');
            this.calendarView.classList.add('hidden');
            this.dashboardBtn.classList.add('bg-teal-600', 'text-white');
            this.dashboardBtn.classList.remove('bg-white', 'text-gray-800');
            this.entriesBtn.classList.add('bg-white', 'text-gray-800');
            this.entriesBtn.classList.remove('bg-teal-600', 'text-white');
            this.calendarBtn.classList.add('bg-white', 'text-gray-800');
            this.calendarBtn.classList.remove('bg-teal-600', 'text-white');
        } else {
            this.entriesView.classList.add('hidden');
            this.dashboardView.classList.add('hidden');
            this.calendarView.classList.remove('hidden');
            this.calendarBtn.classList.add('bg-teal-600', 'text-white');
            this.calendarBtn.classList.remove('bg-white', 'text-gray-800');
            this.entriesBtn.classList.add('bg-white', 'text-gray-800');
            this.entriesBtn.classList.remove('bg-teal-600', 'text-white');
            this.dashboardBtn.classList.add('bg-white', 'text-gray-800');
            this.dashboardBtn.classList.remove('bg-teal-600', 'text-white');
        }
    }

    renderMoodChart(moodData, period) {
        if (this.moodChart) {
            this.moodChart.destroy();
        }

        this.moodChart = new Chart(this.moodChartCanvas, {
            type: 'line',
            data: {
                labels: moodData.labels,
                datasets: [{
                    label: 'Average Mood',
                    data: moodData.data,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: value => {
                                const moods = { 1: 'Angry', 2: 'Sad', 3: 'Neutral', 4: 'Happy', 5: 'Very Happy' };
                                return moods[value] || value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const value = context.parsed.y;
                                return value ? `Mood: ${value.toFixed(2)}` : 'No data';
                            }
                        }
                    }
                }
            }
        });
    }

    renderCalendar(events) {
        if (this.calendar) {
            this.calendar.destroy();
        }

        this.calendar = new FullCalendar.Calendar(this.calendarContainer, {
            initialView: 'dayGridMonth',
            events: events,
            eventClick: info => {
                if (this.onOpenEntry) {
                    this.onOpenEntry(info.event.id);
                }
            },
            dateClick: info => {
                if (onCalendarDateClick) {
                    onCalendarDateClick(info.dateStr);
                }
            },
            height: 'auto',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }
        });

        this.calendar.render();
    }

    getFormData() {
        return {
            date: document.getElementById('entry-date').value,
            title: document.getElementById('entry-title').value.trim(),
            content: document.getElementById('entry-content').value.trim(),
            mood: document.querySelector('input[name="mood"]:checked')?.value || '3'
        };
    }

    resetForm() {
        this.form.reset();
    }

    renderEntries(entries, { filter, searchTerm, selectedMood }) {
        this.entriesContainer.innerHTML = '';
    
        if (entries.length === 0) {
            this.entriesContainer.appendChild(this.noEntries);
            this.noEntries.classList.remove('hidden');
            return;
        }
    
        this.noEntries.classList.add('hidden');
    
        entries.forEach((entry, index) => {
            const entryElement = this.createEntryElement(entry, searchTerm);
            if (index === 0) {
                entryElement.classList.add('fade-in');
            }
            this.entriesContainer.appendChild(entryElement);
        });
    }
    
    createEntryElement(entry, searchTerm) {
        const entryDate = new Date(entry.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = entryDate.toLocaleDateString(undefined, options);

        const moodIcons = {
            '1': { icon: 'fa-angry', color: 'text-red-500' },
            '2': { icon: 'fa-frown', color: 'text-orange-500' },
            '3': { icon: 'fa-meh', color: 'text-yellow-500' },
            '4': { icon: 'fa-smile', color: 'text-green-500' },
            '5': { icon: 'fa-laugh', color: 'text-blue-500' }
        };

        const mood = moodIcons[entry.mood] || moodIcons['3'];

        let displayTitle = this.highlightText(entry.title, searchTerm);
        let displayContent = this.highlightText(entry.content, searchTerm);

        const entryElement = document.createElement('div');
        entryElement.className = 'entry-content p-6 cursor-pointer transition-colors';
        entryElement.dataset.id = entry.id;

        entryElement.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-medium ">${displayTitle}</h3>
                <div class="flex items-center">
                    <i class="fas ${mood.icon} ${mood.color} text-xl mr-2"></i>
                    <span class="text-sm text-gray-500">${formattedDate}</span>
                </div>
            </div>
            <p class="text-gray-600 line-clamp-3">${displayContent}</p>
            <div class="mt-3 flex justify-end">
                <button class="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center read-more">
                    Read more <i class="fas fa-chevron-right ml-1 text-xs"></i>
                </button>
            </div>
        `;

        entryElement.querySelector('.read-more').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onOpenEntry) {
                this.onOpenEntry(entry.id);
            }
        });
    
        entryElement.addEventListener('click', () => {
            if (this.onOpenEntry) {
                this.onOpenEntry(entry.id);
            }
        });
    
        return entryElement;
    }


    highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(searchTerm, 'gi');
        return text.replace(regex, match => `<span class="highlight">${match}</span>`);
    }

    openEntryModal(entry, searchTerm) {
        const entryDate = new Date(entry.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = entryDate.toLocaleDateString(undefined, options);

        const moodIcons = {
            '1': { icon: 'fa-angry', text: 'Angry' },
            '2': { icon: 'fa-frown', text: 'Sad' },
            '3': { icon: 'fa-meh', text: 'Neutral' },
            '4': { icon: 'fa-smile', text: 'Happy' },
            '5': { icon: 'fa-laugh', text: 'Very Happy' }
        };

        const mood = moodIcons[entry.mood] || moodIcons['3'];

        let displayContent = this.highlightText(entry.content, searchTerm);

        this.modalTitle.innerHTML = this.highlightText(entry.title, searchTerm);
        this.modalContent.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center">
                    <i class="fas ${mood.icon} text-xl mr-2 ${mood.text === 'Angry' ? 'text-red-500' : 
                      mood.text === 'Sad' ? 'text-orange-500' : 
                      mood.text === 'Neutral' ? 'text-yellow-500' : 
                      mood.text === 'Happy' ? 'text-green-500' : 'text-blue-500'}"></i>
                    <span class="text-gray-700">${mood.text}</span>
                </div>
                <span class="text-gray-500">${formattedDate}</span>
            </div>
            <div class="prose max-w-none">
                <p class="whitespace-pre-line">${displayContent}</p>
            </div>
        `;

        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    fillFormWithEntry(entry) {
        document.getElementById('entry-date').value = entry.date;
        document.getElementById('entry-title').value = entry.title;
        document.getElementById('entry-content').value = entry.content;
        document.querySelector(`input[name="mood"][value="${entry.mood}"]`).checked = true;
    }

    scrollToTop() {
        this.entriesContainer.scrollTo(0, 0);
    }

    scrollToForm() {
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    exportData(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-entries-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export default UI;