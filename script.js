// ======================
// APP STATE & VARIABLES
// ======================

// DOM Elements
const pages = {
    dashboard: document.getElementById('dashboard-page'),
    habits: document.getElementById('habits-page'),
    calendar: document.getElementById('calendar-page'),
    stats: document.getElementById('stats-page'),
    gamification: document.getElementById('gamification-page'),
    goals: document.getElementById('goals-page'),
       focus: document.getElementById('focus-page'),
       settings: document.getElementById('settings-page')
};

const navTabs = document.querySelectorAll('.nav-tab');
const themeToggle = document.getElementById('themeToggle');
const editHabitModal = document.getElementById('editHabitModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editHabitForm = document.getElementById('editHabitForm');
const frequencyTypeSelect = document.getElementById('editFrequencyType');
const customDaysContainer = document.getElementById('customDaysContainer');
// Header action icons & sidebars
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');
const settingsBtn = document.getElementById('settingsBtn');
const notificationSidebar = document.getElementById('notificationSidebar');
const settingsSidebar = document.getElementById('settingsSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Focus Mode State
let focusMode = {
    active: false,
    timerRunning: false,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    timerInterval: null
};

// State
let habits = JSON.parse(localStorage.getItem('modernHabitTracker')) || [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let editingHabitId = null;
let lastNotificationTime = {};

// Color palette for habits
const colorPalette = [
    '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7', '#ec4899'
];

let habitColors = JSON.parse(localStorage.getItem('habitColors')) || {};

// Gamification Data
let userData = JSON.parse(localStorage.getItem('habitUserData')) || {
    xp: 0,
    level: 1,
    badges: [],
    achievements: []
};

// Journal and Mood Data
let journal = JSON.parse(localStorage.getItem('habitJournal')) || {};

function saveJournal() {
    try {
        localStorage.setItem('habitJournal', JSON.stringify(journal));
    } catch (e) {
        console.error('Error saving journal:', e);
    }
}

// Notifications (stored locally)
let notifications = JSON.parse(localStorage.getItem('habitNotifications')) || [];

function saveNotifications() {
    try {
        localStorage.setItem('habitNotifications', JSON.stringify(notifications));
    } catch (e) {
        console.error('Failed to save notifications', e);
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    list.innerHTML = '';
    if (notifications.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--gray); padding:18px;">No notifications</p>';
        return;
    }
    [...notifications].reverse().forEach(n => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        const message = document.createElement('div');
        message.textContent = n.message;
        const time = document.createElement('div');
        time.className = 'time';
        time.textContent = new Date(n.timestamp).toLocaleString();
        item.appendChild(message);
        item.appendChild(time);
        list.appendChild(item);
    });
}

function updateNotificationBadge() {
    if (!notificationBadge) return;
    const count = notifications.length;
    notificationBadge.textContent = String(count);
    notificationBadge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function addNotification(message) {
    const n = { id: Date.now(), message: message, timestamp: new Date().toISOString(), read: false };
    notifications.push(n);
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
}

function markAllNotificationsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
}

function clearNotifications() {
    if (!confirm('Clear all notifications?')) return;
    notifications = [];
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
}

function openSidebar(which) {
    if (notificationSidebar) notificationSidebar.classList.remove('open');
    if (settingsSidebar) settingsSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.style.display = 'none';

    if (which === 'notifications' && notificationSidebar) {
        notificationSidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.style.display = 'block';
    }
    if (which === 'settings' && settingsSidebar) {
        settingsSidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.style.display = 'block';
    }
}

function closeSidebars() {
    if (notificationSidebar) notificationSidebar.classList.remove('open');
    if (settingsSidebar) settingsSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.style.display = 'none';
}

function handleOverlayClick() { closeSidebars(); }

const moodConfig = {
    happy: { icon: '😊', color: '#FFA500', label: 'Happy' },
    neutral: { icon: '😐', color: '#94a3b8', label: 'Neutral' },
    sad: { icon: '😢', color: '#3b82f6', label: 'Sad' },
    tired: { icon: '😴', color: '#8b5cf6', label: 'Tired' },
    motivated: { icon: '🔥', color: '#ef4444', label: 'Motivated' }
};

// Categories (default + custom)
const defaultCategories = ['Health', 'Study', 'Fitness', 'Productivity', 'Personal'];
let categories = JSON.parse(localStorage.getItem('habitCategories')) || [...defaultCategories];
let categoryColors = JSON.parse(localStorage.getItem('categoryColors')) || {
    Health: '#10b981',
    Study: '#6366f1',
    Fitness: '#f59e0b',
    Productivity: '#8b5cf6',
    Personal: '#ef4444',
    Custom: '#94a3b8'
};

function saveCategories() {
    try {
        localStorage.setItem('habitCategories', JSON.stringify(categories));
        localStorage.setItem('categoryColors', JSON.stringify(categoryColors));
    } catch (e) {
        console.error('Error saving categories:', e);
    }
}

// Goals
let goals = JSON.parse(localStorage.getItem('habitGoals')) || [];
// Ensure all goals have linkedHabits property
goals.forEach(g => {
    if (!g.linkedHabits) g.linkedHabits = [];
});

function saveGoals() {
    try {
        localStorage.setItem('habitGoals', JSON.stringify(goals));
    } catch (e) { console.error('Error saving goals:', e); }
}

function addGoal(goal) {
    goal.id = Date.now();
    goals.push(goal);
    saveGoals();
    populateGoalsSelects();
    return goal;
}

function updateGoal(updated) {
    const idx = goals.findIndex(g => g.id === updated.id);
    if (idx !== -1) {
        goals[idx] = updated;
        saveGoals();
        populateGoalsSelects();
    }
}

function deleteGoal(id) {
    const idx = goals.findIndex(g => g.id === id);
    if (idx !== -1) {
        goals.splice(idx, 1);
        saveGoals();
        populateGoalsSelects();
    }
}

// Apply saved habit order from localStorage
function applySavedHabitOrder() {
    try {
        const savedOrder = localStorage.getItem('habitOrder');
        if (!savedOrder) return;
        
        const orderIds = JSON.parse(savedOrder);
        if (!Array.isArray(orderIds) || orderIds.length === 0) return;
        
        // Create a map of habits by ID
        const habitMap = {};
        habits.forEach(habit => {
            habitMap[habit.id] = habit;
        });
        
        // Rebuild habits array in saved order
        const orderedHabits = [];
        orderIds.forEach(id => {
            if (habitMap[id]) {
                orderedHabits.push(habitMap[id]);
            }
        });
        
        // Add any new habits that weren't in the saved order (to the end)
        habits.forEach(habit => {
            if (!orderIds.includes(habit.id)) {
                orderedHabits.push(habit);
            }
        });
        
        // Update the habits array
        habits = orderedHabits;
        
    } catch (e) {
        console.error('Error applying saved habit order:', e);
    }
}
function addCategory(name, color) {
    if (!name) return false;
    if (!categories.includes(name)) {
        categories.push(name);
        categoryColors[name] = color || '#94a3b8';
        saveCategories();
        return true;
    }
    return false;
}

    function deleteCategory(categoryName) {
        const isDefault = ['Health', 'Study', 'Fitness', 'Productivity', 'Personal'].includes(categoryName);
        if (isDefault) {
            alert('Cannot delete default categories');
            return false;
        }

        // Check if any habits use this category
        const habitsUsingCategory = habits.filter(h => h.category === categoryName);
        if (habitsUsingCategory.length > 0) {
            const confirm = window.confirm(
                `${habitsUsingCategory.length} habit(s) use this category. Delete anyway? They will lose their category.`
            );
            if (!confirm) return false;

            // Remove category from habits
            habitsUsingCategory.forEach(habit => {
                habit.category = null;
            });
            saveHabits();
        }

        // Remove category
        const index = categories.indexOf(categoryName);
        if (index > -1) {
            categories.splice(index, 1);
            delete categoryColors[categoryName];
            saveCategories();
            populateCategorySelects();
            renderCategoriesManagement();
            return true;
        }
        return false;
    }

    function renderCategoriesManagement() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        categories.forEach(categoryName => {
            const isDefault = ['Health', 'Study', 'Fitness', 'Productivity', 'Personal'].includes(categoryName);
            const color = categoryColors[categoryName] || '#94a3b8';
            const count = habits.filter(h => h.category === categoryName).length;

            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item';
            categoryEl.innerHTML = `
                <div class="category-item-content">
                    <div class="category-color-dot" style="background: ${color};"></div>
                    <span class="category-name">${categoryName}</span>
                    ${isDefault ? '<span style="font-size: 11px; color: var(--gray); margin-left: 8px;">(Default)</span>' : ''}
                </div>
                <span class="category-count">${count} habit${count !== 1 ? 's' : ''}</span>
                ${!isDefault ? `
                    <button class="category-delete-btn" title="Delete category">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            `;

            if (!isDefault) {
                const deleteBtn = categoryEl.querySelector('.category-delete-btn');
                deleteBtn.addEventListener('click', () => {
                    deleteCategory(categoryName);
                });
            }

            categoriesList.appendChild(categoryEl);
        });
    }

// Achievement Definitions
const achievements = [
    { id: 'first_habit', name: 'Getting Started', icon: 'fas fa-star', description: 'Complete your first habit', xp: 50 },
    { id: 'seven_streak', name: 'Weekly Warrior', icon: 'fas fa-fire', description: 'Maintain a 7-day streak', xp: 100 },
    { id: 'thirty_streak', name: 'Monthly Master', icon: 'fas fa-crown', description: 'Maintain a 30-day streak', xp: 300 },
    { id: 'hundred_completions', name: 'Century Club', icon: 'fas fa-100', description: 'Complete 100 habits total', xp: 500 },
    { id: 'perfect_week', name: 'Perfect Week', icon: 'fas fa-calendar-check', description: 'Complete all habits for a week', xp: 200 },
    { id: 'early_bird', name: 'Early Bird', icon: 'fas fa-sun', description: 'Complete habits before 8 AM', xp: 150 },
    { id: 'habit_collector', name: 'Habit Collector', icon: 'fas fa-boxes', description: 'Create 10 different habits', xp: 250 },
    { id: 'consistency_king', name: 'Consistency King', icon: 'fas fa-chess-king', description: '30 days without missing', xp: 400 },
    { id: 'quick_starter', name: 'Quick Starter', icon: 'fas fa-bolt', description: 'Complete a habit within 1 hour of reminder', xp: 100 },
    { id: 'weekend_warrior', name: 'Weekend Warrior', icon: 'fas fa-umbrella-beach', description: 'Complete habits on weekends', xp: 150 }
];

// Motivational Quotes
const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Your future is created by what you do today, not tomorrow.", author: "Unknown" },
    { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
    { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" }
];

// Import all functions from the original JavaScript
// All functions follow below...

// ======================
// INITIALIZATION
// ======================

function init() {
    // Reset daily progress for quantitative habits
    resetDailyProgress();
    
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('habitTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
    
    // Set today's date in dashboard
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
    
    // Display daily quote
    const quoteIndex = today.getDate() % quotes.length;
    const dailyQuote = quotes[quoteIndex];
    document.getElementById('dailyQuote').textContent = `"${dailyQuote.text}"`;
    document.getElementById('quoteAuthor').textContent = `- ${dailyQuote.author}`;
    
    // Initialize category selects
    populateCategorySelects();
    
    // Initialize goal selects
    populateGoalsSelects();

    // Initialize pages
    applySavedHabitOrder();
    renderHabits();
    generateCalendar(currentMonth, currentYear);
    updateStats();
    updateDashboard();
    updateGamification();
    updateLegend();
    updateMoodAnalytics();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Start reminder checker
    setInterval(checkReminders, 60000); // Check every minute
    
    // Initialize event listeners
    setupEventListeners();
    
    // Render notifications and update badge
    renderNotifications();
    updateNotificationBadge();

    // Inject settings page content into settings sidebar (if present)
    const settingsPage = document.getElementById('settings-page');
    const settingsContentTarget = document.getElementById('settingsSidebarContent');
    if (settingsContentTarget && settingsPage) {
        // Move settings page content into the sidebar to avoid duplicate IDs
        settingsContentTarget.innerHTML = settingsPage.innerHTML;
        // Replace original settings page content with a small hint (settings now in sidebar)
        settingsPage.innerHTML = '<div style="padding:40px; text-align:center; color:var(--gray);">Open settings via the gear icon in the header.</div>';
        renderCategoriesManagement();
        // Attach settings action handlers to elements inside the sidebar
        const sExport = settingsContentTarget.querySelector('#exportDataBtn');
        const sReset = settingsContentTarget.querySelector('#resetDataBtn');
        if (sExport) sExport.addEventListener('click', handleExportData);
        if (sReset) sReset.addEventListener('click', handleResetData);
    }
    // Heatmap
    populateHeatmapControls();
    renderHeatmap();
}

function populateCategorySelects() {
    const habitCategorySelect = document.getElementById('habitCategorySelect');
    const editHabitCategory = document.getElementById('editHabitCategory');
    const categoryFilter = document.getElementById('categoryFilter');

    if (habitCategorySelect) {
        habitCategorySelect.innerHTML = '<option value="">Category (optional)</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (editHabitCategory) {
        editHabitCategory.innerHTML = '<option value="">Category (optional)</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    saveCategories();
}

function populateGoalsSelects() {
    const habitGoalSelect = document.getElementById('habitGoalSelect');
    const editHabitGoals = document.getElementById('editHabitGoals');
    
    if (habitGoalSelect) {
        habitGoalSelect.innerHTML = '<option value="">Link to goal (optional)</option>' +
            goals.map(g => `<option value="${g.id}">${g.goalName}</option>`).join('');
    }
    
    if (editHabitGoals) {
        editHabitGoals.innerHTML = '<option value="">Select a goal (optional)</option>' +
            goals.map(g => `<option value="${g.id}">${g.goalName}</option>`).join('');
    }
}

function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('change', handleThemeToggle);
    
    // Navigation tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', handleNavTabClick);
    });
    
    // Add habit form
    document.getElementById('addHabitForm').addEventListener('submit', handleAddHabit);

    // Category controls
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => {
        const newCat = document.getElementById('newCategoryInput').value.trim();
        if (!newCat) return;
        const added = addCategory(newCat);
        if (added) {
            populateCategorySelects();
            document.getElementById('newCategoryInput').value = '';
        } else {
            alert('Category already exists');
        }
    });

    const categoryFilterEl = document.getElementById('categoryFilter');
    if (categoryFilterEl) categoryFilterEl.addEventListener('change', () => renderHabits());
    
    // Edit habit modal
    closeEditModal.addEventListener('click', closeEditModalHandler);
    cancelEditBtn.addEventListener('click', closeEditModalHandler);
    editHabitModal.addEventListener('click', handleModalOutsideClick);
    editHabitForm.addEventListener('submit', handleEditHabitSubmit);
    
    // Frequency type change
    frequencyTypeSelect.addEventListener('change', handleFrequencyTypeChange);
    
    // Reminder toggle
    document.getElementById('editReminderEnabled').addEventListener('change', handleReminderToggle);
    
    // Journal modal
    const closeJournalModal = document.getElementById('closeJournalModal');
    const journalForm = document.getElementById('journalForm');
    const cancelJournalBtn = document.getElementById('cancelJournalBtn');
    const journalModal = document.getElementById('journalModal');
    
    if (closeJournalModal) closeJournalModal.addEventListener('click', closeJournalModalHandler);
    if (cancelJournalBtn) cancelJournalBtn.addEventListener('click', closeJournalModalHandler);
    if (journalModal) journalModal.addEventListener('click', handleJournalModalOutsideClick);
    if (journalForm) journalForm.addEventListener('submit', handleJournalSubmit);
    
    // Mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mood = btn.dataset.mood;
            selectMood(mood);
        });
    });
    
    // Calendar navigation
    document.getElementById('prevMonthBtn').addEventListener('click', handlePrevMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', handleNextMonth);
    document.getElementById('prevYearBtn').addEventListener('click', handlePrevYear);
    document.getElementById('nextYearBtn').addEventListener('click', handleNextYear);
    document.getElementById('todayBtn').addEventListener('click', handleTodayClick);
    
    // Quick actions
    document.getElementById('quickAddBtn').addEventListener('click', handleQuickAdd);
    document.getElementById('checkAllBtn').addEventListener('click', handleCheckAll);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    
    // Goals
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) addGoalBtn.addEventListener('click', openAddGoalModal);
    
    // Focus Mode
    document.getElementById('exitFocusBtn').addEventListener('click', exitFocusMode);
    document.getElementById('focusPlayBtn').addEventListener('click', startFocusTimer);
    document.getElementById('focusPauseBtn').addEventListener('click', pauseFocusTimer);
    document.getElementById('focusResetBtn').addEventListener('click', resetFocusTimer);
    document.getElementById('setTimerBtn').addEventListener('click', setCustomTimer);
    
        // Settings
        const exportDataBtn = document.getElementById('exportDataBtn');
        const resetDataBtn = document.getElementById('resetDataBtn');
    
        if (exportDataBtn) exportDataBtn.addEventListener('click', handleExportData);
        if (resetDataBtn) resetDataBtn.addEventListener('click', handleResetData);

    // Notification & Settings buttons
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            const open = notificationSidebar && notificationSidebar.classList.contains('open');
            if (open) closeSidebars(); else openSidebar('notifications');
        });
    }
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const open = settingsSidebar && settingsSidebar.classList.contains('open');
            if (open) closeSidebars(); else openSidebar('settings');
        });
    }

    // Sidebar overlay
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', handleOverlayClick);

    // Sidebar close buttons and actions
    const closeNotifications = document.getElementById('closeNotifications');
    const closeSettings = document.getElementById('closeSettings');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');

    if (closeNotifications) closeNotifications.addEventListener('click', closeSidebars);
    if (closeSettings) closeSettings.addEventListener('click', closeSidebars);
    if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllNotificationsRead);
    if (clearNotificationsBtn) clearNotificationsBtn.addEventListener('click', clearNotifications);

    // Wire up calendar day clicks after generating calendar
    setTimeout(wireCalendarDayClicks, 100);
}

function handleThemeToggle() {
    const theme = this.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('habitTheme', theme);
    
    // Add transition effect
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

// ============================================
// ALL APPLICATION FUNCTIONS
// ============================================

// Include all remaining functions from the original script...
// (Due to length, including key sections)

function resetDailyProgress() {
    const lastResetDate = localStorage.getItem('lastProgressResetDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastResetDate !== today) {
        habits.forEach(habit => {
            if (habit.targetValue) {
                habit.currentProgress = 0;
            }
        });
        
        localStorage.setItem('lastProgressResetDate', today);
        saveHabits();
    }
}

function saveHabits() {
    try {
        localStorage.setItem('modernHabitTracker', JSON.stringify(habits));
        localStorage.setItem('habitColors', JSON.stringify(habitColors));
    } catch (e) {
        console.error('Error saving habits:', e);
    }
}

function handleExportData() {
    try {
        const data = {
            habits,
            goals,
            categories,
            categoryColors,
            userData,
            journal
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Export failed', e);
        alert('Export failed. See console for details.');
    }
}

function handleResetData() {
    if (!confirm('This will delete all your local data and cannot be undone. Continue?')) return;
    try {
        localStorage.clear();
        habits = [];
        goals = [];
        categories = [...defaultCategories];
        categoryColors = {};
        habitColors = {};
        userData = { xp: 0, level: 1, badges: [], achievements: [] };
        journal = {};
        renderHabits();
        renderCategoriesManagement();
        populateCategorySelects();
        updateDashboard();
        updateGamification();
        alert('All data reset.');
    } catch (e) {
        console.error('Reset failed', e);
        alert('Reset failed. See console for details.');
    }
}

function getHabitColor(habitName) {
    if (!habitName) return colorPalette[0];
    
    if (!habitColors[habitName]) {
        const usedColors = Object.values(habitColors);
        let availableColor = colorPalette.find(color => !usedColors.includes(color));
        
        if (!availableColor) {
            availableColor = colorPalette[Object.keys(habitColors).length % colorPalette.length];
        }
        
        habitColors[habitName] = availableColor;
        saveHabits();
    }
    
    return habitColors[habitName];
}

function shouldCompleteToday(habit) {
    if (!habit.frequency) return true;
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    
    switch (habit.frequency.type) {
        case 'daily':
            return true;
        case 'weekly':
            return habit.frequency.days && habit.frequency.days.includes(dayOfWeek);
        case 'monthly':
            return habit.frequency.days && habit.frequency.days.includes(dayOfMonth);
        case 'custom':
            return habit.frequency.days && habit.frequency.days.includes(dayOfWeek);
        default:
            return true;
    }
}

// Render habits, handle completions, manage streaks, delete habits
function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    const emptyState = document.getElementById('emptyState');
    const habitsCount = document.getElementById('habitsCount');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!habitsList || !emptyState || !habitsCount) return;
    
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        habitsList.style.display = 'none';
        habitsCount.textContent = '0 habits';
        return;
    }
    
    emptyState.style.display = 'none';
    habitsList.style.display = 'block';
    habitsList.innerHTML = '';
    
    const today = new Date().toISOString().split('T')[0];
    const sortedHabits = [...habits].sort((a, b) => {
        const aCompletedToday = a.completedDate && a.completedDate.startsWith(today);
        const bCompletedToday = b.completedDate && b.completedDate.startsWith(today);
        
        if (aCompletedToday && !bCompletedToday) return -1;
        if (!aCompletedToday && bCompletedToday) return 1;
        if (!a.completed && b.completed) return -1;
        if (a.completed && !b.completed) return 1;
        return new Date(b.createdDate) - new Date(a.createdDate);
    });
    
    const selectedCategory = categoryFilter ? categoryFilter.value : '';

    sortedHabits.forEach(habit => {
        if (selectedCategory && selectedCategory !== 'all' && habit.category !== selectedCategory) return;

        const habitItem = document.createElement('li');
        habitItem.className = 'habit-item';
        if (habit.category) {
            const catColor = categoryColors[habit.category] || '#6366f1';
            habitItem.style.borderLeft = `5px solid ${catColor}`;
        }
        
        const completedDate = habit.completedDate ? new Date(habit.completedDate) : null;
        const formattedDate = completedDate ? 
            completedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }) : '';
        
        const streakDisplay = habit.streak && habit.streak.currentStreak > 0 
            ? `🔥 ${habit.streak.currentStreak} Day Streak`
            : '';
        
        const frequencyDisplay = getFrequencyDisplay(habit.frequency);
        const reminderDisplay = habit.reminderTime ? `⏰ ${habit.reminderTime}` : '';
        const categoryLabel = habit.category ? `<span class="habit-badge badge-category" style="background:${categoryColors[habit.category] || '#94a3b8'}">${habit.category}</span>` : '';

        const progressBarHTML = habit.targetValue ? `
            <div class="habit-progress-section">
                <div class="progress-header">
                    <span class="progress-label">${habit.currentProgress || 0}/${habit.targetValue} ${habit.targetUnit || ''}</span>
                    <div class="progress-controls">
                        <button class="progress-btn progress-decrease" data-id="${habit.id}" title="Decrease">−</button>
                        <button class="progress-btn progress-increase" data-id="${habit.id}" title="Increase">+</button>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${Math.min(100, (habit.currentProgress || 0) / habit.targetValue * 100)}%"></div>
                </div>
            </div>
        ` : '';

        habitItem.setAttribute('data-drag-id', habit.id);
        habitItem.draggable = true;
        
        habitItem.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="habit-info">
                <input type="checkbox" class="habit-checkbox" ${habit.completed ? 'checked' : ''} data-id="${habit.id}">
                <div class="habit-details">
                    <div class="habit-name-row">
                        <span class="habit-name">${habit.name}</span>
                        ${categoryLabel}
                        ${streakDisplay ? `<span class="habit-badge badge-streak">${streakDisplay}</span>` : ''}
                        ${frequencyDisplay ? `<span class="habit-badge badge-frequency">${frequencyDisplay}</span>` : ''}
                        ${reminderDisplay ? `<span class="habit-badge badge-reminder">Reminder</span>` : ''}
                    </div>
                    ${progressBarHTML}
                    <div class="habit-meta">
                        ${habit.streak?.currentStreak ? `<span class="habit-streak">${habit.streak.currentStreak} day streak</span>` : ''}
                        ${frequencyDisplay ? `<span class="habit-frequency">${frequencyDisplay}</span>` : ''}
                        ${habit.completedDate ? `<span>Completed: ${formattedDate}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="edit-btn" data-id="${habit.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${habit.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        habitsList.appendChild(habitItem);
    });
    
    habitsCount.textContent = `${habits.length} habit${habits.length !== 1 ? 's' : ''}`;
    
    document.querySelectorAll('.habit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', toggleHabitComplete);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteHabit);
    });
    
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', openEditModal);
    });
    
    document.querySelectorAll('.progress-increase').forEach(button => {
        button.addEventListener('click', () => updateHabitProgress(parseInt(button.dataset.id), 1));
    });
    
    document.querySelectorAll('.progress-decrease').forEach(button => {
        button.addEventListener('click', () => updateHabitProgress(parseInt(button.dataset.id), -1));
    });

    initializeDragAndDrop();
}

