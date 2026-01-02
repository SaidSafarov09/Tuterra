export const FREE_LIMITS = {
    students: 3,
    connectedStudents: 1,
    groups: 1,
    subjects: 1,
    studentPlans: 1,
    groupPlans: 0,
    income: 0
};

export type LimitType = keyof typeof FREE_LIMITS | 'income';

export const LIMIT_MESSAGES: Record<LimitType, { title: string; description: string }> = {
    students: {
        title: 'Лимит учеников превышен',
        description: 'В бесплатной версии можно добавить только 3 ученика. Обновитесь до Pro, чтобы снять ограничения.'
    },
    connectedStudents: {
        title: 'Лимит подключений превышен',
        description: 'В бесплатной версии можно подключить к платформе только 1 ученика. Обновитесь до Pro для безлимитных подключений.'
    },
    groups: {
        title: 'Лимит групп превышен',
        description: 'В бесплатной версии доступна только 1 группа. Создавайте больше групп с тарифом Pro.'
    },
    subjects: {
        title: 'Лимит предметов превышен',
        description: 'В бесплатной версии можно добавить только 1 предмет. Обновитесь до Pro для создания неограниченного количества предметов.'
    },
    studentPlans: {
        title: 'Лимит планов обучения',
        description: 'В бесплатной версии можно создать 1 план обучения только для 1 ученика.'
    },
    groupPlans: {
        title: 'Планы для групп недоступны',
        description: 'Планы обучения для групп доступны только в Pro версии.'
    },
    income: {
        title: 'Аналитика доходов в Pro',
        description: 'Детальная статистика, графики роста и средний чек доступны только в Pro версии.'
    }
};
