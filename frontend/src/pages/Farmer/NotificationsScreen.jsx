import React from 'react';
import { T } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';
import { LuBell, LuTrash2, LuCircleCheck, LuInfo, LuClock, LuX } from 'react-icons/lu';

export default function NotificationsScreen({ notifications = [], setNotifications, onNavigate, lang, setLang, user, hideLangBtn = false }) {
  const t = T[lang];
  const clearAll = () => setNotifications([]);
  const removeOne = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <>
      <Topbar 
        title={<><LuBell size={18} /> {t.districtAlerts || "Notifications"}</>} 
        onBack={() => onNavigate("dashboard")} 
        lang={lang} 
        setLang={setLang}
        hideLangBtn={hideLangBtn}
        actions={<button className="tb-btn" onClick={clearAll} title="Clear All"><LuTrash2 size={16} /></button>}
      />
      <div className="scroll fade-up">
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--s400)" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}><LuBell size={48} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No notifications</div>
            <div style={{ fontSize: 13 }}>You're all caught up! Important alerts will appear here.</div>
            <button className="tb-btn" style={{ marginTop: 20, color: "#007AFF" }} onClick={() => onNavigate("dashboard")}>
               Go Back Home
            </button>
          </div>
        ) : (
          <div style={{ paddingBottom: 80 }}>
            {notifications.map(n => (
              <div 
                key={n.id} 
                className="notif-item" 
                style={{ 
                  display: "flex", 
                  gap: 12, 
                  background: "#fff", 
                  padding: 16, 
                  borderRadius: 12, 
                  marginBottom: 12, 
                  border: "1px solid #eee", 
                  position: "relative" 
                }}
              >
                <div style={{ fontSize: 24 }}>
                  {n.type === "success" ? <LuCircleCheck size={20} style={{ color: "var(--g600)" }} /> : <LuInfo size={20} style={{ color: "#007AFF" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--s900)" }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--g700)", fontWeight: 700, marginTop: 2 }}>
                    <i className="bi bi-person-badge"></i> {n.sender || "Bugesera District"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--s600)", marginTop: 6, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "var(--s400)", marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LuClock size={12} /> {new Date(n.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button 
                  onClick={() => removeOne(n.id)} 
                  style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#ccc", position: "absolute", top: 12, right: 12 }}
                >
                  <LuX size={18} />
                </button>
              </div>
            ))}
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="auth-btn" style={{ background: "#f3f4f6", color: "var(--s600)", fontWeight: 600 }} onClick={clearAll}>
                Clear All Notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