// Drag and Drop
let draggedItem = null;
let draggedOverItem = null;

function initializeDragAndDrop() {
    const habitItems = document.querySelectorAll('.habit-item');
    habitItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('touchstart', handleTouchStart, false);
        item.addEventListener('touchmove', handleTouchMove, false);
        item.addEventListener('touchend', handleTouchEnd, false);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.habit-item').forEach(item => {
        item.classList.remove('drag-over', 'drag-over-bottom');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedItem && draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over', 'drag-over-bottom');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedItem !== this) {
        reorderHabits(draggedItem, this);
    }
    
    this.classList.remove('drag-over', 'drag-over-bottom');
    return false;
}

function reorderHabits(draggedElement, targetElement) {
    const draggedId = parseInt(draggedElement.getAttribute('data-drag-id'));
    const targetId = parseInt(targetElement.getAttribute('data-drag-id'));
    
    if (draggedId === targetId) return;
    
    const draggedIndex = habits.findIndex(h => h.id === draggedId);
    const targetIndex = habits.findIndex(h => h.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [removed] = habits.splice(draggedIndex, 1);
    habits.splice(targetIndex, 0, removed);
    
    saveHabitOrder();
    renderHabits();
}

let touchStartY = 0;
let touchItem = null;

function handleTouchStart(e) {
    touchItem = this;
    touchStartY = e.touches[0].clientY;
    this.classList.add('touch-drag');
}

function handleTouchMove(e) {
    if (!touchItem) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const targetItem = elements.find(el => el.classList && el.classList.contains('habit-item'));
    
    if (targetItem && targetItem !== touchItem) {
        draggedOverItem = targetItem;
    }
}

function handleTouchEnd(e) {
    if (touchItem && draggedOverItem && touchItem !== draggedOverItem) {
        reorderHabits(touchItem, draggedOverItem);
    }
    
    if (touchItem) {
        touchItem.classList.remove('touch-drag');
    }
    touchItem = null;
    draggedOverItem = null;
}

function saveHabitOrder() {
    try {
        localStorage.setItem('habitOrder', JSON.stringify(habits.map(h => h.id)));
        saveHabits();
    } catch (e) {
        console.error('Error saving habit order:', e);
    }
}

// Confetti and celebrations
function createConfettiParticle() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    confetti.style.backgroundColor = randomColor;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    
    const tx = (Math.random() - 0.5) * 400;
    const ty = window.innerHeight + 20;
    const rotation = Math.random() * 720;
    const swing = Math.random() * 20 - 10;
    
    confetti.style.setProperty('--tx', tx + 'px');
    confetti.style.setProperty('--ty', ty + 'px');
    confetti.style.setProperty('--rotation', rotation + 'deg');
    confetti.style.setProperty('--swing', swing + 'px');
    
    return confetti;
}

