import {
    DashboardIcon,
    StudentsIcon,
    LessonsIcon,
    CalendarIcon,
    SettingsIcon,
    SubjectsIcon,
    PaymentsIcon,
    UsersGroupIcon,
} from '@/components/icons/Icons'

export const navigation = [
    { name: 'Главная', href: '/dashboard', icon: DashboardIcon },
    { name: 'Занятия', href: '/lessons', icon: LessonsIcon },
    { name: 'Ученики', href: '/students', icon: StudentsIcon },
    { name: 'Группы', href: '/groups', icon: UsersGroupIcon },
    { name: 'Календарь', href: '/calendar', icon: CalendarIcon },
    { name: 'Предметы', href: '/subjects', icon: SubjectsIcon },
    { name: 'Доходы', href: '/income', icon: PaymentsIcon },
    { name: 'Настройки', href: '/settings', icon: SettingsIcon },
]
