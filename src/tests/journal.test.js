// __tests__/journal.test.js

// Mock the modules before import
jest.mock('../storage.js');
jest.mock('../Ui.js');

// Import the modules
import Storage from '../storage.js';
import UI from '../Ui.js';
import JournalApp from '../main.js';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock DOM elements
document.body.innerHTML = `
  <form id="journal-form">
    <input id="entry-date" type="date">
    <input id="entry-title" type="text">
    <textarea id="entry-content"></textarea>
    <div>
      <input type="radio" name="mood" value="1" id="mood-1">
      <input type="radio" name="mood" value="2" id="mood-2">
      <input type="radio" name="mood" value="3" id="mood-3" checked>
      <input type="radio" name="mood" value="4" id="mood-4">
      <input type="radio" name="mood" value="5" id="mood-5">
    </div>
  </form>
  <div id="entries-container"></div>
  <div id="no-entries" class="hidden">No entries found</div>
  <select id="filter-select"></select>
  <input id="search-input" type="text">
  <button id="clear-btn">Clear</button>
  <button id="print-btn">Print</button>
  <button id="export-btn">Export</button>
  <div id="entry-modal" class="hidden">
    <div>
      <button id="close-modal">Close</button>
      <h2 id="modal-title"></h2>
      <div id="modal-content"></div>
      <button id="delete-entry">Delete</button>
      <button id="edit-entry">Edit</button>
    </div>
  </div>
  <div class="mood-filters">
    <button class="mood-filter-btn" data-mood="all">All Moods</button>
    <button class="mood-filter-btn" data-mood="1">Angry</button>
    <button class="mood-filter-btn" data-mood="2">Sad</button>
    <button class="mood-filter-btn" data-mood="3">Neutral</button>
    <button class="mood-filter-btn" data-mood="4">Happy</button>
    <button class="mood-filter-btn" data-mood="5">Very Happy</button>
  </div>
`;

// Mock window.print
window.print = jest.fn();

// Mock date for consistent testing
const mockDate = new Date('2025-05-06T12:00:00Z');
global.Date = class extends Date {
  constructor() {
    super();
    return mockDate;
  }
  
  static now() {
    return mockDate.getTime();
  }
  
  toISOString() {
    return mockDate.toISOString();
  }
};

// Mock confirm
global.confirm = jest.fn(() => true);

// Spy on console.log
console.log = jest.fn();

// Implement the actual Storage class for testing
// instead of using the mocked version
const RealStorage = jest.requireActual('../storage.js').default;

