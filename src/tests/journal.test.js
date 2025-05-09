import Storage from '../storage.js';
import UI from '../Ui.js';
import ThemeManager from '../theme.js';
import '@testing-library/jest-dom';

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
  <div id="no-entries" class="hidden">No entries found</div>
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

// Mock window.matchMedia for theme tests
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: query === '(prefers-color-scheme: light)',
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

// Mock scrollTo for jsdom
beforeEach(() => {
  const entriesContainer = document.getElementById('entries-container');
  entriesContainer.scrollTo = jest.fn();
});

describe('Mindful Journal', () => {
  describe('Storage', () => {
    let storage;

    beforeEach(() => {
      localStorageMock.clear();
      storage = new Storage();
    });

    test('should initialize with empty entries if localStorage is empty', () => {
      expect(storage.getAllEntries()).toEqual([]);
    });

    test('should load entries from localStorage', () => {
      const entries = [
        { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08', createdAt: '2025-05-08T00:00:00Z' },
      ];
      localStorageMock.setItem('journalEntries', JSON.stringify(entries));
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
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
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
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
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
      expect(localStorageMock.setItem).toHaveBeenCalledWith('journalEntries', JSON.stringify([]));
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
      expect(ui.noEntries).not.toHaveClass('hidden');
    });

    test('should open entry modal', () => {
      const entry = { id: '1', title: 'Test', content: 'Content', mood: '4', date: '2025-05-08' };
      ui.openEntryModal(entry, '');
      expect(ui.modal).not.toHaveClass('hidden');
      expect(ui.modalTitle.textContent).toBe('Test');
      expect(ui.modalContent.querySelector('p').textContent).toBe('Content');
    });

    test('should close modal', () => {
      ui.modal.classList.remove('hidden');
      ui.closeModal();
      expect(ui.modal).toHaveClass('hidden');
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
      localStorageMock.clear();
      document.documentElement.setAttribute('data-theme', 'light');
      const themeToggle = document.getElementById('theme-toggle');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    });

  

    test('should initialize with light theme if no saved preference and system prefers light', () => {
      window.matchMedia.mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));
      new ThemeManager();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.getElementById('theme-toggle').textContent).toContain('Dark Mode');
      expect(document.querySelector('#theme-toggle i').classList.contains('fa-moon')).toBe(true);
    });

   
  });
});