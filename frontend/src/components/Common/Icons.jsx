/**
 * Centralized Icon Exports
 * Using React Icons Lucide for consistent, professional design
 */

// React Icons (Lucide) - import aliasing for consistent shared names
import {
  // Agriculture & Nature
  LuSprout as Sprout,
  LuLeaf as Leaf,
  LuFlower2 as Flower2,
  LuMapPin as MapPin,
  LuTractor as Tractor,

  // Weather & Climate
  LuCloud as Cloud,
  LuCloudRain as CloudRain,
  LuCloudSun as CloudSun,
  LuThermometer as Thermometer,
  LuDroplets as Droplets,
  LuWind as Wind,
  LuSun as Sun,

  // Navigation & UI
  LuHouse as Home,
  LuTrendingUp as TrendingUp,
  LuChartBar as BarChart3,
  LuChartPie as PieChart,
  LuActivity as Activity,
  LuCalendar as Calendar,
  LuClock as Clock,
  LuSearch as Search,
  LuFilter as Filter,
  LuSettings as Settings,
  LuUser as User,
  LuUsers as Users,
  LuBell as Bell,
  LuBellRing as BellRing,

  // Actions
  LuPlus as Plus,
  LuPencil as Edit,
  LuTrash2 as Trash2,
  LuSave as Save,
  LuDownload as Download,
  LuUpload as Upload,
  LuRefreshCw as RefreshCw,
  LuCheck as Check,
  LuCircleCheck as CheckCircle2,
  LuX as X,
  LuCircleX as XCircle,
  LuTriangleAlert as AlertTriangle,
  LuInfo as Info,
  LuCircleHelp as HelpCircle,

  // Status & Indicators
  LuTrophy as Trophy,
  LuStar as Star,
  LuSparkles as Sparkles,
  LuTarget as Target,
  LuAward as Award,
  LuTrendingDown as TrendingDown,
  LuCircleAlert as AlertCircle,

  // Data & Reports
  LuFileText as FileText,
  LuClipboardCheck as ClipboardCheck,
  LuClipboardList as ClipboardList,
  LuChartBarStacked as BarChart4,
  LuChartLine as LineChart,

  // Location & Maps
  LuMap as Map,
  LuMapPin as MapPinned,
  LuNavigation as Navigation,
  LuCompass as Compass,

  // Farm & Agriculture Specific
  LuWarehouse as Warehouse,
  LuPackage as Package,
  LuBox as Box,
  LuBoxes as Boxes,

  // Communication
  LuSend as Send,
  LuMail as Mail,
  LuMessageSquare as MessageSquare,
  LuPhone as Phone,
  LuSmile as Smile,

  // Navigation Arrows
  LuArrowRight as ArrowRight,
  LuArrowLeft as ArrowLeft,
  LuArrowUp as ArrowUp,
  LuArrowDown as ArrowDown,
  LuChevronRight as ChevronRight,
  LuChevronLeft as ChevronLeft,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,

  // Misc
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuLock as Lock,
  LuDoorOpen as Unlock,
  LuLogOut as LogOut,
  LuLogIn as LogIn,
  LuMenu as Menu,
  LuMaximize2 as Maximize2,
  LuMinimize2 as Minimize2,
} from 'react-icons/lu';

// Export organized by category
export const AgricultureIcons = {
  // Primary agriculture icons
  Seedling: Sprout,
  Sprout: Sprout,
  Leaf: Leaf,
  Flower: Flower2,
};

export const WeatherIcons = {
  Cloud: Cloud,
  CloudRain: CloudRain,
  CloudSun: CloudSun,
  Thermometer: Thermometer,
  Droplets: Droplets,
  Wind: Wind,
  Sun: Sun,
  WaterDrop: Droplets,
};

export const NavigationIcons = {
  Home: Home,
  BarChart: BarChart3,
  PieChart: PieChart,
  LineChart: LineChart,
  Activity: Activity,
  Calendar: Calendar,
  Clock: Clock,
  Search: Search,
  Filter: Filter,
  Settings: Settings,
  User: User,
  Users: Users,
  Bell: Bell,
  BellRing: BellRing,
  Menu: Menu,
};

export const ActionIcons = {
  Plus: Plus,
  Edit: Edit,
  Trash: Trash2,
  Save: Save,
  Download: Download,
  Upload: Upload,
  Refresh: RefreshCw,
  Check: Check,
  CheckCircle: CheckCircle2,
  X: X,
  XCircle: XCircle,
  Send: Send,
  LogOut: LogOut,
  LogIn: LogIn,
};

export const StatusIcons = {
  Trophy: Trophy,
  Star: Star,
  Sparkles: Sparkles,
  Target: Target,
  Award: Award,
  AlertTriangle: AlertTriangle,
  AlertCircle: AlertCircle,
  Info: Info,
  HelpCircle: HelpCircle,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  Smile: Smile,
};

export const LocationIcons = {
  MapPin: MapPin,
  Map: Map,
  MapPinned: MapPinned,
  Navigation: Navigation,
  Compass: Compass,
};

export const DataIcons = {
  FileText: FileText,
  ClipboardCheck: ClipboardCheck,
  ClipboardList: ClipboardList,
  BarChart: BarChart4,
  LineChart: LineChart,
  Package: Package,
  Box: Box,
  Boxes: Boxes,
  Warehouse: Warehouse,
};

export const ArrowIcons = {
  Right: ArrowRight,
  Left: ArrowLeft,
  Up: ArrowUp,
  Down: ArrowDown,
  ChevronRight: ChevronRight,
  ChevronLeft: ChevronLeft,
  ChevronDown: ChevronDown,
  ChevronUp: ChevronUp,
};

// Quick access - most commonly used icons
export const CommonIcons = {
  // Logo & Branding
  Logo: Sprout,
  LogoAlt: Sprout,
  
  // Dashboard
  Dashboard: Home,
  Predict: Target,
  History: Clock,
  Weather: CloudSun,
  Tips: FileText,
  Notifications: Bell,
  Profile: User,
  
  // Crops
  Maize: Leaf,
  Rice: Sprout,
  Crop: Sprout,
  
  // Status
  Success: CheckCircle2,
  Warning: AlertTriangle,
  Error: XCircle,
  Info: Info,
  
  // Data
  Chart: BarChart3,
  Trend: TrendingUp,
  Report: ClipboardCheck,
  
  // Actions
  Add: Plus,
  Edit: Edit,
  Delete: Trash2,
  Save: Save,
  Refresh: RefreshCw,
  
  // Navigation
  Menu: Menu,
  Search: Search,
  Settings: Settings,
  Logout: LogOut,
};

// Default export for convenience
export default CommonIcons;
