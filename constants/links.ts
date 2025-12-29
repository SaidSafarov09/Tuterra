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

export const teacherNavigation = [
    { name: 'Главная', href: '/dashboard', icon: DashboardIcon },
    { name: 'Занятия', href: '/lessons', icon: LessonsIcon },
    { name: 'Ученики', href: '/students', icon: StudentsIcon },
    { name: 'Группы', href: '/groups', icon: UsersGroupIcon },
    { name: 'Календарь', href: '/calendar', icon: CalendarIcon },
    { name: 'Предметы', href: '/subjects', icon: SubjectsIcon },
    { name: 'Доходы', href: '/income', icon: PaymentsIcon },
    { name: 'Настройки', href: '/settings', icon: SettingsIcon },
]

export const studentNavigation = [
    { name: 'Главная', href: '/student/dashboard', icon: DashboardIcon },
    { name: 'Занятия', href: '/student/lessons', icon: LessonsIcon },
    { name: 'Календарь', href: '/calendar', icon: CalendarIcon },
    { name: 'Мои репетиторы', href: '/student/teachers', icon: StudentsIcon },
    { name: 'Мои предметы', href: '/student/subjects', icon: SubjectsIcon },
    { name: 'Мои группы', href: '/student/groups', icon: UsersGroupIcon, conditional: true },
    { name: 'Настройки', href: '/settings', icon: SettingsIcon },
]

export const navigation = teacherNavigation
