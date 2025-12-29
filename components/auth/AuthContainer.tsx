import React, { useState } from 'react'
import { PhoneStep } from './PhoneStep'
import { CodeStep } from './CodeStep'
import styles from './Auth.module.scss'

export function AuthContainer() {
    const [step, setStep] = useState<'identifier' | 'code'>('identifier')
    const [sessionId, setSessionId] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'teacher' | 'student'>('teacher')
    const [referralCode, setReferralCode] = useState<string | null>(null)

    const handleSuccess = (newSessionId: string, newEmail: string, newRole: 'teacher' | 'student', newRef?: string | null) => {
        setSessionId(newSessionId)
        setEmail(newEmail)
        setRole(newRole)
        setReferralCode(newRef || null)
        setStep('code')
    }

    const handleBack = () => {
        setStep('identifier')
        setSessionId('')
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {step === 'identifier' ? (
                    <PhoneStep onSuccess={handleSuccess} />
                ) : (
                    <CodeStep
                        sessionId={sessionId}
                        email={email}
                        role={role}
                        referralCode={referralCode}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    )
}
