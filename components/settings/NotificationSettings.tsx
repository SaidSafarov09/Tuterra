'use client'

import React from 'react'
import { Switch } from '@/components/ui/Switch'
import { TimeInput } from '@/components/ui/TimeInput'
import styles from './NotificationSettings.module.scss'
import { NotificationSettingsDTO } from '@/services/api'

interface NotificationSettingsProps {
    settings: NotificationSettingsDTO
    onChange: (settings: Partial<NotificationSettingsDTO>) => void
    isStudentView?: boolean
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onChange, isStudentView = false }) => {
    return (
        <div className={styles.container}>
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Типы уведомлений</h3>
                <div className={styles.grid}>
                    <Switch
                        label="Напоминания о занятиях"
                        checked={settings.lessonReminders}
                        onChange={(val) => onChange({ lessonReminders: val })}
                    />
                    <Switch
                        label="Неоплаченные занятия"
                        checked={settings.unpaidLessons}
                        onChange={(val) => onChange({ unpaidLessons: val })}
                    />
                    <Switch
                        label={<>Изменение статуса <br />(отмена/перенос)</>}
                        checked={settings.statusChanges}
                        onChange={(val) => onChange({ statusChanges: val })}
                    />
                    {!isStudentView && (
                        <>
                            <Switch
                                label="Отчеты о доходе (день/месяц)"
                                checked={settings.incomeReports}
                                onChange={(val) => onChange({ incomeReports: val })}
                            />
                            <Switch
                                label="Долги учеников"
                                checked={settings.studentDebts}
                                onChange={(val) => onChange({ studentDebts: val })}
                            />
                            <Switch
                                label="Отсутствие занятий у ученика"
                                checked={settings.missingLessons}
                                onChange={(val) => onChange({ missingLessons: val })}
                            />
                        </>
                    )}
                    <Switch
                        label="Подсказки по профилю"
                        checked={settings.onboardingTips}
                        onChange={(val) => onChange({ onboardingTips: val })}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Способы получения</h3>
                <div className={styles.grid}>
                    <Switch
                        label="На сайте (Push-уведомления)"
                        checked={settings.deliveryWeb}
                        onChange={(val) => onChange({ deliveryWeb: val })}
                    />
                    <Switch
                        label="В Telegram"
                        checked={settings.deliveryTelegram}
                        onChange={(val) => onChange({ deliveryTelegram: val })}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Время тишины</h3>
                <div className={styles.quietHours}>
                    <Switch
                        label="Включить время тишины"
                        checked={settings.quietHoursEnabled}
                        onChange={(val) => onChange({ quietHoursEnabled: val })}
                    />

                    {settings.quietHoursEnabled && (
                        <div className={styles.timeRange}>
                            <TimeInput
                                label="С"
                                value={settings.quietHoursStart}
                                onChange={(value) => onChange({ quietHoursStart: value })}
                            />
                            <TimeInput
                                label="До"
                                value={settings.quietHoursEnd}
                                onChange={(value) => onChange({ quietHoursEnd: value })}
                            />
                        </div>
                    )}
                    <p className={styles.hint}>В это время мы не будем беспокоить вас уведомлениями.</p>
                </div>
            </section>
        </div>
    )
}
