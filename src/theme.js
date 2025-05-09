class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.icon = this.themeToggle?.querySelector('i');
    this.init();
  }

  init() {
    if (!this.themeToggle || !this.icon) return;

    // Load saved theme or default to light
    let savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      // Optionally, check system preference (not required by current tests)
      savedTheme = 'light'; // Default to light if no saved theme
    }
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateButton(savedTheme === 'dark');

    // Add event listener
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
  }

  updateButton(isDark) {
    // Clear existing classes to avoid duplicates
    this.icon.classList.remove('fa-moon', 'fa-sun');
    // Update icon and text based on theme
    if (isDark) {
      this.icon.classList.add('fa-sun');
    } else {
      this.icon.classList.add('fa-moon');
    }
    this.themeToggle.prepend(this.icon);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateButton(newTheme === 'dark');
  }
}

export default ThemeManager;