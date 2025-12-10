import { toast } from 'sonner'
import { groupsApi } from '@/services/api'
import { Group } from '@/types'

export async function fetchGroups(): Promise<Group[]> {
    try {
        return await groupsApi.getAll()
    } catch (error) {
        toast.error('Не удалось загрузить список групп')
        return []
    }
}

export async function createGroup(data: {
    name: string
    subjectId: string
    studentIds?: string[]
}): Promise<Group | null> {
    if (!data.name.trim()) {
        toast.error('Введите название группы')
        return null
    }
    if (!data.subjectId) {
        toast.error('Выберите предмет')
        return null
    }

    try {
        const group = await groupsApi.create(data)
        toast.success('Группа создана')
        return group
    } catch (error: any) {
        const errorMessage = error.message || 'Ошибка при создании группы'
        toast.error(errorMessage)
        return null
    }
}

export async function updateGroup(
    id: string,
    data: {
        name?: string
        subjectId?: string
        studentIds?: string[]
    }
): Promise<Group | null> {
    try {
        const group = await groupsApi.update(id, data)
        toast.success('Группа обновлена')
        return group
    } catch (error: any) {
        console.error('Update group error:', error)
        const errorMessage = error.message || 'Ошибка при обновлении группы'
        toast.error(errorMessage)
        return null
    }
}

export async function deleteGroup(id: string): Promise<boolean> {
    try {
        await groupsApi.delete(id)
        toast.success('Группа удалена')
        return true
    } catch (error) {
        toast.error('Ошибка при удалении группы')
        return false
    }
}
