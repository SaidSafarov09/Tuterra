interface IconProps {
    size?: number
    className?: string
    color?: string
}

export const DashboardIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
)

export const StudentsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="10" cy="6" r="3.5" stroke={color} strokeWidth="1.5" />
        <path d="M4 17C4 13.6863 6.68629 11 10 11C13.3137 11 16 13.6863 16 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const LessonsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 5C4 3.89543 4.89543 3 6 3H14C15.1046 3 16 3.89543 16 5V17L10 14L4 17V5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
)

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="2.75" y="4.75" width="14.5" height="12.5" rx="1.25" stroke={color} strokeWidth="1.5" />
        <path d="M2.75 8.25H17.25" stroke={color} strokeWidth="1.5" />
        <path d="M6 2.75V5.25" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 2.75V5.25" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5" />
        <path d="M10 2.5C10.8284 2.5 11.5 3.17157 11.5 4V4.5C11.5 5.05228 11.9477 5.5 12.5 5.5H13C13.8284 5.5 14.5 6.17157 14.5 7C14.5 7.82843 13.8284 8.5 13 8.5H12.5C11.9477 8.5 11.5 8.94772 11.5 9.5V10.5C11.5 11.0523 11.9477 11.5 12.5 11.5H13C13.8284 11.5 14.5 12.1716 14.5 13C14.5 13.8284 13.8284 14.5 13 14.5H12.5C11.9477 14.5 11.5 14.9477 11.5 15.5V16C11.5 16.8284 10.8284 17.5 10 17.5C9.17157 17.5 8.5 16.8284 8.5 16V15.5C8.5 14.9477 8.05228 14.5 7.5 14.5H7C6.17157 14.5 5.5 13.8284 5.5 13C5.5 12.1716 6.17157 11.5 7 11.5H7.5C8.05228 11.5 8.5 11.0523 8.5 10.5V9.5C8.5 8.94772 8.05228 8.5 7.5 8.5H7C6.17157 8.5 5.5 7.82843 5.5 7C5.5 6.17157 6.17157 5.5 7 5.5H7.5C8.05228 5.5 8.5 5.05228 8.5 4.5V4C8.5 3.17157 9.17157 2.5 10 2.5Z" stroke={color} strokeWidth="1.5" />
    </svg>
)

export const SubjectsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 4.5C3 3.67157 3.67157 3 4.5 3H9.5L11.5 5.5H15.5C16.3284 5.5 17 6.17157 17 7V15.5C17 16.3284 16.3284 17 15.5 17H4.5C3.67157 17 3 16.3284 3 15.5V4.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
)

export const PaymentsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="2.75" y="5.75" width="14.5" height="10.5" rx="1.25" stroke={color} strokeWidth="1.5" />
        <path d="M2.75 9.25H17.25" stroke={color} strokeWidth="1.5" />
        <circle cx="5.5" cy="13" r="0.75" fill={color} />
    </svg>
)

export const AnalyticsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 14L7 10L10 13L17 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 6H17V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const PlusIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M10 4V16M4 10H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const EditIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14.5 3.5L16.5 5.5L8.5 13.5L5.5 14L6 11L14.5 3.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12.5 5.5L14.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const DeleteIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 5H17M7 5V3.5C7 2.94772 7.44772 2.5 8 2.5H12C12.5523 2.5 13 2.94772 13 3.5V5M8.5 9V14M11.5 9V14M5 5L5.5 15.5C5.5 16.3284 6.17157 17 7 17H13C13.8284 17 14.5 16.3284 14.5 15.5L15 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const UploadIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M10 13V4M10 4L6.5 7.5M10 4L13.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13V15C3 15.5523 3.44772 16 4 16H16C16.5523 16 17 15.5523 17 15V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const ClockIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="10" cy="10" r="7.25" stroke={color} strokeWidth="1.5" />
        <path d="M10 6V10L13 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 4L6 10L12 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M8 4L14 10L8 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5 8L10 13L15 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const ChevronUpIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M15 12L10 7L5 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const MenuIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 5H17M3 10H17M3 15H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const CloseIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5 5L15 15M15 5L5 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const CheckIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 10L8 14L16 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const FilterIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 5H17L12 11V16L8 18V11L3 5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
)

