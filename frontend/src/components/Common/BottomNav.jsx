import React from 'react';
import { T } from '../../constants/constants';
import { 
  Home, Target, Clock, CloudSun, Book,
  Gauge, Users, Clipboard, FileText, MapPin, UserPlus, Activity
} from 'lucide-react';

export default function BottomNav({ current, onNavigate, lang, user }) {
  const t = T[lang];

  if (!user) return null;

  let items = [];
  if (user.role === "farmer") {
    items = [
      { id: "dashboard", icon: <Home size={20} />, label: t.home },
      { id: "predict",   icon: <Target size={20} />, label: t.predict },
      { id: "history",   icon: <Clock size={20} />, label: t.history },
      { id: "weather",   icon: <CloudSun size={20} />, label: t.weatherTitle || "Weather" },
      { id: "tips",      icon: <Book size={20} />, label: t.tipsTitle || "Tips" },
    ];
  } else if (user.role === "sector" || user.role === "officer") {
    items = [
      { id: "overview",    icon: <Gauge size={20} />,     label: t.overview || "Overview" },
      { id: "farmers",     icon: <Users size={20} />,            label: "Farmers" },
      { id: "predictions", icon: <Clipboard size={20} />,   label: "Predictions" },
      { id: "activity",    icon: <Activity size={20} />,  label: lang === "en" ? "Activity" : "Ibikorwa" },
      { id: "reports",     icon: <FileText size={20} />, label: t.reportsTab || "Reports" },
    ];
  } else {
    items = [
      { id: "overview", icon: <Gauge size={20} />, label: t.overview || "Overview" },
      { id: "sectors",  icon: <MapPin size={20} />,        label: t.sectorsTab || "Sectors" },
      { id: "reports",  icon: <FileText size={20} />, label: t.reportsTab || "Reports" },
    ];
    if (user.role === "district") {
      items.push({ id: "admin", icon: <UserPlus size={20} />, label: t.registerTab || "Admin" });
    }
  }

  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.id} className={`bn-item ${current === it.id ? "act" : ""}`} onClick={() => onNavigate(it.id)}>
          <span className="bn-icon">{it.icon}</span>
          <span className="bn-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