function shootConfetti(intensity = 'normal') {
    const existing = document.querySelector('.confetti-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    const particleCount = intensity === 'intense' ? 50 : intensity === 'mild' ? 15 : 30;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            if (container.parentElement) {
                const confetti = createConfettiParticle();
                container.appendChild(confetti);
                confetti.offsetHeight;
                confetti.classList.add('animate');
                setTimeout(() => confetti.remove(), 2600);
            }
        }, i * 30);
    }
    
    setTimeout(() => {
        if (container.children.length === 0) {
            container.remove();
        }
    }, 3000);
}

function triggerPulseAnimation(element) {
    if (!element) return;
    element.classList.remove('pulse');
    element.offsetHeight;
    element.classList.add('pulse');
    setTimeout(() => element.classList.remove('pulse'), 600);
}

function triggerStreakMilestone(element) {
    if (!element) return;
    element.classList.remove('streak-milestone');
    element.offsetHeight;
    element.classList.add('streak-milestone');
    setTimeout(() => element.classList.remove('streak-milestone'), 600);
}

function triggerStatBounce(element) {
    if (!element) return;
    element.classList.remove('bounce');
    element.offsetHeight;
    element.classList.add('bounce');
    setTimeout(() => element.classList.remove('bounce'), 400);
}

function triggerButtonPress(element) {
    if (!element) return;
    element.classList.remove('active-press');
    element.offsetHeight;
    element.classList.add('active-press');
    setTimeout(() => element.classList.remove('active-press'), 300);
}

function getFrequencyDisplay(frequency) {
    if (!frequency) return 'Daily';
    
    switch (frequency.type) {
        case 'daily': return 'Daily';
        case 'weekly': return 'Weekly';
        case 'monthly': return 'Monthly';
        case 'custom': 
            if (!frequency.days || frequency.days.length === 0) return 'Custom';
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return frequency.days.map(d => days[d]).join(', ');
        default: return 'Daily';
    }
}

