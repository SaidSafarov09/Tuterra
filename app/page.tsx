'use client'

import React from 'react'
import { Header } from '@/components/landing/Header'
import { Hero } from '@/components/landing/Hero'
import { ProductDemo } from '@/components/landing/ProductDemo'
import { FeatureSection } from '@/components/landing/FeatureSection'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { Comparison } from '@/components/landing/Comparison'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
    return (
        <div id="landing-root" style={{ minHeight: '100vh', backgroundColor: '#F8FAFF', color: '#1A1A1A' }}>
            <main>
                <Header />
                <Hero />
                <ProductDemo />
                <FeatureSection />
                <ProblemSolution />
                <Comparison />
                <Testimonials />
                <Pricing />
                <CTASection />
                <Footer />
            </main>

            <style jsx global>{`
                #landing-root {
                    --background: #F8FAFF !important;
                    --surface: #FFFFFF !important;
                    --text-primary: #1A1A1A !important;
                    --text-secondary: #4B5563 !important;
                    --text-muted: #9CA3AF !important;
                    --border: #E5E7EB !important;
                    --border-light: #F3F4F6 !important;
                    --primary: #4A6CF7 !important;
                }

                #landing-root * {
                    border-color: #E5E7EB !important;
                }

                /* Гарантированный ТЕМНЫЙ текст на светлых фонах */
                #landing-root h1, 
                #landing-root h2, 
                #landing-root h3, 
                #landing-root h4 {
                    color: #1A1A1A !important;
                }

                #landing-root p, 
                #landing-root li,
                #landing-root span:not(.subjectBadge) span:not(.trustBadges) {
                    color: #4B5563;
                }

                /* Гарантированный СВЕТЛЫЙ текст на ТЕМНЫХ или КРАСОЧНЫХ блоках */
                #landing-root [style*="background: var(--primary)"] h2,
                #landing-root [style*="background: var(--primary)"] p,
                #landing-root .dark-block h1,
                #landing-root .dark-block h2,
                #landing-root .dark-block h3,
                #landing-root .dark-block p,
                #landing-root .dark-block span,
                #landing-root [style*="background: var(--text-primary)"] h2,
                #landing-root [style*="background: var(--text-primary)"] p,
                #landing-root [style*="background:var(--text-primary)"] h2,
                #landing-root [style*="background:var(--text-primary)"] p {
                    color: #FFFFFF !important;
                }

                html {
                    scroll-behavior: smooth;
                }
                
                body {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    overflow-x: hidden;
                }

                section {
                    position: relative;
                }

                .container-padding {
                    padding-left: max(5%, 20px);
                    padding-right: max(5%, 20px);
                }
            `}</style>
        </div>
    )
}
