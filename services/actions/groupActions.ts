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

export async function fetchStudentGroups(): Promise<Group[]> {
    try {
        const response = await fetch('/api/student/groups')
        const data = await response.json()
        return data.success ? data.groups : []
    } catch (error) {
        toast.error('Не удалось загрузить ваши группы')
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

export async function linkStudentToGroup(groupId: string, studentId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/groups/${groupId}/students/link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An error occurred' }))
            throw new Error(error.message || error.error || 'Failed to link student to group')
        }

        toast.success('Ученик добавлен в группу')
        return true
    } catch (error: any) {
        console.error('Link student to group error:', error)
        toast.error(error.message || 'Ошибка при добавлении ученика в группу')
        return false
    }
}

export async function unlinkStudentFromGroup(groupId: string, studentId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/groups/${groupId}/students/link`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An error occurred' }))
            throw new Error(error.message || error.error || 'Failed to unlink student from group')
        }

        toast.success('Ученик удален из группы')
        return true
    } catch (error: any) {
        console.error('Unlink student from group error:', error)
        toast.error(error.message || 'Ошибка при удалении ученика из группы')
        return false
    }
}
