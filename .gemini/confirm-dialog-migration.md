# Инструкция по замене confirm() на ConfirmDialog

## Оставшиеся файлы для обновления:

### 1. `/app/(dashboard)/students/[id]/page.tsx`
- **Строка 107**: Удаление студента
- **Строка 128**: Удаление предмета у студента

### 2. `/app/(dashboard)/lessons/[id]/page.tsx`  
- **Строка 81**: Удаление занятия

## Шаги для каждого файла:

### 1. Добавить состояние (уже добавлен импорт):
```tsx
const [deleteStudentConfirm, setDeleteStudentConfirm] = useState(false)
const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)
```

### 2. Заменить confirm() на setState:
```tsx
// Было:
if (!confirm('Текст')) return

// Стало:
setDeleteStudentConfirm(true)
```

### 3. Создать функцию подтверждения:
```tsx
const confirmDeleteStudent = async () => {
    // Код удаления
    setDeleteStudentConfirm(false)
}
```

### 4. Добавить компонент перед закрывающим </div>:
```tsx
<ConfirmDialog
    isOpen={deleteStudentConfirm}
    onClose={() => setDeleteStudentConfirm(false)}
    onConfirm={confirmDeleteStudent}
    title="Удалить студента?"
    message="Вы уверены? Все занятия также будут удалены."
    confirmText="Удалить"
    cancelText="Отмена"
    variant="danger"
/>
```

## Статус:
- ✅ `/subjects/page.tsx` - готово
- ✅ `/lessons/page.tsx` - готово  
- ⏳ `/students/[id]/page.tsx` - импорт добавлен, нужно добавить логику
- ⏳ `/lessons/[id]/page.tsx` - нужно добавить импорт и логику
