import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const MONTHS_GENITIVE: Record<string, string> = {
    январь: "январе",
    февраль: "феврале",
    март: "марте",
    апрель: "апреле",
    май: "мае",
    июнь: "июне",
    июль: "июле",
    август: "августе",
    сентябрь: "сентябре",
    октябрь: "октябре",
    ноябрь: "ноябре",
    декабрь: "декабре",
}

export const LESSON_MESSAGES = {
    CREATED: 'Занятие успешно создано',
    UPDATED: 'Занятие обновлено',
    DELETED: 'Занятие удалено',
    CANCELED: 'Занятие отменено',
    RESTORED: 'Занятие восстановлено',
    PAID: 'Занятие отмечено как оплаченное',
    UNPAID: 'Оплата отменена',
    MARKED_PAID: 'Отмечено как оплаченное',
    MARKED_UNPAID: 'Отмечено как неоплаченное',
    CREATE_ERROR: 'Не удалось создать занятие',
    UPDATE_ERROR: 'Не удалось обновить занятие',
    DELETE_ERROR: 'Не удалось удалить занятие',
    FETCH_ERROR: 'Не удалось загрузить занятия',
    PAYMENT_STATUS_ERROR: 'Не удалось обновить статус оплаты',
    CANCEL_STATUS_ERROR: 'Не удалось обновить статус',
} as const

export const STUDENT_MESSAGES = {
    CREATED: 'Ученик успешно создан',
    UPDATED: 'Данные ученика обновлены',
    DELETED: 'Ученик удалён',
    NOT_FOUND: 'Ученик не найден',
    CREATE_ERROR: 'Не удалось создать ученика',
    UPDATE_ERROR: 'Не удалось обновить данные',
    DELETE_ERROR: 'Не удалось удалить ученика',
    FETCH_ERROR: 'Не удалось загрузить учеников',
    LINKED_TO_SUBJECT: 'Ученик успешно добавлен к предмету',
    UNLINKED_FROM_SUBJECT: 'Ученик отвязан от предмета',
} as const

export const SUBJECT_MESSAGES = {
    CREATED: 'Предмет успешно добавлен',
    UPDATED: 'Предмет обновлён',
    DELETED: 'Предмет успешно удалён',
    DELETED_WITH_LESSONS: (count: number) =>
        `Предмет успешно удалён. Также удалено занятий: ${count}`,
    CREATE_ERROR: 'Не удалось создать предмет',
    UPDATE_ERROR: 'Не удалось обновить предмет',
    DELETE_ERROR: 'Не удалось удалить предмет',
    FETCH_ERROR: 'Не удалось загрузить предметы',
    LINK_ERROR: 'Не удалось добавить предмет',
} as const

export const GENERAL_MESSAGES = {
    GENERIC_ERROR: 'Произошла ошибка',
    NETWORK_ERROR: 'Ошибка сети',
    LOADING: 'Загрузка...',
    SAVED: 'Настройки сохранены',
    VALIDATION_ERROR: 'Заполните все обязательные поля',
    FETCH_ERROR: 'Не удалось загрузить данные',
} as const

export const VALIDATION_MESSAGES = {
    REQUIRED_FIELD: 'Это поле обязательно для заполнения',
    INVALID_EMAIL: 'Неверный формат email',
    INVALID_PHONE: 'Неверный формат телефона',
    MIN_LENGTH: (min: number) => `Минимум ${min} символов`,
    MAX_LENGTH: (max: number) => `Максимум ${max} символов`,
    ENTER_STUDENT_NAME: 'Введите имя ученика',
    ENTER_SUBJECT_NAME: 'Введите название предмета',
    ENTER_PRICE: 'Укажите цену',
    SELECT_STUDENT: 'Выберите ученика',
    SELECT_SUBJECT: 'Выберите предмет',
    PAST_DATE: 'Нельзя создавать занятия в прошедшем времени',
    PAST_DATE_ERROR: 'Нельзя создавать занятия в прошедшем времени',
} as const

export const createStudentCreatedMessage = (name: string) => `Ученик "${name}" создан`
export const createSubjectCreatedMessage = (name: string) => `Предмет "${name}" создан`
export const createStudentLinkedMessage = (studentName: string) =>
    `Ученик "${studentName}" добавлен к предмету`

function formatMonthGenitive(date: Date) {
    const month = format(date, 'LLLL', { locale: ru }).toLowerCase()
    const year = format(date, 'yyyy')
    return `${MONTHS_GENITIVE[month] ?? month} ${year}`
}

export const INCOME_MESSAGES = {
    EMPTY_STATE: {
        NO_DATA_TITLE: 'Нет данных о доходах',
        NO_DATA_DESCRIPTION:
            'Здесь будет отображаться статистика ваших доходов с занятий.\nНачните проводить занятия и отмечайте их как оплаченные.',
        NO_INCOME_THIS_MONTH_TITLE: 'В этом месяце доходов нет',
        NO_INCOME_THIS_MONTH_DESCRIPTION: (date: Date) =>
            `В ${formatMonthGenitive(date)} пока нет оплаченных занятий.`,
    },
} as const
