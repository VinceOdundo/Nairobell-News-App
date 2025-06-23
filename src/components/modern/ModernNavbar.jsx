import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Globe,
  User,
  Settings,
  LogOut,
  Bell,
  Bookmark,
  TrendingUp,
  MapPin,
  Users,
  Edit3,
  Award,
  Download,
  Volume2,
  Languages,
  Wifi,
  WifiOff,
  Star,
  Zap,
  MessageCircle,
  Filter,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { AfricanTranslationService } from "../../services/africanTranslationService";
import { NotificationService } from "../../services/notificationService";
import { OfflineService } from "../../services/offlineService";
import { GamificationService } from "../../services/gamificationService";
import toast from "react-hot-toast";

const AFRICAN_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧", native: "English" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪", native: "Kiswahili" },
  { code: "am", name: "Amharic", flag: "🇪🇹", native: "አማርኛ" },
  { code: "ha", name: "Hausa", flag: "🇳🇬", native: "Hausa" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬", native: "Yorùbá" },
  { code: "ig", name: "Igbo", flag: "🇳🇬", native: "Igbo" },
  { code: "zu", name: "Zulu", flag: "🇿🇦", native: "isiZulu" },
  { code: "xh", name: "Xhosa", flag: "🇿🇦", native: "isiXhosa" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦", native: "Afrikaans" },
  { code: "fr", name: "French", flag: "🇨🇮", native: "Français" },
  { code: "ar", name: "Arabic", flag: "🇪🇬", native: "العربية" },
  { code: "pt", name: "Portuguese", flag: "🇦🇴", native: "Português" },
];

export default function ModernNavbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Feature State
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load user preferences and data
    loadUserData();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);
  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load notifications
      const unreadCount = await NotificationService.getUnreadCount(user.id);
      setUnreadNotifications(unreadCount);

      // Load gamification data
      const userStats = await GamificationService.getUserStats(user.id);
      setUserPoints(userStats.points || 0);
      setUserStreak(userStats.streak || 0);

      // Load offline queue
      const queueStatus = await OfflineService.getQueueStatus();
      setOfflineQueueCount(queueStatus.pendingCount || 0);

      // Load preferences
      const preferences = await AfricanTranslationService.getUserPreferences(
        user.id
      );
      setSelectedLanguage(preferences.preferredLanguage || "en");
      setIsAudioEnabled(preferences.audioEnabled || false);
      setIsDarkMode(preferences.darkMode || false);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };
  const handleLanguageChange = async (langCode) => {
    try {
      setSelectedLanguage(langCode);
      if (user) {
        await AfricanTranslationService.setUserLanguagePreference(
          user.id,
          langCode
        );
      }
      setIsLanguageOpen(false);

      // Show translation toast
      const language = AFRICAN_LANGUAGES.find((l) => l.code === langCode);
      toast.success(`Language changed to ${language.native}`, {
        icon: language.flag,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error("Failed to change language");
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
    // Save preference
    if (user) {
      AfricanTranslationService.updateUserPreferences(user.id, {
        darkMode: !isDarkMode,
      });
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      setIsMenuOpen(false);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const currentLanguage =
    AFRICAN_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    AFRICAN_LANGUAGES[0];
  const navigationItems = [
    { path: "/home", label: "Home", icon: TrendingUp },
    { path: "/explore", label: "Explore", icon: Globe },
    { path: "/community", label: "Community", icon: Users, protected: false },
    {
      path: "/citizen-journalism",
      label: "Report",
      icon: Edit3,
      protected: true,
    },
    { path: "/saved", label: "Saved", icon: Bookmark, protected: true },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {" "}
            {/* Logo */}
            <Link
              to={user ? "/home" : "/"}
              className="flex items-center space-x-2"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Nairobell
                </span>
              </motion.div>
            </Link>{" "}
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname === path
                      ? "text-orange-600 bg-orange-50"
                      : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search African news..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </form>
            </div>
            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                >
                  <Globe size={16} />
                  <span>
                    {
                      AFRICAN_LANGUAGES.find((l) => l.code === selectedLanguage)
                        ?.flag
                    }
                  </span>
                </button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                    >
                      {AFRICAN_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            selectedLanguage === lang.code
                              ? "bg-orange-50 text-orange-600"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {profile?.first_name?.[0] ||
                            user.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block">
                      {profile?.first_name || "User"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md hover:from-orange-600 hover:to-red-700 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-orange-600 hover:bg-gray-50"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-2 space-y-1">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search African news..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </form>{" "}
                {/* Mobile Navigation Items */}
                {navigationItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === path
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
