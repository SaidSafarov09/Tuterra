import React, { useState } from 'react'
import { PhoneStep } from './PhoneStep'
import { CodeStep } from './CodeStep'
import styles from './Auth.module.scss'

export function AuthContainer() {
    const [step, setStep] = useState<'phone' | 'code'>('phone')
    const [sessionId, setSessionId] = useState('')
    const [phone, setPhone] = useState('')

    const handlePhoneSuccess = (newSessionId: string, newPhone: string) => {
        setSessionId(newSessionId)
        setPhone(newPhone)
        setStep('code')
    }

    const handleBack = () => {
        setStep('phone')
        setSessionId('')
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {step === 'phone' ? (
                    <PhoneStep onSuccess={handlePhoneSuccess} />
                ) : (
                    <CodeStep
                        sessionId={sessionId}
                        phone={phone}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    )
}