function handleAddHabit(e) {
    e.preventDefault();
    
    const habitName = document.getElementById('habitInput').value.trim();
    if (habitName === '') return;
    const habitCategory = document.getElementById('habitCategorySelect') ? document.getElementById('habitCategorySelect').value : '';
    const habitGoal = document.getElementById('habitGoalSelect') ? document.getElementById('habitGoalSelect').value : '';
    const targetValue = parseInt(document.getElementById('habitTargetValue').value) || null;
    const targetUnit = document.getElementById('habitTargetUnit').value.trim() || null;
    
    const newHabit = {
        id: Date.now(),
        name: habitName,
        category: habitCategory || null,
        linkedGoals: habitGoal ? [parseInt(habitGoal)] : [],
        frequency: { type: 'daily', days: [] },
        completed: false,
        completedDate: null,
        createdDate: new Date().toISOString(),
        streak: { currentStreak: 0, longestStreak: 0 },
        reminderTime: null,
        targetValue: targetValue,
        targetUnit: targetUnit,
        currentProgress: 0
    };
    
    habits.push(newHabit);
    getHabitColor(habitName);
    saveHabits();
    
    if (habitGoal) {
        linkHabitToGoal(newHabit.id, parseInt(habitGoal));
    }
    
    addXP(10);
    
    renderHabits();
    generateCalendar(currentMonth, currentYear);
    updateStats();
    updateDashboard();
    updateGamification();
    renderHeatmap();
    
    document.getElementById('habitInput').value = '';
    const hc = document.getElementById('habitCategorySelect'); if (hc) hc.value = '';
    document.getElementById('habitInput').focus();
    
    const submitBtn = e.target.querySelector('button');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
    submitBtn.style.background = 'var(--success)';
    
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
    }, 1500);
    
    checkAchievements();
}

function toggleHabitComplete(e) {
    const habitId = parseInt(e.target.dataset.id);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const wasCompletedToday = habit.completedDate && habit.completedDate.startsWith(todayStr);
    
    if (e.target.checked) {
        if (!shouldCompleteToday(habit)) {
            alert(`This habit is not scheduled for today (${getFrequencyDisplay(habit.frequency)})`);
            e.target.checked = false;
            return;
        }
        
        habit.completed = true;
        habit.completedDate = new Date().toISOString();
        
        triggerPulseAnimation(e.target);
        shootConfetti('normal');
        
        if (!wasCompletedToday) {
            updateStreak(habit, true);
            addXP(5);
            
            if (habit.streak && (habit.streak.currentStreak === 5 || 
                habit.streak.currentStreak === 10 || 
                habit.streak.currentStreak === 25 || 
                habit.streak.currentStreak === 50 ||
                habit.streak.currentStreak === 100)) {
                shootConfetti('intense');
            }
        }
    } else {
        habit.completed = false;
        habit.completedDate = null;
        updateStreak(habit, false);
    }
    
    saveHabits();
    renderHabits();
    generateCalendar(currentMonth, currentYear);
    updateStats();
    updateDashboard();
    updateGamification();
    renderHeatmap();
    checkAchievements();
}

function updateHabitProgress(habitId, delta) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.targetValue) return;
    
    let newProgress = (habit.currentProgress || 0) + delta;
    newProgress = Math.max(0, Math.min(newProgress, habit.targetValue));
    
    habit.currentProgress = newProgress;
    
    if (newProgress >= habit.targetValue && !habit.completed) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const wasCompletedToday = habit.completedDate && habit.completedDate.startsWith(todayStr);
        
        if (!wasCompletedToday) {
            habit.completed = true;
            habit.completedDate = new Date().toISOString();
            updateStreak(habit, true);
            addXP(5);
        }
    }
    else if (newProgress < habit.targetValue && habit.completed) {
        habit.completed = false;
        habit.completedDate = null;
        updateStreak(habit, false);
    }
    
    saveHabits();
    renderHabits();
    generateCalendar(currentMonth, currentYear);
    updateStats();
    updateDashboard();
    updateGamification();
    renderHeatmap();
}

function updateStreak(habit, completedToday) {
    if (!habit.streak) {
        habit.streak = { currentStreak: 0, longestStreak: 0 };
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const lastCompletionStr = habit.completedDate ? 
        new Date(habit.completedDate).toISOString().split('T')[0] : null;
    
    if (completedToday) {
        if (lastCompletionStr === yesterdayStr) {
            habit.streak.currentStreak++;
        } else if (lastCompletionStr !== todayStr) {
            habit.streak.currentStreak = 1;
        }
    } else {
        if (habit.streak.currentStreak > 0 && lastCompletionStr === todayStr) {
            habit.streak.currentStreak = Math.max(0, habit.streak.currentStreak - 1);
        }
    }
    
    if (habit.streak.currentStreak > habit.streak.longestStreak) {
        habit.streak.longestStreak = habit.streak.currentStreak;
    }
}

function deleteHabit(e) {
    const habitId = parseInt(e.target.closest('.delete-btn').dataset.id);
    
    if (confirm('Are you sure you want to delete this habit?')) {
        const habitIndex = habits.findIndex(h => h.id === habitId);
        if (habitIndex !== -1) {
            const habit = habits[habitIndex];
            const habitName = habit.name;
            
            if (habit.linkedGoals && habit.linkedGoals.length) {
                habit.linkedGoals.forEach(goalId => {
                    unlinkHabitFromGoal(habitId, goalId);
                });
            }
            
            habits.splice(habitIndex, 1);
            
            const hasSameName = habits.some(h => h.name === habitName);
            if (!hasSameName) {
                delete habitColors[habitName];
            }
            
            saveHabits();
            renderHabits();
            generateCalendar(currentMonth, currentYear);
            updateStats();
            updateDashboard();
            updateGamification();
            renderHeatmap();
        }
    }
}

function openEditModal(e) {
    const habitId = parseInt(e.target.closest('.edit-btn').dataset.id);
    const habit = habits.find(h => h.id === habitId);
    
    if (!habit) return;
    
    editingHabitId = habitId;
    populateGoalsSelects();
    
    document.getElementById('editHabitName').value = habit.name;
    document.getElementById('editHabitCategory').value = habit.category || '';
    const editGoalsSel = document.getElementById('editHabitGoals');
    if (editGoalsSel) {
        editGoalsSel.value = '';
        if (habit.linkedGoals && habit.linkedGoals.length) {
            editGoalsSel.value = habit.linkedGoals[0];
        }
    }
    document.getElementById('editFrequencyType').value = habit.frequency?.type || 'daily';
    
    const customDaysCheckboxes = document.querySelectorAll('input[name="customDay"]');
    customDaysCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    if (habit.frequency?.type === 'custom' && habit.frequency.days) {
        habit.frequency.days.forEach(day => {
            const checkbox = document.querySelector(`input[name="customDay"][value="${day}"]`);
            if (checkbox) checkbox.checked = true;
        });
        customDaysContainer.style.display = 'block';
    } else {
        customDaysContainer.style.display = 'none';
    }
    
    const reminderEnabled = !!habit.reminderTime;
    document.getElementById('editReminderEnabled').checked = reminderEnabled;
    document.getElementById('editReminderTime').value = habit.reminderTime || '09:00';
    document.getElementById('editReminderTime').disabled = !reminderEnabled;
    
    document.getElementById('editTargetValue').value = habit.targetValue || '';
    document.getElementById('editTargetUnit').value = habit.targetUnit || '';
    
    editHabitModal.classList.add('active');
}

function handleFrequencyTypeChange() {
    customDaysContainer.style.display = this.value === 'custom' ? 'block' : 'none';
}

function handleReminderToggle() {
    document.getElementById('editReminderTime').disabled = !this.checked;
}

function handleEditHabitSubmit(e) {
    e.preventDefault();
    
    const habit = habits.find(h => h.id === editingHabitId);
    if (!habit) return;
    
    const oldName = habit.name;
    const newName = document.getElementById('editHabitName').value.trim();
    habit.name = newName;
    
    if (oldName !== newName && habitColors[oldName]) {
        habitColors[newName] = habitColors[oldName];
        delete habitColors[oldName];
    }
    
    const frequencyType = document.getElementById('editFrequencyType').value;
    habit.frequency = { type: frequencyType, days: [] };

    const newCategory = document.getElementById('editHabitCategory') ? document.getElementById('editHabitCategory').value : '';
    habit.category = newCategory || null;
    
    const editGoalsSel = document.getElementById('editHabitGoals');
    const oldGoalId = habit.linkedGoals && habit.linkedGoals.length ? habit.linkedGoals[0] : null;
    const newGoalId = editGoalsSel && editGoalsSel.value ? parseInt(editGoalsSel.value) : null;
    
    if (oldGoalId !== newGoalId) {
        updateHabitGoalLink(habit.id, oldGoalId, newGoalId);
    }
    
    if (newGoalId) {
        habit.linkedGoals = [newGoalId];
    } else {
        habit.linkedGoals = [];
    }
    
    if (frequencyType === 'custom') {
        const selectedDays = Array.from(document.querySelectorAll('input[name="customDay"]:checked'))
            .map(cb => parseInt(cb.value));
        habit.frequency.days = selectedDays;
    }
    
    if (document.getElementById('editReminderEnabled').checked) {
        habit.reminderTime = document.getElementById('editReminderTime').value;
    } else {
        habit.reminderTime = null;
    }
    
    const targetValue = parseInt(document.getElementById('editTargetValue').value) || null;
    const targetUnit = document.getElementById('editTargetUnit').value.trim() || null;
    habit.targetValue = targetValue;
    habit.targetUnit = targetUnit;
    if (!targetValue) {
        habit.currentProgress = 0;
    }
    
    saveHabits();
    renderHabits();
    updateDashboard();
    updateLegend();
    closeEditModalHandler();
    renderHeatmap();
}

function closeEditModalHandler() {
    editHabitModal.classList.remove('active');
    editingHabitId = null;
    editHabitForm.reset();
}

function handleModalOutsideClick(e) {
    if (e.target === editHabitModal) {
        closeEditModalHandler();
    }
}

// Calendar
function generateCalendar(month, year) {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthEl = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthEl) return;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    let calendarHTML = '';
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="calendar-day"></div>`;
    }
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayHabits = getHabitsForDate(dateStr);
        const isToday = isCurrentMonth && day === today.getDate();
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}" style="cursor: pointer;">
                <div class="day-number">${day}</div>
                <div class="task-dots">
        `;
        
        const displayHabits = dayHabits.slice(0, 6);
        displayHabits.forEach(habit => {
            const color = getHabitColor(habit.name);
            calendarHTML += `<div class="task-dot" style="background-color: ${color}" title="${habit.name}"></div>`;
        });
        
        if (dayHabits.length > 6) {
            calendarHTML += `<div class="task-dot" style="background-color: var(--gray);" title="+${dayHabits.length - 6} more"></div>`;
        }
        
        calendarHTML += `
                </div>
            </div>
        `;
    }
    
    calendarGrid.innerHTML = calendarHTML;
    wireCalendarDayClicks();
    generateMiniCalendar();
}

