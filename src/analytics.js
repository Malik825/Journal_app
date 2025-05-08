class MoodAnalytics {
    constructor(storage) {
        this.storage = storage;
        this.moodEmojis = {
            '1': { icon: 'fa-angry', text: 'Angry', color: 'text-red-500' },
            '2': { icon: 'fa-frown', text: 'Sad', color: 'text-orange-500' },
            '3': { icon: 'fa-meh', text: 'Neutral', color: 'text-yellow-500' },
            '4': { icon: 'fa-smile', text: 'Happy', color: 'text-green-500' },
            '5': { icon: 'fa-laugh', text: 'Very Happy', color: 'text-blue-500' }
        };
    }

    // Get mood distribution (count of each mood type)
    getMoodDistribution() {
        const entries = this.storage.getAllEntries();
        const distribution = {
            '1': 0, // Angry
            '2': 0, // Sad
            '3': 0, // Neutral
            '4': 0, // Happy
            '5': 0  // Very Happy
        };

        entries.forEach(entry => {
            if (distribution[entry.mood] !== undefined) {
                distribution[entry.mood]++;
            }
        });

        return distribution;
    }

    // Get mood trends over time (weekly or monthly)
    getMoodTrends(period = 'weekly') {
        const entries = this.storage.getAllEntries();
        const now = new Date();
        let startDate;
        
        // Determine start date based on period
        if (period === 'weekly') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30); // Last 30 days for weekly view
        } else {
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 6); // Last 6 months for monthly view
        }

        // Filter entries by date range
        const filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= now;
        });

        // Group entries by week or month
        const groupedData = this.groupEntriesByPeriod(filteredEntries, period);
        
        return groupedData;
    }

    // Group entries by week or month
    groupEntriesByPeriod(entries, period) {
        const result = [];
        const grouped = {};

        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            let key;
            
            if (period === 'weekly') {
                // Get the week number
                const weekNumber = this.getWeekNumber(entryDate);
                const year = entryDate.getFullYear();
                key = `${year}-W${weekNumber}`;
            } else {
                // Get the month
                const year = entryDate.getFullYear();
                const month = entryDate.getMonth() + 1;
                key = `${year}-${month}`;
            }

            // Initialize group if it doesn't exist
            if (!grouped[key]) {
                grouped[key] = {
                    period: key,
                    entries: [],
                    averageMood: 0,
                    moodCounts: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
                };
            }

            // Add entry to the group
            grouped[key].entries.push(entry);
            grouped[key].moodCounts[entry.mood]++;
        });

        // Calculate average mood for each period
        for (const key in grouped) {
            const group = grouped[key];
            let totalMood = 0;
            let count = 0;
            
            for (const mood in group.moodCounts) {
                totalMood += parseInt(mood) * group.moodCounts[mood];
                count += group.moodCounts[mood];
            }
            
            group.averageMood = count > 0 ? totalMood / count : 0;
            group.entryCount = count;
            
            // Format the period label for display
            if (period === 'weekly') {
                const [year, week] = key.split('-W');
                const startOfWeek = this.getDateOfWeek(parseInt(week), parseInt(year));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                group.label = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else {
                const [year, month] = key.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                group.label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }
            
            result.push(group);
        }

        // Sort results by period
        return result.sort((a, b) => {
            return a.period.localeCompare(b.period);
        });
    }

    // Helper function to get the week number
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // Helper function to get the date of a specific week
    getDateOfWeek(week, year) {
        const firstDayOfYear = new Date(year, 0, 1);
        const dayOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
        const date = new Date(year, 0, dayOffset);
        return date;
    }

    // Get top recurring moods by day of week
    getMoodsByDayOfWeek() {
        const entries = this.storage.getAllEntries();
        const dayOfWeekMoods = {
            0: [], // Sunday
            1: [], // Monday
            2: [], // Tuesday
            3: [], // Wednesday
            4: [], // Thursday
            5: [], // Friday
            6: []  // Saturday
        };

        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const dayOfWeek = entryDate.getDay();
            dayOfWeekMoods[dayOfWeek].push(parseInt(entry.mood));
        });

        // Calculate average mood for each day of week
        const averageMoods = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (const day in dayOfWeekMoods) {
            const moods = dayOfWeekMoods[day];
            if (moods.length > 0) {
                const sum = moods.reduce((acc, mood) => acc + mood, 0);
                averageMoods[dayNames[day]] = {
                    average: sum / moods.length,
                    count: moods.length
                };
            } else {
                averageMoods[dayNames[day]] = {
                    average: 0,
                    count: 0
                };
            }
        }

        return averageMoods;
    }

    // Get mood summary statistics
    getMoodSummary() {
        const entries = this.storage.getAllEntries();
        
        if (entries.length === 0) {
            return {
                count: 0,
                averageMood: 0,
                mostFrequentMood: null,
                recentTrend: null
            };
        }
        
        // Count entries by mood
        const moodCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        let totalMood = 0;
        
        entries.forEach(entry => {
            moodCounts[entry.mood]++;
            totalMood += parseInt(entry.mood);
        });
        
        // Find most frequent mood
        let mostFrequentMood = '3';
        let maxCount = 0;
        
        for (const mood in moodCounts) {
            if (moodCounts[mood] > maxCount) {
                maxCount = moodCounts[mood];
                mostFrequentMood = mood;
            }
        }
        
        // Calculate average mood
        const averageMood = totalMood / entries.length;
        
        // Calculate recent trend (last 7 entries)
        const recentEntries = [...entries].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        }).slice(0, 7);
        
        let recentTrend = 'stable';
        if (recentEntries.length >= 3) {
            const recentMoods = recentEntries.map(entry => parseInt(entry.mood));
            
            // Simple trend analysis - are moods generally improving or declining?
            let improvements = 0;
            let declines = 0;
            
            for (let i = 0; i < recentMoods.length - 1; i++) {
                if (recentMoods[i] > recentMoods[i + 1]) {
                    improvements++;
                } else if (recentMoods[i] < recentMoods[i + 1]) {
                    declines++;
                }
            }
            
            if (improvements > declines && improvements > recentMoods.length / 3) {
                recentTrend = 'improving';
            } else if (declines > improvements && declines > recentMoods.length / 3) {
                recentTrend = 'declining';
            }
        }
        
        return {
            count: entries.length,
            averageMood,
            mostFrequentMood,
            moodCounts,
            recentTrend
        };
    }

    // Get mood data suitable for rendering in a chart
    getChartData(period = 'weekly') {
        const trendData = this.getMoodTrends(period);
        
        // Format data for recharts
        return trendData.map(item => {
            return {
                name: item.label,
                average: parseFloat(item.averageMood.toFixed(2)),
                count: item.entryCount,
                angry: item.moodCounts['1'],
                sad: item.moodCounts['2'],
                neutral: item.moodCounts['3'],
                happy: item.moodCounts['4'],
                veryHappy: item.moodCounts['5']
            };
        });
    }
}
export default MoodAnalytics