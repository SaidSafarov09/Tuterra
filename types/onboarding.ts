export interface OnboardingStep {
    id: string
    title: string
    description: string
    page: string
    target: string // data-onboarding selector value, e.g., "create-button"
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}
