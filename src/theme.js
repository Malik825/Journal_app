class ThemeManager {
    constructor() {
      this.themeToggle = document.getElementById('theme-toggle');
      this.icon = this.themeToggle?.querySelector('i');
      this.init();
    }
  
    init() {
      if (!this.themeToggle || !this.icon) return;
  
      // Set initial theme
      const savedTheme = this.getPreferredTheme();
      document.documentElement.setAttribute('data-theme', savedTheme);
      this.updateButton(savedTheme === 'dark');
  
      // Add event listener
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  
    getPreferredTheme() {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) return storedTheme;
      
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
  
    updateButton(isDark) {
      if (isDark) {
        this.icon.classList.replace('fa-moon', 'fa-sun');
        this.themeToggle.textContent = ' Light Mode';
      } else {
        this.icon.classList.replace('fa-sun', 'fa-moon');
        this.themeToggle.textContent = ' Dark Mode';
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