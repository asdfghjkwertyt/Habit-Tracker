# Habit Tracker Feature Test

## Features to Test:

### Journal & Mood Tracking:

1. Open the habit tracker in a browser
2. Go to **Calendar** page
3. Click on any date to open the journal modal
4. Select a mood (Happy, Neutral, Sad, Tired, Motivated)
5. Write some reflection notes
6. Click "Save Entry"
7. Go to **Statistics** page
8. Check "Mood Tracking" section for analytics

### Expected Results:

- Journal modal should pop up when clicking a calendar day
- Mood buttons should highlight when selected
- Data should persist after refresh
- Mood analytics should show counts and percentages
- Mood vs Habits correlation should display

## Troubleshooting:

If journal modal doesn't open:

1. Open browser console (F12)
2. Check for JavaScript errors
3. Try clicking on calendar days - should trigger openJournalModal()

If mood tracking not showing:

1. Check localStorage - habitJournal should have entries
2. Verify updateMoodAnalytics() is being called