function getHabitsForDate(dateStr) {
    return habits.filter(habit => {
        if (!habit.completedDate) return false;
        
        const habitDate = new Date(habit.completedDate);
        const habitDateStr = `${habitDate.getUTCFullYear()}-${String(habitDate.getUTCMonth() + 1).padStart(2, '0')}-${String(habitDate.getUTCDate()).padStart(2, '0')}`;
        
        return habitDateStr === dateStr;
    });
}

function generateMiniCalendar() {
    const today = new Date();
    const miniCalendarEl = document.getElementById('miniCalendar');
    
    if (!miniCalendarEl) return;
    
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    let miniHTML = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 15px;">';
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateStr = day.toISOString().split('T')[0];
        
        const dayHabits = getHabitsForDate(dateStr);
        const isToday = day.toDateString() === today.toDateString();
        
        miniHTML += `
            <div style="text-align: center; padding: 10px; border-radius: 8px; background: ${isToday ? 'var(--primary)' : 'var(--hover-bg)'}; color: ${isToday ? 'white' : 'var(--text-color)'}">
                <div style="font-size: 12px; font-weight: 600;">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</div>
                <div style="font-size: 16px; font-weight: 700; margin: 5px 0;">${day.getDate()}</div>
                <div style="font-size: 11px;">${dayHabits.length} done</div>
            </div>
        `;
    }
    
    miniHTML += '</div>';
    miniCalendarEl.innerHTML = miniHTML;
}

function handlePrevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
}

function handleNextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
}

function handlePrevYear() {
    currentYear--;
    generateCalendar(currentMonth, currentYear);
}

function handleNextYear() {
    currentYear++;
    generateCalendar(currentMonth, currentYear);
}

function handleTodayClick() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    generateCalendar(currentMonth, currentYear);
}

