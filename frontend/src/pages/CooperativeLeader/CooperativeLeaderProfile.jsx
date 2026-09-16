import React, { useState } from 'react';
import { T, API_BASE } from '../../constants/constants';
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuBuilding2, LuIdCard,
  LuPencilLine, LuKey, LuGlobe, LuLogOut, LuChevronRight,
  LuShield, LuEye, LuEyeOff, LuUsers
} from 'react-icons/lu';
import { useToast, ToastContainer } from '../../components/Common/Toast';

export default function CooperativeLeaderProfile({ user, onLogout, onBack, lang, setLang }) {
  const t = T[lang];
  const { toasts, showToast, removeToast } = useToast();
  const [mode, setMode] = useState('view'); // 'view', 'edit', 'change-password'
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Edit profile state
  const [name, setName] = useState(user.name || user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const initials = (user.name || user.full_name || 'CL').split(' ').map(n => n[0]).join('').toUpperCase();

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      showToast(lang === 'en' ? 'Name is required' : 'Izina rirakenewe', 'warning');
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      showToast(lang === 'en' ? 'Valid email is required' : 'Imeri ifite uburyo bukwiye irakenewe', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/update-farmer-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: user.farmer_id,
          full_name: name,
          email,
          phone
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        showToast(lang === 'en' ? 'Profile updated successfully!' : 'Umwirondoro wahinduwe neza!', 'success');
        // Update user object
        user.name = name;
        user.full_name = name;
        user.email = email;
        user.phone = phone;
        setTimeout(() => setMode('view'), 2000);
      } else {
        showToast(data.error || (lang === 'en' ? 'Update failed' : 'Guhindura byanze'), 'error');
      }
    } catch (e) {
      showToast(lang === 'en' ? 'Network error' : 'Ikosa ryo kuri network', 'error');
    }
    
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(lang === 'en' ? 'All fields are required' : 'Byose birakenewe', 'warning');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast(lang === 'en' ? 'Passwords do not match' : 'Ibanga ntabwo rihuye', 'warning');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast(lang === 'en' ? 'Password must be at least 6 characters' : 'Ibanga rigomba kuba nibura 6', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || user.farmer_id,
          role: user.role || 'farmer',
          old_password: currentPassword,
          new_password: newPassword
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        showToast(lang === 'en' ? 'Password changed successfully!' : 'Ijambo ryibanga ryahinduwe neza!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setMode('view'), 2000);
      } else {
        showToast(data.error || (lang === 'en' ? 'Password change failed' : 'Guhindura ijambo ryanze'), 'error');
      }
    } catch (e) {
      showToast(lang === 'en' ? 'Network error' : 'Ikosa ryo kuri network', 'error');
    }
    
    setLoading(false);
  };

  if (mode === 'edit') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 16px' }}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <button 
          onClick={() => setMode('view')}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#334155'
          }}
        >
          ← {lang === 'en' ? 'Back' : 'Subira'}
        </button>

        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px 24px',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#e0f2fe',
              color: '#0891b2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LuPencilLine size={22} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {lang === 'en' ? 'Edit Profile' : 'Hindura Umwirondoro'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {lang === 'en' ? 'Update your personal information' : 'Hindura amakuru yawe'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'Full Name' : 'Izina Ryuzuye'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0891b2'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'Email Address' : 'Aderesi ya Imeri'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0891b2'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'Phone Number' : 'Nimero ya Telefone'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="250..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0891b2'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: '#0891b2',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              {loading ? (lang === 'en' ? 'Saving...' : 'Kubika...') : (lang === 'en' ? 'Save Changes' : 'Bika Impinduka')}
            </button>
            <button
              onClick={() => setMode('view')}
              style={{
                padding: '14px 20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 12,
                color: '#64748b',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {lang === 'en' ? 'Cancel' : 'Hagarika'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'change-password') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 16px' }}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <button 
          onClick={() => setMode('view')}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#334155'
          }}
        >
          ← {lang === 'en' ? 'Back' : 'Subira'}
        </button>

        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px 24px',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#fef3c7',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LuKey size={22} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {lang === 'en' ? 'Change Password' : 'Hindura Ijambo Ryibanga'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {lang === 'en' ? 'Update your account password' : 'Hindura ijambo ryibanga rya konti yawe'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'Current Password' : 'Ijambo Ryibanga Rya None'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showPasswords ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'New Password' : 'Ijambo Ryibanga Rishya'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'Confirm New Password' : 'Emeza Ijambo Ryibanga Rishya'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: '#f59e0b',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? (lang === 'en' ? 'Changing...' : 'Guhindura...') : (lang === 'en' ? 'Change Password' : 'Hindura Ijambo')}
            </button>
            <button
              onClick={() => setMode('view')}
              style={{
                padding: '14px 20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 12,
                color: '#64748b',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {lang === 'en' ? 'Cancel' : 'Hagarika'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View mode - main profile screen
  const personalInfo = [
    { icon: <LuUser size={20} />, key: lang === 'en' ? 'Full Name' : 'Izina', val: user.name || user.full_name, color: '#6366f1' },
    { icon: <LuMail size={20} />, key: lang === 'en' ? 'Email' : 'Imeri', val: user.email, color: '#f59e0b' },
    { icon: <LuPhone size={20} />, key: lang === 'en' ? 'Phone' : 'Telefone', val: user.phone || (lang === 'en' ? 'Not set' : 'Ntibashyizweho'), color: '#10b981' },
    { icon: <LuIdCard size={20} />, key: lang === 'en' ? 'Farmer ID' : 'ID', val: user.farmer_id, color: '#8b5cf6' },
    { icon: <LuUsers size={20} />, key: lang === 'en' ? 'Cooperative' : 'Koperative', val: user.cooperative_name || 'N/A', color: '#0891b2' },
    { icon: <LuShield size={20} />, key: lang === 'en' ? 'Role' : 'Uruhare', val: lang === 'en' ? 'Cooperative Leader' : 'Umuyobozi wa Koperative', color: '#059669' },
    { icon: <LuMapPin size={20} />, key: lang === 'en' ? 'Location' : 'Ahantu', val: `${user.cell_name || ''} ${user.village_name || ''}`.trim() || 'Bugesera', color: '#0d9488' },
  ];

  const settingsItems = [
    { label: lang === 'en' ? 'Edit Profile' : 'Hindura Umwirondoro', action: () => setMode('edit'), icon: <LuPencilLine size={20} />, color: '#0891b2' },
    { label: lang === 'en' ? 'Change Password' : 'Hindura Ijambo Ryibanga', action: () => setMode('change-password'), icon: <LuKey size={20} />, color: '#f59e0b' },
    { label: `${lang === 'en' ? 'Language' : 'Ururimi'} (${lang === "en" ? "English" : "Kinyarwanda"})`, action: () => setLang(l => l === "en" ? "rw" : "en"), icon: <LuGlobe size={20} />, color: '#8b5cf6' },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 16px' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {onBack && (
        <button 
          onClick={onBack}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#334155'
          }}
        >
          ← {lang === 'en' ? 'Back to Dashboard' : 'Subira ku kibaho'}
        </button>
      )}

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
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          fontWeight: 800,
          margin: '0 auto 16px',
          boxShadow: '0 8px 16px rgba(8, 145, 178, 0.3)'
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
          background: '#e0f2fe',
          padding: '6px 16px',
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 700,
          color: '#0891b2',
          border: '1px solid #bae6fd',
          marginBottom: 8
        }}>
          <LuUsers size={14} />
          {lang === 'en' ? 'Cooperative Leader' : 'Umuyobozi wa Koperative'}
        </div>
        <div style={{
          fontSize: 12,
          color: '#94a3b8',
          marginTop: 4
        }}>
          {user.farmer_id}
        </div>
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
          {lang === 'en' ? 'Personal Information' : 'Amakuru Yihariye'}
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
          {lang === 'en' ? 'Settings' : 'Igenamiterere'}
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
              onClick={item.action}
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
        {lang === 'en' ? 'Logout' : 'Sohoka'}
      </button>
    </div>
  );
}

