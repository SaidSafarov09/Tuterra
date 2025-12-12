import { useState, useEffect, useMemo, useCallback } from 'react'
import { useModalStore } from '@/store/useModalStore'
import { Student, Subject, Group } from '@/types'
import {
    fetchStudents as loadStudents,
    fetchSubjects as loadSubjects,
    fetchGroups as loadGroups,
    createStudent as createNewStudent,
    createSubjectWithRandomColor,
} from '@/services/actions'
import { ContactType } from '@/lib/contactUtils'

export function useStudents(onSuccess?: () => void) {
    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        contactType: 'phone' as ContactType,
        parentContact: '',
        parentContactType: 'phone' as ContactType,
        note: '',
        subjectId: '',
        subjectName: '',
        groupId: '',
    })

    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')

    const { isOpen, openModal, closeModal } = useModalStore()

    const fetchStudents = async () => {
        const data = await loadStudents()
        setStudents(data)
    }

    const fetchSubjects = async () => {
        const data = await loadSubjects()
        setSubjects(data)
    }

    const fetchGroups = async () => {
        const data = await loadGroups()
        setGroups(data)
    }

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([fetchStudents(), fetchSubjects(), fetchGroups()])
            setIsLoading(false)
        }
        loadData()
    }, [])

    const handleOpenModal = () => {
        setFormData({
            name: '',
            contact: '',
            contactType: 'phone',
            parentContact: '',
            parentContactType: 'phone',
            note: '',
            subjectId: '',
            subjectName: '',
            groupId: '',
        })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
        closeModal()
        setError('')
    }

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target
            setFormData((prev) => ({ ...prev, [name]: value }))
        },
        []
    )

    const handleCreateSubject = async (name: string) => {
        const newSubject = await createSubjectWithRandomColor(name)

        if (newSubject) {
            await fetchSubjects()
            setFormData(prev => ({
                ...prev,
                subjectId: newSubject.id,
                subjectName: newSubject.name
            }))
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError('')

        const student = await createNewStudent(formData)

        if (student) {
            await fetchStudents()
            await fetchSubjects()
            handleCloseModal()
            if (onSuccess) onSuccess()
        }

        setIsSubmitting(false)
    }

    const filteredStudents = useMemo(() => {
        if (selectedSubjectFilter === 'all') return students
        return students.filter((s) => s.subjects.some(subj => subj.id === selectedSubjectFilter))
    }, [students, selectedSubjectFilter])

    return {
        students,
        subjects,
        groups,
        isLoading,
        isSubmitting,
        error,
        formData,
        setFormData,
        selectedSubjectFilter,
        setSelectedSubjectFilter,
        isOpen,
        handleOpenModal,
        handleCloseModal,
        handleChange,
        handleCreateSubject,
        handleSubmit,
        filteredStudents
    }
}