// Statistics
function updateStats() {
    const totalHabitsEl = document.getElementById('totalHabits');
    if (totalHabitsEl) {
        triggerStatBounce(totalHabitsEl);
        totalHabitsEl.textContent = habits.length;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(habit => 
        habit.completedDate && habit.completedDate.startsWith(today)
    ).length;
    const completedTodayEl = document.getElementById('completedToday');
    if (completedTodayEl) {
        triggerStatBounce(completedTodayEl);
        completedTodayEl.textContent = completedToday;
    }
    
    let streak = 0;
    const todayDate = new Date();
    
    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(todayDate);
        checkDate.setDate(todayDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const habitsOnDate = habits.filter(habit => 
            habit.completedDate && habit.completedDate.startsWith(dateStr)
        );
        
        if (habitsOnDate.length > 0) {
            streak++;
        } else if (i === 0) {
            streak = 0;
            break;
        } else {
            break;
        }
    }
    
    const currentStreakEl = document.getElementById('currentStreak');
    if (currentStreakEl) {
        triggerStatBounce(currentStreakEl);
        currentStreakEl.textContent = streak;
    }
}

// Heatmap
function populateHeatmapControls() {
    const mode = document.getElementById('heatmapMode');
    const habitSelect = document.getElementById('heatmapHabitSelect');

    if (mode) {
        mode.addEventListener('change', () => {
            if (mode.value === 'individual') {
                if (habitSelect) habitSelect.style.display = 'inline-block';
            } else {
                if (habitSelect) habitSelect.style.display = 'none';
            }
            renderHeatmap();
        });
    }

    if (habitSelect) {
        habitSelect.innerHTML = '<option value="">Select habit</option>' +
            habits.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
        habitSelect.addEventListener('change', renderHeatmap);
    }
}

function computeCompletionCounts() {
    const overall = {};
    const perHabit = {};

    habits.forEach(h => perHabit[h.id] = {});

    habits.forEach(h => {
        if (!h.completedDate) return;
        const d = new Date(h.completedDate);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const ds = `${year}-${month}-${day}`;
        overall[ds] = (overall[ds] || 0) + 1;
        if (perHabit[h.id]) perHabit[h.id][ds] = (perHabit[h.id][ds] || 0) + 1;
    });

    return { overall, perHabit };
}

function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    const tooltip = document.getElementById('heatmapTooltip');
    if (!container) return;

    const today = new Date();
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));

    const firstSunday = new Date(firstDay);
    const dayOfWeek = firstDay.getUTCDay();
    firstSunday.setUTCDate(firstDay.getUTCDate() - dayOfWeek);

    const counts = computeCompletionCounts();
    const mode = document.getElementById('heatmapMode') ? document.getElementById('heatmapMode').value : 'overall';
    const habitSelect = document.getElementById('heatmapHabitSelect');
    const selectedHabitId = habitSelect && habitSelect.value ? parseInt(habitSelect.value) : null;

    const overallMax = Object.values(counts.overall).reduce((m, v) => Math.max(m, v), 0) || 1;

    let html = '<div class="heatmap">';
    let date = new Date(firstSunday);
    while (date <= lastDay) {
        html += '<div class="heatmap-week">';
        for (let dow = 0; dow < 7; dow++) {
            const year = date.getUTCFullYear();
            const m = String(date.getUTCMonth() + 1).padStart(2, '0');
            const d = String(date.getUTCDate()).padStart(2, '0');
            const ds = `${year}-${m}-${d}`;

            const isInMonth = date.getUTCMonth() === month;

            if (!isInMonth) {
                html += `<div class="heatmap-day" data-date="${ds}" data-count="0"></div>`;
            } else {
                let value = 0;
                if (mode === 'overall') {
                    value = counts.overall[ds] || 0;
                } else if (mode === 'individual' && selectedHabitId && counts.perHabit[selectedHabitId]) {
                    value = counts.perHabit[selectedHabitId][ds] || 0;
                }

                let cls = 'heat-none';
                if (value === 0) cls = 'heat-none';
                else {
                    const pct = Math.min(1, value / overallMax);
                    if (pct <= 0.33) cls = 'heat-low';
                    else if (pct <= 0.66) cls = 'heat-medium';
                    else cls = 'heat-high';
                }

                html += `<div class="heatmap-day ${cls}" data-date="${ds}" data-count="${value}"></div>`;
            }
            date.setUTCDate(date.getUTCDate() + 1);
        }
        html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;

    document.querySelectorAll('#heatmapContainer .heatmap-day').forEach(el => {
        el.addEventListener('mouseenter', (ev) => {
            const d = el.dataset.date;
            const c = parseInt(el.dataset.count) || 0;
            tooltip.style.display = 'block';
            tooltip.innerHTML = `<strong>${d}</strong><div style="margin-top:6px;">${c} habit${c !== 1 ? 's' : ''} completed</div>`;
            const rect = el.getBoundingClientRect();
            const ttRect = tooltip.getBoundingClientRect();
            let left = rect.left + window.scrollX - (ttRect.width / 2) + (rect.width / 2);
            let top = rect.top + window.scrollY - ttRect.height - 8;
            if (top < 8) top = rect.bottom + window.scrollY + 8;
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });
        el.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}

// Dashboard continued with remaining functions...

function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const totalHabitsCount = habits.length;
    const completedTodayCount = habits.filter(habit => 
        habit.completedDate && habit.completedDate.startsWith(today)
    ).length;
    
    const progressPercent = totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;
    
    const completedCountEl = document.getElementById('completedCount');
    const totalCountEl = document.getElementById('totalCount');
    const progressPercentEl = document.getElementById('progressPercent');
    const progressFillEl = document.getElementById('progressFill');
    
    if (completedCountEl) {
        triggerStatBounce(completedCountEl);
        completedCountEl.textContent = completedTodayCount;
    }
    if (totalCountEl) totalCountEl.textContent = totalHabitsCount;
    if (progressPercentEl) {
        triggerStatBounce(progressPercentEl);
        progressPercentEl.textContent = `${progressPercent}%`;
    }
    if (progressFillEl) progressFillEl.style.width = `${progressPercent}%`;
    
    const totalHabitsEl = document.getElementById('dashboardTotalHabits');
    const completedTodayEl = document.getElementById('dashboardCompletedToday');
    const bestStreakEl = document.getElementById('dashboardBestStreak');
    const missedTodayEl = document.getElementById('dashboardMissedToday');
    
    if (totalHabitsEl) totalHabitsEl.textContent = totalHabitsCount;
    if (completedTodayEl) {
        triggerStatBounce(completedTodayEl);
        completedTodayEl.textContent = completedTodayCount;
    }
    
    const bestStreak = habits.reduce((max, habit) => {
        return Math.max(max, habit.streak?.longestStreak || 0);
    }, 0);
    if (bestStreakEl) {
        triggerStatBounce(bestStreakEl);
        bestStreakEl.textContent = bestStreak;
    }
    
    let missedCount = 0;
    habits.forEach(habit => {
        if (shouldCompleteToday(habit) && 
            (!habit.completedDate || !habit.completedDate.startsWith(today))) {
            missedCount++;
        }
    });
    if (missedTodayEl) missedTodayEl.textContent = missedCount;
    
    updateRemindersList();
    
    const dashboardGoalsSummary = document.getElementById('dashboardGoalsSummary');
    if (dashboardGoalsSummary) {
        if (goals.length === 0) {
            dashboardGoalsSummary.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--gray);">No goals yet. <a href="javascript:void(0)" onclick="document.querySelector(\'[data-page=goals]\').click();" style="color: var(--primary); text-decoration: underline;">Create one</a></p>';
        } else {
            let goalsHtml = '<div style="display: flex; flex-direction: column; gap: 12px;">';
            goals.slice(0, 3).forEach(goal => {
                const stats = calculateGoalProgress(goal);
                goalsHtml += `
                    <div style="padding: 10px; background: var(--hover-bg); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                            <span style="font-weight: 600; color: var(--text-color);">${goal.goalName}</span>
                            <span style="color: var(--primary); font-weight: 700;">${stats.progress}%</span>
                        </div>
                        <div style="background: var(--light-gray); height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${stats.progress}%; height: 100%; background: ${stats.progress >= 100 ? '#10b981' : 'var(--primary)'}; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                `;
            });
            if (goals.length > 3) {
                goalsHtml += `<p style="text-align: center; color: var(--gray); font-size: 12px; margin-top: 8px;">and ${goals.length - 3} more goal${goals.length - 3 !== 1 ? 's' : ''}</p>`;
            }
            goalsHtml += '</div>';
            dashboardGoalsSummary.innerHTML = goalsHtml;
        }
    }

    const categorySummaryEl = document.getElementById('categorySummary');
    if (categorySummaryEl) {
        const counts = {};
        categories.forEach(c => counts[c] = 0);
        habits.forEach(h => {
            if (h.category && counts.hasOwnProperty(h.category)) counts[h.category]++;
        });

        let html = '';
        categories.forEach(c => {
            const color = categoryColors[c] || '#94a3b8';
            html += `<div style="background: ${color}; color: white; padding: 10px 14px; border-radius: 12px; font-weight:700; display:flex; gap:8px; align-items:center;">` +
                    `<span>${c}</span><span style="opacity:0.9; background: rgba(255,255,255,0.12); padding:4px 8px; border-radius:8px;">${counts[c] || 0}</span></div>`;
        });

        categorySummaryEl.innerHTML = html;
    }

    try { renderHeatmap(); } catch (e) { }
}

function updateRemindersList() {
    const remindersList = document.getElementById('remindersList');
    if (!remindersList) return;
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const today = now.toISOString().split('T')[0];
    
    const habitsWithReminders = habits.filter(habit => habit.reminderTime && shouldCompleteToday(habit));
    
    if (habitsWithReminders.length === 0) {
        remindersList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--gray);">No reminders set for today</p>';
        return;
    }
    
    let remindersHTML = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    habitsWithReminders.forEach(habit => {
        const reminderTime = habit.reminderTime;
        const isPast = compareTimes(reminderTime, currentTime) < 0;
        const isCompleted = habit.completedDate && habit.completedDate.startsWith(today);
        
        remindersHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--hover-bg); border-radius: 8px;">
                <div>
                    <div style="font-weight: 600;">${habit.name}</div>
                    <div style="font-size: 12px; color: var(--gray);">${reminderTime}</div>
                </div>
                <div>
                    ${isCompleted ? 
                        '<span style="color: var(--success); font-size: 12px;"><i class="fas fa-check"></i> Done</span>' :
                        isPast ?
                        '<span style="color: var(--warning); font-size: 12px;"><i class="fas fa-clock"></i> Missed</span>' :
                        '<span style="color: var(--primary); font-size: 12px;"><i class="fas fa-clock"></i> Upcoming</span>'
                    }
                </div>
            </div>
        `;
    });
    
    remindersHTML += '</div>';
    remindersList.innerHTML = remindersHTML;
}

function compareTimes(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    if (h1 !== h2) return h1 - h2;
    return m1 - m2;
}

function handleQuickAdd() {
    const habitsTab = document.querySelector('.nav-tab[data-page="habits"]');
    if (habitsTab) {
        habitsTab.click();
        setTimeout(() => {
            const habitInput = document.getElementById('habitInput');
            if (habitInput) habitInput.focus();
        }, 300);
    }
}

function handleCheckAll() {
    const today = new Date().toISOString().split('T')[0];
    let completedCount = 0;
    
    habits.forEach(habit => {
        if (shouldCompleteToday(habit) && 
            (!habit.completedDate || !habit.completedDate.startsWith(today))) {
            habit.completed = true;
            habit.completedDate = new Date().toISOString();
            updateStreak(habit, true);
            completedCount++;
        }
    });
    
    if (completedCount > 0) {
        addXP(completedCount * 5);
        saveHabits();
        renderHabits();
        updateStats();
        updateDashboard();
        updateGamification();
        checkAchievements();
        alert(`${completedCount} habits marked as completed!`);
    } else {
        alert('All habits are already completed for today!');
    }
}

// Reminders
function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const today = now.toISOString().split('T')[0];
    
    habits.forEach(habit => {
        if (habit.reminderTime && shouldCompleteToday(habit)) {
            if (habit.reminderTime === currentTime) {
                const isCompleted = habit.completedDate && habit.completedDate.startsWith(today);
                const notificationKey = `${habit.id}_${today}`;
                if (!isCompleted && !lastNotificationTime[notificationKey]) {
                    new Notification('Habit Reminder', {
                        body: `Time to: ${habit.name}\nStay consistent and make progress!`,
                        icon: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/bell.svg'
                    });
                    
                    playNotificationSound();
                    // also add to in-app notifications (persistent)
                    try { addNotification(`Reminder: ${habit.name}`); } catch (e) { /* ignore */ }
                    lastNotificationTime[notificationKey] = now.getTime();
                }
            }
        }
    });
    
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    Object.keys(lastNotificationTime).forEach(key => {
        if (lastNotificationTime[key] < oneDayAgo) {
            delete lastNotificationTime[key];
        }
    });
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio context not supported');
    }
}

// Gamification
function updateGamification() {
    const xpNeeded = userData.level * 100;
    const xpPercent = xpNeeded > 0 ? Math.min(100, (userData.xp / xpNeeded) * 100) : 100;
    
    const xpTextEl = document.getElementById('xpText');
    const xpFillEl = document.getElementById('xpFill');
    const currentLevelEl = document.getElementById('currentLevel');
    
    if (xpTextEl) xpTextEl.textContent = `${userData.xp}/${xpNeeded} XP`;
    if (xpFillEl) xpFillEl.style.width = `${xpPercent}%`;
    if (currentLevelEl) currentLevelEl.textContent = userData.level;
    
    updateBadges();
    
    const badgeCountEl = document.getElementById('badgeCount');
    const unlockedCount = userData.badges.length;
    if (badgeCountEl) badgeCountEl.textContent = `${unlockedCount}/${achievements.length} unlocked`;
}

function addXP(amount) {
    if (amount <= 0) return;
    
    userData.xp += amount;
    
    let leveledUp = false;
    const maxIterations = 100;
    let iterations = 0;
    
    while (iterations < maxIterations) {
        const xpNeeded = userData.level * 100;
        if (userData.xp < xpNeeded) break;
        
        userData.xp -= xpNeeded;
        userData.level++;
        leveledUp = true;
        iterations++;
    }
    
    if (leveledUp) {
        showLevelUpAnimation();
    }
    
    localStorage.setItem('habitUserData', JSON.stringify(userData));
    updateGamification();
}

function showLevelUpAnimation() {
    const levelBadge = document.getElementById('levelBadge');
    if (levelBadge) {
        triggerButtonPress(levelBadge);
        shootConfetti('intense');
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Level Up!', {
            body: `Congratulations! You reached Level ${userData.level}!`,
            icon: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/trophy.svg'
        });
    }
}

function checkAchievements() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    achievements.forEach(achievement => {
        if (!userData.badges.includes(achievement.id)) {
            let unlocked = false;
            
            switch (achievement.id) {
                case 'first_habit':
                    unlocked = habits.some(h => h.completed);
                    break;
                case 'seven_streak':
                    unlocked = habits.some(h => h.streak?.currentStreak >= 7);
                    break;
                case 'thirty_streak':
                    unlocked = habits.some(h => h.streak?.currentStreak >= 30);
                    break;
                case 'hundred_completions':
                    const totalCompletions = habits.reduce((sum, h) => sum + (h.completed ? 1 : 0), 0);
                    unlocked = totalCompletions >= 100;
                    break;
                case 'habit_collector':
                    unlocked = habits.length >= 10;
                    break;
                case 'early_bird':
                    unlocked = habits.some(h => {
                        if (!h.completedDate) return false;
                        const completionTime = new Date(h.completedDate);
                        return completionTime.getHours() < 8;
                    });
                    break;
                default:
                    unlocked = false;
            }
            
            if (unlocked) {
                unlockAchievement(achievement);
            }
        }
    });
}

function unlockAchievement(achievement) {
    if (userData.badges.includes(achievement.id)) return;
    
    userData.badges.push(achievement.id);
    userData.achievements.push({
        id: achievement.id,
        unlockedAt: new Date().toISOString()
    });
    
    addXP(achievement.xp);
    shootConfetti('intense');
    showAchievementUnlocked(achievement);
    
    localStorage.setItem('habitUserData', JSON.stringify(userData));
    updateGamification();
}

function showAchievementUnlocked(achievement) {
    const celebration = document.createElement('div');
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--card-bg);
        padding: 30px;
        border-radius: var(--radius);
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        z-index: 1001;
        text-align: center;
        animation: modalPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 3px solid var(--warning);
        min-width: 300px;
    `;
    
    celebration.innerHTML = `
        <div style="font-size: 48px; color: var(--warning); margin-bottom: 15px; animation: achievementPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);" class="achievement-icon unlock">
            <i class="${achievement.icon}"></i>
        </div>
        <h3 style="margin-bottom: 10px; color: var(--text-color);">Achievement Unlocked!</h3>
        <h4 style="margin-bottom: 10px; color: var(--primary);">${achievement.name}</h4>
        <p style="color: var(--gray); margin-bottom: 20px;">${achievement.description}</p>
        <button class="btn btn-primary close-celebration">
            <i class="fas fa-check"></i> Awesome!
        </button>
    `;
    
    document.body.appendChild(celebration);
    
    celebration.querySelector('.close-celebration').addEventListener('click', () => {
        celebration.remove();
    });
    
    playCelebrationSound();
    
    setTimeout(() => {
        if (celebration.parentElement) {
            celebration.remove();
        }
    }, 5000);
}

function playCelebrationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 600 + (i * 200);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, i * 100);
        }
    } catch (e) {
        console.log('Audio context not supported');
    }
}

