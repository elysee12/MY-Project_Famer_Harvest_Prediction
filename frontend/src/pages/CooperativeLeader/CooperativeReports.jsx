import React, { useState, useEffect } from 'react';
import { T, API_BASE, fmtDate } from '../../constants/constants';
import {
  LuFileText, LuCalendar, LuFilter, LuDownload, LuUsers,
  LuTrendingUp, LuLandPlot, LuActivity, LuChartBar
} from 'react-icons/lu';

export default function CooperativeReports({ user, lang }) {
  const t = T[lang];
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, week, month, season, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [reportData, setReportData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const cooperativeId = user.cooperative_id;
  const cooperativeName = user.cooperative_name || 'Your Cooperative';

  useEffect(() => {
    fetchReportData();
  }, [filterType, startDate, endDate, selectedSeason]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filter type
      let url = `${API_BASE}/api/cooperative-reports/${cooperativeId}?`;
      
      if (filterType === 'custom' && startDate && endDate) {
        url += `start_date=${startDate}&end_date=${endDate}`;
      } else if (filterType === 'season' && selectedSeason) {
        url += `season=${selectedSeason}`;
      } else {
        url += `filter=${filterType}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setReportData(data.stats || {});
        setPredictions(data.predictions || []);
      }
    } catch (e) {
      console.error('Failed to fetch report data:', e);
    }
    setLoading(false);
  };

  const getDateRangeText = () => {
    if (filterType === 'all') return lang === 'en' ? 'All Time' : 'Igihe Cyose';
    if (filterType === 'week') return lang === 'en' ? 'This Week' : 'Iki Cyumweru';
    if (filterType === 'month') return lang === 'en' ? 'This Month' : 'Ukwezi';
    if (filterType === 'season' && selectedSeason) return selectedSeason;
    if (filterType === 'year') return lang === 'en' ? 'This Year' : 'Uyu Mwaka';
    if (filterType === 'custom' && startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }
    return lang === 'en' ? 'Select Date Range' : 'Hitamo Igihe';
  };

  const downloadCSV = () => {
    if (!predictions || predictions.length === 0) {
      alert(lang === 'en' ? 'No data to download' : 'Nta makuru yo gukuramo');
      return;
    }

    // Prepare CSV content with grand totals
    const headers = ['Farmer ID', 'Farmer Name', 'Crop', 'Season', 'Land Size (ha)', 'Expected Yield (kg/are)', 'Total Yield (kg)', 'Prediction Date'];
    const rows = predictions.map(p => [
      p.farmer_id || '',
      p.farmer_name || '',
      p.crop_type || p.crop || '',
      p.season || '',
      (p.farm_size_ha || 0).toFixed(2),
      (p.yield_per_are_kg || 0).toFixed(2),
      (p.total_yield_kg || 0).toFixed(2),
      p.created_at ? new Date(p.created_at).toLocaleDateString() : ''
    ]);

    // Add summary totals at the end
    const totalRows = [
      ['', '', '', '', '', '', '', ''],
      ['COOPERATIVE TOTALS:', '', '', '', '', '', '', ''],
      ['Total Members', reportData?.totalMembers || 0, '', '', '', '', '', ''],
      ['Total Land Area (ha)', (reportData?.totalLandHa || 0).toFixed(2), '', '', '', '', '', ''],
      ['Grand Total Yield (kg)', (reportData?.grandTotalYieldKg || 0).toFixed(0), '', '', '', '', '', ''],
      ['Average Yield (kg/are)', (reportData?.avgYieldKgAre || 0).toFixed(2), '', '', '', '', '', ''],
      ['Projected Revenue (RWF)', (reportData?.totalProjectedRevenueRwf || 0).toFixed(0), '', '', '', '', '', '']
    ];

    // Add revenue breakdown by crop if available
    if (reportData?.cropRevenues && reportData.cropRevenues.length > 0) {
      totalRows.push(['', '', '', '', '', '', '', '']);
      totalRows.push(['REVENUE BY CROP:', '', '', '', '', '', '', '']);
      reportData.cropRevenues.forEach(crop => {
        totalRows.push([
          crop.crop_type, 
          `${crop.total_kg.toFixed(0)} kg`,
          `${crop.price_per_kg} RWF/kg`,
          `${crop.revenue_rwf.toFixed(0)} RWF`,
          '', '', '', ''
        ]);
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...totalRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${cooperativeName}_Report_${getDateRangeText()}.csv`;
    link.click();
  };

  const downloadPDF = async () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(lang === 'en' ? 'PDF library loading, please wait...' : 'Ikibitabo cya PDF kiracyashyirwa, tegereza gato...');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(8, 145, 178);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`${cooperativeName}`, 15, 20);
    doc.setFontSize(12);
    doc.text('Harvest Prediction Report', 15, 28);
    doc.setFontSize(9);
    doc.text(`Period: ${getDateRangeText()}`, 15, 34);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 34);

    // Summary Stats
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Summary Statistics', 15, 50);
    
    const summaryData = [
      ['Total Members', reportData?.totalMembers || 0],
      ['Total Land Area (ha)', (reportData?.totalLandHa || 0).toFixed(2)],
      ['Total Predictions', reportData?.totalPredictions || 0],
      ['Average Yield (kg/are)', (reportData?.avgYieldKgAre || 0).toFixed(2)],
      ['Grand Total Yield (kg)', (reportData?.grandTotalYieldKg || 0).toLocaleString()],
      ['Projected Revenue (RWF)', (reportData?.totalProjectedRevenueRwf || 0).toLocaleString()]
    ];

    doc.autoTable({
      startY: 55,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [8, 145, 178] }
    });

    // Revenue Breakdown by Crop (if available)
    if (reportData?.cropRevenues && reportData.cropRevenues.length > 0) {
      doc.setFontSize(14);
      doc.text('Revenue Breakdown by Crop', 15, doc.lastAutoTable.finalY + 15);

      const revenueData = reportData.cropRevenues.map(crop => [
        crop.crop_type,
        crop.total_kg.toLocaleString() + ' kg',
        crop.price_per_kg + ' RWF/kg',
        crop.revenue_rwf.toLocaleString() + ' RWF'
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Crop', 'Total Yield', 'Price/kg', 'Revenue']],
        body: revenueData,
        theme: 'striped',
        headStyles: { fillColor: [8, 145, 178] }
      });
    }

    // Predictions Table
    if (predictions && predictions.length > 0) {
      doc.setFontSize(14);
      doc.text('Prediction Details', 15, doc.lastAutoTable.finalY + 15);

      const predData = predictions.slice(0, 20).map(p => [
        p.farmer_name || '',
        p.crop_type || p.crop || '',
        (p.farm_size_ha || 0).toFixed(2),
        (p.yield_per_are_kg || 0).toFixed(1),
        (p.total_yield_kg || 0).toFixed(0)
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Farmer', 'Crop', 'Land (ha)', 'Yield/are', 'Total (kg)']],
        body: predData,
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178] },
        styles: { fontSize: 9 }
      });

      if (predictions.length > 20) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Showing 20 of ${predictions.length} predictions. Download CSV for complete data.`, 15, doc.lastAutoTable.finalY + 10);
      }
    }

    // Footer
    const finalY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${cooperativeName} | Bugesera Agricultural System`, 15, finalY);
    
    doc.save(`${cooperativeName}_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <LuFileText size={24} />
            {lang === 'en' ? 'Cooperative Reports' : 'Raporo za Koperative'}
          </h2>
          <p style={{
            fontSize: 13,
            color: '#64748b',
            margin: 0
          }}>
            {lang === 'en'
              ? `Comprehensive reports for ${cooperativeName}`
              : `Raporo zuzuye za ${cooperativeName}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={downloadCSV}
            disabled={loading || !predictions || predictions.length === 0}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: loading || !predictions || predictions.length === 0 ? 0.5 : 1
            }}
          >
            <LuDownload size={16} />
            {lang === 'en' ? 'CSV' : 'CSV'}
          </button>
          <button
            onClick={downloadPDF}
            disabled={loading || !predictions || predictions.length === 0}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: loading || !predictions || predictions.length === 0 ? 0.5 : 1
            }}
          >
            <LuDownload size={16} />
            {lang === 'en' ? 'PDF' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <LuFilter size={20} />
          {lang === 'en' ? 'Filter Reports' : 'Shungura Raporo'}
        </h3>

        {/* Quick Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: lang === 'en' ? 'All Time' : 'Igihe Cyose', icon: <LuCalendar size={14} /> },
            { key: 'week', label: lang === 'en' ? 'This Week' : 'Iki Cyumweru', icon: <LuCalendar size={14} /> },
            { key: 'month', label: lang === 'en' ? 'This Month' : 'Ukwezi', icon: <LuCalendar size={14} /> },
            { key: 'year', label: lang === 'en' ? 'This Year' : 'Uyu Mwaka', icon: <LuCalendar size={14} /> },
            { key: 'season', label: lang === 'en' ? 'By Season' : 'Kuri Season', icon: <LuActivity size={14} /> },
            { key: 'custom', label: lang === 'en' ? 'Custom Range' : 'Hitamo Igihe', icon: <LuFilter size={14} /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              style={{
                background: filterType === key ? '#0891b2' : 'white',
                color: filterType === key ? 'white' : '#64748b',
                border: filterType === key ? 'none' : '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Season Selector */}
        {filterType === 'season' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              marginBottom: 8
            }}>
              {lang === 'en' ? 'Select Season' : 'Hitamo Season'}
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              style={{
                width: '100%',
                maxWidth: 300,
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              <option value="">{lang === 'en' ? 'Select...' : 'Hitamo...'}</option>
              <option value="Season A">Season A</option>
              <option value="Season B">Season B</option>
              <option value="Season C">Season C</option>
            </select>
          </div>
        )}

        {/* Custom Date Range */}
        {filterType === 'custom' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 8
              }}>
                {lang === 'en' ? 'From Date' : 'Kuva'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "'Outfit', sans-serif"
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 8
              }}>
                {lang === 'en' ? 'To Date' : 'Kugeza'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "'Outfit', sans-serif"
                }}
              />
            </div>
          </div>
        )}

        {/* Current Filter Display */}
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          color: '#64748b'
        }}>
          <LuCalendar size={16} />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {lang === 'en' ? 'Showing:' : 'Werekana:'}
          </span>
          <span>{getDateRangeText()}</span>
        </div>
      </div>

      {/* Summary Statistics */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div className="spin" style={{ margin: '0 auto 10px', width: 40, height: 40 }}></div>
          <div>{lang === 'en' ? 'Loading report data...' : 'Gutegura amakuru ya raporo...'}</div>
        </div>
      ) : (
        <>
          {/* Grand Totals Summary - Prominently Displayed */}
          <div style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
            borderRadius: 20,
            padding: '32px',
            marginBottom: 32,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'translate(60px, -60px)'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%',
              transform: 'translate(-40px, 40px)'
            }}></div>

            <h2 style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LuTrendingUp size={24} />
              </div>
              {lang === 'en' ? '🏆 Cooperative Grand Totals' : '🏆 Ibisobanuro by\'Inyungu za Koperative'}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
              position: 'relative',
              zIndex: 1
            }}>
              {/* Total Land Area */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '20px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 900,
                  marginBottom: 8
                }}>
                  {(reportData?.totalLandHa || 0).toFixed(1)}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {lang === 'en' ? 'Total Land (ha)' : 'Ubuso Bwose (ha)'}
                </div>
                <div style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginTop: 4
                }}>
                  {reportData?.totalMembers || 0} {lang === 'en' ? 'farmers' : 'abahinzi'}
                </div>
              </div>

              {/* Average Yield per Are */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '20px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 900,
                  marginBottom: 8
                }}>
                  {(reportData?.avgYieldKgAre || 0).toFixed(1)}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {lang === 'en' ? 'Avg Yield (kg/are)' : 'Umusaruro (kg/are)'}
                </div>
                <div style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginTop: 4
                }}>
                  {reportData?.totalPredictions || 0} {lang === 'en' ? 'predictions' : 'ibisobanuro'}
                </div>
              </div>

              {/* Grand Total Yield */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '20px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 900,
                  marginBottom: 8
                }}>
                  {(reportData?.grandTotalYieldKg || 0).toLocaleString()}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {lang === 'en' ? 'Total Yield (kg)' : 'Umusaruro Wose (kg)'}
                </div>
                <div style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginTop: 4
                }}>
                  {lang === 'en' ? 'Expected harvest' : 'Isarura riteganyijwe'}
                </div>
              </div>

              {/* Projected Revenue */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '20px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: 36,
                  fontWeight: 900,
                  marginBottom: 8
                }}>
                  {((reportData?.totalProjectedRevenueRwf || 0) / 1000000).toFixed(1)}M
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {lang === 'en' ? 'Revenue (RWF)' : 'Inyungu (RWF)'}
                </div>
                <div style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginTop: 4
                }}>
                  {reportData?.totalProjectedRevenueRwf ? 
                    `~${Math.round(reportData.totalProjectedRevenueRwf / (reportData.totalMembers || 1)).toLocaleString()} ${lang === 'en' ? 'per farmer' : 'kuri umuhinzi'}` 
                    : (lang === 'en' ? 'Projected earnings' : 'Inyungu ziteganyijwe')}
                </div>
              </div>
            </div>

            {/* Revenue Breakdown by Crop */}
            {reportData?.cropRevenues && reportData.cropRevenues.length > 0 && (
              <div style={{
                marginTop: 32,
                position: 'relative',
                zIndex: 1
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 16,
                  opacity: 0.9
                }}>
                  {lang === 'en' ? '💰 Revenue Breakdown by Crop' : '💰 Inyungu Z\'Ibihingwa'}
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16
                }}>
                  {reportData.cropRevenues.map((crop, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{
                        fontSize: 18,
                        fontWeight: 800,
                        marginBottom: 8
                      }}>
                        {(crop.revenue_rwf / 1000000).toFixed(1)}M RWF
                      </div>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        opacity: 0.9,
                        marginBottom: 4
                      }}>
                        {crop.crop_type}
                      </div>
                      <div style={{
                        fontSize: 11,
                        opacity: 0.7
                      }}>
                        {crop.total_kg.toLocaleString()} kg × {crop.price_per_kg} RWF/kg
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                value: reportData?.totalMembers || 0,
                label: lang === 'en' ? 'Active Members' : 'Abanyamuryango',
                unit: lang === 'en' ? 'farmers' : 'abahinzi'
              },
              {
                icon: <LuLandPlot size={24} />,
                color: '#059669',
                bg: '#d1fae5',
                value: (reportData?.totalLandHa || 0).toFixed(2),
                label: lang === 'en' ? 'Total Land' : 'Ubuso Bwose',
                unit: 'ha'
              },
              {
                icon: <LuActivity size={24} />,
                color: '#f59e0b',
                bg: '#fef3c7',
                value: reportData?.totalPredictions || 0,
                label: lang === 'en' ? 'Predictions' : 'Ibisobanuro',
                unit: lang === 'en' ? 'records' : 'amakuru'
              },
              {
                icon: <LuTrendingUp size={24} />,
                color: '#8b5cf6',
                bg: '#ede9fe',
                value: (reportData?.avgYieldKgAre || 0).toFixed(1),
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
                  gap: 12
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
          {reportData?.cropBreakdown && reportData.cropBreakdown.length > 0 && (
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
                <LuChartBar size={22} />
                {lang === 'en' ? 'Crop Production Analysis' : 'Isesengura ry\'Ibihingwa'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {reportData.cropBreakdown.map((crop, idx) => {
                  const colors = { Maize: '#f59e0b', Rice: '#0d9488' };
                  const color = colors[crop.crop_type] || '#64748b';
                  const percentage = reportData.totalPredictions > 0
                    ? ((crop.count / reportData.totalPredictions) * 100).toFixed(0)
                    : 0;

                  return (
                    <div key={idx}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: color
                          }}></div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
                            {crop.crop_type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                              {crop.totalYield?.toFixed(1)} kg/are
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {lang === 'en' ? 'Avg Yield' : 'Umusaruro'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                              {crop.count}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {lang === 'en' ? 'Predictions' : 'Ibisobanuro'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{
                        height: 12,
                        background: '#f1f5f9',
                        borderRadius: 99,
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${percentage}%`,
                          background: color,
                          borderRadius: 99,
                          transition: 'width 1s ease'
                        }}></div>
                        <div style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 10,
                          fontWeight: 800,
                          color: percentage > 50 ? 'white' : '#64748b'
                        }}>
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Predictions Table */}
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
                <LuFileText size={22} />
                {lang === 'en' ? 'Detailed Prediction Records' : 'Amakuru y\'Ibisobanuro'}
              </span>
              <span style={{
                background: '#e0f2fe',
                color: '#0891b2',
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 700
              }}>
                {predictions.length} {lang === 'en' ? 'records' : 'amakuru'}
              </span>
            </h3>

            {predictions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#94a3b8',
                fontSize: 14
              }}>
                <LuFileText size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div>{lang === 'en' ? 'No predictions found for this period' : 'Nta bisobanuro byaboneka muri iki gihe'}</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13
                }}>
                  <thead>
                    <tr style={{
                      background: '#f8fafc',
                      borderBottom: '2px solid #e2e8f0'
                    }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Farmer' : 'Umuhinzi'}
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Crop' : 'Igihingwa'}
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Season' : 'Season'}
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Land (ha)' : 'Ubuso (ha)'}
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Yield/are' : 'Umusaruro/are'}
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Total (kg)' : 'Igiteranyo (kg)'}
                      </th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {lang === 'en' ? 'Date' : 'Itariki'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '12px', color: '#334155', fontWeight: 600 }}>
                          {pred.farmer_name || pred.farmer_id}
                        </td>
                        <td style={{ padding: '12px', color: '#334155' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: pred.crop_type === 'Maize' ? '#fef3c7' : pred.crop_type === 'Rice' ? '#ccfbf1' : '#d1fae5',
                            color: pred.crop_type === 'Maize' ? '#92400e' : pred.crop_type === 'Rice' ? '#0d9488' : '#065f46'
                          }}>
                            {pred.crop_type || pred.crop}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>
                          {pred.season || '—'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                          {(pred.farm_size_ha || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: 700 }}>
                          {(pred.yield_per_are_kg || 0).toFixed(1)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                          {(pred.total_yield_kg || 0).toFixed(0)}
                        </td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
                          {pred.created_at ? new Date(pred.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

