import React, { useState, useEffect } from 'react';
import { T, API_BASE } from '../../constants/constants';
import { LuBuilding2, LuUser } from 'react-icons/lu';

export default function SectorFarmers({ sectorName, sectorId, setSelectedFarmerId, lang }) {
  const t = T[lang];
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all'); // all, individual, cooperative

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/admin/sector-details/${sectorId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setFarmers(data.data.farmers || []);
        setLoading(false);
      })
      .catch(() => {
        setFarmers([]);
        setLoading(false);
      });
  }, [sectorId]);

  const filtered = farmers
    .filter(f => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (f.full_name || '').toLowerCase().includes(q) ||
        (f.farmer_id || f.id || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        (f.phone || '').includes(q);
      
      // Filter by farmer type
      const matchType = filterType === 'all' || 
        (filterType === 'cooperative' && f.is_cooperative_member === 1) ||
        (filterType === 'individual' && f.is_cooperative_member === 0);
      
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'size') return (b.farm_size_are || 0) - (a.farm_size_are || 0);
      if (sortBy === 'type') {
        // Sort cooperative first, then individual
        return (b.is_cooperative_member || 0) - (a.is_cooperative_member || 0);
      }
      return (a.full_name || '').localeCompare(b.full_name || '');
    });

  // Count farmers by type
  const cooperativeCount = farmers.filter(f => f.is_cooperative_member === 1).length;
  const individualCount = farmers.filter(f => f.is_cooperative_member === 0).length;

  const initials = (name) => (name || 'F').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColors = ['#0d9488', '#0d9488', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
  const avatarColor = (id) => avatarColors[(id || '').charCodeAt(0) % avatarColors.length];

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="so-page-header">
        <div>
          <h2 className="so-page-title">
            <i className="bi bi-people-fill"></i>
            {sectorName} {lang === 'en' ? 'Sector Farmers' : 'Abahinzi ba Umurenge'}
          </h2>
          <p className="so-page-sub">
            {loading ? '…' : (
              <>
                {filtered.length} {lang === 'en' ? 'farmers' : 'abahinzi'} 
                {filterType === 'all' && (
                  <span style={{ color: '#64748b', fontSize: 13, marginLeft: 6 }}>
                    ({cooperativeCount} {lang === 'en' ? 'cooperative' : 'ikoperative'}, {individualCount} {lang === 'en' ? 'individual' : 'bigenga'})
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="so-page-header-actions">
          <select className="so-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">{lang === 'en' ? 'Sort: Name' : 'Amazina'}</option>
            <option value="type">{lang === 'en' ? 'Sort: Type' : 'Ubwoko'}</option>
            <option value="size">{lang === 'en' ? 'Sort: Farm Size' : 'Ubuso'}</option>
          </select>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ marginBottom: 20 }}>
        <div className="so-list-search" style={{ marginBottom: 12 }}>
          <i className="bi bi-search"></i>
          <input
            className="so-search-input"
            placeholder={lang === 'en' ? 'Search by name, ID, phone or email…' : 'Shakisha izina, ID, telefone cyangwa email…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="so-search-clear" onClick={() => setSearch('')}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        {/* Farmer Type Filter Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            className={`so-filter-chip ${filterType === 'all' ? 'act' : ''}`}
            onClick={() => setFilterType('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <i className="bi bi-people"></i>
            {lang === 'en' ? 'All Farmers' : 'Abahinzi Bose'} ({farmers.length})
          </button>
          <button 
            className={`so-filter-chip ${filterType === 'cooperative' ? 'act' : ''}`}
            onClick={() => setFilterType('cooperative')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: filterType === 'cooperative' ? '#e0f2fe' : 'white',
              borderColor: filterType === 'cooperative' ? '#0891b2' : '#e2e8f0',
              color: filterType === 'cooperative' ? '#0891b2' : '#64748b'
            }}
          >
            <LuBuilding2 size={14} />
            {lang === 'en' ? 'Cooperative Members' : 'Abanyamuryango'} ({cooperativeCount})
          </button>
          <button 
            className={`so-filter-chip ${filterType === 'individual' ? 'act' : ''}`}
            onClick={() => setFilterType('individual')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: filterType === 'individual' ? '#f0fdf4' : 'white',
              borderColor: filterType === 'individual' ? '#059669' : '#e2e8f0',
              color: filterType === 'individual' ? '#059669' : '#64748b'
            }}
          >
            <LuUser size={14} />
            {lang === 'en' ? 'Individual Farmers' : 'Abahinzi Bigenga'} ({individualCount})
          </button>
        </div>
      </div>

      {/* Farmer Grid */}
      {loading ? (
        <div className="so-farmer-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="so-farmer-card so-skeleton-card">
              <div className="so-skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="so-skeleton" style={{ width: '70%', height: 14, marginBottom: 8 }} />
                <div className="so-skeleton" style={{ width: '50%', height: 11 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="so-empty-state">
          <i className="bi bi-person-x"></i>
          <p>{search || filterType !== 'all' ? (lang === 'en' ? 'No farmers match your filters' : 'Nta muhinzi uhuye n\'ubushakashatsi') : (lang === 'en' ? 'No farmers registered in this sector' : 'Nta bahinzi biyandikishije muri uyu murenge')}</p>
        </div>
      ) : (
        <div className="so-farmer-grid">
          {filtered.map(f => {
            const fid = f.farmer_id || f.id;
            const name = f.full_name || f.name || 'Unknown';
            const sizeAre = f.farm_size_are || 0;
            const sizeHa = (sizeAre / 100).toFixed(2);
            const isCooperative = f.is_cooperative_member === 1;
            
            return (
              <div 
                key={fid} 
                className="so-farmer-card" 
                onClick={() => setSelectedFarmerId(fid)}
                style={{
                  border: isCooperative ? '2px solid #e0f2fe' : '1px solid #e2e8f0',
                  background: isCooperative ? '#f8fbff' : 'white'
                }}
              >
                <div className="so-farmer-avatar" style={{ 
                  background: isCooperative ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : avatarColor(fid),
                  position: 'relative'
                }}>
                  {initials(name)}
                  {isCooperative && (
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      background: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #0891b2'
                    }}>
                      <LuBuilding2 size={11} color="#0891b2" />
                    </div>
                  )}
                </div>
                <div className="so-farmer-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div className="so-farmer-name">{name}</div>
                    {isCooperative && (
                      <span style={{
                        background: '#0891b2',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <LuBuilding2 size={9} />
                        {lang === 'en' ? 'COOP' : 'KOOP'}
                      </span>
                    )}
                  </div>
                  <div className="so-farmer-id">{fid}</div>
                  <div className="so-farmer-meta">
                    {!isCooperative && (
                      <span style={{
                        color: '#059669',
                        fontWeight: 600,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <LuUser size={11} />
                        {lang === 'en' ? 'Individual' : 'Umuntu ku giti cye'}
                      </span>
                    )}
                    {f.phone && <span><i className="bi bi-telephone"></i> {f.phone}</span>}
                    {sizeAre > 0 && <span><i className="bi bi-rulers"></i> {sizeAre} are ({sizeHa} ha)</span>}
                  </div>
                </div>
                <div className="so-farmer-card-action">
                  <button className="so-view-btn">
                    {lang === 'en' ? 'View' : 'Reba'} <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

