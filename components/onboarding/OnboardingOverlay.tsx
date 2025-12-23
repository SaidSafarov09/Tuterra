'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import { useOnboardingStore } from '@/hooks/useOnboardingStore'
import { useAuthStore } from '@/store/auth'
import { ONBOARDING_STEPS } from '@/config/onboarding'
import { Button } from '@/components/ui/Button'
import styles from './Onboarding.module.scss'

export function OnboardingOverlay() {
    const { isActive, currentStepIndex, next, skip, isCompleted } = useOnboardingStore()
    const { user, setUser } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    // Локальное состояние для координат подсветки
    const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
    const [isElementFound, setIsElementFound] = useState(false)

    // Элемент тултипа для расчетов его размеров
    const tooltipRef = useRef<HTMLDivElement>(null)

    // Текущий шаг
    const step = ONBOARDING_STEPS[currentStepIndex]
    const isFirstStep = currentStepIndex === 0
    const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1

    // 1. Управление навигацией и поиском элемента
    useEffect(() => {
        if (!isActive || !step) return

        setIsElementFound(false)
        setRect(null)

        // Если текущая страница не соответствует шагу, переходим
        if (pathname !== step.page) {
            router.push(step.page)
            return // Ждем смены URL
        }

        // Если страница верна, ищем цель
        const findTarget = () => {
            if (step.target === 'none') {
                setIsElementFound(true)
                setRect(null) // Центрируем или просто показываем модалку
                return
            }

            const el = document.querySelector(`[data-onboarding="${step.target}"]`)
            if (el) {
                const r = el.getBoundingClientRect()
                // Обновляем только если координаты изменились значительно (защита от тряски)
                setRect((prev) => {
                    const isEqual = prev &&
                        Math.abs(prev.top - r.top) < 2 &&
                        Math.abs(prev.left - r.left) < 2 &&
                        Math.abs(prev.width - r.width) < 2 &&
                        Math.abs(prev.height - r.height) < 2

                    if (isEqual) return prev

                    return {
                        top: r.top,
                        left: r.left,
                        width: r.width,
                        height: r.height
                    }
                })
                setIsElementFound(true)
            } else {
                // Если элемент не найден сразу (асинхронная загрузка), пробуем еще раз
                // Это "полезный" поллинг, так как MutationObserver сложнее
            }
        }

        // Запускаем частый поиск (для плавной реакции на загрузку/ресайз)
        // Но с оптимизацией внутри setState
        const interval = setInterval(findTarget, 200)
        findTarget() // Сразу пробуем

        return () => clearInterval(interval)

    }, [isActive, step, pathname, router])


    // 2. Расчет позиции тултипа (зависит от rect и размеров самого тултипа)
    useEffect(() => {
        if (!step || !tooltipRef.current) return

        // Если это последний шаг без цели, центрируем
        if (step.target === 'none' || !rect) {
            const viewportH = window.innerHeight
            const viewportW = window.innerWidth
            setTooltipPos({
                top: viewportH / 2 - 150, // Примерно половина высоты тултипа
                left: viewportW / 2 - 170
            })
            return
        }

        // Логика позиционирования "умного" тултипа
        const tooltipW = 340
        const tooltipH = tooltipRef.current.offsetHeight || 200
        const gap = 20

        let top = 0
        let left = 0

        // Простая логика: если внизу есть место - ставим вниз, иначе вверх
        // Можно усложнить в зависимости от step.position

        let position = step.position

        // На мобилках для первого шага (дашборд) форсируем позицию сверху,
        // чтобы не перекрывать контент карточек
        if (typeof window !== 'undefined' && window.innerWidth <= 768 && currentStepIndex === 0) {
            position = 'top'
        }

        switch (position) {
            case 'bottom':
                top = rect.top + rect.height + gap
                left = rect.left + (rect.width / 2) - (tooltipW / 2)
                break
            case 'top':
                top = rect.top - tooltipH - gap
                left = rect.left + (rect.width / 2) - (tooltipW / 2)
                break
            case 'center':
            default:
                top = window.innerHeight / 2 - (tooltipH / 2)
                left = window.innerWidth / 2 - (tooltipW / 2)
        }

        // Clamp to viewport
        const padding = 16
        if (left < padding) left = padding
        if (left + tooltipW > window.innerWidth - padding) left = window.innerWidth - tooltipW - padding
        if (top < padding) top = padding
        if (top + tooltipH > window.innerHeight - padding) top = window.innerHeight - tooltipH - padding

        setTooltipPos({ top, left })

    }, [rect, step, isElementFound]) // Пересчитываем только когда нашли элемент


    if (!isActive || isCompleted) return null

    // Рендерим в портал, чтобы быть поверх всего
    if (typeof document === 'undefined') return null

    return createPortal(
        <div className={`${styles.overlayContainer} ${isElementFound ? styles.visible : ''}`}>

            {/* Пятно прожектора (если есть цель) */}
            {rect && (
                <div
                    className={styles.spotlight}
                    style={{
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    }}
                />
            )}

            {/* Если цели нет, но мы активны - показать просто фон (для финального шага) */}
            {!rect && <div className={styles.fullBackdrop} />}

            {/* Тултип */}
            <div
                className={styles.tooltip}
                ref={tooltipRef}
                style={{
                    top: tooltipPos?.top ?? '50%',
                    left: tooltipPos?.left ?? '50%',
                    opacity: tooltipPos ? 1 : 0 // Скрываем пока не посчитали позицию
                }}
            >
                <h3>{step?.title}</h3>
                <p>{step?.description}</p>

                <div className={styles.footer}>
                    <span className={styles.stepIndicator}>
                        Шаг {currentStepIndex + 1} из {ONBOARDING_STEPS.length}
                    </span>
                    <div className={styles.buttons}>
                        {/* Кнопка Skip (кроме последнего шага) */}
                        {!isLastStep && (
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                    if (user) {
                                        setUser({ ...user, onboardingCompleted: true })
                                    }
                                    skip()
                                }}
                            >
                                Пропустить
                            </Button>
                        )}

                        <Button
                            size="small"
                            onClick={() => {
                                if (isLastStep && user) {
                                    setUser({ ...user, onboardingCompleted: true })
                                }
                                next()
                            }}
                        >
                            {isLastStep ? 'Завершить' : 'Далее'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
