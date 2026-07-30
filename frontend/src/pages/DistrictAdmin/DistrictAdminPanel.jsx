import React, { useState, useEffect } from 'react';
import { T, API_BASE, SECTORS } from '../../constants/constants';

export default function DistrictAdminPanel({ user, lang }) {
  const t = T[lang];
  const [activeTab, setActiveTab] = useState('staff'); // 'staff', 'farmers', 'cooperatives'
  
  // Staff Management State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [officerRole, setOfficerRole] = useState('sector'); // 'sector' or 'admin'
  const [sector, setSector] = useState(SECTORS[0]);
  const dept = 'Crop Production';
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [filterRole, setFilterRole] = useState('all');
  const [searchOfficer, setSearchOfficer] = useState('');

  // Farmers State
  const [farmers, setFarmers] = useState([]);
  const [searchFarmer, setSearchFarmer] = useState('');

  // Cooperatives State
  const [cooperatives, setCooperatives] = useState([]);
  const [coopName, setCoopName] = useState('');
  const [coopContact, setCoopContact] = useState('');
  const [coopPhone, setCoopPhone] = useState('');
  const [coopEmail, setCoopEmail] = useState('');
  const [coopLoading, setCoopLoading] = useState(false);
  const [coopStatus, setCoopStatus] = useState(null);

  useEffect(() => {
    if (activeTab === 'staff') fetchOfficers();
    if (activeTab === 'farmers') fetchFarmers();
    if (activeTab === 'cooperatives') fetchCooperatives();
  }, [activeTab]);

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF MANAGEMENT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const checkEmail = async (emailVal) => {
    if (!emailVal || !emailVal.includes('@')) return;
    try {
      const res = await fetch(`${API_BASE}/api/check-email?email=${encodeURIComponent(emailVal.trim().toLowerCase())}`);
      const data = await res.json();
      if (data.exists) {
        setStatus({ type: 'err', msg: "This email is already taken. Please use another email." });
      } else if (status && status.msg === "This email is already taken. Please use another email.") {
        setStatus(null);
      }
    } catch (e) {
      console.log("Email check error:", e);
    }
  };

  const fetchOfficers = async () => {
    try {
      const requester = user?.id || user?.officer_id || '';
      const res = await fetch(`${API_BASE}/api/officers?requester_id=${requester}`);
      const data = await res.json();
      if (data.success) setOfficers(data.officers);
    } catch (e) {
      console.log("Error fetching officers:", e);
    }
  };

  const handleRegisterOfficer = async () => {
    if (!name.trim() || !email.trim() || (officerRole === 'sector' && !sector.trim())) {
      return setStatus({ type: 'err', msg: t.allRequired || 'Please fill in all required fields.' });
    }
    if (!email.includes('@')) {
      return setStatus({ type: 'err', msg: 'Please enter a valid email address.' });
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          role: officerRole === 'admin' ? 'district' : 'sector',
          sector: officerRole === 'sector' ? sector : 'Gashora',
          department: dept
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'ok', msg: t.officerRegistered || `Officer registered successfully!` });
        setName(''); setEmail(''); setPhone(''); setOfficerRole('sector');
        fetchOfficers();
      } else {
        setStatus({ type: 'err', msg: data.error || 'Registration failed.' });
      }
    } catch (e) {
      setStatus({ type: 'err', msg: 'Server connection failed.' });
    }
    setLoading(false);
    setTimeout(() => setStatus(null), 5000);
  };

  const handleToggleOfficerStatus = async (officerId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const res = await fetch(`${API_BASE}/api/admin/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: officerId, role: 'officer', status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOfficers();
      }
    } catch (e) {
      console.log("Error toggling officer status:", e);
    }
  };

  const handleDeleteOfficer = async (officerId) => {
    if (!confirm('Are you sure you want to delete this officer?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/officers/${officerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchOfficers();
      }
    } catch (e) {
      console.log("Error deleting officer:", e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FARMERS MANAGEMENT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchFarmers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/all-farmers`);
      const data = await res.json();
      if (data.success) setFarmers(data.farmers);
    } catch (e) {
      console.log("Error fetching farmers:", e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COOPERATIVES MANAGEMENT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchCooperatives = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cooperatives`);
      const data = await res.json();
      if (data.success) setCooperatives(data.cooperatives);
    } catch (e) {
      console.log("Error fetching cooperatives:", e);
    }
  };

  const handleCreateCooperative = async () => {
    if (!coopName.trim()) {
      return setCoopStatus({ type: 'err', msg: 'Cooperative name is required.' });
    }
    setCoopLoading(true);
    setCoopStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/cooperatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: coopName,
          contact_person: coopContact,
          contact_phone: coopPhone,
          contact_email: coopEmail
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoopStatus({ type: 'ok', msg: 'Cooperative created successfully!' });
        setCoopName(''); setCoopContact(''); setCoopPhone(''); setCoopEmail('');
        fetchCooperatives();
      } else {
        setCoopStatus({ type: 'err', msg: data.error || 'Failed to create cooperative.' });
      }
    } catch (e) {
      setCoopStatus({ type: 'err', msg: 'Server connection failed.' });
    }
    setCoopLoading(false);
    setTimeout(() => setCoopStatus(null), 5000);
  };

  const handleDeleteCooperative = async (coopId) => {
    if (!confirm('Are you sure you want to delete this cooperative?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/cooperatives/${coopId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCooperatives();
      } else {
        alert(data.error || 'Cannot delete cooperative with active members.');
      }
    } catch (e) {
      console.log("Error deleting cooperative:", e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredOfficers = officers.filter(o => {
    // Match 'district' filter with both 'district' and 'admin' roles (they are the same)
    const matchRole = filterRole === 'all' || o.role === filterRole || (filterRole === 'district' && o.role === 'admin');
    const matchSearch = !searchOfficer || o.name.toLowerCase().includes(searchOfficer.toLowerCase()) || (o.sector || '').toLowerCase().includes(searchOfficer.toLowerCase());
    return matchRole && matchSearch;
  });

  const filteredFarmers = farmers.filter(f => {
    return !searchFarmer || f.full_name?.toLowerCase().includes(searchFarmer.toLowerCase()) || f.email?.toLowerCase().includes(searchFarmer.toLowerCase());
  });

  const roleBadge = (r) => {
    if (r === 'district' || r === 'admin') return <span className="badge bg-blue">System Admin</span>;
    if (r === 'sector') return <span className="badge bg-green">Sector Officer</span>;
    return <span className="badge bg-amber">{r}</span>;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fade-up" style={{ paddingBottom: 40 }}>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--s200)', paddingBottom: 0 }}>
        {[
          { key: 'staff', icon: 'bi-people-fill', label: lang === 'en' ? 'Staff & Officers' : 'Abakozi' },
          { key: 'farmers', icon: 'bi-person-lines-fill', label: lang === 'en' ? 'All Farmers' : 'Abahinzi Bose' },
          { key: 'cooperatives', icon: 'bi-building', label: lang === 'en' ? 'Cooperatives' : 'Amakoperative' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.key ? '#0d9488' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--s600)',
              fontWeight: 700,
              fontSize: 14,
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              bottom: activeTab === tab.key ? '-2px' : '0',
              borderBottom: activeTab === tab.key ? '2px solid #0d9488' : 'none'
            }}
          >
            <i className={`bi ${tab.icon}`} style={{ marginRight: 8 }}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STAFF & OFFICERS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'staff' && (
        <>
          {/* Register Form */}
          <div className="sec-hd">
            <i className="bi bi-person-plus"></i> {lang === 'en' ? 'Register New Staff' : 'Andika Umukozi Mushya'}
          </div>
          <div className="card" style={{ marginBottom: 28 }}>

            {status && (
              <div style={{
                marginBottom: 14, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: status.type === 'ok' ? '#ccfbf1' : 'var(--red-l)',
                color: status.type === 'ok' ? '#0f766e' : 'var(--red-d)',
                border: `1px solid ${status.type === 'ok' ? '#99f6e4' : 'transparent'}`,
              }}>
                <i className={`bi bi-${status.type === 'ok' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>{' '}
                {status.msg}
              </div>
            )}

            {/* Officer Role Selection */}
            <div className="fgrp" style={{ marginBottom: 16 }}>
              <label className="flabel">{lang === 'en' ? 'Officer Role' : 'Inshingano'} *</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="officer_role"
                    value="sector"
                    checked={officerRole === 'sector'}
                    onChange={e => setOfficerRole(e.target.value)}
                    style={{ accentColor: 'var(--g700)' }}
                  />
                  <span style={{ fontSize: 14 }}>{lang === 'en' ? 'Sector Officer (Agronomist)' : 'Ofisiye w\'Umurenge'}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="officer_role"
                    value="admin"
                    checked={officerRole === 'admin'}
                    onChange={e => setOfficerRole(e.target.value)}
                    style={{ accentColor: 'var(--g700)' }}
                  />
                  <span style={{ fontSize: 14 }}>{lang === 'en' ? 'System Administrator' : 'Umuyobozi Mukuru'}</span>
                </label>
              </div>
            </div>

            {/* Row 1: Full Name + Email */}
            <div className="frow">
              <div className="fgrp">
                <label className="flabel">{t.fullName || 'Full Name'} *</label>
                <input
                  className="finput"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Marie Uwase"
                />
              </div>
              <div className="fgrp">
                <label className="flabel">{t.emailLabel || 'Email Address'} *</label>
                <input
                  className="finput"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={e => checkEmail(e.target.value)}
                  placeholder="officer@sector.gov.rw"
                />
              </div>
            </div>

            {/* Row 2: Phone + Assigned Sector (only for sector officers) */}
            <div className="frow">
              <div className="fgrp">
                <label className="flabel">{t.phoneReg || 'Phone Number'}</label>
                <input
                  className="finput"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+250 78..."
                />
              </div>
              {officerRole === 'sector' && (
                <div className="fgrp">
                  <label className="flabel">{t.assignedSector || 'Assigned Sector'} *</label>
                  <select className="finput" value={sector} onChange={e => setSector(e.target.value)}>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{
              background: 'var(--s50)', border: '1px solid var(--s200)',
              borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--s600)', marginBottom: 14,
            }}>
              <i className="bi bi-info-circle"></i>{' '}
              {lang === 'en'
                ? <>A default password <strong>harvest2024</strong> will be assigned. Login credentials will be sent to the officer's email.</>
                : <>Ijambo ry'ibanga <strong>harvest2024</strong> rizashyirwa. Amakuru yo kwinjira azohererezwa kuri email y'ofisiye.</>}
            </div>

            <button className="btn btn-primary" onClick={handleRegisterOfficer} disabled={loading} style={{ marginTop: 4 }}>
              {loading
                ? <><i className="bi bi-arrow-repeat spin"></i> {lang === 'en' ? 'Registering…' : 'Kwandika…'}</>
                : <><i className="bi bi-person-plus"></i> {lang === 'en' ? 'Register Staff' : 'Andika Umukozi'}</>}
            </button>
          </div>

          {/* Officers List */}
          <div className="sec-hd"><i className="bi bi-people"></i> {lang === 'en' ? 'Active Staff' : 'Abakozi Bakora'}</div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="finput"
              style={{ flex: 1, minWidth: 180, maxWidth: 300, marginBottom: 0 }}
              placeholder="Search by name or sector…"
              value={searchOfficer}
              onChange={e => setSearchOfficer(e.target.value)}
            />
            <div className="toggle-group" style={{ flex: 'none' }}>
              {[['all', 'All'], ['sector', 'Sector'], ['district', 'Admin']].map(([k, label]) => (
                <button
                  key={k}
                  className={`toggle-opt ${filterRole === k ? 'sel' : ''}`}
                  style={{ padding: '9px 14px', fontSize: 12 }}
                  onClick={() => setFilterRole(k)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                <thead style={{ background: 'var(--s100)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Sector / Dept</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOfficers.map((o, i) => (
                    <tr key={o.id || i} style={{ borderTop: '1px solid var(--s200)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--g100)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 14, color: 'var(--g700)', flexShrink: 0
                          }}>
                            <i className="bi bi-person"></i>
                          </div>
                          <div>
                            <div>{o.name}</div>
                            <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--s400)' }}>{o.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{roleBadge(o.role)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        {o.role === 'sector' ? o.sector : o.department}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${o.is_active === 1 ? 'bg-green' : 'bg-amber'}`}>
                          <i className="bi bi-circle-fill" style={{ fontSize: 7 }}></i> {o.is_active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleToggleOfficerStatus(o.id, o.is_active)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 11,
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: 6,
                              background: o.is_active === 1 ? '#fef3c7' : '#ccfbf1',
                              color: o.is_active === 1 ? '#92400e' : '#0f766e',
                              cursor: 'pointer'
                            }}
                          >
                            {o.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteOfficer(o.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: 11,
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: 6,
                              background: '#fee2e2',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOfficers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--s400)' }}>
                        <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 10 }}></i>
                        No officers match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--s400)', textAlign: 'center' }}>
            <i className="bi bi-people"></i> {filteredOfficers.length} officer{filteredOfficers.length !== 1 ? 's' : ''} listed
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ALL FARMERS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'farmers' && (
        <>
          <div className="sec-hd"><i className="bi bi-person-lines-fill"></i> {lang === 'en' ? 'All Registered Farmers' : 'Abahinzi Bose Biyandikishije'}</div>

          {/* Search */}
          <div style={{ marginBottom: 14 }}>
            <input
              className="finput"
              style={{ maxWidth: 400 }}
              placeholder="Search by name or email…"
              value={searchFarmer}
              onChange={e => setSearchFarmer(e.target.value)}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead style={{ background: 'var(--s100)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Farmer</th>
                    <th style={{ padding: '12px 16px' }}>Cell / Village</th>
                    <th style={{ padding: '12px 16px' }}>Farm Size</th>
                    <th style={{ padding: '12px 16px' }}>Cooperative</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((f, i) => (
                    <tr key={f.farmer_id || i} style={{ borderTop: '1px solid var(--s200)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        <div>
                          <div>{f.full_name}</div>
                          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--s400)' }}>{f.email} · {f.farmer_id}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        {f.cell_name} / {f.village_name}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        {f.farm_size_ha} ha
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        {f.cooperative_name || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${f.is_active === 1 ? 'bg-green' : 'bg-amber'}`}>
                          {f.is_active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredFarmers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--s400)' }}>
                        <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 10 }}></i>
                        No farmers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--s400)', textAlign: 'center' }}>
            <i className="bi bi-people"></i> {filteredFarmers.length} farmer{filteredFarmers.length !== 1 ? 's' : ''} listed
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* COOPERATIVES TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cooperatives' && (
        <>
          {/* Create Cooperative Form */}
          <div className="sec-hd">
            <i className="bi bi-building"></i> {lang === 'en' ? 'Create New Cooperative' : 'Kurema Ikoperative Nshya'}
          </div>
          <div className="card" style={{ marginBottom: 28 }}>

            {coopStatus && (
              <div style={{
                marginBottom: 14, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: coopStatus.type === 'ok' ? '#ccfbf1' : 'var(--red-l)',
                color: coopStatus.type === 'ok' ? '#0f766e' : 'var(--red-d)',
                border: `1px solid ${coopStatus.type === 'ok' ? '#99f6e4' : 'transparent'}`,
              }}>
                <i className={`bi bi-${coopStatus.type === 'ok' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>{' '}
                {coopStatus.msg}
              </div>
            )}

            <div className="frow">
              <div className="fgrp">
                <label className="flabel">{lang === 'en' ? 'Cooperative Name' : 'Izina rya Kooperative'} *</label>
                <input
                  className="finput"
                  value={coopName}
                  onChange={e => setCoopName(e.target.value)}
                  placeholder="e.g. Gashora Rice Cooperative"
                />
              </div>
              <div className="fgrp">
                <label className="flabel">{lang === 'en' ? 'Contact Person' : 'Umuntu wo Guhamagara'}</label>
                <input
                  className="finput"
                  value={coopContact}
                  onChange={e => setCoopContact(e.target.value)}
                  placeholder="e.g. Jean Habimana"
                />
              </div>
            </div>

            <div className="frow">
              <div className="fgrp">
                <label className="flabel">{lang === 'en' ? 'Contact Phone' : 'Telefone'}</label>
                <input
                  className="finput"
                  value={coopPhone}
                  onChange={e => setCoopPhone(e.target.value)}
                  placeholder="+250 78..."
                />
              </div>
              <div className="fgrp">
                <label className="flabel">{lang === 'en' ? 'Contact Email' : 'Email'}</label>
                <input
                  className="finput"
                  type="email"
                  value={coopEmail}
                  onChange={e => setCoopEmail(e.target.value)}
                  placeholder="contact@cooperative.rw"
                />
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleCreateCooperative} disabled={coopLoading} style={{ marginTop: 4 }}>
              {coopLoading
                ? <><i className="bi bi-arrow-repeat spin"></i> {lang === 'en' ? 'Creating…' : 'Kurema…'}</>
                : <><i className="bi bi-plus-circle"></i> {lang === 'en' ? 'Create Cooperative' : 'Kurema Ikoperative'}</>}
            </button>
          </div>

          {/* Cooperatives List */}
          <div className="sec-hd"><i className="bi bi-building"></i> {lang === 'en' ? 'Active Cooperatives' : 'Amakoperative Akora'}</div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 650 }}>
                <thead style={{ background: 'var(--s100)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Cooperative Name</th>
                    <th style={{ padding: '12px 16px' }}>Contact</th>
                    <th style={{ padding: '12px 16px' }}>Members</th>
                    <th style={{ padding: '12px 16px' }}>Total Farm (ha)</th>
                    <th style={{ padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cooperatives.map((coop, i) => (
                    <tr key={coop.cooperative_id || i} style={{ borderTop: '1px solid var(--s200)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        <div>
                          <div>{coop.cooperative_name}</div>
                          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--s400)' }}>ID: {coop.cooperative_id}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        <div>{coop.contact_person || '—'}</div>
                        <div style={{ fontSize: 10 }}>{coop.contact_phone || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        {coop.member_count || 0} farmers
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--s600)' }}>
                        {coop.total_farm_ha || 0} ha
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleDeleteCooperative(coop.cooperative_id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: 6,
                            background: '#fee2e2',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cooperatives.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--s400)' }}>
                        <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 10 }}></i>
                        No cooperatives found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--s400)', textAlign: 'center' }}>
            <i className="bi bi-building"></i> {cooperatives.length} cooperative{cooperatives.length !== 1 ? 's' : ''} listed
          </div>
        </>
      )}

    </div>
  );
}
