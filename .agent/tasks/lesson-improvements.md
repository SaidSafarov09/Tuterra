# Lesson and Subject Improvements

## Tasks

### 1. Prevent Creating Lessons in the Past ✓
- Add validation in all lesson creation forms
- Show toast error if user tries to create lesson in the past
- Locations:
  - `/lessons` page
  - `/students/[id]` page
  - `/subjects` page

### 2. Edit Subject Cards (Change Color)
- Add edit button to subject cards
- Create edit modal with color picker
- Update API to support PATCH/PUT

### 3. Improved Color Picker
- Add RGB color picker component
- Show 6 random beautiful colors as quick options
- Allow custom RGB input

### 4. Delete Subjects from Student Card
- Add delete button for each subject in student detail page
- Confirm before deletion
- Update API to support unlinking

### 5. Creatable Dropdowns in /lessons
- Student dropdown: allow creating new student inline
- Subject dropdown: allow creating new subject inline
- Auto-link subject to student when both are created/selected

## Implementation Order
1. Past lesson validation (quick win)
2. Delete subjects from student
3. Creatable dropdowns in /lessons
4. Edit subject cards
5. RGB color picker
