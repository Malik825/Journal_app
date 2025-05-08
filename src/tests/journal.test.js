/* tests/journal.test.js */
import Storage from '../storage.js';
import JournalApp from '../main.js';
import UI from '../Ui.js';

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => (store[key] = value.toString())),
    clear: jest.fn(() => (store = {})),
    removeItem: jest.fn((key) => delete store[key]),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock DOM environment
document.body.innerHTML = `
  <form id="journal-form">
    <input id="entry-date" value="2025-05-08" />
    <input id="entry-title" value="Test Entry" />
    <textarea id="entry-content">This is a test</textarea>
    <input type="radio" name="mood" value="4" checked />
  </form>
  <div id="entries-container"></div>
  <div id="no-entries" class="hidden"></div>
  <select id="filter-select"></select>
  <input id="search-input" />
  <button id="clear-btn"></button>
  <button id="print-btn"></button>
  <button id="export-btn"></button>
  <div id="entry-modal" class="hidden">
    <h3 id="modal-title"></h3>
    <div id="modal-content"></div>
    <button id="close-modal"></button>
    <button id="delete-entry"></button>
    <button id="edit-entry"></button>
    <button id="share-entry"></button>
  </div>
  <button class="mood-filter-btn" data-mood="all"></button>
  <button id="dashboard-btn"></button>
  <button id="entries-btn"></button>
  <button id="calendar-btn"></button>
  <div id="entries-view"></div>
  <div id="dashboard-view" class="hidden"></div>
  <div id="calendar-view" class="hidden"></div>
  <select id="period-select"></select>
  <canvas id="mood-chart"></canvas>
  <div id="calendar"></div>
  <button id="theme-toggle"><i class="fas fa-moon"></i> Dark Mode</button>
`;

// Mock Chart.js and FullCalendar
// jest.mock('chart.js', () => ({
//   Chart: jest.fn(),
// }));
// jest.mock('fullcalendar', () => ({
//   Calendar: jest.fn(() => ({
//     destroy: jest.fn(),
//     render: jest.fn(),
//   })),
// }));

