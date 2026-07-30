import React from 'react';
import { T } from '../../../constants/constants';
import Topbar from '../../../components/Common/Topbar';
import BottomNav from '../../../components/Common/BottomNav';

export default function ProfileScreen({ user, onNavigate, onLogout, lang, setLang }) {
  const t = T[lang];
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : "F";
  
  const stats = [
    { icon: (<i className="bi bi-geo-alt"></i>), label: t.sector, val: user.sector || "Gashora" },
    { icon: (<i className="bi bi-rulers"></i>), label: lang === "en" ? "Land Size" : "Ubuso", val: `${user.farm_size_ha || 0} ha` }
  ];

  return (
    <>
      <Topbar 
        title={(<><i className="bi bi-person"></i> {t.myProfile}</>)} 
        onBack={() => onNavigate("dashboard")} 
        lang={lang} 
        setLang={setLang}
      />
      <div className="scroll fade-up">
        
        {/* Premium Header */}
        <div className="p-header" style={{ textAlign: "center", padding: "24px 20px 20px" }}>
          <div className="p-avatar-wrap" style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--g100)", color: "var(--g800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, margin: "0 auto 12px" }}>
            {initials}
          </div>
          <div className="p-name" style={{ fontSize: 18, fontWeight: 800, color: "var(--s900)" }}>{user.name || user.full_name}</div>
          <div className="p-id-badge" style={{ display: "inline-block", background: "var(--s100)", padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: "var(--s600)", marginTop: 6 }}>
            {t.farmerId}: {user.id || user.farmer_id}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="p-stat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {stats.map(s => (
            <div key={s.label} className="p-stat-card" style={{ background: "white", border: "1px solid var(--s200)", padding: 12, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span className="p-stat-icon" style={{ fontSize: 20, color: "var(--g700)" }}>{s.icon}</span>
              <span className="p-stat-val" style={{ fontSize: 14, fontWeight: 800 }}>{s.val}</span>
              <span className="p-stat-lbl" style={{ fontSize: 10, color: "var(--s500)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="p-details-title" style={{ fontSize: 13, fontWeight: 800, color: "var(--s400)", textTransform: "uppercase", letterSpacing: ".5px", margin: "18px 0 8px" }}>{t.personalInfo}</div>
        <div className="card" style={{ padding: "10px 20px" }}>
          {[
            { icon: (<i className="bi bi-person"></i>), key: t.name, val: user.name || user.full_name },
            { icon: (<i className="bi bi-envelope"></i>), key: t.emailLabel, val: user.email },
            { icon: (<i className="bi bi-telephone"></i>), key: lang === "en" ? "Phone Number" : "Nimero ya Telefone", val: user.phone || "None" },
            { icon: (<i className="bi bi-person-badge"></i>), key: t.farmerId, val: user.id || user.farmer_id },
            { icon: (<i className="bi bi-geo-alt"></i>), key: t.sector, val: user.sector || "Nyamata" },
            { icon: (<i className="bi bi-rulers"></i>), key: t.farmSizeHa, val: `${user.farm_size_ha || 0} ha (${user.farm_size_are || Math.round((user.farm_size_ha || 0) * 100)} are)` }
          ].map((item, idx, arr) => (
            <div key={item.key} style={{
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "12px 0",
              borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--s100)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 18, width: 24, color: "var(--s400)" }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--s500)", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.key}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--s900)", textAlign: "right" }}>{item.val}</span>
            </div>
          ))}
        </div>

        <div className="p-details-title" style={{ fontSize: 13, fontWeight: 800, color: "var(--s400)", textTransform: "uppercase", letterSpacing: ".5px", margin: "18px 0 8px" }}>{t.settings}</div>
        <div className="card" style={{ padding: 0 }}>
          {[
            { label: t.editProfile, mode: "edit-profile", icon: (<i className="bi bi-pencil"></i>) },
            { label: t.changePassword, mode: "change-password", icon: (<i className="bi bi-key"></i>) },
            { label: `${t.language} (${lang === "en" ? "English" : "Kinyarwanda"})`, mode: "language", icon: (<i className="bi bi-globe"></i>) },
            { label: t.aboutApp, mode: "about", icon: "ℹ" }
          ].map((item, idx, arr) => (
            <div key={item.mode} 
              className="info-row" 
              style={{
                cursor: "pointer", 
                padding: "16px 14px", 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--s100)"
              }} 
              onClick={() => onNavigate(item.mode)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, color: "var(--s400)" }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--s700)" }}>{item.label}</span>
              </div>
              <span style={{ color: "var(--s400)" }}>→</span>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost" onClick={onLogout} 
          style={{
            marginTop: 15,
            borderColor: "#ef4444", 
            color: "#ef4444", 
            background: "rgba(239, 68, 68, 0.05)",
            fontWeight: 800,
            marginBottom: 20
          }}>
          <i className="bi bi-box-arrow-right"></i> {t.logout}
        </button>

      </div>
      <BottomNav current="profile" onNavigate={onNavigate} lang={lang} user={user} />
    </>
  );
}