// Storage Class Tests
describe('Storage Class', () => {
  let StorageImplementation;
  
  beforeEach(() => {
    localStorage.clear();
    StorageImplementation = RealStorage;
  });

  test('should initialize with empty array if no entries in localStorage', () => {
    const storage = new StorageImplementation();
    expect(storage.getAllEntries()).toEqual([]);
  });

  test('should load entries from localStorage if available', () => {
    const testEntries = [
      { id: '1', title: 'Test Entry', content: 'Test content', mood: '4', date: '2025-05-06' }
    ];
    localStorage.setItem('journalEntries', JSON.stringify(testEntries));
    
    const storage = new StorageImplementation();
    expect(storage.getAllEntries()).toEqual(testEntries);
  });

  test('should add a new entry to the beginning of entries array', () => {
    const storage = new StorageImplementation();
    const newEntry = { 
      id: '1', 
      title: 'Test Entry', 
      content: 'Test content', 
      mood: '4', 
      date: '2025-05-06',
      createdAt: mockDate.toISOString()
    };
    
    storage.addEntry(newEntry);
    expect(storage.getAllEntries()[0]).toEqual(newEntry);
    expect(localStorage.setItem).toHaveBeenCalledWith('journalEntries', JSON.stringify([newEntry]));
  });

  test('should get entry by id', () => {
    const storage = new StorageImplementation();
    const entry1 = { id: '1', title: 'Entry 1', content: 'Content 1', mood: '3', date: '2025-05-06' };
    const entry2 = { id: '2', title: 'Entry 2', content: 'Content 2', mood: '4', date: '2025-05-06' };
    
    storage.addEntry(entry1);
    storage.addEntry(entry2);
    
    expect(storage.getEntryById('1')).toEqual(entry1);
    expect(storage.getEntryById('2')).toEqual(entry2);
    expect(storage.getEntryById('3')).toBeUndefined();
  });

  test('should update an entry', () => {
    const storage = new StorageImplementation();
    const entry = { id: '1', title: 'Entry 1', content: 'Content 1', mood: '3', date: '2025-05-06' };
    
    storage.addEntry(entry);
    
    const updatedEntry = { ...entry, title: 'Updated Title', content: 'Updated Content' };
    storage.updateEntry('1', updatedEntry);
    
    expect(storage.getEntryById('1')).toEqual(updatedEntry);
  });

  test('should delete an entry', () => {
    const storage = new StorageImplementation();
    const entry1 = { id: '1', title: 'Entry 1', content: 'Content 1', mood: '3', date: '2025-05-06' };
    const entry2 = { id: '2', title: 'Entry 2', content: 'Content 2', mood: '4', date: '2025-05-06' };
    
    storage.addEntry(entry1);
    storage.addEntry(entry2);
    
    storage.deleteEntry('1');
    
    expect(storage.getAllEntries().length).toBe(1);
    expect(storage.getEntryById('1')).toBeUndefined();
    expect(storage.getEntryById('2')).toEqual(entry2);
  });

  test('should export entries with metadata', () => {
    const storage = new StorageImplementation();
    const entry = { id: '1', title: 'Entry 1', content: 'Content 1', mood: '3', date: '2025-05-06' };
    
    storage.addEntry(entry);
    
    const exported = storage.exportEntries();
    
    expect(exported).toEqual({
      journalName: "Mindful Journal",
      version: "1.0",
      exportedAt: mockDate.toISOString(),
      entries: [entry]
    });
  });
});

// Use a real UI implementation for UI tests
const RealUI = jest.requireActual('../Ui.js').default;

