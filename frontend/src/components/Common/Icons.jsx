/**
 * Centralized Icon Exports
 * Using Lucide React Icons for consistent, professional design
 */

// Lucide Icons (Primary - Modern, Clean, Professional)
import { 
  // Agriculture & Nature
  Sprout,
  Leaf,
  Flower2,
  MapPin,
  Tractor,
  
  // Weather & Climate
  Cloud,
  CloudRain,
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  
  // Navigation & UI
  Home,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Clock,
  Search,
  Filter,
  Settings,
  User,
  Users,
  Bell,
  BellRing,
  
  // Actions
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  RefreshCw,
  Check,
  CheckCircle2,
  X,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  
  // Status & Indicators
  Trophy,
  Star,
  Sparkles,
  Target,
  Award,
  TrendingDown,
  
  // Data & Reports
  FileText,
  ClipboardCheck,
  ClipboardList,
  BarChart4,
  LineChart,
  
  // Location & Maps
  Map,
  MapPin as MapPinned,
  Navigation,
  Compass,
  
  // Farm & Agriculture Specific
  Warehouse,
  Package,
  Box,
  Boxes,
  
  // Communication
  Send,
  Mail,
  MessageSquare,
  Phone,
  Smile,
  
  // Navigation Arrows
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  
  // Misc
  Eye,
  EyeOff,
  Lock,
  Unlock,
  LogOut,
  LogIn,
  Menu,
  MoreVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';

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
  Info: AlertCircle,
  
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
