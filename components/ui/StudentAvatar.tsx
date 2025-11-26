import React from 'react'

interface AvatarProps {
    skinColor?: string
    hairStyle?: string
    hairColor?: string
    eyeStyle?: string
    accessory?: string
    bgColor?: string
    size?: number
    className?: string
}

export const StudentAvatar: React.FC<AvatarProps> = ({
    skinColor = '#F4C2A6',
    hairStyle = 'short',
    hairColor = '#2C1B18',
    eyeStyle = 'default',
    accessory = 'none',
    bgColor = '#E3F2FD',
    size = 80,
    className = '',
}) => {
    // Стили волос
    const hairStyles = {
        short: (
            <path
                d="M15 10C15 5 12 2 20 2C28 2 25 5 25 10C25 15 22 18 20 18C18 18 15 15 15 10Z"
                fill={hairColor}
            />
        ),
        long: (
            <path
                d="M12 8C12 3 15 0 20 0C25 0 28 3 28 8V22C28 24 26 26 24 26C22 26 20 24 20 22V20C20 22 18 24 16 24C14 24 12 22 12 20V8Z"
                fill={hairColor}
            />
        ),
        curly: (
            <>
                <circle cx="16" cy="8" r="3" fill={hairColor} />
                <circle cx="20" cy="6" r="3.5" fill={hairColor} />
                <circle cx="24" cy="8" r="3" fill={hairColor} />
                <path d="M14 10C14 8 15 6 17 6H23C25 6 26 8 26 10V14H14V10Z" fill={hairColor} />
            </>
        ),
        bald: null,
    }

    // Стили глаз
    const eyeStyles = {
        default: (
            <>
                <circle cx="16" cy="16" r="1.5" fill="#2C1B18" />
                <circle cx="24" cy="16" r="1.5" fill="#2C1B18" />
            </>
        ),
        happy: (
            <>
                <path d="M14 16C14 15 15 14 16 14C17 14 18 15 18 16" stroke="#2C1B18" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M22 16C22 15 23 14 24 14C25 14 26 15 26 16" stroke="#2C1B18" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
        ),
        surprised: (
            <>
                <circle cx="16" cy="16" r="2" fill="#2C1B18" />
                <circle cx="24" cy="16" r="2" fill="#2C1B18" />
            </>
        ),
    }

    // Аксессуары
    const accessories = {
        none: null,
        glasses: (
            <>
                <circle cx="16" cy="16" r="4" stroke="#2C1B18" strokeWidth="1.5" fill="none" />
                <circle cx="24" cy="16" r="4" stroke="#2C1B18" strokeWidth="1.5" fill="none" />
                <path d="M20 16H20" stroke="#2C1B18" strokeWidth="1.5" />
            </>
        ),
        sunglasses: (
            <>
                <rect x="12" y="14" width="8" height="5" rx="2.5" fill="#2C1B18" opacity="0.8" />
                <rect x="20" y="14" width="8" height="5" rx="2.5" fill="#2C1B18" opacity="0.8" />
                <path d="M20 16.5H20" stroke="#2C1B18" strokeWidth="1.5" />
            </>
        ),
        hat: (
            <path d="M12 8H28L26 4C26 2 24 0 20 0C16 0 14 2 14 4L12 8Z" fill="#FF6B6B" />
        ),
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background */}
            <rect width="40" height="40" rx="20" fill={bgColor} />

            {/* Head */}
            <circle cx="20" cy="20" r="10" fill={skinColor} />

            {/* Hair */}
            {hairStyles[hairStyle as keyof typeof hairStyles]}

            {/* Eyes */}
            {eyeStyles[eyeStyle as keyof typeof eyeStyles]}

            {/* Mouth */}
            <path
                d="M16 22C16 23 17.5 24 20 24C22.5 24 24 23 24 22"
                stroke="#2C1B18"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
            />

            {/* Accessories */}
            {accessories[accessory as keyof typeof accessories]}
        </svg>
    )
}

// Опции для генератора аватаров
export const avatarOptions = {
    skinColors: [
        { name: 'Светлая', value: '#F4C2A6' },
        { name: 'Средняя', value: '#D9A066' },
        { name: 'Темная', value: '#8D5524' },
        { name: 'Очень темная', value: '#5C3317' },
    ],
    hairStyles: [
        { name: 'Короткие', value: 'short' },
        { name: 'Длинные', value: 'long' },
        { name: 'Кудрявые', value: 'curly' },
        { name: 'Лысый', value: 'bald' },
    ],
    hairColors: [
        { name: 'Черные', value: '#2C1B18' },
        { name: 'Коричневые', value: '#6F4E37' },
        { name: 'Светлые', value: '#D4AF37' },
        { name: 'Рыжие', value: '#D2691E' },
        { name: 'Серые', value: '#808080' },
    ],
    eyeStyles: [
        { name: 'Обычные', value: 'default' },
        { name: 'Счастливые', value: 'happy' },
        { name: 'Удивленные', value: 'surprised' },
    ],
    accessories: [
        { name: 'Нет', value: 'none' },
        { name: 'Очки', value: 'glasses' },
        { name: 'Солнцезащитные очки', value: 'sunglasses' },
        { name: 'Шляпа', value: 'hat' },
    ],
    bgColors: [
        { name: 'Голубой', value: '#E3F2FD' },
        { name: 'Розовый', value: '#FCE4EC' },
        { name: 'Зеленый', value: '#E8F5E9' },
        { name: 'Желтый', value: '#FFF9C4' },
        { name: 'Фиолетовый', value: '#F3E5F5' },
        { name: 'Оранжевый', value: '#FFF3E0' },
    ],
}
