import React, { useState, useEffect } from 'react';
import { T, API_BASE, fmtDate } from '../../constants/constants';

export default function DistrictReports({ user, lang }) {
  const t = T[lang];
  const [reports, setReports]           = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfStatus, setPdfStatus]       = useState(null);
  const [reportType, setReportType]     = useState('Season Summary');
  const [reportPeriod, setReportPeriod] = useState('Season A 2024');
  const [sectorScope, setSectorScope]   = useState('All Sectors');

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/reports?officer_id=${user.id}&role=district`);
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch {
      setReports([
        { report_id: 'R001', title: 'Gashora Weekly Status – Season A', sender_name: 'Marie Uwase', sector_name: 'Gashora',
          content: 'Summary of 18 predictions in Gashora Sector:\n- Total Submissions: 18\n- Avg Expected Yield: 23.4 kg/are\n- Crops: Maize, Rice\n\nFall Armyworm sightings on 3 farms. Recommend immediate intervention.',
          created_at: new Date(Date.now() - 86400000).toISOString() },
        { report_id: 'R002', title: 'Gashora Monthly Crop Report', sender_name: 'Jean Paul Habimana', sector_name: 'Gashora',
          content: 'Monthly performance report for Gashora Sector:\n- Maize: 24.1 kg/are avg\n- Beans: 11.8 kg/are avg\n- Rice: 36.2 kg/are avg\n\nGood rainfall this season. Soil moisture is optimal.',
          created_at: new Date(Date.now() - 172800000).toISOString() },
      ]);
    }
  };

  const generatePDF = async () => {
    setPdfStatus({ type: 'info', msg: lang === 'en' ? 'Generating PDF…' : 'Gutegura PDF…' });
    try {
      window.open(`${API_BASE}/api/generate-district-pdf`, '_blank');
      setPdfStatus({ type: 'ok', msg: lang === 'en' ? 'PDF opened in new tab.' : 'PDF ifunguye mu itabi rishya.' });
    } catch {
      setPdfStatus({ type: 'err', msg: lang === 'en' ? 'PDF generation failed.' : 'Gutegura PDF byanze.' });
    }
    setTimeout(() => setPdfStatus(null), 4000);
  };

  return (
    <div className="fade-up" style={{ paddingBottom: 40 }}>

      {/* ── Generate PDF ── */}
      <div className="sec-hd"><i className="bi bi-file-earmark-text"></i> {t.generateReport || 'Generate District Report'}</div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Report Configuration</div>
        {pdfStatus && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: pdfStatus.type === 'ok' ? 'var(--g50)' : pdfStatus.type === 'err' ? '#fee2e2' : '#ccfbf1',
            color:      pdfStatus.type === 'ok' ? 'var(--g800)' : pdfStatus.type === 'err' ? '#991b1b' : '#0f766e',
            border: `1px solid ${pdfStatus.type === 'ok' ? 'var(--g300)' : 'transparent'}` }}>
            {pdfStatus.msg}
          </div>
        )}
        <div className="frow">
          <div className="fgrp">
            <label className="flabel">Report Type</label>
            <select className="finput" value={reportType} onChange={e => setReportType(e.target.value)}>
              {['Season Summary','Crop Performance','Risk Assessment','Farmer Statistics'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="fgrp">
            <label className="flabel">Period</label>
            <select className="finput" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}>
              {['Season A 2024','Season B 2024','Full Year 2024'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="fgrp">
          <label className="flabel">Sector Scope</label>
          <select className="finput" value={sectorScope} onChange={e => setSectorScope(e.target.value)}>
            {['All Sectors','Selected Sectors'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={generatePDF}>
          <i className="bi bi-download"></i> {t.generatePDF || 'Generate PDF'}
        </button>
      </div>

      {/* ── Reports Inbox ── */}
      <div className="sec-hd" style={{ marginTop: 8 }}><i className="bi bi-inbox"></i> {lang === 'en' ? 'Sector Reports from Officers' : 'Raporo z\'Imirenge ziva ku Bagri Officer'}</div>

      {selectedReport ? (
        <div className="card fade-up">
          <button className="btn btn-ghost" style={{ marginBottom: 15, width: 'auto', padding: '6px 12px', fontSize: 12 }} onClick={() => setSelectedReport(null)}>
            <i className="bi bi-arrow-left"></i> {lang === 'en' ? 'Back to Inbox' : 'Subira ku Raporo'}
          </button>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--s900)', marginBottom: 4 }}>{selectedReport.title}</div>
          <div style={{ fontSize: 11, color: 'var(--s500)', marginBottom: 16 }}>
            {lang === 'en' ? 'From' : 'Uvuye kuri'}: <strong>{selectedReport.sender_name}</strong> · {selectedReport.sector_name} · {fmtDate(selectedReport.created_at)}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, background: 'var(--s50)', padding: 16, borderRadius: 12, fontFamily: 'monospace', border: '1px solid var(--s200)' }}>
            {selectedReport.content}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          {reports.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--s400)', textAlign: 'center', padding: 40 }}>
              <i className="bi bi-inbox" style={{ fontSize: 30, display: 'block', marginBottom: 10 }}></i>
              {lang === 'en' ? 'No reports received from sectors yet.' : 'Nta raporo yoherejwe n\'imirenge.'}
            </div>
          ) : reports.map(r => (
            <div key={r.report_id} className="hitem"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--s100)', cursor: 'pointer' }}
              onClick={() => setSelectedReport(r)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--s500)', marginTop: 4 }}>{r.sender_name} · {r.sector_name} · {fmtDate(r.created_at)}</div>
              </div>
              <i className="bi bi-chevron-right" style={{ color: 'var(--s300)', marginLeft: 10 }}></i>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