// UI Class Tests
describe('UI Class', () => {
  let ui;
  
  beforeEach(() => {
    // Reset DOM elements
    document.getElementById('journal-form').reset();
    document.getElementById('entries-container').innerHTML = '';
    document.getElementById('no-entries').classList.add('hidden');
    document.getElementById('modal-title').textContent = '';
    document.getElementById('modal-content').innerHTML = '';
    document.getElementById('entry-modal').classList.add('hidden');
    
    // Create new UI instance
    ui = new RealUI();
  });

  test('should get form data correctly', () => {
    // Set form values
    document.getElementById('entry-date').value = '2025-05-06';
    document.getElementById('entry-title').value = 'Test Title';
    document.getElementById('entry-content').value = 'Test Content';
    document.getElementById('mood-4').checked = true;
    
    const formData = ui.getFormData();
    
    expect(formData).toEqual({
      date: '2025-05-06',
      title: 'Test Title',
      content: 'Test Content',
      mood: '4'
    });
  });

  test('should reset form', () => {
    // Set form values
    document.getElementById('entry-date').value = '2025-05-06';
    document.getElementById('entry-title').value = 'Test Title';
    document.getElementById('entry-content').value = 'Test Content';
    
    ui.resetForm();
    
    expect(document.getElementById('entry-title').value).toBe('');
    expect(document.getElementById('entry-content').value).toBe('');
  });

  test('should show no entries message when there are no entries', () => {
    ui.renderEntries([], { filter: 'all', searchTerm: '', selectedMood: 'all' });
    
    expect(document.getElementById('no-entries').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('entries-container').children.length).toBe(1); // Only the no-entries div
  });

  test('should create entry element with correct data', () => {
    const entry = {
      id: '1234567890',
      date: '2025-05-06',
      title: 'Test Title',
      content: 'Test Content with multiple lines\nSecond line\nThird line',
      mood: '4',
      createdAt: mockDate.toISOString()
    };
    
    const entryElement = ui.createEntryElement(entry, '');
    
    expect(entryElement.dataset.id).toBe('1234567890');
    expect(entryElement.querySelector('h3').textContent).toBe('Test Title');
    expect(entryElement.querySelector('p').textContent).toContain('Test Content');
    expect(entryElement.querySelector('.fa-smile')).not.toBeNull();
  });

  test('should highlight search terms in text', () => {
    const text = 'This is a test text for search';
    const highlighted = ui.highlightText(text, 'test');
    
    expect(highlighted).toBe('This is a <span class="highlight">test</span> text for search');
  });

  test('should fill form with entry data', () => {
    const entry = {
      id: '1',
      date: '2025-05-06',
      title: 'Test Title',
      content: 'Test Content',
      mood: '5'
    };
    
    ui.fillFormWithEntry(entry);
    
    expect(document.getElementById('entry-date').value).toBe('2025-05-06');
    expect(document.getElementById('entry-title').value).toBe('Test Title');
    expect(document.getElementById('entry-content').value).toBe('Test Content');
    expect(document.getElementById('mood-5').checked).toBe(true);
  });

  test('should open and close modal', () => {
    const entry = {
      id: '1',
      date: '2025-05-06',
      title: 'Test Title',
      content: 'Test Content',
      mood: '4'
    };
    
    ui.openEntryModal(entry, '');
    
    expect(document.getElementById('entry-modal').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('modal-title').textContent).toBe('Test Title');
    expect(document.body.style.overflow).toBe('hidden');
    
    ui.closeModal();
    
    expect(document.getElementById('entry-modal').classList.contains('hidden')).toBe(true);
    expect(document.body.style.overflow).toBe('');
  });
});

// Get the real JournalApp for testing
const createMockJournalApp = () => {
  // Create a mock Storage instance
  const mockStorage = {
    entries: [],
    getAllEntries: jest.fn(() => mockStorage.entries),
    getEntryById: jest.fn(id => mockStorage.entries.find(entry => entry.id === id)),
    addEntry: jest.fn(entry => {
      mockStorage.entries.unshift(entry);
    }),
    updateEntry: jest.fn((id, updatedEntry) => {
      const index = mockStorage.entries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        mockStorage.entries[index] = updatedEntry;
      }
    }),
    deleteEntry: jest.fn(id => {
      mockStorage.entries = mockStorage.entries.filter(entry => entry.id !== id);
    }),
    save: jest.fn(),
    exportEntries: jest.fn(() => ({
      journalName: "Mindful Journal",
      version: "1.0",
      exportedAt: mockDate.toISOString(),
      entries: mockStorage.entries
    }))
  };
  
  // Create a mock UI instance
  const mockUI = {
    getFormData: jest.fn(),
    resetForm: jest.fn(),
    renderEntries: jest.fn(),
    scrollToTop: jest.fn(),
    scrollToForm: jest.fn(),
    openEntryModal: jest.fn(),
    closeModal: jest.fn(),
    fillFormWithEntry: jest.fn(),
    exportData: jest.fn(),
    initEventListeners: jest.fn()
  };
  
  // Create a partial mock of the JournalApp
  const journalApp = new JournalApp();
  journalApp.storage = mockStorage;
  journalApp.ui = mockUI;
  journalApp.currentEntryId = null;
  journalApp.searchTerm = '';
  journalApp.selectedMood = 'all';
  journalApp.currentFilter = 'all';
  
  return journalApp;
};

