interface LogoProps {
    size?: number
    className?: string
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="48" height="48" rx="12" fill="url(#gradient)" />
            <path
                d="M24 12L16 18V28L24 34L32 28V18L24 12Z"
                fill="white"
                fillOpacity="0.9"
            />
            <path
                d="M24 18L19 21V27L24 30L29 27V21L24 18Z"
                fill="url(#innerGradient)"
            />
            <circle cx="24" cy="24" r="3" fill="white" />
            <defs>
                <linearGradient
                    id="gradient"
                    x1="0"
                    y1="0"
                    x2="48"
                    y2="48"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#4A6CF7" />
                    <stop offset="1" stopColor="#6C8AFF" />
                </linearGradient>
                <linearGradient
                    id="innerGradient"
                    x1="19"
                    y1="18"
                    x2="29"
                    y2="30"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#4A6CF7" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#6C8AFF" stopOpacity="0.3" />
                </linearGradient>
            </defs>
        </svg>
    )
}
