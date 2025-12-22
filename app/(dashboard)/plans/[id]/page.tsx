"use client"

import { PlanEditor } from '@/components/plans/PlanEditor'
import { use } from 'react'

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <PlanEditor planId={id} />
}