describe('Mindful Journal', () => {
  describe('Storage', () => {
    let storage;

    beforeEach(() => {
      localStorage.clear();
      storage = new Storage();
    });

    test('should initialize with empty entries if localStorage is empty', () => {
      expect(storage.getAllEntries()).toEqual([]);
    });

    test('should load entries from localStorage', () => {
      const entries = [
        { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08', createdAt: '2025-05-08T00:00:00Z' },
      ];
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      storage = new Storage();
      expect(storage.getAllEntries()).toEqual(entries);
    });

    test('should add a new entry', () => {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
        date: '2025-05-08',
        createdAt: '2025-05-08T00:00:00Z',
      };
      storage.addEntry(entry);
      expect(storage.getAllEntries()).toEqual([entry]);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'journalEntries',
        JSON.stringify([entry])
      );
    });

    test('should update an existing entry', () => {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
        date: '2025-05-08',
        createdAt: '2025-05-08T00:00:00Z',
      };
      storage.addEntry(entry);
      const updatedEntry = { ...entry, title: 'Updated Entry', mood: '5' };
      storage.updateEntry('1', updatedEntry);
      expect(storage.getAllEntries()).toEqual([updatedEntry]);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'journalEntries',
        JSON.stringify([updatedEntry])
      );
    });

    test('should delete an entry', () => {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
        date: '2025-05-08',
        createdAt: '2025-05-08T00:00:00Z',
      };
      storage.addEntry(entry);
      storage.deleteEntry('1');
      expect(storage.getAllEntries()).toEqual([]);
      expect(localStorage.setItem).toHaveBeenCalledWith('journalEntries', JSON.stringify([]));
    });

    test('should get entry by ID', () => {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
        date: '2025-05-08',
        createdAt: '2025-05-08T00:00:00Z',
      };
      storage.addEntry(entry);
      expect(storage.getEntryById('1')).toEqual(entry);
      expect(storage.getEntryById('2')).toBeUndefined();
    });

    test('should export entries', () => {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
        date: '2025-05-08',
        createdAt: '2025-05-08T00:00:00Z',
      };
      storage.addEntry(entry);
      const exported = storage.exportEntries();
      expect(exported).toEqual({
        journalName: 'Mindful Journal',
        version: '1.0',
        exportedAt: expect.any(String),
        entries: [entry],
      });
    });

    // test('should get mood trends for week', () => {
    //   const entries = [
    //     { id: '1', title: 'Test 1', content: 'Content', mood: '4', date: '2025-05-08', createdAt: '2025-05-08T00:00:00Z' },
    //     { id: '2', title: 'Test 2', content: 'Content', mood: '5', date: '2025-05-07', createdAt: '2025-05-07T00:00:00Z' },
    //   ];
    //   entries.forEach(entry => storage.addEntry(entry));
    //   const trends = storage.getMoodTrends('week');
    //   expect(trends.labels).toEqual(['Week 1', 'Week 2', 'Week 3', 'Week 4']);
    //   expect(trends.data.length).toBe(4);
    //   expect(trends.data[3]).toBeCloseTo(4.5); // Average of 4 and 5
    // });

    // test('should get calendar events', () => {
    //   const entry = {
    //     id: '1',
    //     title: 'Test Entry',
    //     content: 'This is a test',
    //     mood: '4',
    //     date: '2025-05-08',
    //     createdAt: '2025-05-08T00:00:00Z',
    //   };
    //   storage.addEntry(entry);
    //   const events = storage.getCalendarEvents();
    //   expect(events).toEqual([
    //     {
    //       id: '1',
    //       title: 'Test Entry',
    //       start: '2025-05-08',
    //       backgroundColor: '#22c55e',
    //       borderColor: '#22c55e',
    //     },
    //   ]);
    // });
  });

  describe('JournalApp', () => {
    let journalApp;
    let mockStorage;
    let mockUI;

    beforeEach(() => {
      mockStorage = {
        getAllEntries: jest.fn(),
        getEntryById: jest.fn(),
        addEntry: jest.fn(),
        updateEntry: jest.fn(),
        deleteEntry: jest.fn(),
        save: jest.fn(),
        exportEntries: jest.fn(),
        getMoodTrends: jest.fn(),
        getCalendarEvents: jest.fn(),
      };
      mockUI = {
        initEventListeners: jest.fn(),
        renderEntries: jest.fn(),
        resetForm: jest.fn(),
        getFormData: jest.fn(),
        scrollToTop: jest.fn(),
        openEntryModal: jest.fn(),
        closeModal: jest.fn(),
        fillFormWithEntry: jest.fn(),
        scrollToForm: jest.fn(),
        exportData: jest.fn(),
        toggleView: jest.fn(),
        renderMoodChart: jest.fn(),
        renderCalendar: jest.fn(),
        shareEntry: jest.fn(),
      };
      Storage.mockImplementation(() => mockStorage);
      UI.mockImplementation(() => mockUI);
      journalApp = new JournalApp();
    });

    test('should initialize correctly', () => {
      expect(mockUI.initEventListeners).toHaveBeenCalled();
      expect(journalApp.renderEntries).toHaveBeenCalled();
    });

    test('should add a new entry', () => {
      mockUI.getFormData.mockReturnValue({
        date: '2025-05-08',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
      });
      journalApp.addEntry();
      expect(mockStorage.addEntry).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        date: '2025-05-08',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
        createdAt: expect.any(String),
      }));
      expect(mockUI.resetForm).toHaveBeenCalled();
      expect(journalApp.renderEntries).toHaveBeenCalled();
      expect(mockUI.scrollToTop).toHaveBeenCalled();
    });

    test('should not add entry if form data is incomplete', () => {
      mockUI.getFormData.mockReturnValue({
        date: '',
        title: '',
        content: '',
        mood: '4',
      });
      journalApp.addEntry();
      expect(mockStorage.addEntry).not.toHaveBeenCalled();
    });

    test('should filter entries by mood', () => {
      const entries = [
        { id: '1', title: 'Test 1', content: 'Content', mood: '4', date: '2025-05-08' },
        { id: '2', title: 'Test 2', content: 'Content', mood: '5', date: '2025-05-07' },
      ];
      mockStorage.getAllEntries.mockReturnValue(entries);
      journalApp.filterByMood('4');
      expect(journalApp.selectedMood).toBe('4');
      expect(mockUI.renderEntries).toHaveBeenCalledWith(
        [entries[0]],
        expect.any(Object)
      );
    });

    test('should search entries by title or content', () => {
      const entries = [
        { id: '1', title: 'Test Entry', content: 'Content', mood: '4', date: '2025-05-08' },
        { id: '2', title: 'Other', content: 'Different', mood: '5', date: '2025-05-07' },
      ];
      mockStorage.getAllEntries.mockReturnValue(entries);
      journalApp.searchEntries('test');
      expect(journalApp.searchTerm).toBe('test');
      expect(mockUI.renderEntries).toHaveBeenCalledWith(
        [entries[0]],
        expect.any(Object)
      );
    });

    test('should filter entries by date', () => {
      const entries = [
        { id: '1', title: 'Test 1', content: 'Content', mood: '4', date: '2025-05-08' },
        { id: '2', title: 'Test 2', content: 'Content', mood: '5', date: '2025-05-07' },
      ];
      mockStorage.getAllEntries.mockReturnValue(entries);
      journalApp.filterByDate('2025-05-08');
      expect(journalApp.currentFilter).toBe('date:2025-05-08');
      expect(mockUI.renderEntries).toHaveBeenCalledWith(
        [entries[0]],
        expect.any(Object)
      );
    });

    test('should open an entry', () => {
      const entry = { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08' };
      mockStorage.getEntryById.mockReturnValue(entry);
      journalApp.openEntry('1');
      expect(journalApp.currentEntryId).toBe('1');
      expect(mockUI.openEntryModal).toHaveBeenCalledWith(entry, '');
    });

    test('should delete an entry', () => {
      global.confirm = jest.fn(() => true);
      journalApp.currentEntryId = '1';
      journalApp.deleteEntry();
      expect(mockStorage.deleteEntry).toHaveBeenCalledWith('1');
      expect(mockUI.closeModal).toHaveBeenCalled();
      expect(journalApp.renderEntries).toHaveBeenCalled();
    });

    test('should edit an entry', () => {
      const entry = { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08' };
      mockStorage.getEntryById.mockReturnValue(entry);
      journalApp.currentEntryId = '1';
      journalApp.editEntry();
      expect(mockUI.fillFormWithEntry).toHaveBeenCalledWith(entry);
      expect(mockStorage.deleteEntry).toHaveBeenCalledWith('1');
      expect(mockUI.closeModal).toHaveBeenCalled();
      expect(mockUI.scrollToForm).toHaveBeenCalled();
    });

    test('should export entries', () => {
      const exportedData = { journalName: 'Mindful Journal', entries: [] };
      mockStorage.exportEntries.mockReturnValue(exportedData);
      journalApp.exportEntries();
      expect(mockStorage.exportEntries).toHaveBeenCalled();
      expect(mockUI.exportData).toHaveBeenCalledWith(exportedData);
    });
  });

  describe('UI', () => {
    let ui;

    beforeEach(() => {
      ui = new UI();
      jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      window.alert.mockRestore();
    });

    test('should get form data', () => {
      expect(ui.getFormData()).toEqual({
        date: '2025-05-08',
        title: 'Test Entry',
        content: 'This is a test',
        mood: '4',
      });
    });

    test('should reset form', () => {
      const formResetSpy = jest.spyOn(ui.form, 'reset');
      ui.resetForm();
      expect(formResetSpy).toHaveBeenCalled();
    });

    test('should render entries', () => {
      const entries = [
        { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08', createdAt: '2025-05-08T00:00:00Z' },
      ];
      ui.renderEntries(entries, { filter: 'all', searchTerm: '', selectedMood: 'all' });
      expect(ui.entriesContainer.children.length).toBe(1);
      expect(ui.entriesContainer.querySelector('.entry-content')).toBeTruthy();
    });

    test('should show no entries message when empty', () => {
      ui.renderEntries([], { filter: 'all', searchTerm: '', selectedMood: 'all' });
      expect(ui.noEntries.classList.contains('hidden')).toBe(false);
    });

    test('should open entry modal', () => {
      const entry = { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08' };
      ui.openEntryModal(entry, '');
      expect(ui.modal.classList.contains('hidden')).toBe(false);
      expect(ui.modalTitle.textContent).toBe('Test');
      expect(ui.modalContent.querySelector('p').textContent).toBe('Content');
    });

    test('should close modal', () => {
      ui.modal.classList.remove('hidden');
      ui.closeModal();
      expect(ui.modal.classList.contains('hidden')).toBe(true);
    });

    test('should fill form with entry data', () => {
      const entry = { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08' };
      ui.fillFormWithEntry(entry);
      expect(document.getElementById('entry-date').value).toBe('2025-05-08');
      expect(document.getElementById('entry-title').value).toBe('Test');
      expect(document.getElementById('entry-content').value).toBe('Content');
      expect(document.querySelector('input[name="mood"][value="4"]').checked).toBe(true);
    });

  
  });

  describe('Theme Toggle', () => {
    beforeEach(() => {
      // Reset theme-related mocks
      localStorage.clear();
      document.documentElement.setAttribute('data-theme', 'light');
      const themeToggle = document.getElementById('theme-toggle');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    });

    test('should initialize with saved theme or system preference', () => {
      localStorage.setItem('theme', 'dark');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.getElementById('theme-toggle').textContent).toContain('Light Mode');
      expect(document.querySelector('#theme-toggle i').classList.contains('fa-sun')).toBe(true);
    });

    test('should initialize with light theme if no saved preference and system prefers light', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));
      document.dispatchEvent(new Event('DOMContentLoaded'));
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.getElementById('theme-toggle').textContent).toContain('Dark Mode');
      expect(document.querySelector('#theme-toggle i').classList.contains('fa-moon')).toBe(true);
    });

    test('should toggle theme on button click', () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      const themeToggle = document.getElementById('theme-toggle');
      themeToggle.click();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(themeToggle.textContent).toContain('Light Mode');
      expect(document.querySelector('#theme-toggle i').classList.contains('fa-sun')).toBe(true);

      themeToggle.click();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
      expect(themeToggle.textContent).toContain('Dark Mode');
      expect(document.querySelector('#theme-toggle i').classList.contains('fa-moon')).toBe(true);
    });

  
  });
});
