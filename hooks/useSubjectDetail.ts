import { useState } from 'react'
import { toast } from 'sonner'
import { Subject, Student } from '@/types'
import { subjectsApi } from '@/services/api'
import {
    createStudent,
    createLesson,
    linkStudentToSubject,
} from '@/services/actions'
import { STUDENT_MESSAGES, createStudentLinkedMessage } from '@/constants/messages'
import { ContactType } from '@/lib/contactUtils'

import { Group } from '@/types'

export function useSubjectDetail(subject: Subject | null, onUpdate?: () => void) {
    const [students, setStudents] = useState<Student[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoadingStudents, setIsLoadingStudents] = useState(false) // Rename to isLoadingDetails? Keep for compatibility

    const fetchStudents = async (subjectId: string) => {
        setIsLoadingStudents(true)
        try {
            const data = await subjectsApi.getById(subjectId)
            setStudents(data.students || [])
            setGroups(data.groups || [])
        } catch (error) {
            toast.error(STUDENT_MESSAGES.FETCH_ERROR)
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const linkStudent = async (subjectId: string, studentId: string) => {
        const success = await linkStudentToSubject(subjectId, studentId)

        if (success) {
            await fetchStudents(subjectId)
            onUpdate?.()
        }

        return { success }
    }



    const createAndLinkStudent = async (
        subjectId: string,
        studentData: {
            name: string;
            contact?: string;
            contactType?: ContactType;
            parentContact?: string;
            parentContactType?: ContactType;
            note?: string
        }
    ) => {
        const newStudent = await createStudent({
            ...studentData,
            subjectId,
        })

        if (newStudent) {
            await fetchStudents(subjectId)
            onUpdate?.()
            toast.success(createStudentLinkedMessage(newStudent.name))
            return { success: true }
        }

        return { success: false }
    }

    const createLessonForSubject = async (
        subjectId: string,
        lessonData: {
            studentId: string
            date: Date
            price: string
            isPaid: boolean
        }
    ) => {
        const lesson = await createLesson({
            studentId: lessonData.studentId,
            subjectId,
            date: lessonData.date,
            price: lessonData.price,
            isPaid: lessonData.isPaid,
        })

        if (lesson) {
            await fetchStudents(subjectId)
            onUpdate?.()
            return { success: true }
        }

        return { success: false }
    }

    return {
        students,
        groups,
        isLoadingStudents,
        fetchStudents,
        linkStudent,
        createAndLinkStudent,
        createLesson: createLessonForSubject,
    }
}
