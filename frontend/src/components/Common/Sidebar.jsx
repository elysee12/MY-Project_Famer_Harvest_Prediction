import React from 'react';
import { T } from '../../constants/constants';
import { LogoWithText } from './Logo';
import { 
  Home, Target, Clock, CloudSun, Book, Bell, User,
  Gauge, MapPin, FileText, Shield, Users, Clipboard,
  BellRing, Building2, LogOut, Activity
} from 'lucide-react';

export default function Sidebar({ current, onNavigate, user, onLogout, lang, setLang, unreadMessages = 0 }) {
  const t = T[lang];

  if (!user) return null;

  const isFarmer = user.role === 'farmer';
  const isCooperative = user.role === 'cooperative';
  const isSector = user.role === 'sector' || user.role === 'officer';
  const isAdmin = user.role === 'admin' || user.role === 'district'; // Support both 'admin' and legacy 'district'

  // Render navigation links based on user role
  const renderNavLinks = () => {
    if (isFarmer || isCooperative) {
      const navItems = [
        { id: "dashboard", icon: <Home size={18} />, label: t.home },
        { id: "predict", icon: <Target size={18} />, label: t.predict },
        { id: "history", icon: <Clock size={18} />, label: t.history },
        { id: "weather", icon: <CloudSun size={18} />, label: t.weatherTitle || "Weather" },
        { id: "tips", icon: <Book size={18} />, label: t.tipsTitle || "Tips" },
        { id: "notifications", icon: <Bell size={18} />, label: t.districtAlerts || "Alerts" },
      ];
      return (
        <>
          <div className="sn-section">Navigation</div>
          {navItems.map(item => (
            <button key={item.id} className={`sn-item ${current === item.id ? "act" : ""}`} onClick={() => onNavigate(item.id)}>
              <span className="sn-icon">{item.icon}</span>
              <span className="sn-label">{item.label}</span>
              {current === item.id && <span className="sn-badge">●</span>}
            </button>
          ))}
          <div className="sn-section" style={{ marginTop: 8 }}>Account</div>
          <button className={`sn-item ${current === "profile" ? "act" : ""}`} onClick={() => onNavigate("profile")}>
            <span className="sn-icon"><User size={18} /></span>
            <span className="sn-label">{t.myProfile || "Profile"}</span>
          </button>
        </>
      );
    } else if (isAdmin) {
      // System Admin navigation - Overview, Sectors, Reports, Register (Staff Management)
      const adminItems = [
        { id: "overview", icon: <Gauge size={18} />, label: t.overview || "Overview" },
        { id: "sectors", icon: <MapPin size={18} />, label: t.sectorsTab || "Sectors" },
        { id: "reports", icon: <FileText size={18} />, label: t.reportsTab || "Reports" },
        { id: "admin", icon: <Shield size={18} />, label: lang === 'en' ? 'Register' : 'Kwandika' },
      ];
      
      return (
        <>
          <div className="sn-section">Dashboard</div>
          {adminItems.map(item => (
            <button key={item.id} className={`sn-item ${current === item.id ? "act" : ""}`} onClick={() => onNavigate(item.id)}>
              <span className="sn-icon">{item.icon}</span>
              <span className="sn-label">{item.label}</span>
              {current === item.id && <span className="sn-badge">●</span>}
            </button>
          ))}
        </>
      );
    } else if (isSector) {
      // Sector Officer navigation
      const officerItems = [
        { id: "overview",     icon: <Gauge size={18} />,      label: t.overview },
        { id: "farmers",      icon: <Users size={18} />,             label: lang === "en" ? "Farmers" : "Abahinzi" },
        { id: "predictions",  icon: <Clipboard size={18} />,    label: lang === "en" ? "Predictions" : "Ibisobanuro" },
        { id: "activity",     icon: <Activity size={18} />,    label: lang === "en" ? "Activity" : "Ibikorwa" },
        { id: "reports",      icon: <FileText size={18} />,  label: t.reportsTab },
        { id: "messages",     icon: <BellRing size={18} />,          label: lang === "en" ? "Messages" : "Ubutumwa", badge: unreadMessages > 0 ? unreadMessages : null },
      ];

      return (
        <>
          <div className="sn-section">Dashboard</div>
          {officerItems.map(item => (
            <button key={item.id} className={`sn-item ${current === item.id ? "act" : ""}`} onClick={() => onNavigate(item.id)}
              style={{ position: 'relative' }}>
              <span className="sn-icon">{item.icon}</span>
              <span className="sn-label">{item.label}</span>
              {item.badge && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#dc2626', color: 'white',
                  borderRadius: '50%', minWidth: 18, height: 18,
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px'
                }}>{item.badge}</span>
              )}
              {current === item.id && !item.badge && <span className="sn-badge">●</span>}
            </button>
          ))}
        </>
      );
    } else {
      // Fallback for other roles
      return null;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LogoWithText size={44} lang={lang} variant="light" />
      </div>
      <nav className="sidebar-nav">
        {renderNavLinks()}
        <div className="sn-section" style={{ marginTop: 8 }}>Settings</div>
        <button className="sn-item" onClick={() => setLang(l => l === "en" ? "rw" : "en")}>
          <span className="sn-icon">{lang === "en" ? "EN" : "RW"}</span>
          <span className="sn-label">{lang === "en" ? "Kinyarwanda" : "English"}</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={onLogout} title={t.logout}>
          <div className="sidebar-avatar">
            {isFarmer
              ? <span style={{ fontSize: 13, fontWeight: 800 }}>{(user.name || 'F').charAt(0).toUpperCase()}</span>
              : <Building2 size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name || user.full_name}</div>
            <div className="sidebar-user-role"><LogOut size={14} /> {t.logout}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
