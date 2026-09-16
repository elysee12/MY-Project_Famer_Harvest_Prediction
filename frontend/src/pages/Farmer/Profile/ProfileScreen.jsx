import React from 'react';
import { T } from '../../../constants/constants';
import Topbar from '../../../components/Common/Topbar';
import BottomNav from '../../../components/Common/BottomNav';
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuRuler, LuIdCard,
  LuKey, LuGlobe, LuInfo, LuLogOut, LuChevronRight
} from 'react-icons/lu';

export default function ProfileScreen({ user, onNavigate, onLogout, lang, setLang }) {
  const t = T[lang];
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : "F";
  
  const stats = [
    { icon: <LuMapPin size={22} />, label: t.sector, val: user.sector || "Gashora", color: "#0891b2", bg: "#e0f2fe" },
    { icon: <LuRuler size={22} />, label: lang === "en" ? "Land Size" : "Ubuso", val: `${user.farm_size_ha || 0} ha`, color: "#059669", bg: "#d1fae5" }
  ];

  const personalInfo = [
    { icon: <LuUser size={20} />, key: t.name, val: user.name || user.full_name, color: "#6366f1" },
    { icon: <LuMail size={20} />, key: t.emailLabel, val: user.email, color: "#f59e0b" },
    { icon: <LuPhone size={20} />, key: lang === "en" ? "Phone Number" : "Nimero ya Telefone", val: user.phone || "None", color: "#10b981" },
    { icon: <LuIdCard size={20} />, key: t.farmerId, val: user.id || user.farmer_id, color: "#8b5cf6" },
    { icon: <LuMapPin size={20} />, key: t.sector, val: user.sector || "Nyamata", color: "#0891b2" },
    { icon: <LuRuler size={20} />, key: t.farmSizeHa, val: `${user.farm_size_ha || 0} ha (${user.farm_size_are || Math.round((user.farm_size_ha || 0) * 100)} are)`, color: "#059669" }
  ];

  const settingsItems = [
    { label: t.editProfile, mode: "edit-profile", icon: <LuKey size={20} />, color: "#0891b2" },
    { label: t.changePassword, mode: "change-password", icon: <LuKey size={20} />, color: "#f59e0b" },
    { label: `${t.language} (${lang === "en" ? "English" : "Kinyarwanda"})`, mode: "language", icon: <LuGlobe size={20} />, color: "#8b5cf6" },
    { label: t.aboutApp, mode: "about", icon: <LuInfo size={20} />, color: "#64748b" }
  ];

  return (
    <>
      <Topbar 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LuUser size={20} />
            {t.myProfile}
          </div>
        } 
        onBack={() => onNavigate("dashboard")} 
        lang={lang} 
        setLang={setLang}
      />
      <div className="scroll fade-up" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 16px' }}>
        
        {/* Profile Header Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px 20px',
          textAlign: 'center',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 800,
            margin: '0 auto 16px',
            boxShadow: '0 8px 16px rgba(13, 148, 136, 0.3)'
          }}>
            {initials}
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 8,
            letterSpacing: '-0.3px'
          }}>
            {user.name || user.full_name}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f0fdfa',
            padding: '6px 16px',
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 700,
            color: '#0d9488',
            border: '1px solid #ccfbf1'
          }}>
            <LuIdCard size={14} />
            {t.farmerId}: {user.id || user.farmer_id}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20
        }}>
          {stats.map((s, idx) => (
            <div key={idx} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              padding: '18px 16px',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {s.icon}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#0f172a',
                textAlign: 'center'
              }}>
                {s.val}
              </div>
              <div style={{
                fontSize: 11,
                color: '#64748b',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Personal Information Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 12,
            paddingLeft: 4
          }}>
            {t.personalInfo}
          </div>
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {personalInfo.map((item, idx, arr) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 18px',
                borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${item.color}15`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      marginBottom: 3
                    }}>
                      {item.key}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.val}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 12,
            paddingLeft: 4
          }}>
            {t.settings}
          </div>
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            {settingsItems.map((item, idx, arr) => (
              <div key={idx}
                onClick={() => onNavigate(item.mode)}
                style={{
                  cursor: 'pointer',
                  padding: '16px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${item.color}15`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#334155'
                  }}>
                    {item.label}
                  </span>
                </div>
                <LuChevronRight size={18} color="#94a3b8" />
              </div>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: 12,
            color: '#dc2626',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s ease',
            marginBottom: 20
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fee2e2';
            e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.borderColor = '#fecaca';
          }}>
          <LuLogOut size={18} />
          {t.logout}
        </button>

      </div>
      <BottomNav current="profile" onNavigate={onNavigate} lang={lang} user={user} />
    </>
  );
}
