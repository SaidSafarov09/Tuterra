import { useState, useEffect } from 'react'

export const useTypewriter = (words: string[], typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) => {
    const [text, setText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [loopNum, setLoopNum] = useState(0)
    const [typingSpeedState, setTypingSpeedState] = useState(typingSpeed)

    useEffect(() => {
        const handleType = () => {
            const i = loopNum % words.length
            const fullText = words[i]

            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            )

            setTypingSpeedState(isDeleting ? deletingSpeed : typingSpeed)

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), pauseTime)
            } else if (isDeleting && text === '') {
                setIsDeleting(false)
                setLoopNum(loopNum + 1)
            }
        }

        const timer = setTimeout(handleType, typingSpeedState)

        return () => clearTimeout(timer)
    }, [text, isDeleting, loopNum, words, typingSpeed, deletingSpeed, pauseTime, typingSpeedState])

    return text
}
