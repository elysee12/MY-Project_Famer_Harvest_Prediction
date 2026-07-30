/**
 * Activity Analytics Dashboard for Sector Officers
 * Monitor crop yields across cells and villages with professional analytics
 */
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Sprout, MapPin, 
  BarChart3, PieChart, Filter, Download, RefreshCw,
  Activity, CheckCircle2, AlertTriangle, Building2, User, Users2
} from 'lucide-react';
import { API_BASE } from '../../constants/constants';
import { T } from '../../constants/constants';

export default function ActivityAnalytics({ user, lang }) {
  const t = T[lang];
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cell: 'all',
    village: 'all',
    crop: 'all',
    farmerType: 'all', // all, individual, cooperative
    season: 'all'
  });

  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalFarmers: 0,
      individualFarmers: 0,
      cooperativeMembers: 0,
      totalYield: 0,
      averageYield: 0,
      topPerformers: 0,
      underperformers: 0
    },
    cellData: [],
    villageData: [],
    cropData: [],
    recentActivities: [],
    yieldTrends: []
  });

  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
    fetchLocations();
  }, [filters]);

  const fetchLocations = async () => {
    try {
      const cellsRes = await fetch(`${API_BASE}/api/cells`);
      const cellsData = await cellsRes.json();
      if (cellsData.success) setCells(cellsData.cells);

      if (filters.cell !== 'all') {
        const villagesRes = await fetch(`${API_BASE}/api/villages?cell_id=${filters.cell}`);
        const villagesData = await villagesRes.json();
        if (villagesData.success) setVillages(villagesData.villages);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.cell !== 'all') params.append('cell_id', filters.cell);
      if (filters.village !== 'all') params.append('village_id', filters.village);
      if (filters.crop !== 'all') params.append('crop', filters.crop);
      if (filters.farmerType !== 'all') params.append('farmer_type', filters.farmerType);
      
      const response = await fetch(`${API_BASE}/api/sector/analytics?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'cell' && value === 'all' ? { village: 'all' } : {})
    }));
  };

  const exportData = () => {
    // Export functionality
    console.log('Exporting data...');
  };

  return (
    <div className="activity-analytics" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={32} color="#0d9488" />
              {lang === 'en' ? 'Activity & Analytics' : 'Ibikorwa n\'Isesengura'}
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {lang === 'en' ? 'Monitor crop yields and farmer activities across all locations' : 'Kugenzura umusaruro w\'ibihingwa n\'ibikorwa by\'abahinzi'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => fetchAnalyticsData()} 
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                fontSize: 14
              }}
            >
              <RefreshCw size={16} />
              {lang === 'en' ? 'Refresh' : 'Ongera'}
            </button>
            <button 
              onClick={exportData}
              style={{
                padding: '10px 20px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                fontSize: 14
              }}
            >
              <Download size={16} />
              {lang === 'en' ? 'Export' : 'Kubika'}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Filter size={20} color="#64748b" />
          
          {/* Cell Filter */}
          <select 
            value={filters.cell} 
            onChange={(e) => handleFilterChange('cell', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              minWidth: 150
            }}
          >
            <option value="all">{lang === 'en' ? 'All Cells' : 'Utugereko Twose'}</option>
            {cells.map(cell => (
              <option key={cell.cell_id} value={cell.cell_id}>{cell.cell_name}</option>
            ))}
          </select>

          {/* Village Filter */}
          <select 
            value={filters.village} 
            onChange={(e) => handleFilterChange('village', e.target.value)}
            disabled={filters.cell === 'all'}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              minWidth: 150,
              opacity: filters.cell === 'all' ? 0.5 : 1
            }}
          >
            <option value="all">{lang === 'en' ? 'All Villages' : 'Imidugudu Yose'}</option>
            {villages.map(village => (
              <option key={village.village_id} value={village.village_id}>{village.village_name}</option>
            ))}
          </select>

          {/* Crop Filter */}
          <select 
            value={filters.crop} 
            onChange={(e) => handleFilterChange('crop', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              minWidth: 120
            }}
          >
            <option value="all">{lang === 'en' ? 'All Crops' : 'Ibihingwa Byose'}</option>
            <option value="Maize">Maize</option>
            <option value="Rice">Rice</option>
          </select>

          {/* Farmer Type Filter - NEW! */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select 
              value={filters.farmerType} 
              onChange={(e) => handleFilterChange('farmerType', e.target.value)}
              style={{
                padding: '10px 36px 10px 12px',
                border: '2px solid #0d9488',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                minWidth: 180,
                background: '#f0fdfa',
                appearance: 'none',
                cursor: 'pointer',
                paddingLeft: '44px'
              }}
            >
              <option value="all">{lang === 'en' ? 'All Farmers' : 'Abahinzi Bose'}</option>
              <option value="individual">{lang === 'en' ? 'Individual Farmers' : 'Abahinzi Bigenga'}</option>
              <option value="cooperative">{lang === 'en' ? 'Cooperative Members' : 'Abanyamuryango'}</option>
            </select>
            <div style={{ position: 'absolute', left: 12, pointerEvents: 'none', color: '#0d9488' }}>
              {filters.farmerType === 'all' && <Users2 size={18} />}
              {filters.farmerType === 'individual' && <User size={18} />}
              {filters.farmerType === 'cooperative' && <Building2 size={18} />}
            </div>
            <div style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: '#0d9488', fontSize: 14 }}>
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <MetricCard
          icon={<Users size={24} />}
          title={lang === 'en' ? 'Total Farmers' : 'Abahinzi Bose'}
          value={analyticsData.summary.totalFarmers}
          subtitle={`${analyticsData.summary.individualFarmers} individual, ${analyticsData.summary.cooperativeMembers} cooperative`}
          color="#0d9488"
          trend={+5.2}
        />
        <MetricCard
          icon={<Sprout size={24} />}
          title={lang === 'en' ? 'Total Yield' : 'Umusaruro Wose'}
          value={`${analyticsData.summary.totalYield.toLocaleString()} kg`}
          subtitle={`${analyticsData.summary.averageYield.toFixed(1)} kg/are avg`}
          color="#059669"
          trend={+12.4}
        />
        <MetricCard
          icon={<CheckCircle2 size={24} />}
          title={lang === 'en' ? 'Top Performers' : 'Bakora Neza'}
          value={analyticsData.summary.topPerformers}
          subtitle={lang === 'en' ? 'Above benchmark' : 'Hejuru y\'ikigero'}
          color="#0891b2"
          trend={+3.1}
        />
        <MetricCard
          icon={<AlertTriangle size={24} />}
          title={lang === 'en' ? 'Need Support' : 'Basaba Ubufasha'}
          value={analyticsData.summary.underperformers}
          subtitle={lang === 'en' ? 'Below average' : 'Munsi y\'ikigero'}
          color="#f59e0b"
          trend={-2.3}
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Yield by Location Chart */}
        <ChartCard
          title={lang === 'en' ? 'Yield Performance by Location' : 'Umusaruro ukurikije Ahantu'}
          icon={<BarChart3 size={20} />}
        >
          <YieldByLocationChart data={analyticsData.cellData} lang={lang} />
        </ChartCard>

        {/* Farmer Type Distribution */}
        <ChartCard
          title={lang === 'en' ? 'Farmer Distribution' : 'Uko Abahinzi Bagabanijwe'}
          icon={<PieChart size={20} />}
        >
          <FarmerTypeDistribution 
            individual={analyticsData.summary.individualFarmers}
            cooperative={analyticsData.summary.cooperativeMembers}
            lang={lang}
          />
        </ChartCard>
      </div>

      {/* Detailed Location Data Table */}
      <LocationDataTable data={analyticsData.cellData} lang={lang} />

      {/* Recent Activities */}
      <RecentActivitiesCard activities={analyticsData.recentActivities} lang={lang} />
    </div>
  );
}

// MetricCard Component
function MetricCard({ icon, title, value, subtitle, color, trend }) {
  const isPositive = trend > 0;
  return (
    <div style={{
      background: 'white',
      padding: 20,
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'all 0.3s',
      cursor: 'pointer'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 14,
          fontWeight: 600,
          color: isPositive ? '#059669' : '#dc2626'
        }}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        {subtitle}
      </div>
    </div>
  );
}

// ChartCard Component
function ChartCard({ title, icon, children }) {
  return (
    <div style={{
      background: 'white',
      padding: 24,
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ color: '#0d9488' }}>{icon}</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// YieldByLocationChart Component
function YieldByLocationChart({ data, lang }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
      {lang === 'en' ? 'No data available' : 'Nta makuru ahari'}
    </div>;
  }

  const maxYield = Math.max(...data.map(d => d.avgYield || 0));

  return (
    <div style={{ padding: '10px 0' }}>
      {data.slice(0, 5).map((item, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0d9488' }}>{item.avgYield?.toFixed(1)} kg/are</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${(item.avgYield / maxYield) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
              borderRadius: 4,
              transition: 'width 0.5s'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// FarmerTypeDistribution Component
function FarmerTypeDistribution({ individual, cooperative, lang }) {
  const total = individual + cooperative;
  const individualPercent = total > 0 ? (individual / total * 100) : 50;
  const cooperativePercent = total > 0 ? (cooperative / total * 100) : 50;

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Donut Chart Representation */}
      <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Individual Farmers Segment */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="#0d9488"
            strokeWidth="40"
            strokeDasharray={`${individualPercent * 4.4} 440`}
            transform="rotate(-90 100 100)"
          />
          {/* Cooperative Members Segment */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="40"
            strokeDasharray={`${cooperativePercent * 4.4} 440`}
            strokeDashoffset={-individualPercent * 4.4}
            transform="rotate(-90 100 100)"
          />
          {/* Center Text */}
          <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="800" fill="#0f172a">
            {total}
          </text>
          <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#64748b">
            {lang === 'en' ? 'Total' : 'Byose'}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#0d9488' }} />
            <span style={{ fontSize: 13, color: '#334155' }}>
              {lang === 'en' ? 'Individual' : 'Umuntu ku giti cye'}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            {individual} ({individualPercent.toFixed(0)}%)
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#06b6d4' }} />
            <span style={{ fontSize: 13, color: '#334155' }}>
              {lang === 'en' ? 'Cooperative' : 'Ikoperative'}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            {cooperative} ({cooperativePercent.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// LocationDataTable Component
function LocationDataTable({ data, lang }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      padding: 24,
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      marginBottom: 20
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={20} color="#0d9488" />
        {lang === 'en' ? 'Detailed Location Performance' : 'Imikorere y\'Ahantu Byibuze'}
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Location' : 'Ahantu'}
              </th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Farmers' : 'Abahinzi'}
              </th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Individual' : 'Bigenga'}
              </th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Cooperative' : 'Ikoperative'}
              </th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Avg Yield' : 'Umusaruro Hagati'}
              </th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Status' : 'Uko bimeze'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((location, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 600, color: '#0f172a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#f0fdfa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0d9488',
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {location.name?.charAt(0)}
                    </div>
                    {location.name}
                  </div>
                </td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                  {location.totalFarmers}
                </td>
                <td style={{ padding: 12, textAlign: 'right', color: '#64748b' }}>
                  {location.individualFarmers}
                </td>
                <td style={{ padding: 12, textAlign: 'right', color: '#64748b' }}>
                  {location.cooperativeMembers}
                </td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, color: '#0d9488' }}>
                  {location.avgYield?.toFixed(1)} kg/are
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {getPerformanceBadge(location.performance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPerformanceBadge(performance) {
  const badges = {
    excellent: { color: '#059669', bg: '#d1fae5', text: 'Excellent', icon: '🏆' },
    good: { color: '#0891b2', bg: '#cffafe', text: 'Good', icon: '✓' },
    average: { color: '#f59e0b', bg: '#fef3c7', text: 'Average', icon: '−' },
    poor: { color: '#dc2626', bg: '#fee2e2', text: 'Poor', icon: '!' }
  };

  const badge = badges[performance] || badges.average;

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      background: badge.bg,
      color: badge.color
    }}>
      {badge.icon} {badge.text}
    </span>
  );
}

// RecentActivitiesCard Component
function RecentActivitiesCard({ activities, lang }) {
  return (
    <div style={{
      background: 'white',
      padding: 24,
      borderRadius: 12,
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={20} color="#0d9488" />
        {lang === 'en' ? 'Recent Activities' : 'Ibikorwa bya Vuba'}
      </h3>
      
      {(!activities || activities.length === 0) ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          {lang === 'en' ? 'No recent activities' : 'Nta bikorwa bya vuba'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activities.slice(0, 10).map((activity, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 50,
                background: activity.farmerType === 'cooperative' ? '#e0f2fe' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {activity.farmerType === 'cooperative' ? <Building2 size={20} color="#0891b2" /> : <User size={20} color="#16a34a" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                  {activity.farmerName}
                  {activity.farmerType === 'cooperative' && (
                    <span style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '2px 8px',
                      background: '#e0f2fe',
                      color: '#0891b2',
                      borderRadius: 4,
                      fontWeight: 700
                    }}>
                      COOPERATIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {activity.action} • {activity.location}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                {activity.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