// JournalApp Class Tests
describe('JournalApp Class', () => {
  let app;
  
  beforeEach(() => {
    app = createMockJournalApp();
  });

  test('should add a new entry', () => {
    // Setup
    app.ui.getFormData.mockReturnValue({
      date: '2025-05-06',
      title: 'Test Title',
      content: 'Test Content',
      mood: '4'
    });
    
    // Test
    app.addEntry();
    
    // Assert
    expect(app.storage.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      date: '2025-05-06',
      title: 'Test Title',
      content: 'Test Content',
      mood: '4'
    }));
    expect(app.ui.resetForm).toHaveBeenCalled();
    expect(app.ui.renderEntries).toHaveBeenCalled();
    expect(app.ui.scrollToTop).toHaveBeenCalled();
  });

  test('should not add entry if required fields are missing', () => {
    // Missing title
    app.ui.getFormData.mockReturnValue({
      date: '2025-05-06',
      title: '',
      content: 'Test Content',
      mood: '4'
    });
    
    app.addEntry();
    
    expect(app.storage.addEntry).not.toHaveBeenCalled();
    
    // Missing content
    app.ui.getFormData.mockReturnValue({
      date: '2025-05-06',
      title: 'Test Title',
      content: '',
      mood: '4'
    });
    
    app.addEntry();
    
    expect(app.storage.addEntry).not.toHaveBeenCalled();
    
    // Missing date
    app.ui.getFormData.mockReturnValue({
      date: '',
      title: 'Test Title',
      content: 'Test Content',
      mood: '4'
    });
    
    app.addEntry();
    
    expect(app.storage.addEntry).not.toHaveBeenCalled();
  });

  test('should filter entries by date range', () => {
    // Mock the date filter behavior
    const filterMock = jest.spyOn(app, 'filterEntries');
    
    // Set up mock entries with different dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 6);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 15);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];
    
    app.storage.entries = [
      { id: '1', date: todayStr, title: 'Today', content: 'Content', mood: '4' },
      { id: '2', date: yesterdayStr, title: 'Yesterday', content: 'Content', mood: '3' },
      { id: '3', date: lastWeekStr, title: 'Last Week', content: 'Content', mood: '5' },
      { id: '4', date: lastMonthStr, title: 'Last Month', content: 'Content', mood: '2' },
      { id: '5', date: twoMonthsAgoStr, title: 'Two Months Ago', content: 'Content', mood: '1' }
    ];
    
    // Test filtering by date range
    app.filterEntries('all');
    expect(app.currentFilter).toBe('all');
    
    app.filterEntries('today');
    expect(app.currentFilter).toBe('today');
    
    app.filterEntries('week');
    expect(app.currentFilter).toBe('week');
    
    app.filterEntries('month');
    expect(app.currentFilter).toBe('month');
    
    // Clean up
    filterMock.mockRestore();
  });

  test('should filter entries by mood', () => {
    // Call filterByMood
    app.filterByMood('4');
    
    // Check that the mood is set correctly
    expect(app.selectedMood).toBe('4');
    expect(app.ui.renderEntries).toHaveBeenCalled();
  });

  test('should search entries by title or content', () => {
    // Call searchEntries
    app.searchEntries('test');
    
    // Check that the search term is set correctly
    expect(app.searchTerm).toBe('test');
    expect(app.ui.renderEntries).toHaveBeenCalled();
  });

  test('should open entry modal', () => {
    // Set up mock entry
    const entry = { id: '1', title: 'Test Entry', content: 'Content', mood: '4' };
    app.storage.getEntryById.mockReturnValue(entry);
    
    // Call openEntry
    app.openEntry('1');
    
    // Check that the modal is opened with the correct entry
    expect(app.currentEntryId).toBe('1');
    expect(app.ui.openEntryModal).toHaveBeenCalledWith(entry, app.searchTerm);
  });

  test('should close modal', () => {
    // Set currentEntryId
    app.currentEntryId = '1';
    
    // Call closeModal
    app.closeModal();
    
    // Check that the currentEntryId is reset and modal is closed
    expect(app.currentEntryId).toBeNull();
    expect(app.ui.closeModal).toHaveBeenCalled();
  });

  test('should delete entry', () => {
    // Set currentEntryId
    app.currentEntryId = '1';
    
    // Call deleteEntry
    app.deleteEntry();
    
    // Check that the entry is deleted
    expect(app.storage.deleteEntry).toHaveBeenCalledWith('1');
    expect(app.ui.renderEntries).toHaveBeenCalled();
    expect(app.ui.closeModal).toHaveBeenCalled();
  });

  test('should edit entry', () => {
    // Set up mock entry
    const entry = { id: '1', title: 'Test Entry', content: 'Content', mood: '4' };
    app.currentEntryId = '1';
    app.storage.getEntryById.mockReturnValue(entry);
    
    // Call editEntry
    app.editEntry();
    
    // Check that the form is filled with entry data
    expect(app.ui.fillFormWithEntry).toHaveBeenCalledWith(entry);
    expect(app.storage.deleteEntry).toHaveBeenCalledWith('1');
    expect(app.ui.closeModal).toHaveBeenCalled();
    expect(app.ui.scrollToForm).toHaveBeenCalled();
  });

  test('should export entries', () => {
    // Set up mock entries
    const mockExportData = {
      journalName: "Mindful Journal",
      version: "1.0",
      exportedAt: mockDate.toISOString(),
      entries: []
    };
    app.storage.exportEntries.mockReturnValue(mockExportData);
    
    // Call exportEntries
    app.exportEntries();
    
    // Check that export data is passed to UI
    expect(app.ui.exportData).toHaveBeenCalledWith(mockExportData);
  });
});

