# Tiptap Editor Test Checklist

## Test URL
http://localhost:3002/contents/695fefb2438841aa5465cd5d/edit

## Test Scenarios

### 1. Page Load
- [ ] Page loads without errors
- [ ] Content from version 1 is displayed in the editor
- [ ] Header shows correct title: "Test Course - Tiptap Editor"
- [ ] Header shows subject: "Mathématiques - Test Editor"
- [ ] Header shows content type: "COURSE"
- [ ] Header shows version number: "Version 1"
- [ ] Status badge shows "Brouillon" (draft)
- [ ] AI model is displayed: "gemini"
- [ ] Metadata section shows tokens used, duration, model info, and creation date
- [ ] Back button is visible

### 2. Editor Functionality
- [ ] Can click inside the editor and cursor appears
- [ ] Can type new text
- [ ] Can delete existing text
- [ ] Can select text with mouse
- [ ] Editor has proper styling (prose classes applied)
- [ ] Min height is at least 500px

### 3. Toolbar Formatting
#### Text Formatting
- [ ] Bold button (B) works - makes text bold
- [ ] Italic button (I) works - makes text italic
- [ ] Bold button is highlighted when cursor is in bold text
- [ ] Italic button is highlighted when cursor is in italic text

#### Headings
- [ ] H1 button creates level 1 heading
- [ ] H2 button creates level 2 heading
- [ ] H3 button creates level 3 heading
- [ ] Heading buttons are highlighted when cursor is in corresponding heading
- [ ] Multiple clicks toggle heading on/off

#### Lists
- [ ] Bullet list button (•) creates unordered list
- [ ] Ordered list button (1.) creates numbered list
- [ ] List buttons are highlighted when cursor is in a list
- [ ] Multiple clicks toggle list on/off
- [ ] Enter key creates new list item
- [ ] Backspace on empty list item exits the list

#### Other Formatting
- [ ] Blockquote button (") creates blockquote
- [ ] Blockquote button is highlighted when cursor is in blockquote
- [ ] Link button (🔗) prompts for URL
- [ ] Link button creates clickable link with blue color and underline
- [ ] Link button is highlighted when cursor is in a link
- [ ] Empty URL removes link

### 4. Auto-Save Functionality
#### Save Status Indicator
- [ ] Auto-save indicator is in the top-right of toolbar
- [ ] When typing, indicator shows nothing initially (idle)
- [ ] After 2 seconds of no typing, indicator shows "💾 Sauvegarde..." (saving)
- [ ] When save completes, indicator shows "✓ Sauvegardé" (saved) in green
- [ ] If save fails, indicator shows "✗ Erreur de sauvegarde" (error) in red
- [ ] Saved indicator disappears after 2 seconds
- [ ] Error indicator disappears after 3 seconds

#### Save Persistence
- [ ] Make an edit and wait for "Sauvegardé" indicator
- [ ] Open browser dev tools > Network tab
- [ ] Verify PUT request to /api/contents/[id] was made
- [ ] Response status should be 200
- [ ] Refresh the page
- [ ] **Note:** Content changes won't persist (known limitation - see below)

### 5. Known Limitations (To Be Fixed)
⚠️ **Content persistence limitation**: The current implementation has a known issue where the `handleSave` function calls `PUT /api/contents/[id]` which only updates metadata (title, subject, etc.) but NOT the version content itself.

**What this means:**
- Auto-save indicator will work correctly
- API call will succeed (200 status)
- Local state will update (content appears saved in current session)
- BUT: Content changes will NOT persist to database
- Refreshing the page will show original content

**Fix required:**
Create a new endpoint: `PATCH /api/contents/[id]/versions/[versionNumber]/content` to update version content directly.

See comment in `app/(routes)/contents/[id]/edit/page.tsx:62-74` for details.

### 6. Navigation
- [ ] Back button works (navigates to previous page)
- [ ] Browser back button works

### 7. Responsive Design
- [ ] Toolbar buttons wrap properly on narrow screens
- [ ] Editor is readable on mobile viewport
- [ ] Sticky header stays at top when scrolling

## Browser Console Checks
- [ ] No console errors on page load
- [ ] No console errors when typing
- [ ] No console errors during auto-save
- [ ] Auto-save logs appear: "Auto-save failed: ..." (if any)

## Edge Cases
- [ ] Rapid typing doesn't cause multiple simultaneous saves (debounce works)
- [ ] Leaving page before save completes doesn't cause errors
- [ ] Very long content (10000+ chars) loads properly
- [ ] Empty content (delete all text) saves properly
- [ ] Special characters in content work (émojis, accents, quotes)

## Performance
- [ ] Typing feels responsive (no lag)
- [ ] Auto-save doesn't block typing
- [ ] Page loads in under 2 seconds
- [ ] Save completes in under 1 second

## Cleanup (After Testing)
```bash
# Delete test content
curl -X DELETE http://localhost:3002/api/contents/695fefb2438841aa5465cd5d

# Delete test subject
curl -X DELETE http://localhost:3002/api/subjects/695fef9b438841aa5465cd5a
```

## Test Result Summary
- Total checks: ~60
- Passed: ___
- Failed: ___
- Skipped (known limitations): 1

## Notes
_Add any observations, bugs, or issues found during testing here._
