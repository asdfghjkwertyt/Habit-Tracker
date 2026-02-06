# Quantitative Target Tracking Feature

## Overview

Added comprehensive quantitative target tracking system for habits, allowing users to set numeric goals and track partial progress toward completion.

## Features Implemented

### 1. **Target Definition**

- Add numeric targets when creating habits
- Edit targets in the edit habit modal
- Set target unit (e.g., "glasses", "hours", "miles", "calories")
- Optional feature - habits without targets use binary completion

### 2. **Progress Tracking UI**

- Progress bar showing visual completion percentage
- Progress label showing "current / target unit"
- Increment (+) and Decrement (−) buttons for quick updates
- Buttons styled to match the app theme
- Progress bar smooth animations

### 3. **Progress Update Handlers**

- `updateHabitProgress(habitId, delta)` function
  - Increments/decrements progress by delta
  - Respects target boundaries (min 0, max targetValue)
  - Auto-completes habit when progress reaches target
  - Unmarks completion if progress falls below target
  - Awards XP and updates streaks on completion
  - Integrates with calendar and dashboard

### 4. **Automatic Completion Logic**

- When `currentProgress >= targetValue`:
  - Marks habit as completed for the day
  - Updates streak
  - Awards XP (5 points)
  - Updates all UI views
- When `currentProgress < targetValue`:
  - If habit was marked complete, unmarks it
  - Updates streak accordingly

### 5. **Daily Reset**

- `resetDailyProgress()` function
- Automatically resets `currentProgress` to 0 at start of each day
- Uses `lastProgressResetDate` localStorage key to track reset timing
- Only resets once per day
- Preserves binary completion state

### 6. **Data Persistence**

- Habit object extended with 3 new properties:
  - `targetValue` (number | null): The numeric goal
  - `targetUnit` (string | null): Unit of measurement
  - `currentProgress` (number): Current progress (starts at 0)
- All properties saved to localStorage with habit data
- Backward compatible - habits without targets work as before

### 7. **Form Integration**

- Add Habit Form: Target Value and Unit input fields
- Edit Modal: Pre-populated target fields from existing habit data
- Proper error handling for invalid numeric inputs

### 8. **Streak Integration**

- Streaks now consider progress-based completion
- When target is met, streak updates same as binary completion
- Streak breaks if progress falls below target and habit was marked complete

## Form Fields Added

### Add Habit Form

```
Target Value: <input type="number"> (optional)
Target Unit: <input type="text"> (optional, e.g., "glasses", "km")
```

### Edit Habit Modal

```
editTargetValue: <input type="number">
editTargetUnit: <input type="text">
```

## CSS Classes

```css
.habit-progress-section       /* Container for all progress UI */
.progress-header              /* Flex container for label + controls */
.progress-label               /* Shows "X / Y unit" */
.progress-controls            /* Container for +/- buttons */
.progress-btn                 /* Style for increment/decrement buttons */
.progress-decrease            /* Minus button */
.progress-increase            /* Plus button */
.progress-bar-container       /* Background track for progress bar */
.progress-bar                 /* Animated fill showing completion percentage */
```

## Event Listeners

- `.progress-increase` buttons call `updateHabitProgress(habitId, +1)`
- `.progress-decrease` buttons call `updateHabitProgress(habitId, -1)`
- Listeners attached during `renderHabits()` execution

## Examples

### Example 1: Water Tracking

```javascript
{
  id: 1,
  name: "Drink Water",
  targetValue: 8,
  targetUnit: "glasses",
  currentProgress: 3,
  completed: false,
  // ... other properties
}
// Progress shown as: "3 / 8 glasses" with 37.5% filled progress bar
```

### Example 2: Exercise Minutes

```javascript
{
  id: 2,
  name: "Exercise",
  targetValue: 60,
  targetUnit: "minutes",
  currentProgress: 45,
  completed: false,
  // ... other properties
}
// Progress shown as: "45 / 60 minutes" with 75% filled progress bar
// When progress reaches 60, habit auto-completes
```

### Example 3: Binary Habit (no target)

```javascript
{
  id: 3,
  name: "Read",
  targetValue: null,
  targetUnit: null,
  currentProgress: 0,
  completed: false,
  // ... other properties
}
// Shows traditional checkbox, no progress bar
```

## Technical Details

### Progress Calculation

```javascript
percentComplete = Math.min(100, (currentProgress / targetValue) * 100);
```

### Daily Reset Timing

- Runs on app initialization (`init()` function)
- Checks if `lastProgressResetDate` matches today's date
- Resets all habits with targetValue
- Updates `lastProgressResetDate` to today

### Completion State Management

- Progress reaching target = habit marked complete
- Binary completion unaffected (checkbox still works independently)
- Multiple ways to complete a quantitative habit:
  1. Reach target through progress updates (auto-complete)
  2. Check the checkbox directly (if allowed by frequency rules)

## Backward Compatibility

- Existing habits created before this feature have `targetValue: null`
- No changes to binary completion workflow
- Progress bar only shows for habits with `targetValue` defined
- All existing features (categories, goals, streaks, XP) continue to work unchanged

## Files Modified

- `d:\habit tracker\habit.html`
  - Form fields added (lines ~1600+)
  - Progress bar HTML in renderHabits (lines ~2200+)
  - CSS for progress styles (lines ~590+)
  - openEditModal() updated to populate targets (lines ~2450+)
  - handleEditHabitSubmit() updated to save targets (lines ~2530+)
  - updateHabitProgress() function (lines ~2404+)
  - resetDailyProgress() function (lines ~2057+)
  - init() updated to call resetDailyProgress() (line 1871)
