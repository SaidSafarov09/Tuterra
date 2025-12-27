'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
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

const ScrollSection = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    })

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1])
    const y = useTransform(scrollYProgress, [0, 0.2], [40, 0])

    return (
        <motion.div
            ref={ref}
            style={{ opacity, scale, y }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export default function HomePage() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    return (
        <div id="landing-root">
            <motion.div
                className="progress-bar"
                style={{
                    scaleX,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'var(--primary)',
                    transformOrigin: '0%',
                    zIndex: 2000
                }}
            />

            <Header />

            <main>
                <Hero />

                <ScrollSection>
                    <FeatureSection />
                </ScrollSection>

                <ScrollSection>
                    <ProductDemo />
                </ScrollSection>

                <ScrollSection>
                    <ProblemSolution />
                </ScrollSection>

                <ScrollSection>
                    <Comparison />
                </ScrollSection>

                <ScrollSection>
                    <Testimonials />
                </ScrollSection>

                <ScrollSection>
                    <Pricing />
                </ScrollSection>

                <ScrollSection>
                    <CTASection />
                </ScrollSection>
            </main>

            <Footer />
        </div>
    )
}
