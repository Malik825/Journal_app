import Storage from '../storage.js';
import UI from '../Ui.js';
import JournalApp from '../main.js';

// Set up JSDOM with all required elements
beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <!-- Form elements -->
      <form id="journal-form">
        <input id="entry-date" value="2023-01-01">
        <input id="entry-title" value="Test Title">
        <textarea id="entry-content">Test Content</textarea>
        <input type="radio" name="mood" value="1" id="mood-1">
        <input type="radio" name="mood" value="2" id="mood-2">
        <input type="radio" name="mood" value="3" id="mood-3" checked>
      </form>
      
      <!-- Entries container -->
      <div id="entries-container"></div>
      <div id="no-entries" class="hidden">No entries</div>
      
      <!-- Filter controls -->
      <select id="filter-select"><option value="all">All</option></select>
      <input id="search-input">
      
      <!-- Buttons -->
      <button id="clear-btn"></button>
      <button id="print-btn"></button>
      <button id="export-btn"></button>
      
      <!-- Modal -->
      <div id="entry-modal" class="hidden">
        <div id="modal-title"></div>
        <div id="modal-content"></div>
        <button id="close-modal"></button>
        <button id="delete-entry"></button>
        <button id="edit-entry"></button>
      </div>
      
      <!-- Mood filters -->
      <button class="mood-filter-btn" data-mood="all"></button>
      <button class="mood-filter-btn" data-mood="1"></button>
      
      <!-- Theme toggle -->
      <button id="theme-toggle">
        <i class="fas fa-moon"></i>
      </button>
    </div>
  `;
});

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// ==================== Storage Tests ====================
describe('Storage', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new Storage();
  });

  test('initializes with empty array when no data in localStorage', () => {
    expect(storage.getAllEntries()).toEqual([]);
  });

  test('initializes with existing data from localStorage', () => {
    const testData = [{ id: '1', title: 'Test Entry' }];
    localStorage.setItem('journalEntries', JSON.stringify(testData));
    const newStorage = new Storage();
    expect(newStorage.getAllEntries()).toEqual(testData);
  });

  test('adds and retrieves entries correctly', () => {
    const entry = { id: '1', title: 'Test Entry' };
    storage.addEntry(entry);
    expect(storage.getAllEntries()).toHaveLength(1);
    expect(storage.getEntryById('1')).toEqual(entry);
    expect(storage.getEntryById('2')).toBeUndefined();
  });

  test('updates entries correctly', () => {
    const entry = { id: '1', title: 'Test Entry' };
    storage.addEntry(entry);
    const updatedEntry = { ...entry, title: 'Updated' };
    storage.updateEntry('1', updatedEntry);
    expect(storage.getEntryById('1')).toEqual(updatedEntry);
  });

  test('deletes entries correctly', () => {
    const entry = { id: '1', title: 'Test Entry' };
    storage.addEntry(entry);
    storage.deleteEntry('1');
    expect(storage.getAllEntries()).toHaveLength(0);
  });

  test('exports entries with metadata', () => {
    const entry = { id: '1', title: 'Test Entry' };
    storage.addEntry(entry);
    const exported = storage.exportEntries();
    expect(exported.entries).toContainEqual(entry);
    expect(exported).toHaveProperty('journalName');
    expect(exported).toHaveProperty('version');
    expect(exported).toHaveProperty('exportedAt');
  });
});

// ==================== UI Tests ====================
describe('UI', () => {
  let ui;
  let mockCallbacks;

  beforeEach(() => {
    mockCallbacks = {
      onFormSubmit: jest.fn(),
      onClearForm: jest.fn(),
      onFilterChange: jest.fn(),
      onSearch: jest.fn(),
      onMoodFilter: jest.fn(),
      onPrint: jest.fn(),
      onExport: jest.fn(),
      onCloseModal: jest.fn(),
      onDeleteEntry: jest.fn(),
      onEditEntry: jest.fn(),
      onOpenEntry: jest.fn()
    };

    ui = new UI();
    ui.initEventListeners(mockCallbacks);
  });

  test('gets form data correctly', () => {
    const formData = ui.getFormData();
    expect(formData).toEqual({
      date: '2023-01-01',
      title: 'Test Title',
      content: 'Test Content',
      mood: '3'
    });
  });

  test('resets form correctly', () => {
    ui.resetForm();
    expect(document.getElementById('entry-title').value).toBe('');
  });

  test('renders entries correctly', () => {
    const entries = [
      { id: '1', title: 'Test 1', content: 'Content 1', date: '2023-01-01', mood: '3' },
      { id: '2', title: 'Test 2', content: 'Content 2', date: '2023-01-02', mood: '4' }
    ];
    
    ui.renderEntries(entries, { filter: 'all', searchTerm: '', selectedMood: 'all' });
    const container = document.getElementById('entries-container');
    expect(container.children).toHaveLength(2);
  });

  test('opens and closes modal correctly', () => {
    const entry = { id: '1', title: 'Test', content: 'Content', date: '2023-01-01', mood: '3' };
    ui.openEntryModal(entry, '');
    expect(document.getElementById('entry-modal').classList.contains('hidden')).toBe(false);
    ui.closeModal();
    expect(document.getElementById('entry-modal').classList.contains('hidden')).toBe(true);
  });
});

// ==================== JournalApp Tests ====================
describe('JournalApp', () => {
  let journalApp;

  beforeEach(() => {
    localStorage.clear();
    journalApp = new JournalApp();
  });

  test('initializes with default state', () => {
    expect(journalApp.currentEntryId).toBeNull();
    expect(journalApp.searchTerm).toBe('');
    expect(journalApp.selectedMood).toBe('all');
    expect(journalApp.currentFilter).toBe('all');
  });

  test('adds entry correctly', () => {
    jest.spyOn(UI.prototype, 'getFormData').mockImplementation(() => ({
      date: '2023-01-01',
      title: 'Test',
      content: 'Content',
      mood: '3'
    }));
    
    const mockAddEntry = jest.spyOn(Storage.prototype, 'addEntry');
    journalApp.addEntry();
    expect(mockAddEntry).toHaveBeenCalled();
  });

  test('filters entries by date range', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    jest.spyOn(Storage.prototype, 'getAllEntries').mockImplementation(() => [
      { id: '1', date: today.toISOString().split('T')[0] },
      { id: '2', date: yesterday.toISOString().split('T')[0] },
      { id: '3', date: '2000-01-01' }
    ]);
    
    const todayEntries = journalApp.filterEntries('today');
    expect(todayEntries).toHaveLength(1);
  });
});

// // ==================== Theme Manager Tests ====================
// describe('ThemeManager', () => {
//   let themeManager;

//   beforeEach(() => {
//     localStorage.clear();
//   });

//   test('initializes with light theme by default', () => {
//     Object.defineProperty(window, 'matchMedia', {
//       writable: true,
//       value: jest.fn().mockImplementation(() => ({ matches: false })),
//     });
    
//     themeManager = new JournalApp().themeManager;
//     expect(document.documentElement.getAttribute('data-theme')).toBe('light');
//   });

//   test('toggles theme on button click', () => {
//     themeManager = new JournalApp().themeManager;
//     const button = document.getElementById('theme-toggle');
    
//     // Initial state
//     document.documentElement.setAttribute('data-theme', 'light');
    
//     // First click - switch to dark
//     button.click();
//     expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
//     // Second click - switch back to light
//     button.click();
//     expect(document.documentElement.getAttribute('data-theme')).toBe('light');
//   });

//   test('saves theme preference to localStorage', () => {
//     themeManager = new JournalApp().themeManager;
//     const button = document.getElementById('theme-toggle');
    
//     button.click(); // Switch to dark
//     expect(localStorage.getItem('theme')).toBe('dark');
    
//     button.click(); // Switch to light
//     expect(localStorage.getItem('theme')).toBe('light');
//   });
// });