class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.icon = this.themeToggle?.querySelector('i');
    this.init();
  }

  init() {
    if (!this.themeToggle || !this.icon) return;

    // Set light theme initially
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateButton(savedTheme === 'dark');

    // Add event listener
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
  }

  updateButton(isDark) {
    if (isDark) {
      this.icon.classList.replace('fa-moon', 'fa-sun');
    } else {
      this.icon.classList.replace('fa-sun', 'fa-moon');
    }
    this.themeToggle.prepend(this.icon);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateButton(newTheme === 'dark');
  }
}

export default ThemeManager;