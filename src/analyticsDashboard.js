import MoodAnalytics from './analytics.js';

class AnalyticsDashboard {
    constructor(storage) {
        this.storage = storage;
        this.analytics = new MoodAnalytics(storage);
        this.dashboardContainer = null;
        this.chartPeriod = 'weekly';
        this.moodEmojis = {
            '1': { icon: 'fa-angry', text: 'Angry', color: 'text-red-500', bgColor: 'bg-red-100' },
            '2': { icon: 'fa-frown', text: 'Sad', color: 'text-orange-500', bgColor: 'bg-orange-100' },
            '3': { icon: 'fa-meh', text: 'Neutral', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
            '4': { icon: 'fa-smile', text: 'Happy', color: 'text-green-500', bgColor: 'bg-green-100' },
            '5': { icon: 'fa-laugh', text: 'Very Happy', color: 'text-blue-500', bgColor: 'bg-blue-100' }
        };
    }

    // Initialize the analytics dashboard
    initDashboard() {
        // Create dashboard container if it doesn't exist
        if (!document.getElementById('analytics-dashboard')) {
            const mainContainer = document.querySelector('.container');
            
            // Create dashboard button in header
            const headerButtons = document.querySelector('header div:last-child');
            const dashboardBtn = document.createElement('button');
            dashboardBtn.id = 'dashboard-btn';
            dashboardBtn.className = 'no-print bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 border border-gray-300 rounded-lg shadow-sm flex items-center';
            dashboardBtn.innerHTML = '<i class="fas fa-chart-line mr-2"></i> Insights';
            headerButtons.prepend(dashboardBtn);

            // Create dashboard container
            this.dashboardContainer = document.createElement('div');
            this.dashboardContainer.id = 'analytics-dashboard';
            this.dashboardContainer.className = 'bg-white rounded-xl shadow-md overflow-hidden my-8 hidden';
            
            mainContainer.appendChild(this.dashboardContainer);

            // Add click event to dashboard button
            dashboardBtn.addEventListener('click', () => {
                if (this.dashboardContainer.classList.contains('hidden')) {
                    this.dashboardContainer.classList.remove('hidden');
                    this.renderDashboard();
                    
                    // Scroll to dashboard
                    this.dashboardContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    this.dashboardContainer.classList.add('hidden');
                }
            });
        }
    }

    // Render the full dashboard
    renderDashboard() {
        const entries = this.storage.getAllEntries();
        
        if (entries.length < 3) {
            this.dashboardContainer.innerHTML = `
                <div class="p-6 text-center">
                    <i class="fas fa-chart-bar text-4xl text-gray-300 mb-3"></i>
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">Not Enough Data Yet</h2>
                    <p class="text-gray-600">Add at least 3 journal entries to see your mood insights.</p>
                </div>
            `;
            return;
        }

        const moodSummary = this.analytics.getMoodSummary();
        const moodDistribution = this.analytics.getMoodDistribution();
        const dayOfWeekMoods = this.analytics.getMoodsByDayOfWeek();
        
        this.dashboardContainer.innerHTML = `
            <div class="border-b border-gray-200">
                <div class="px-6 py-4 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Mood Insights</h2>
                    <div class="flex space-x-2">
                        <button id="weekly-btn" class="px-3 py-1 rounded-md text-sm font-medium ${this.chartPeriod === 'weekly' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}">
                            Weekly
                        </button>
                        <button id="monthly-btn" class="px-3 py-1 rounded-md text-sm font-medium ${this.chartPeriod === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}">
                            Monthly
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="p-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    ${this.renderSummaryCard('Overall Mood', this.getMoodIcon(moodSummary.averageMood), `Average: ${moodSummary.averageMood.toFixed(1)}/5`)}
                    ${this.renderSummaryCard('Most Frequent', this.getMoodIcon(moodSummary.mostFrequentMood), this.moodEmojis[moodSummary.mostFrequentMood].text)}
                    ${this.renderSummaryCard('Recent Trend', this.getTrendIcon(moodSummary.recentTrend), this.capitalizeFirstLetter(moodSummary.recentTrend))}
                </div>
                
                <!-- Mood Distribution -->
                <div class="bg-gray-50 rounded-lg p-4 mb-8">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">Mood Distribution</h3>
                    <div class="flex flex-wrap gap-3">
                        ${this.renderMoodDistribution(moodDistribution)}
                    </div>
                </div>
                
                <!-- Chart Container -->
                <div class="bg-gray-50 rounded-lg p-4 mb-8">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">Mood Over Time</h3>
                    <div id="mood-chart" class="h-64">
                        ${this.renderChartPlaceholder()}
                    </div>
                </div>
                
                <!-- Day of Week Analysis -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">Mood By Day of Week</h3>
                    <div class="grid grid-cols-7 gap-2">
                        ${this.renderDayOfWeekMoods(dayOfWeekMoods)}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for chart period buttons
        document.getElementById('weekly-btn').addEventListener('click', () => {
            this.chartPeriod = 'weekly';
            this.renderDashboard();
        });
        
        document.getElementById('monthly-btn').addEventListener('click', () => {
            this.chartPeriod = 'monthly';
            this.renderDashboard();
        });
        
        // Initialize chart after DOM is loaded
        this.initChart();
    }
    
    // Render a summary card
    renderSummaryCard(title, icon, value) {
        return `
            <div class="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                <h3 class="text-sm font-medium text-gray-500 mb-1">${title}</h3>
                <div class="text-3xl mb-1">${icon}</div>
                <p class="text-lg font-medium text-gray-800">${value}</p>
            </div>
        `;
    }
    
    // Render mood distribution
    renderMoodDistribution(distribution) {
        let html = '';
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        
        for (const mood in distribution) {
            const percentage = total > 0 ? Math.round((distribution[mood] / total) * 100) : 0;
            const moodInfo = this.moodEmojis[mood];
            
            html += `
                <div class="flex-1 min-w-[100px] ${moodInfo.bgColor} rounded-lg p-3 text-center">
                    <div class="text-2xl mb-1"><i class="fas ${moodInfo.icon} ${moodInfo.color}"></i></div>
                    <p class="text-sm font-medium text-gray-800">${moodInfo.text}</p>
                    <p class="text-xs text-gray-600">${percentage}% (${distribution[mood]})</p>
                </div>
            `;
        }
        
        return html;
    }
    
    // Render day of week mood analysis
    renderDayOfWeekMoods(dayOfWeekMoods) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let html = '';
        
        days.forEach(day => {
            const dayData = dayOfWeekMoods[day];
            const average = dayData ? dayData.average : 0;
            const count = dayData ? dayData.count : 0;
            const moodIcon = this.getMoodIcon(average);
            const bgColor = count > 0 ? this.getBgColorByMood(average) : 'bg-gray-100';
            
            html += `
                <div class="${bgColor} rounded-lg p-2 text-center">
                    <p class="text-xs font-medium text-gray-600">${day.substring(0, 3)}</p>
                    <div class="text-xl my-1">${moodIcon}</div>
                    <p class="text-xs text-gray-600">${count > 0 ? average.toFixed(1) : '-'}</p>
                </div>
            `;
        });
        
        return html;
    }
    
    // Render chart placeholder
    renderChartPlaceholder() {
        return `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <i class="fas fa-chart-line text-3xl text-gray-300 mb-2"></i>
                    <p class="text-gray-500">Loading chart...</p>
                </div>
            </div>
        `;
    }
    
    // Initialize the mood chart
    initChart() {
        const chartData = this.analytics.getChartData(this.chartPeriod);
        
        if (chartData.length < 2) {
            document.getElementById('mood-chart').innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <i class="fas fa-chart-line text-3xl text-gray-300 mb-2"></i>
                        <p class="text-gray-500">Not enough data for trend analysis</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Load the Chart.js script if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.onload = () => this.createChart(chartData);
            document.head.appendChild(script);
        } else {
            this.createChart(chartData);
        }
    }
    
    // Create the actual chart
    createChart(chartData) {
        const ctx = document.createElement('canvas');
        ctx.id = 'mood-trend-chart';
        ctx.height = 250;
        
        const chartContainer = document.getElementById('mood-chart');
        chartContainer.innerHTML = '';
        chartContainer.appendChild(ctx);
        
        // Define chart colors
        const colors = {
            average: 'rgba(79, 70, 229, 0.8)', // Indigo
            angry: 'rgba(239, 68, 68, 0.5)',   // Red
            sad: 'rgba(249, 115, 22, 0.5)',    // Orange
            neutral: 'rgba(234, 179, 8, 0.5)', // Yellow
            happy: 'rgba(34, 197, 94, 0.5)',   // Green
            veryHappy: 'rgba(59, 130, 246, 0.5)' // Blue
        };
        
        // Create chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.name),
                datasets: [
                    {
                        label: 'Average Mood',
                        data: chartData.map(d => d.average),
                        borderColor: colors.average,
                        backgroundColor: colors.average,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const labels = ['', 'Angry', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
                                return labels[value];
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            afterTitle: function(context) {
                                const idx = context[0].dataIndex;
                                return `Entries: ${chartData[idx].count}`;
                            },
                            afterBody: function(context) {
                                const idx = context[0].dataIndex;
                                const item = chartData[idx];
                                return [
                                    '',
                                    `😡 Angry: ${item.angry}`,
                                    `😔 Sad: ${item.sad}`,
                                    `😐 Neutral: ${item.neutral}`,
                                    `😊 Happy: ${item.happy}`,
                                    `😄 Very Happy: ${item.veryHappy}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Helper methods
    getMoodIcon(moodValue) {
        // Convert the mood value to the nearest integer between 1-5
        const roundedMood = Math.max(1, Math.min(5, Math.round(parseFloat(moodValue))));
        const moodInfo = this.moodEmojis[roundedMood];
        return `<i class="fas ${moodInfo.icon} ${moodInfo.color}"></i>`;
    }
    
    getBgColorByMood(moodValue) {
        const roundedMood = Math.max(1, Math.min(5, Math.round(parseFloat(moodValue))));
        return this.moodEmojis[roundedMood].bgColor;
    }
    
    getTrendIcon(trend) {
        if (trend === 'improving') {
            return '<i class="fas fa-arrow-trend-up text-green-500"></i>';
        } else if (trend === 'declining') {
            return '<i class="fas fa-arrow-trend-down text-orange-500"></i>';
        } else {
            return '<i class="fas fa-arrows-left-right text-yellow-500"></i>';
        }
    }
    
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

export default AnalyticsDashboard;