function updateBadges() {
    const badgesGrid = document.getElementById('badgesGrid');
    if (!badgesGrid) return;
    
    badgesGrid.innerHTML = '';
    
    achievements.forEach(achievement => {
        const isUnlocked = userData.badges.includes(achievement.id);
        
        const badgeItem = document.createElement('div');
        badgeItem.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        badgeItem.innerHTML = `
            <div class="badge-icon">
                <i class="${achievement.icon}"></i>
            </div>
            <div class="badge-name">${achievement.name}</div>
            ${isUnlocked ? 
                '<div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">Unlocked!</div>' :
                '<div style="font-size: 10px; margin-top: 5px; opacity: 0.6;">Locked</div>'
            }
        `;
        
        badgesGrid.appendChild(badgeItem);
    });
}

function updateLegend() {
    const legendContainer = document.getElementById('legendContainer');
    if (!legendContainer) return;
    
    const completedHabits = habits.filter(h => h.completed);
    const uniqueHabitNames = [...new Set(completedHabits.map(h => h.name))];
    
    if (uniqueHabitNames.length === 0) {
        legendContainer.innerHTML = `
            <p style="text-align: center; padding: 20px; color: var(--gray);">
                Complete some habits to see them in the legend
            </p>
        `;
        return;
    }
    
    let legendHTML = '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
    
    uniqueHabitNames.forEach(habitName => {
        const color = getHabitColor(habitName);
        legendHTML += `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color};"></div>
                <span style="font-size: 14px;">${habitName}</span>
            </div>
        `;
    });
    
    legendHTML += '</div>';
    legendContainer.innerHTML = legendHTML;
}

function handleExport() {
    const exportData = habits.map(habit => {
        const createdDate = new Date(habit.createdDate);
        const completedDate = habit.completedDate ? new Date(habit.completedDate) : null;
        
        return {
            "Habit Name": habit.name,
            "Frequency": getFrequencyDisplay(habit.frequency),
            "Status": habit.completed ? "Completed" : "Pending",
            "Current Streak": habit.streak?.currentStreak || 0,
            "Longest Streak": habit.streak?.longestStreak || 0,
            "Reminder Time": habit.reminderTime || "Not set",
            "Created Date": createdDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            "Completed Date": completedDate ? 
                completedDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }) : "Not completed"
        };
    });
    
    if (habits.length > 0) {
        exportData.push({}, {
            "Habit Name": "=== GAMIFICATION ===",
            "Frequency": "",
            "Status": "",
            "Current Streak": "",
            "Longest Streak": "",
            "Reminder Time": "",
            "Created Date": `Level: ${userData.level}`,
            "Completed Date": `XP: ${userData.xp}`
        });
    }
    
    if (exportData.length === 0) {
        exportData.push({
            "Habit Name": "Sample Habit",
            "Frequency": "Daily",
            "Status": "Completed",
            "Current Streak": "1",
            "Longest Streak": "1",
            "Reminder Time": "09:00",
            "Created Date": "Wed, Feb 4, 2026",
            "Completed Date": "Wed, Feb 4, 2026"
        });
    }
    
    try {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const colWidths = [
            { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, 
            { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }
        ];
        worksheet['!cols'] = colWidths;
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Habits");
        
        const today = new Date();
        const filename = `habit-tracker-pro-${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}.xlsx`;
        
        XLSX.writeFile(workbook, filename);
        
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Exported!';
        this.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        
        setTimeout(() => {
            this.innerHTML = originalText;
            this.style.background = '';
        }, 2000);
    } catch (e) {
        console.error('Error exporting data:', e);
        alert('Error exporting data. Please try again.');
    }
}

// Journal & Mood
let currentEditingDate = null;

function openJournalModal(dateStr) {
    currentEditingDate = dateStr;
    const journalModal = document.getElementById('journalModal');
    const journalDate = document.getElementById('journalDate');
    const journalMoodInput = document.getElementById('journalMoodInput');
    const journalNote = document.getElementById('journalNote');
    
    if (!journalModal) return;

    const date = new Date(dateStr + 'T00:00:00Z');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    journalDate.textContent = `Journal - ${date.toLocaleDateString('en-US', options)}`;

    const entry = journal[dateStr];
    if (entry) {
        journalNote.value = entry.note || '';
        journalMoodInput.value = entry.mood || '';
        updateMoodButtonStates(entry.mood);
    } else {
        journalNote.value = '';
        journalMoodInput.value = '';
        updateMoodButtonStates(null);
    }

    journalModal.classList.add('active');
}

function closeJournalModalHandler() {
    const journalModal = document.getElementById('journalModal');
    if (journalModal) journalModal.classList.remove('active');
    currentEditingDate = null;
}

function handleJournalModalOutsideClick(e) {
    const journalModal = document.getElementById('journalModal');
    if (e.target === journalModal) {
        closeJournalModalHandler();
    }
}

function selectMood(mood) {
    document.getElementById('journalMoodInput').value = mood;
    updateMoodButtonStates(mood);
}

function updateMoodButtonStates(activeMood) {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        if (btn.dataset.mood === activeMood) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function handleJournalSubmit(e) {
    e.preventDefault();
    if (!currentEditingDate) return;

    const mood = document.getElementById('journalMoodInput').value;
    const note = document.getElementById('journalNote').value.trim();

    if (!mood && !note) {
        journal[currentEditingDate] = undefined;
    } else {
        journal[currentEditingDate] = { date: currentEditingDate, mood, note };
    }

    saveJournal();
    closeJournalModalHandler();
    generateCalendar(currentMonth, currentYear);
    updateStats();
    updateMoodAnalytics();
}

function updateMoodAnalytics() {
    const moodAnalyticsEl = document.getElementById('moodAnalytics');
    if (!moodAnalyticsEl) return;

    const moodCounts = {
        happy: 0,
        neutral: 0,
        sad: 0,
        tired: 0,
        motivated: 0
    };

    Object.values(journal).forEach(entry => {
        if (entry && entry.mood && moodCounts.hasOwnProperty(entry.mood)) {
            moodCounts[entry.mood]++;
        }
    });

    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    let html = '';

    Object.entries(moodCounts).forEach(([mood, count]) => {
        const cfg = moodConfig[mood];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        html += `
            <div style="padding: 12px; background: var(--hover-bg); border-radius: 12px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 4px;">${cfg.icon}</div>
                <div style="font-size: 12px; font-weight: 600; color: var(--text-color);">${cfg.label}</div>
                <div style="font-size: 14px; font-weight: 700; margin-top: 4px; color: ${cfg.color};">${count}</div>
                <div style="font-size: 11px; color: var(--gray); margin-top: 2px;">${pct}%</div>
            </div>
        `;
    });

    moodAnalyticsEl.innerHTML = html;
    updateMoodHabitCorrelation(moodCounts);
}

function updateMoodHabitCorrelation(moodCounts) {
    const correlationEl = document.getElementById('moodHabitCorrelation');
    if (!correlationEl) return;

    const entries = Object.values(journal).filter(e => e);
    if (entries.length === 0) {
        correlationEl.textContent = 'Complete more journal entries to see correlations';
        return;
    }

    const habitsByMood = {
        happy: [],
        neutral: [],
        sad: [],
        tired: [],
        motivated: []
    };

    entries.forEach(entry => {
        if (!entry.mood) return;
        const dayHabits = getHabitsForDate(entry.date);
        habitsByMood[entry.mood].push(dayHabits.length);
    });

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">';
    Object.entries(habitsByMood).forEach(([mood, counts]) => {
        if (counts.length === 0) return;
        const avg = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
        const cfg = moodConfig[mood];
        html += `
            <div style="padding: 10px; background: var(--hover-bg); border-radius: 8px;">
                <div style="font-size: 18px; margin-bottom: 4px;">${cfg.icon}</div>
                <div style="font-size: 11px; color: var(--gray); margin-bottom: 4px;">Avg Habits</div>
                <div style="font-size: 16px; font-weight: 700; color: ${cfg.color};">${avg}</div>
            </div>
        `;
    });
    html += '</div>';
    correlationEl.innerHTML = html;
}

function wireCalendarDayClicks() {
    document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
        day.addEventListener('click', (e) => {
            if (e.target.closest('.task-dots')) return;
            openJournalModal(day.dataset.date);
        });
    });
}

// Goals
function calculateGoalProgress(goal) {
    if (!goal.linkedHabits || goal.linkedHabits.length === 0) {
        return { completions: 0, progress: 0, targetValue: goal.targetValue || 1 };
    }
    
    let totalCompletions = 0;
    goal.linkedHabits.forEach(habitId => {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            if (habit.completions) {
                totalCompletions += habit.completions;
            } else if (habit.completed) {
                totalCompletions += 1;
            }
        }
    });
    
    const targetValue = goal.targetValue || 1;
    const progress = Math.min(100, Math.round((totalCompletions / targetValue) * 100));
    
    return { completions: totalCompletions, progress, targetValue };
}

