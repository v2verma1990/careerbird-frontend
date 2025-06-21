# Backend Template Fix Required

## Problem
The backend HTML template is generating inline styles that override frontend CSS:
```html
<div class="sidebar" style="background-color: #315389;">
```

## Solution
Update the backend HTML template to remove ALL inline styles:

### ❌ Current Backend Template (Wrong):
```html
<div class="sidebar" style="background-color: #315389; color: #fff;">
  <!-- content -->
</div>
<h2 style="color: #315389;">Experience</h2>
<div class="section-label" style="color: #315389;">Skills</div>
```

### ✅ Fixed Backend Template (Correct):
```html
<div class="sidebar">
  <!-- content -->
</div>
<h2>Experience</h2>
<div class="section-label">Skills</div>
```

## Files to Update in Backend:
1. `/html/navy-column-modern.html` - Remove all `style="..."` attributes
2. Backend template service - Stop injecting color into HTML
3. Backend CSS generation - Can be completely removed

## Benefits:
- ✅ No more color conflicts
- ✅ Frontend CSS has full control
- ✅ Faster rendering (no CSS generation on backend)
- ✅ Better caching
- ✅ Cleaner separation of concerns

## Backend Changes Needed:
```csharp
// Remove color injection from HTML template
// OLD: template.Replace("{{COLOR}}", color)
// NEW: Just replace data, no color injection

// Remove CSS generation endpoints
// DELETE: /api/template/{id}/css
// KEEP: /api/template/{id}/html (but without color injection)
```

## Test After Backend Fix:
1. Preview should show correct color immediately
2. No red fallback colors
3. Color changes should work instantly
4. PDF should match preview exactly