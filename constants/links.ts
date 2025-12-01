import {
    DashboardIcon,
    StudentsIcon,
    LessonsIcon,
    CalendarIcon,
    SettingsIcon,
    SubjectsIcon,
    PaymentsIcon,
} from '@/components/icons/Icons'

export const navigation = [
    { name: 'Главная', href: '/dashboard', icon: DashboardIcon },
    { name: 'Ученики', href: '/students', icon: StudentsIcon },
    { name: 'Занятия', href: '/lessons', icon: LessonsIcon },
    { name: 'Календарь', href: '/calendar', icon: CalendarIcon },
    { name: 'Предметы', href: '/subjects', icon: SubjectsIcon },
    { name: 'Доходы', href: '/income', icon: PaymentsIcon },
    { name: 'Настройки', href: '/settings', icon: SettingsIcon },
]