function renderGoalsPage() {
    const container = document.getElementById('goalsContainer');
    if (!container) return;
    
    if (goals.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray);">No goals yet. Create one to get started!</p>';
        return;
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">';
    
    goals.forEach(goal => {
        const stats = calculateGoalProgress(goal);
        const linkedHabitNames = goal.linkedHabits
            .map(hid => {
                const h = habits.find(x => x.id === hid);
                return h ? h.name : 'Unknown';
            })
            .join(', ');
        
        const deadline = goal.deadline ? new Date(goal.deadline) : null;
        const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const isOverdue = deadline && new Date() > deadline;
        
        html += `
            <div class="card goal-card" data-goal-id="${goal.id}" style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">${goal.goalName}</h3>
                        ${goal.description ? `<p style="color: var(--gray); font-size: 14px; margin-bottom: 8px;">${goal.description}</p>` : ''}
                    </div>
                    <button class="btn-delete-goal" data-goal-id="${goal.id}" style="background: var(--danger); color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div style="background: var(--hover-bg); padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                        <span style="font-weight: 600;">Progress</span>
                        <span style="font-weight: 700; color: var(--primary);">${stats.completions} / ${stats.targetValue}</span>
                    </div>
                    <div style="background: var(--light-gray); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${stats.progress}%; height: 100%; background: ${stats.progress >= 100 ? '#10b981' : 'var(--primary)'}; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="font-size: 12px; color: var(--gray); margin-top: 6px; text-align: right;">${stats.progress}% complete</div>
                </div>
                
                ${deadline ? `
                    <div style="background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; padding: 10px; border-radius: 6px; border-left: 4px solid ${isOverdue ? '#ef4444' : '#f59e0b'};">
                        <div style="font-size: 12px; color: ${isOverdue ? '#991b1b' : '#78350f'}; font-weight: 600;">
                            <i class="fas fa-calendar"></i> 
                            ${isOverdue ? 'OVERDUE' : daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' left'}
                        </div>
                        <div style="font-size: 11px; color: ${isOverdue ? '#b91c1c' : '#b45309'}; margin-top: 2px;">
                            Due: ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                ` : ''}
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <div style="font-size: 12px; color: var(--gray); margin-bottom: 6px;">
                        <strong>Linked Habits (${goal.linkedHabits.length}):</strong>
                    </div>
                    <div style="font-size: 13px; color: var(--text-color); background: var(--hover-bg); padding: 8px; border-radius: 6px;">
                        ${linkedHabitNames || 'None'}
                    </div>
                </div>
                
                <button class="btn-edit-goal btn btn-primary" data-goal-id="${goal.id}" style="width: 100%; margin-top: auto;">
                    <i class="fas fa-edit"></i> Edit Goal
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    document.querySelectorAll('.btn-delete-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const goalId = parseInt(btn.dataset.goalId);
            if (confirm('Are you sure you want to delete this goal?')) {
                deleteGoal(goalId);
                renderGoalsPage();
            }
        });
    });
    
    document.querySelectorAll('.btn-edit-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const goalId = parseInt(btn.dataset.goalId);
            openEditGoalModal(goalId);
        });
    });
}

let editGoalId = null;

function openEditGoalModal(goalId) {
    editGoalId = goalId;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const name = prompt('Goal name:', goal.goalName);
    if (name === null) return;
    
    const desc = prompt('Description (optional):', goal.description || '');
    if (desc === null) return;
    
    const target = prompt('Target value (completions):', goal.targetValue || 1);
    if (target === null) return;
    
    goal.goalName = name;
    goal.description = desc;
    goal.targetValue = parseInt(target) || 1;
    
    updateGoal(goal);
    renderGoalsPage();
}

function openAddGoalModal() {
    const name = prompt('Goal name:');
    if (!name) return;
    
    const desc = prompt('Description (optional):');
    const target = prompt('Target completions:', '1');
    
    const newGoal = {
        id: Date.now(),
        goalName: name || 'Unnamed Goal',
        description: desc || '',
        targetValue: parseInt(target) || 1,
        linkedHabits: [],
        deadline: null,
        createdDate: new Date().toISOString()
    };
    
    addGoal(newGoal);
    populateGoalsSelects();
    renderGoalsPage();
}

function linkHabitToGoal(habitId, goalId) {
    if (!goalId) return;
    
    const goal = goals.find(g => g.id === goalId);
    if (goal && !goal.linkedHabits.includes(habitId)) {
        goal.linkedHabits.push(habitId);
        saveGoals();
    }
}

function unlinkHabitFromGoal(habitId, goalId) {
    if (!goalId) return;
    
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        goal.linkedHabits = goal.linkedHabits.filter(hid => hid !== habitId);
        saveGoals();
    }
}

function updateHabitGoalLink(habitId, oldGoalId, newGoalId) {
    if (oldGoalId) {
        unlinkHabitFromGoal(habitId, oldGoalId);
    }
    if (newGoalId) {
        linkHabitToGoal(habitId, newGoalId);
    }
}

// Focus Mode
function renderFocusHabits() {
    const today = new Date().toISOString().split('T')[0];
    const container = document.getElementById('focusHabitsContainer');
    const emptyState = document.getElementById('focusEmptyState');
    
    if (!container) return;
    
    const todayHabits = habits.filter(h => shouldCompleteToday(h));
    
    if (todayHabits.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    todayHabits.forEach(habit => {
        const isCompleted = habit.completedDate && habit.completedDate.startsWith(today);
        const progress = habit.targetValue ? `${habit.currentProgress || 0}/${habit.targetValue}` : '';
        const progressPercent = habit.targetValue ? Math.min(100, ((habit.currentProgress || 0) / habit.targetValue) * 100) : 0;
        
        const habitEl = document.createElement('div');
        habitEl.className = `focus-habit-item ${isCompleted ? 'completed' : ''}`;
        habitEl.innerHTML = `
            <input type="checkbox" class="focus-habit-checkbox" data-id="${habit.id}" ${isCompleted ? 'checked' : ''}>
            <div class="focus-habit-details">
                <div class="focus-habit-name">${habit.name}</div>
                <div class="focus-habit-meta">
                    ${habit.category ? `<span class="focus-meta-item">${habit.category}</span>` : ''}
                    ${habit.streak?.currentStreak ? `<span class="focus-meta-item">🔥 ${habit.streak.currentStreak} day streak</span>` : ''}
                </div>
                ${habit.targetValue ? `
                    <div class="focus-progress-bar">
                        <div class="focus-progress-header">
                            <span class="focus-progress-label">${progress} ${habit.targetUnit || ''}</span>
                            <span class="focus-progress-value">${Math.round(progressPercent)}%</span>
                        </div>
                        <div class="focus-progress-container">
                            <div class="focus-progress-bar-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="focus-progress-buttons">
                            <button class="focus-progress-btn focus-decrease" data-id="${habit.id}">−</button>
                            <button class="focus-progress-btn focus-increase" data-id="${habit.id}">+</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(habitEl);
    });
    
    document.querySelectorAll('.focus-habit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const habitId = parseInt(e.target.dataset.id);
            const isChecked = e.target.checked;
            const checkbox = document.querySelector(`input[data-id="${habitId}"]`);
            if (checkbox && checkbox !== e.target) {
                checkbox.checked = isChecked;
            }
            toggleHabitComplete({target: e.target});
            updateFocusStats();
            renderFocusHabits();
        });
    });
    
    document.querySelectorAll('.focus-increase').forEach(btn => {
        btn.addEventListener('click', () => {
            const habitId = parseInt(btn.dataset.id);
            updateHabitProgress(habitId, 1);
            updateFocusStats();
            renderFocusHabits();
        });
    });
    
    document.querySelectorAll('.focus-decrease').forEach(btn => {
        btn.addEventListener('click', () => {
            const habitId = parseInt(btn.dataset.id);
            updateHabitProgress(habitId, -1);
            updateFocusStats();
            renderFocusHabits();
        });
    });
}

function updateFocusStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayHabits = habits.filter(h => shouldCompleteToday(h));
    const completedToday = todayHabits.filter(h => h.completedDate && h.completedDate.startsWith(today)).length;
    const total = todayHabits.length;
    const percentage = total > 0 ? Math.round((completedToday / total) * 100) : 0;
    
    document.getElementById('focusCompletedCount').textContent = completedToday;
    document.getElementById('focusTotalCount').textContent = total;
    document.getElementById('focusPercentage').textContent = `${percentage}%`;
}

function startFocusTimer() {
    if (focusMode.timerRunning) return;
    
    focusMode.timerRunning = true;
    document.getElementById('focusPlayBtn').style.display = 'none';
    document.getElementById('focusPauseBtn').style.display = 'inline-flex';
    document.getElementById('timerSetupGroup').style.display = 'none';
    
    focusMode.timerInterval = setInterval(() => {
        if (focusMode.remainingSeconds > 0) {
            focusMode.remainingSeconds--;
            updateFocusTimerDisplay();
        } else {
            pauseFocusTimer();
            playTimerAlertSound();
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Focus Session Complete', {
                    body: 'Great work! Your focus session is complete.',
                    icon: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/trophy.svg'
                });
            }
        }
    }, 1000);
}

function pauseFocusTimer() {
    focusMode.timerRunning = false;
    clearInterval(focusMode.timerInterval);
    document.getElementById('focusPlayBtn').style.display = 'inline-flex';
    document.getElementById('focusPauseBtn').style.display = 'none';
}

function resetFocusTimer() {
    pauseFocusTimer();
    focusMode.remainingSeconds = focusMode.totalSeconds;
    updateFocusTimerDisplay();
    document.getElementById('timerSetupGroup').style.display = 'flex';
}

function setCustomTimer() {
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 25;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    
    focusMode.totalSeconds = minutes * 60 + seconds;
    focusMode.remainingSeconds = focusMode.totalSeconds;
    updateFocusTimerDisplay();
}

function updateFocusTimerDisplay() {
    const mins = Math.floor(focusMode.remainingSeconds / 60);
    const secs = focusMode.remainingSeconds % 60;
    const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('focusTimer').textContent = display;
    document.title = `${display} - Modern Habit Tracker Pro`;
}

function playTimerAlertSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800 + (i * 200);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
            }, i * 150);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

function exitFocusMode() {
    pauseFocusTimer();
    focusMode.active = false;
    
    const dashboardTab = document.querySelector('[data-page="dashboard"]');
    if (dashboardTab) {
        dashboardTab.click();
    }
    
    renderHabits();
    updateStats();
    updateDashboard();
}

function handleNavTabClick() {
    const pageId = this.dataset.page;
    
    navTabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    Object.values(pages).forEach(page => {
        if (page) page.classList.remove('active');
    });
    if (pages[pageId]) pages[pageId].classList.add('active');
    
    switch (pageId) {
        case 'calendar':
            generateCalendar(currentMonth, currentYear);
            updateLegend();
            break;
        case 'stats':
            updateStats();
            updateMoodAnalytics();
            break;
        case 'dashboard':
            updateDashboard();
            break;
        case 'gamification':
            updateGamification();
            break;
        case 'habits':
            renderHabits();
            break;
        case 'goals':
            renderGoalsPage();
            break;
            case 'settings':
                renderCategoriesManagement();
                break;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
