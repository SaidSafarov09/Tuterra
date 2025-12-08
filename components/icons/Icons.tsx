'use client'

import React from 'react'
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Calendar,
    Settings,
    Library,
    Home,
    Wallet,
    LogOut,
    AlertTriangle,
    Coins,
    PartyPopper,
    Scissors,
    User,
    Eye,
    Palette,
    Plus,
    Pencil,
    Trash2,
    Upload,
    Clock,
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Check,
    Filter,
    Search,
    Mail,
    Phone,
    GraduationCap,
    PieChart,
    XCircle,
    FileText,
    DollarSign,
    Send,
    MessageCircle,
    History,
    Receipt,
    CalendarClock,
    MoreVertical
} from 'lucide-react'



export const HistoryIcon: React.FC<IconProps> = (props) => <History {...props} />
export const ReceiptIcon: React.FC<IconProps> = (props) => <Receipt {...props} />

interface IconProps {
    size?: number
    className?: string
    color?: string
    style?: React.CSSProperties
}


export const DashboardIcon: React.FC<IconProps> = (props) => <LayoutDashboard {...props} />
export const StudentsIcon: React.FC<IconProps> = (props) => <GraduationCap {...props} />
export const LessonsIcon: React.FC<IconProps> = (props) => <BookOpen {...props} />
export const SubjectsIcon: React.FC<IconProps> = (props) => <Library {...props} />
export const PaymentsIcon: React.FC<IconProps> = (props) => <Wallet {...props} />
export const SettingsIcon: React.FC<IconProps> = (props) => <Settings {...props} />
export const CalendarIcon: React.FC<IconProps> = (props) => <Calendar {...props} />
export const AnalyticsIcon: React.FC<IconProps> = (props) => <PieChart {...props} />
export const LogoutIcon: React.FC<IconProps> = (props) => <LogOut {...props} />


export const PlusIcon: React.FC<IconProps> = (props) => <Plus {...props} />
export const EditIcon: React.FC<IconProps> = (props) => <Pencil {...props} />
export const DeleteIcon: React.FC<IconProps> = (props) => <Trash2 {...props} />
export const UploadIcon: React.FC<IconProps> = (props) => <Upload {...props} />
export const CloseIcon: React.FC<IconProps> = (props) => <X {...props} />
export const CheckIcon: React.FC<IconProps> = (props) => <Check {...props} />
export const MenuIcon: React.FC<IconProps> = (props) => <Menu {...props} />
export const FilterIcon: React.FC<IconProps> = (props) => <Filter {...props} />
export const SearchIcon: React.FC<IconProps> = (props) => <Search {...props} />
export const XCircleIcon: React.FC<IconProps> = (props) => <XCircle {...props} />


export const ArrowLeftIcon: React.FC<IconProps> = (props) => <ArrowLeft {...props} />
export const ArrowRightIcon: React.FC<IconProps> = (props) => <ArrowRight {...props} />
export const ChevronDownIcon: React.FC<IconProps> = (props) => <ChevronDown {...props} />
export const ChevronUpIcon: React.FC<IconProps> = (props) => <ChevronUp {...props} />
export const ChevronLeftIcon: React.FC<IconProps> = (props) => <ChevronLeft {...props} />
export const ChevronRightIcon: React.FC<IconProps> = (props) => <ChevronRight {...props} />
export const ClockIcon: React.FC<IconProps> = (props) => <Clock {...props} />
export const MailIcon: React.FC<IconProps> = (props) => <Mail {...props} />
export const PhoneIcon: React.FC<IconProps> = (props) => <Phone {...props} />
export const NoteIcon: React.FC<IconProps> = (props) => <FileText {...props} />
export const HomeIcon: React.FC<IconProps> = (props) => <Home {...props} />


export const UsersGroupIcon: React.FC<IconProps> = (props) => <Users {...props} />
export const BookIcon: React.FC<IconProps> = (props) => <BookOpen {...props} />
export const AlertIcon: React.FC<IconProps> = (props) => <AlertTriangle {...props} />
export const MoneyIcon: React.FC<IconProps> = (props) => <Coins {...props} />
export const WalletIcon: React.FC<IconProps> = (props) => <Wallet {...props} />
export const DollarIcon: React.FC<IconProps> = (props) => <DollarSign {...props} />
export const CelebrationIcon: React.FC<IconProps> = (props) => <PartyPopper {...props} />


export const UserIcon: React.FC<IconProps> = (props) => <User {...props} />
export const ScissorsIcon: React.FC<IconProps> = (props) => <Scissors {...props} />
export const EyeIcon: React.FC<IconProps> = (props) => <Eye {...props} />
export const PaletteIcon: React.FC<IconProps> = (props) => <Palette {...props} />


export const TelegramIcon: React.FC<IconProps> = (props) => <Send {...props} />
export const WhatsAppIcon: React.FC<IconProps> = (props) => <MessageCircle {...props} />

export const RescheduleIcon: React.FC<IconProps> = (props) => <CalendarClock {...props} />
export const MoreVerticalIcon: React.FC<IconProps> = (props) => <MoreVertical {...props} />