export const SearchIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="8.5" cy="8.5" r="5.75" stroke={color} strokeWidth="1.5" />
        <path d="M12.5 12.5L17 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const MailIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="2.75" y="4.75" width="14.5" height="10.5" rx="1.25" stroke={color} strokeWidth="1.5" />
        <path d="M3 6L10 11L17 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const PhoneIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M6 3C5.17157 3 4.5 3.67157 4.5 4.5V15.5C4.5 16.3284 5.17157 17 6 17H14C14.8284 17 15.5 16.3284 15.5 15.5V4.5C15.5 3.67157 14.8284 3 14 3H6Z" stroke={color} strokeWidth="1.5" />
        <circle cx="10" cy="14" r="0.75" fill={color} />
    </svg>
)

export const LogoutIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M13 14L17 10L13 6M17 10H7M7 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const UsersGroupIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="7" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
        <circle cx="13" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
        <path d="M2 16C2 13.7909 3.79086 12 6 12H8C9.10457 12 10.1046 12.4214 10.8507 13.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 16C18 13.7909 16.2091 12 14 12H12C10.8954 12 9.89543 12.4214 9.14929 13.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const BookIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 3.5C4 2.94772 4.44772 2.5 5 2.5H15C15.5523 2.5 16 2.94772 16 3.5V16.5C16 17.0523 15.5523 17.5 15 17.5H5C4.44772 17.5 4 17.0523 4 16.5V3.5Z" stroke={color} strokeWidth="1.5" />
        <path d="M7 6.5H13M7 9.5H13M7 12.5H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const AlertIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M8.57465 3.5C9.15893 2.5 10.8411 2.5 11.4253 3.5L17.0574 13C17.6417 14 17.0006 15.25 15.8321 15.25H4.16795C2.99937 15.25 2.35829 14 2.94257 13L8.57465 3.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 7V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="12.5" r="0.75" fill={color} />
    </svg>
)

export const MoneyIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="10" cy="10" r="7.25" stroke={color} strokeWidth="1.5" />
        <path d="M10 6V14M8 7.5C8 6.94772 8.44772 6.5 9 6.5H11C11.5523 6.5 12 6.94772 12 7.5C12 8.05228 11.5523 8.5 11 8.5H9C8.44772 8.5 8 8.94772 8 9.5V10.5C8 11.0523 8.44772 11.5 9 11.5H11C11.5523 11.5 12 11.9477 12 12.5C12 13.0523 11.5523 13.5 11 13.5H9C8.44772 13.5 8 13.0523 8 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const CelebrationIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M10 2L11 6L10 10L9 6L10 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4 4L6.5 6.5L4 9L1.5 6.5L4 4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 4L18.5 6.5L16 9L13.5 6.5L16 4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6 12L8 14L6 16L4 14L6 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M14 12L16 14L14 16L12 14L14 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="10" cy="14" r="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
)

export const ScissorsIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="5" cy="5" r="2.25" stroke={color} strokeWidth="1.5" />
        <circle cx="5" cy="15" r="2.25" stroke={color} strokeWidth="1.5" />
        <path d="M7 6L16 15M7 14L16 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const UserIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="10" cy="7" r="3.25" stroke={color} strokeWidth="1.5" />
        <path d="M4 17C4 13.6863 6.68629 11 10 11C13.3137 11 16 13.6863 16 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

export const EyeIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2.25" stroke={color} strokeWidth="1.5" />
    </svg>
)

export const PaletteIcon: React.FC<IconProps> = ({ size = 20, className = '', color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5C10.8284 17.5 11.5 16.8284 11.5 16V15C11.5 14.1716 12.1716 13.5 13 13.5H15C16.3807 13.5 17.5 12.3807 17.5 11V10C17.5 5.85786 14.1421 2.5 10 2.5Z" stroke={color} strokeWidth="1.5" />
        <circle cx="7" cy="8" r="1" fill={color} />
        <circle cx="10" cy="6" r="1" fill={color} />
        <circle cx="13" cy="8" r="1" fill={color} />
    </svg>
)

