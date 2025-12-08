interface LogoProps {
    size?: number
    className?: string
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="13" y="10" width="6" height="18" rx="3" fill="#4A6CF7" />
            <rect x="6" y="4" width="20" height="6" rx="3" fill="#4A6CF7" />
            <circle cx="24" cy="26" r="3" fill="#4A6CF7" fillOpacity="0.4" />
        </svg>
    )
}
