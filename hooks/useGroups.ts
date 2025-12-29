import { useState, useEffect, useMemo, useCallback } from 'react'
import { useModalStore } from '@/store/useModalStore'
import { Group, Subject, Student } from '@/types'
import {
    fetchGroups as loadGroups,
    fetchStudentGroups as loadStudentGroups,
    fetchSubjects as loadSubjects,
    fetchStudents as loadStudents,
    createGroup as createNewGroup,
    createSubjectWithRandomColor,
} from '@/services/actions'

export function useGroups(onSuccess?: () => void, isStudent = false) {
    const [groups, setGroups] = useState<Group[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        subjectId: '',
        subjectName: '',
        studentIds: [] as string[],
    })

    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')

    const { isOpen, openModal, closeModal } = useModalStore()

    const fetchGroups = async () => {
        const data = isStudent ? await loadStudentGroups() : await loadGroups()
        setGroups(data)
    }

    const fetchSubjects = async () => {
        if (isStudent) return
        const data = await loadSubjects()
        setSubjects(data)
    }

    const fetchStudents = async () => {
        if (isStudent) return
        const data = await loadStudents()
        setStudents(data)
    }

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([fetchGroups(), fetchSubjects(), fetchStudents()])
            setIsLoading(false)
        }
        loadData()
    }, [])

    const handleOpenModal = () => {
        setFormData({
            name: '',
            subjectId: '',
            subjectName: '',
            studentIds: [],
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

    const handleStudentSelection = (studentId: string) => {
        setFormData(prev => {
            const isSelected = prev.studentIds.includes(studentId)
            return {
                ...prev,
                studentIds: isSelected
                    ? prev.studentIds.filter(id => id !== studentId)
                    : [...prev.studentIds, studentId]
            }
        })
    }

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

        const group = await createNewGroup(formData)

        if (group) {
            await fetchGroups()
            handleCloseModal()
            if (onSuccess) onSuccess()
        }

        setIsSubmitting(false)
    }

    const filteredGroups = useMemo(() => {
        if (selectedSubjectFilter === 'all') return groups
        return groups.filter((g) => g.subject.id === selectedSubjectFilter)
    }, [groups, selectedSubjectFilter])

    return {
        groups,
        subjects,
        students,
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
        handleStudentSelection,
        handleCreateSubject,
        handleSubmit,
        filteredGroups
    }
}
