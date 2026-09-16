import React, { useState, useEffect, lazy } from 'react';
import { T, API_BASE } from '../../constants/constants';
import Sidebar from '../../components/Common/Sidebar';
import Topbar from '../../components/Common/Topbar';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { useToast, ToastContainer } from '../../components/Common/Toast';
import CooperativeReports from './CooperativeReports';
import CooperativeLeaderProfile from './CooperativeLeaderProfile';
import NotificationsScreen from '../Farmer/NotificationsScreen';
import { 
  LuUsers, LuLandPlot, LuTrendingUp, LuActivity,
  LuUser, LuPhone, LuMail, LuMapPin, LuClock, 
  LuCircleCheck, LuCircleX
} from 'react-icons/lu';

// Lazy load the other components
const SeasonConfiguration = lazy(() => import('./SeasonConfiguration'));
const WeatherScreen = lazy(() => import('../Farmer/WeatherScreen'));
const TipsScreen = lazy(() => import('../Farmer/TipsScreen'));
const HistoryScreen = lazy(() => import('../Farmer/HistoryScreen'));

export default function CooperativeLeaderDashboard({ user, onLogout, lang, setLang }) {
  const t = T[lang];
  const { toasts, showToast, removeToast } = useToast();

  // Debug user object
  console.log('CooperativeLeaderDashboard render - User:', JSON.stringify(user, null, 2));

  // Early return if user data is invalid
  if (!user) {
    console.log('CooperativeLeaderDashboard: No user data');
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Loading user data...</h2>
      </div>
    );
  }

  const cooperativeId = user?.cooperative_id || user?.cooperativeId;
  const cooperativeName = user?.cooperative_name || user?.cooperativeName || 'Your Cooperative';

  // Debug logging
  console.log('CooperativeLeaderDashboard - User object:', user);
  console.log('CooperativeLeaderDashboard - Cooperative ID:', cooperativeId);

  if (!cooperativeId) {
    console.log('CooperativeLeaderDashboard: No cooperative ID found, user data:', user);
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Error: No cooperative ID found</h2>
        <p>User data: {JSON.stringify(user)}</p>
        <button onClick={onLogout}>Back to Login</button>
      </div>
    );
  }

  const [confirmConfig, setConfirmConfig] = useState(null);
  const [currentView, setCurrentView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalLandHa: 0,
    totalPredictions: 0,
    avgYieldKgAre: 0
  });
  const [cropBreakdown, setCropBreakdown] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [cooperativePredictions, setCooperativePredictions] = useState([]);
  const [error, setError] = useState(null);


  useEffect(() => {
    console.log('CooperativeLeaderDashboard useEffect triggered:', { cooperativeId, user });
    
    if (!cooperativeId || !user) {
      console.warn('Missing cooperativeId or user data:', { cooperativeId, user });
      return;
    }
    
    const initializeDashboard = async () => {
      try {
        console.log('Initializing cooperative dashboard with:', { cooperativeId, user });
        
        await Promise.all([
          fetchCooperativeData(),
          fetchPendingMembers(),
          fetchNotifications(),
          fetchCooperativePredictions()
        ]);
        
        console.log('Dashboard initialization completed');
      } catch (err) {
        console.error('Dashboard initialization failed:', err);
        setError(err.message);
        showToast(`Initialization error: ${err.message}`, 'error');
      }
    };
    
    initializeDashboard();
  }, [cooperativeId, user]);

  const fetchCooperativeData = async () => {
    if (!cooperativeId) {
      console.error('fetchCooperativeData: No cooperative ID available');
      setLoading(false);
      return;
    }

    setLoading(true);
    const url = `${API_BASE}/api/cooperative-dashboard/${cooperativeId}`;
    console.log('fetchCooperativeData: Making request to:', url);
    
    try {
      console.log('Fetching cooperative data for ID:', cooperativeId);
      const res = await fetch(url);
      console.log('fetchCooperativeData response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Cooperative data received:', data);
      
      if (data.success) {
        setMembers(data.members || []);
        setStats(data.stats || stats);
        setCropBreakdown(data.cropBreakdown || []);
      } else {
        console.error('API returned error:', data.error);
        showToast(data.error || 'Failed to fetch cooperative data', 'error');
      }
    } catch (e) {
      console.error('Failed to fetch cooperative data:', e);
      showToast(`Network error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const fetchPendingMembers = async () => {
    if (!cooperativeId) {
      console.error('fetchPendingMembers: No cooperative ID available');
      return;
    }

    const url = `${API_BASE}/api/cooperative/pending-members/${cooperativeId}`;
    console.log('fetchPendingMembers: Making request to:', url);

    try {
      console.log('Fetching pending members for cooperative ID:', cooperativeId);
      const res = await fetch(url);
      console.log('fetchPendingMembers response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Pending members received:', data);
      
      if (data.success) {
        setPendingMembers(data.pending_members || []);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (e) {
      console.error('Failed to fetch pending members:', e);
    }
  };

  const handleApproveMember = async (farmerId) => {
    const member = pendingMembers.find(m => m.farmer_id === farmerId);
    setConfirmConfig({
      type: 'success',
      title: lang === 'en' ? 'Approve Member' : 'Kwemera Umunyamuryango',
      message: lang === 'en'
        ? `Are you sure you want to approve ${member?.full_name || 'this member'}?`
        : `Uremeza kwemera ${member?.full_name || 'uyu munyamuryango'}?`,
      subMessage: lang === 'en'
        ? 'They will receive a confirmation email and can login immediately.'
        : 'Bazahamagara email yo kwemezwa kandi bazashobora kwinjira vuba.',
      confirmLabel: lang === 'en' ? 'Yes, Approve' : 'Yego, Kwemeza',
      cancelLabel: lang === 'en' ? 'Cancel' : 'Kureka',
      onConfirm: () => doApproveMember(farmerId),
    });
  };

  const doApproveMember = async (farmerId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cooperative/approve-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: farmerId, cooperative_id: cooperativeId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'en' ? 'Member approved successfully! A confirmation email has been sent.' : 'Umunyamuryango yemewe neza! Email y\'inyemeza yoherejwe.',
          'success'
        );
        fetchPendingMembers();
        fetchCooperativeData();
      } else {
        showToast(data.error || 'Failed to approve member', 'error');
      }
    } catch (e) {
      showToast('Connection error: ' + e.message, 'error');
    }
    setActionLoading(false);
  };

  const handleRejectMember = async () => {
    if (!rejectionReason.trim()) {
      showToast(
        lang === 'en' ? 'Please provide a rejection reason' : 'Tanga impamvu yo kwanga',
        'warning'
      );
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cooperative/reject-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmer_id: selectedFarmer.farmer_id, 
          cooperative_id: cooperativeId,
          rejection_reason: rejectionReason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'en' ? 'Member application rejected.' : 'Ubusabe bw\'umunyamuryango bwanzwe.',
          'info'
        );
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedFarmer(null);
        fetchPendingMembers();
      } else {
        showToast(data.error || 'Failed to reject member', 'error');
      }
    } catch (e) {
      showToast('Connection error: ' + e.message, 'error');
    }
    setActionLoading(false);
  };

  const fetchNotifications = async () => {
    const farmerId = user?.farmer_id || user?.id;
    if (!farmerId) {
      console.error('fetchNotifications: No farmer ID available in user object:', user);
      return;
    }

    try {
      console.log('Fetching notifications for farmer ID:', farmerId);
      const url = `${API_BASE}/api/notifications?farmer_id=${farmerId}`;
      console.log('Full URL:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Notifications received:', data);
      
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const fetchCooperativePredictions = async () => {
    if (!cooperativeId) {
      console.error('fetchCooperativePredictions: No cooperative ID available');
      return;
    }

    try {
      console.log('Fetching cooperative predictions for cooperative_id:', cooperativeId);
      const url = `${API_BASE}/api/cooperative/${cooperativeId}/predictions`;
      console.log('Full URL:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Cooperative predictions received:', data);
      
      if (data.success) {
        setCooperativePredictions(data.predictions || []);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (e) {
      console.error('Failed to fetch cooperative predictions:', e);
    }
  };

  const openRejectModal = (farmer) => {
    setSelectedFarmer(farmer);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  // ── View Rendering Functions ──────────────────────────────────────────────
  const renderOverviewView = () => (
    <>
      {/* Welcome Card */}
      <div className="modern-welcome-card" style={{ 
        padding: "20px 28px", 
        marginBottom: "24px", 
        background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)" 
      }}>
        <div className="welcome-content">
          <h2 className="welcome-greet" style={{ fontSize: "20px", color: "white" }}>
            {t.welcome}, <span style={{ color: "#e0f2fe" }}>{user.name?.split(" ")[0] || "Leader"}</span>!
          </h2>
          <p className="welcome-sub" style={{ marginBottom: 0, opacity: .9, color: "white" }}>
            {lang === "en" 
              ? `Managing ${cooperativeName} with ${stats.totalMembers} members`
              : `Gucunga ${cooperativeName} hamwe n'abanyamuryango ${stats.totalMembers}`}
          </p>
        </div>
        <div className="welcome-illustration" style={{ fontSize: "60px", opacity: 0.3 }}>
          <LuUsers size={60} color="white" />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {[
          {
            icon: <LuUsers size={24} />,
            color: '#0891b2',
            bg: '#e0f2fe',
            value: loading ? '...' : stats.totalMembers,
            label: lang === 'en' ? 'Total Members' : 'Abanyamuryango',
            unit: lang === 'en' ? 'farmers' : 'abahinzi'
          },
          {
            icon: <LuLandPlot size={24} />,
            color: '#059669',
            bg: '#d1fae5',
            value: loading ? '...' : stats.totalLandHa?.toFixed(2),
            label: lang === 'en' ? 'Total Land Area' : 'Ubuso Bwose',
            unit: 'ha'
          },
          {
            icon: <LuActivity size={24} />,
            color: '#f59e0b',
            bg: '#fef3c7',
            value: loading ? '...' : stats.totalPredictions,
            label: lang === 'en' ? 'Total Predictions' : 'Ibisobanuro Byose',
            unit: lang === 'en' ? 'predictions' : 'ibisobanuro'
          },
          {
            icon: <LuTrendingUp size={24} />,
            color: '#8b5cf6',
            bg: '#ede9fe',
            value: loading ? '...' : stats.avgYieldKgAre?.toFixed(1),
            label: lang === 'en' ? 'Avg Yield' : 'Umusaruro Hagati',
            unit: 'kg/are'
          }
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: kpi.bg,
              color: kpi.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 4
              }}>
                {kpi.value} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>{kpi.unit}</span>
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Crop Breakdown */}
      {cropBreakdown.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 24
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <LuActivity size={22} />
            {lang === 'en' ? 'Crop Production Breakdown' : 'Ibisobanuro by\'Ibihingwa'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cropBreakdown.map((crop, idx) => {
              const colors = { Maize: '#f59e0b', Rice: '#0d9488' };
              const color = colors[crop.crop_type] || '#64748b';
              const percentage = stats.totalPredictions > 0 
                ? ((crop.count / stats.totalPredictions) * 100).toFixed(0)
                : 0;
              
              return (
                <div key={idx}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: color
                      }}></div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                        {crop.crop_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                        {crop.totalYield?.toFixed(1)} kg/are avg
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                        {crop.count} {lang === 'en' ? 'predictions' : 'ibisobanuro'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: 10,
                    background: '#f1f5f9',
                    borderRadius: 99,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: color,
                      borderRadius: 99,
                      transition: 'width 1s ease'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Members Section */}
      {pendingMembers.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #fbbf24',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 24
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LuClock size={22} style={{ color: '#f59e0b' }} />
              {lang === 'en' ? 'Pending Approval' : 'Gutegereza Kwemezwa'}
            </span>
            <span style={{
              background: '#fef3c7',
              color: '#f59e0b',
              padding: '4px 12px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700
            }}>
              {pendingMembers.length} {lang === 'en' ? 'pending' : 'gutegereza'}
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingMembers.slice(0, 3).map((member, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 12
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {(member.full_name || 'F').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: 4
                  }}>
                    {member.full_name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}>
                    {member.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LuPhone size={12} />
                        {member.phone}
                      </span>
                    )}
                    {member.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LuMail size={12} />
                        {member.email}
                      </span>
                    )}
                    {member.cell_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LuMapPin size={12} />
                        {member.cell_name}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: 8
                }}>
                  <button
                    onClick={() => handleApproveMember(member.farmer_id)}
                    disabled={actionLoading}
                    style={{
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    <LuCircleCheck size={16} />
                    {lang === 'en' ? 'Approve' : 'Kwemeza'}
                  </button>
                  <button
                    onClick={() => openRejectModal(member)}
                    disabled={actionLoading}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    <LuCircleX size={16} />
                    {lang === 'en' ? 'Reject' : 'Kwanga'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pendingMembers.length > 3 && (
            <button
              onClick={() => setCurrentView('pending')}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '12px',
                background: 'transparent',
                border: '2px solid #fbbf24',
                borderRadius: 8,
                color: '#f59e0b',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {lang === 'en' ? `View All ${pendingMembers.length} Pending Requests` : `Reba Byose ${pendingMembers.length}`}
            </button>
          )}
        </div>
      )}
    </>
  );

  const renderMembersView = () => (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 16,
      padding: '24px',
      marginBottom: 24
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LuUsers size={22} />
          {lang === 'en' ? 'Cooperative Members' : 'Abanyamuryango ba Koperative'}
        </span>
        <span style={{
          background: '#e0f2fe',
          color: '#0891b2',
          padding: '4px 12px',
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 700
        }}>
          {members.length} {lang === 'en' ? 'members' : 'abanyamuryango'}
        </span>
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div className="spin" style={{ margin: '0 auto 10px' }}></div>
          {lang === 'en' ? 'Loading members...' : 'Gutegura abanyamuryango...'}
        </div>
      ) : members.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#94a3b8',
          fontSize: 14
        }}>
          <LuUsers size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div>{lang === 'en' ? 'No members yet' : 'Nta banyamuryango'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.map((member, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#0891b2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0
              }}>
                {(member.full_name || 'F').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 4
                }}>
                  {member.full_name}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  {member.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LuPhone size={12} />
                      {member.phone}
                    </span>
                  )}
                  {member.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LuMail size={12} />
                      {member.email}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4
              }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#059669'
                }}>
                  {member.farm_size_ha?.toFixed(2) || '0.00'} ha
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {lang === 'en' ? 'Land Size' : 'Ubuso'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPendingView = () => (
    <div style={{
      background: 'white',
      border: '2px solid #fbbf24',
      borderRadius: 16,
      padding: '24px',
      marginBottom: 24
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LuClock size={22} style={{ color: '#f59e0b' }} />
          {lang === 'en' ? 'Pending Approval Requests' : 'Ibyasabwe Gutegereza Kwemezwa'}
        </span>
        <span style={{
          background: '#fef3c7',
          color: '#f59e0b',
          padding: '4px 12px',
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 700
        }}>
          {pendingMembers.length} {lang === 'en' ? 'pending' : 'gutegereza'}
        </span>
      </h3>

      {pendingMembers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#94a3b8',
          fontSize: 14
        }}>
          <LuClock size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div>{lang === 'en' ? 'No pending requests' : 'Nta byasabwe'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingMembers.map((member, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 12
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0
              }}>
                {(member.full_name || 'F').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 4
                }}>
                  {member.full_name}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  {member.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LuPhone size={12} />
                      {member.phone}
                    </span>
                  )}
                  {member.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LuMail size={12} />
                      {member.email}
                    </span>
                  )}
                  {member.cell_name && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LuMapPin size={12} />
                      {member.cell_name}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: 8
              }}>
                <button
                  onClick={() => handleApproveMember(member.farmer_id)}
                  disabled={actionLoading}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  <LuCircleCheck size={16} />
                  {lang === 'en' ? 'Approve' : 'Kwemeza'}
                </button>
                <button
                  onClick={() => openRejectModal(member)}
                  disabled={actionLoading}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  <LuCircleX size={16} />
                  {lang === 'en' ? 'Reject' : 'Kwanga'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSeasonConfigView = () => (
    <React.Suspense fallback={
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="spin" style={{ margin: '0 auto' }}></div>
      </div>
    }>
      <SeasonConfiguration user={user} lang={lang} />
    </React.Suspense>
  );

  const renderReportsView = () => (
    <CooperativeReports user={user} lang={lang} />
  );

  const renderProfileView = () => (
    <CooperativeLeaderProfile 
      user={user} 
      onLogout={onLogout} 
      lang={lang} 
      setLang={setLang} 
    />
  );

  const renderHistoryView = () => (
    <React.Suspense fallback={
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="spin" style={{ margin: '0 auto' }}></div>
      </div>
    }>
      <HistoryScreen 
        user={user} 
        lang={lang} 
        setLang={setLang}
        hideLangBtn={true}
        predictions={cooperativePredictions}
        onNavigate={(view) => setCurrentView(view)}
      />
    </React.Suspense>
  );

  const renderWeatherView = () => (
    <React.Suspense fallback={
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="spin" style={{ margin: '0 auto' }}></div>
      </div>
    }>
      <WeatherScreen user={user} lang={lang} setLang={setLang} hideLangBtn={true} />
    </React.Suspense>
  );

  const renderTipsView = () => (
    <React.Suspense fallback={
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="spin" style={{ margin: '0 auto' }}></div>
      </div>
    }>
      <TipsScreen user={user} lang={lang} setLang={setLang} hideLangBtn={true} />
    </React.Suspense>
  );

  const renderNotificationsView = () => (
    <NotificationsScreen 
      user={user} 
      lang={lang} 
      setLang={setLang}
      hideLangBtn={true}
      notifications={notifications}
      setNotifications={setNotifications}
      onNavigate={(view) => setCurrentView(view)}
    />
  );

  // Error state display
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Dashboard Error</h2>
        <p style={{ color: 'red', marginBottom: 20 }}>{error}</p>
        <button onClick={() => {
          setError(null);
          window.location.reload();
        }}>
          Retry
        </button>
        <br />
        <button onClick={onLogout} style={{ marginTop: 10 }}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="web-layout">
      <Sidebar
        current={currentView}
        onNavigate={(view) => setCurrentView(view)}
        user={user}
        onLogout={onLogout}
        lang={lang}
        setLang={setLang}
      />
      <div className="main-content">
        <div className="shell">
          <Topbar
            title={
              <div className="dash-header-clean">
                <span className="dash-header-icon" style={{ background: '#e0f2fe', color: '#0891b2' }}>
                  <LuUsers size={24} />
                </span>
                <div className="dash-header-text">
                  <h1 className="dash-title">
                    {lang === "en" ? "Cooperative Leader Dashboard" : "Incumbane y'Umuyobozi wa Koperative"}
                  </h1>
                  <p className="dash-subtitle">{cooperativeName}</p>
                </div>
              </div>
            }
            lang={lang}
            setLang={setLang}
            actions={
              <button className="dash-action-btn" onClick={onLogout} title={t.logout}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            }
          />

          <div className="scroll fade-up">
            {/* Render view based on currentView */}
            {currentView === 'overview' && renderOverviewView()}
            {currentView === 'members' && renderMembersView()}
            {currentView === 'pending' && renderPendingView()}
            {currentView === 'season-config' && renderSeasonConfigView()}
            {currentView === 'history' && renderHistoryView()}
            {currentView === 'weather' && renderWeatherView()}
            {currentView === 'tips' && renderTipsView()}
            {currentView === 'notifications' && renderNotificationsView()}
            {currentView === 'reports' && renderReportsView()}
            {currentView === 'profile' && renderProfileView()}
          </div>
        </div>
      </div>
      
      {/* Rejection Modal */}
      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              background: 'white', borderRadius: 20, padding: '32px 28px',
              maxWidth: 460, width: '90%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#fee2e2', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  {lang === 'en' ? 'Reject Application' : 'Kwanga Ubusabe'}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  {selectedFarmer?.full_name}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
              {lang === 'en'
                ? 'Please provide a reason. This will be sent to the applicant via email.'
                : 'Tanga impamvu. Izohererezwa umusaba kuri email.'}
            </p>

            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Farm size does not meet minimum requirements...' : 'Urugero: Ubuso bw\'umuhinzi ntibuhagije...'}
              style={{
                width: '100%', minHeight: 110,
                padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 12,
                fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', marginBottom: 22,
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                disabled={actionLoading}
                style={{
                  background: '#f1f5f9', color: '#64748b', border: 'none',
                  borderRadius: 10, padding: '11px 22px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {lang === 'en' ? 'Cancel' : 'Kureka'}
              </button>
              <button
                onClick={handleRejectMember}
                disabled={actionLoading || !rejectionReason.trim()}
                style={{
                  background: actionLoading || !rejectionReason.trim()
                    ? '#fca5a5' : 'linear-gradient(135deg,#dc2626,#ef4444)',
                  color: 'white', border: 'none',
                  borderRadius: 10, padding: '11px 22px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                }}
              >
                {actionLoading
                  ? (lang === 'en' ? 'Rejecting…' : 'Kureka…')
                  : (lang === 'en' ? 'Reject Member' : 'Kwanga Umunyamuryango')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog (replaces window.confirm) */}
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />

      {/* Toast notifications (replaces alert) */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
