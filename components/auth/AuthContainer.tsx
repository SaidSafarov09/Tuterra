import React, { useState } from 'react'
import { PhoneStep } from './PhoneStep'
import { CodeStep } from './CodeStep'
import styles from './Auth.module.scss'

export function AuthContainer() {
    const [step, setStep] = useState<'identifier' | 'code'>('identifier')
    const [sessionId, setSessionId] = useState('')
    const [email, setEmail] = useState('')

    const handleSuccess = (newSessionId: string, newEmail: string) => {
        setSessionId(newSessionId)
        setEmail(newEmail)
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
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    )
}