// Integration Tests
describe('Integration Tests', () => {
  // For integration tests, you'll need to setup a mock environment and proper module interactions
  // Here's a basic structure - a full integration test would need more setup
  test('adding an entry and rendering', () => {
    // Mock localStorage
    jest.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify([]));
    jest.spyOn(localStorage, 'setItem').mockImplementation(() => {});
    
    // Setup the DOM
    document.body.innerHTML = `
      <form id="journal-form">
        <input id="entry-date" type="date" value="2025-05-06">
        <input id="entry-title" type="text" value="Test Entry">
        <textarea id="entry-content">Test Content</textarea>
        <input type="radio" name="mood" value="4" id="mood-4" checked>
      </form>
      <div id="entries-container"></div>
      <div id="no-entries" class="hidden">No entries found</div>
      <select id="filter-select"></select>
    `;
    
    // Create the necessary elements that would be created by initEventListeners
    const moodFilterButtons = document.createElement('div');
    moodFilterButtons.innerHTML = `
      <button class="mood-filter-btn" data-mood="all">All Moods</button>
    `;
    document.body.appendChild(moodFilterButtons);
    
    // Create UI, Storage, and JournalApp instances
    const uiMock = {
      initEventListeners: jest.fn(),
      getFormData: jest.fn().mockReturnValue({
        date: '2025-05-06',
        title: 'Test Entry',
        content: 'Test Content',
        mood: '4'
      }),
      resetForm: jest.fn(),
      renderEntries: jest.fn(),
      scrollToTop: jest.fn()
    };
    
    const storageMock = {
      entries: [],
      getAllEntries: jest.fn(() => storageMock.entries),
      addEntry: jest.fn(entry => {
        storageMock.entries.unshift(entry);
      }),
      save: jest.fn()
    };
    
    // Create JournalApp and override its dependencies
    const app = new JournalApp();
    app.ui = uiMock;
    app.storage = storageMock;
    
    // Test adding an entry
    app.addEntry();
    
    // Verify the entry was added and UI was updated
    expect(storageMock.addEntry).toHaveBeenCalled();
    expect(uiMock.resetForm).toHaveBeenCalled();
    expect(uiMock.renderEntries).toHaveBeenCalled();
    expect(uiMock.scrollToTop).toHaveBeenCalled();
    expect(storageMock.entries.length).toBe(1);
    expect(storageMock.entries[0].title).toBe('Test Entry');
  });
});
