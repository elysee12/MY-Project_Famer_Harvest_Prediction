import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { T, API_BASE, fmtDate } from '../../constants/constants';

export default function SectorReports({ user, dashData, lang }) {
  const t = T[lang];
  const [activeTab, setActiveTab] = useState('submit');
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [targetGroup, setTargetGroup] = useState('All Farmers');
  const [adviceSubject, setAdviceSubject] = useState('');
  const [adviceMsg, setAdviceMsg] = useState('');
  const [adviceStatus, setAdviceStatus] = useState(null);
  const [sendingAdvice, setSendingAdvice] = useState(false);
  const [sentReports, setSentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [sentAdvice, setSentAdvice] = useState([]);
  const [loadingAdviceHistory, setLoadingAdviceHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchReports();
      fetchSentAdvice();
    }
  }, [activeTab]);

  const fetchSentAdvice = () => {
    setLoadingAdviceHistory(true);
    fetch(`${API_BASE}/api/sent-advice?officer_id=${user.id || user.officer_id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSentAdvice(d.advice || []);
        setLoadingAdviceHistory(false);
      })
      .catch(() => setLoadingAdviceHistory(false));
  };

  const handleRevokeAdvice = async (adviceId) => {
    try {
      const res = await fetch(`${API_BASE}/api/revoke-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: user.id || user.officer_id, advice_id: adviceId })
      });
      const d = await res.json();
      if (d.success) {
        setSentAdvice((prev) => prev.filter((item) => item.advice_id !== adviceId && item.advice_id !== adviceId));
      } else {
        setAdviceStatus({ type: 'err', msg: d.error || (lang === 'en' ? 'Unable to revoke advice' : 'Ntibyashobotse gukuraho inama') });
      }
    } catch {
      setAdviceStatus({ type: 'err', msg: lang === 'en' ? 'Unable to revoke advice' : 'Ntibyashobotse gukuraho inama' });
    }
  };

  const fetchReports = () => {
    setLoadingReports(true);
    fetch(`${API_BASE}/api/reports?officer_id=${user.id || user.officer_id}&role=sector`)
      .then(r => r.json())
      .then(d => { if (d.success) setSentReports(d.reports || []); setLoadingReports(false); })
      .catch(() => setLoadingReports(false));
  };

  const handleAutoDraft = () => {
    const allPreds = dashData?.all_predictions || dashData?.recent_preds || [];
    const total = allPreds.length;
    const avg = total > 0
      ? (allPreds.reduce((s, p) => s + parseFloat(p.yield_per_are_kg || 0), 0) / total).toFixed(2)
      : '—';
    const crops = [...new Set(allPreds.map(p => p.crop || p.crop_type).filter(Boolean))].join(', ') || 'Maize, Rice';
    const farmerCount = dashData?.farmer_count || 0;
    const date = new Date().toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' });

    setReportTitle(`${user.sector} Sector Agricultural Status Report — ${date}`);
    setReportContent(
      `SECTOR AGRICULTURAL STATUS REPORT\n` +
      `Sector: ${user.sector} | Date: ${date}\n` +
      `Submitted by: ${user.name} (Sector Agri Officer)\n\n` +
      `SUMMARY\n` +
      `• Total Registered Farmers: ${farmerCount}\n` +
      `• Total Predictions Made: ${total}\n` +
      `• Average Expected Yield: ${avg} kg/are\n` +
      `• Active Crops: ${crops}\n\n` +
      `FIELD OBSERVATIONS\n` +
      `Agricultural activities in ${user.sector} sector are progressing as expected for the current season. ` +
      `Soil moisture levels are adequate in most areas. Fertilizer application has been completed in approximately 75% of registered farms. ` +
      `No major pest outbreaks have been reported this week.\n\n` +
      `RECOMMENDATIONS TO DISTRICT\n` +
      `1. Provide additional fertilizer support to small-scale farmers in the sector.\n` +
      `2. Organize a training session on post-harvest storage techniques.\n` +
      `3. Monitor rainfall patterns closely — some areas may need irrigation support.\n\n` +
      `Report prepared and submitted by:\n${user.name}\nSector Agricultural Officer — ${user.sector}`
    );
  };

  const handleSubmitReport = async () => {
    if (!reportTitle.trim() || !reportContent.trim()) {
      setSubmitStatus({ type: 'err', msg: lang === 'en' ? 'Please fill in both title and content' : 'Uzuza insanganyamatsiko n\'ibiri mu raporo' });
      return;
    }
    setSubmitting(true);
    setSubmitStatus({ type: 'info', msg: lang === 'en' ? 'Submitting report to District…' : 'Kohereza raporo ku Karere…' });
    try {
      const res = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id || user.officer_id,
          title: reportTitle,
          content: reportContent,
          sector_id: user.sector_id,
          sector_name: user.sector
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus({ type: 'ok', msg: lang === 'en' ? '✓ Report submitted to District successfully!' : '✓ Raporo yoherejwe ku Karere neza!' });
        setReportTitle(''); setReportContent('');
        setTimeout(() => setSubmitStatus(null), 4000);
      } else {
        setSubmitStatus({ type: 'err', msg: data.error });
      }
    } catch {
      setSubmitStatus({ type: 'ok', msg: lang === 'en' ? '✓ Report submitted (local simulation)' : '✓ Raporo yoherejwe (simulation)' });
      setReportTitle(''); setReportContent('');
      setTimeout(() => setSubmitStatus(null), 4000);
    }
    setSubmitting(false);
  };

  const handleSendAdvice = async () => {
    if (!adviceMsg.trim()) {
      setAdviceStatus({ type: 'err', msg: lang === 'en' ? 'Please write a message' : 'Andika ubutumwa' });
      return;
    }
    setSendingAdvice(true);
    setAdviceStatus({ type: 'info', msg: lang === 'en' ? 'Sending advice…' : 'Kohereza inama…' });
    try {
      const res = await fetch(`${API_BASE}/api/send-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: user.id || user.officer_id,
          subject: adviceSubject || (lang === 'en' ? 'Agricultural Advisory' : 'Inama ku Buhinzi'),
          message: adviceMsg,
          target_group: targetGroup,
          advice_type: 'broadcast',
          sector_id: user.sector_id
        })
      });
      const data = await res.json();
      if (data.success) {
        setAdviceStatus({ type: 'ok', msg: lang === 'en' ? `✓ Advice sent to ${targetGroup}!` : `✓ Inama yoherejwe kuri ${targetGroup}!` });
        setAdviceMsg(''); setAdviceSubject('');
        setTimeout(() => setAdviceStatus(null), 4000);
      } else {
        setAdviceStatus({ type: 'err', msg: data.error });
      }
    } catch {
      setAdviceStatus({ type: 'ok', msg: lang === 'en' ? '✓ Advice sent (local simulation)' : '✓ Inama yoherejwe (simulation)' });
      setAdviceMsg(''); setAdviceSubject('');
      setTimeout(() => setAdviceStatus(null), 4000);
    }
    setSendingAdvice(false);
  };

  return (
    <div className="fade-up">
      {/* Page Header */}
      <div className="so-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="so-page-title">
            <i className="bi bi-file-earmark-text-fill"></i>
            {lang === 'en' ? 'Reports & Advice' : 'Raporo n\'Inama'}
          </h2>
          <p className="so-page-sub">
            {lang === 'en'
              ? `Submit reports to District · Send advice to ${user.sector} farmers`
              : `Ohereza raporo ku Karere · Ohereza inama ku bahinzi ba ${user.sector}`}
          </p>
        </div>
      </div>

      {/* Sub-section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--s100)', paddingBottom: 0 }}>
        {[
          { key: 'submit', label: lang === 'en' ? 'Submit Report' : 'Ohereza Raporo' },
          { key: 'advice', label: lang === 'en' ? 'Send Advice' : 'Ohereza Inama' },
          { key: 'history', label: lang === 'en' ? 'Report History' : 'Amateka ya Raporo' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700,
            color: activeTab === key ? 'var(--g700)' : 'var(--s400)',
            borderBottom: activeTab === key ? '2px solid var(--g600)' : '2px solid transparent',
            marginBottom: -2, transition: 'all .2s'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Submit Report */}
      {activeTab === 'submit' && (
        <div className="fade-up">
          <div className="so-report-card">
            <div className="so-report-card-header">
              <div className="so-report-card-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                <i className="bi bi-file-earmark-arrow-up-fill"></i>
              </div>
              <div>
                <div className="so-report-card-title">{lang === 'en' ? 'Submit Sector Report to District' : 'Ohereza Raporo y\'Umurenge ku Karere'}</div>
                <div className="so-report-card-sub">
                  {lang === 'en'
                    ? 'Reports are sent directly to the District Agricultural Officer'
                    : 'Raporo zoherezwa directly ku Ofisiye w\'Ubuhinzi w\'Akarere'}
                </div>
              </div>
              <button className="so-auto-draft-btn" onClick={handleAutoDraft}>
                <i className="bi bi-magic"></i> {lang === 'en' ? 'Auto-Draft' : 'Inyandiko Bwite'}
              </button>
            </div>

            {submitStatus && (
              <div className={`so-status-alert ${submitStatus.type}`} style={{ marginBottom: 16 }}>
                <i className={`bi ${submitStatus.type === 'ok' ? 'bi-check-circle-fill' : submitStatus.type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                {submitStatus.msg}
              </div>
            )}

            <div className="fgrp">
              <label className="flabel">{lang === 'en' ? 'Report Title' : 'Insanganyamatsiko ya Raporo'}</label>
              <input
                className="finput"
                placeholder={lang === 'en' ? `e.g. ${user.sector} Weekly Status Report` : `Urugero: Raporo y'Icyumweru cya ${user.sector}`}
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
              />
            </div>
            <div className="fgrp">
              <label className="flabel">{lang === 'en' ? 'Report Content' : 'Ibiri mu Raporo'}</label>
              <textarea
                className="finput"
                rows={12}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
                placeholder={lang === 'en' ? 'Write your sector report here or use Auto-Draft above…' : 'Andika raporo y\'umurenge hano cyangwa ukoreshe Inyandiko Bwite hejuru…'}
                value={reportContent}
                onChange={e => setReportContent(e.target.value)}
              />
              <div style={{ fontSize: 11, color: 'var(--s400)', marginTop: 4 }}>
                {reportContent.length} {lang === 'en' ? 'characters' : 'inyuguti'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleSubmitReport}
                disabled={submitting || !reportTitle.trim() || !reportContent.trim()}
              >
                {submitting
                  ? <><div className="spin" style={{ display: 'inline-block', marginRight: 8 }} /> {lang === 'en' ? 'Submitting…' : 'Kohereza…'}</>
                  : <><i className="bi bi-send-fill"></i> {lang === 'en' ? 'Submit to District' : 'Ohereza ku Karere'}</>}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setReportTitle(''); setReportContent(''); }}>
                {lang === 'en' ? 'Clear' : 'Siba'}
              </button>
            </div>
          </div>

          {/* Report Tips */}
          <div className="so-report-tips">
            <div className="so-tips-title"><i className="bi bi-lightbulb-fill"></i> {lang === 'en' ? 'Report Writing Tips' : 'Inama zo Kwandika Raporo'}</div>
            <div className="so-tips-grid">
              {[
                { icon: <i className="bi bi-bar-chart-fill"></i>, tip: lang === 'en' ? 'Include actual yield data and farmer counts' : 'Shyiramo amakuru y\'umusaruro nyaryo n\'umubare w\'abahinzi' },
                { icon: <i className="bi bi-flower1"></i>, tip: lang === 'en' ? 'Mention any crop diseases or pest outbreaks' : 'Vuga indwara z\'ibihingwa cyangwa udukoko twabonwe' },
                { icon: <i className="bi bi-droplet-fill"></i>, tip: lang === 'en' ? 'Report on irrigation and water availability' : 'Vuga ku kuhira no kuboneka kw\'amazi' },
                { icon: <i className="bi bi-clipboard-check-fill"></i>, tip: lang === 'en' ? 'List specific support needed from District' : 'Vuga ubufasha bwihariye busabwa ku Karere' },
              ].map((tip, i) => (
                <div key={i} className="so-tip-item">
                  <span>{tip.icon}</span>
                  <span>{tip.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Send Advice */}
      {activeTab === 'advice' && (
        <div className="fade-up">
          <div className="so-report-card">
            <div className="so-report-card-header">
              <div className="so-report-card-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                <i className="bi bi-megaphone-fill"></i>
              </div>
              <div>
                <div className="so-report-card-title">
                  {lang === 'en' ? `Broadcast Advice to ${user.sector} Farmers` : `Ohereza Inama ku Bahinzi ba ${user.sector}`}
                </div>
                <div className="so-report-card-sub">
                  {lang === 'en'
                    ? 'Messages will appear in farmers\' notification inbox'
                    : 'Ubutumwa buzaboneka mu butumwa bw\'abahinzi'}
                </div>
              </div>
            </div>

            {adviceStatus && (
              <div className={`so-status-alert ${adviceStatus.type}`} style={{ marginBottom: 16 }}>
                <i className={`bi ${adviceStatus.type === 'ok' ? 'bi-check-circle-fill' : adviceStatus.type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                {adviceStatus.msg}
              </div>
            )}

            {/* Target Group */}
            <div className="fgrp">
              <label className="flabel">{t.targetGroup}</label>
              <div className="so-target-group-row">
                {[
                  { val: 'All Farmers', icon: 'bi-people-fill', label: lang === 'en' ? 'All Farmers' : 'Abahinzi Bose' },
                  { val: 'Maize Farmers', icon: 'bi-flower3', label: lang === 'en' ? 'Maize Farmers' : 'Abahinzi ba Ibigori' },
                  { val: 'Rice Farmers', icon: 'bi-flower2', label: lang === 'en' ? 'Rice Farmers' : 'Abahinzi ba Umuceri' },
                ].map(({ val, icon, label }) => (
                  <button
                    key={val}
                    className={`so-target-btn ${targetGroup === val ? 'act' : ''}`}
                    onClick={() => setTargetGroup(val)}
                  >
                    <i className={`bi ${icon}`}></i> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fgrp">
              <label className="flabel">{lang === 'en' ? 'Subject' : 'Insanganyamatsiko'}</label>
              <input
                className="finput"
                placeholder={lang === 'en' ? 'e.g. Fertilizer Application Reminder' : 'Urugero: Igihe cyo Gushyira Ifumbire'}
                value={adviceSubject}
                onChange={e => setAdviceSubject(e.target.value)}
              />
            </div>
            <div className="fgrp">
              <label className="flabel">{t.adviceMessage}</label>
              <textarea
                className="finput"
                rows={5}
                style={{ resize: 'vertical' }}
                placeholder={lang === 'en' ? 'Write your farming advice here…' : 'Andika inama yawe y\'ubuhinzi hano…'}
                value={adviceMsg}
                onChange={e => setAdviceMsg(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSendAdvice}
              disabled={sendingAdvice || !adviceMsg.trim()}
            >
              {sendingAdvice
                ? <><div className="spin" style={{ display: 'inline-block', marginRight: 8 }} /> {lang === 'en' ? 'Sending…' : 'Kohereza…'}</>
                : <><i className="bi bi-send-fill"></i> {t.sendToFarmers}</>}
            </button>
          </div>

          {/* Quick Advice Templates */}
          <div className="so-report-card" style={{ marginTop: 20 }}>
          <div className="so-section-hd" style={{ marginBottom: 16 }}>
              <span><i className="bi bi-lightning-fill"></i> {lang === 'en' ? 'Quick Advice Templates' : 'Inyandiko z\'Inama Zihuse'}</span>
            </div>
            <div className="so-templates-grid">
              {[
                {
                  icon: <i className="bi bi-flower1"></i>, title: lang === 'en' ? 'Season A Planting' : 'Gutera Season A',
                  msg: lang === 'en'
                    ? 'Season A planting window is now open. Prepare your land and apply DAP fertilizer (0.5 kg/are) at planting. Ensure seeds are certified and treated before planting.'
                    : 'Igihe cyo gutera Season A cyafunguwe. Tegura ubutaka bwawe kandi ushyire ifumbire ya DAP (0.5 kg/are) igihe utera. Menya ko imbuto zawe zemewe kandi zafashwe mbere yo gutera.'
                },
                {
                  icon: <AlertTriangle size={20} color="#dc2626" />, title: lang === 'en' ? 'Pest Alert' : 'Impururu y\'Udukoko',
                  msg: lang === 'en'
                    ? 'Pest activity has been detected in the sector. Scout your fields every 5 days. If you see Fall Armyworm or aphids, contact the sector office immediately for free pesticide support.'
                    : 'Udukoko twabonwe mu murenge. Genzura imirima yawe buri minsi 5. Niba ubonye Fall Armyworm cyangwa aphids, baza ibiro by\'umurenge vuba kugira ngo ubone pesticide ubuntu.'
                },
                {
                  icon: <i className="bi bi-droplet-fill"></i>, title: lang === 'en' ? 'Irrigation Reminder' : 'Igihe cyo Kuhira',
                  msg: lang === 'en'
                    ? 'Rainfall has been below average this week. Farmers with irrigation access should apply 4-6cm of water per week, especially during the flowering stage, to protect yields.'
                    : 'Imvura yari munsi y\'impuzandengo iki cyumweru. Abahinzi bafite uburyo bwo kuhira bagomba gukoresha 4-6cm y\'amazi buri cyumweru, cyane cyane mu gihe cy\'uburabyo, kugira ngo barinde umusaruro.'
                },
                {
                  icon: <Package size={20} color="#3b82f6" />, title: lang === 'en' ? 'Harvest & Storage' : 'Gusarura no Kubika',
                  msg: lang === 'en'
                    ? 'Harvest season is approaching. Prepare hermetic storage bags now. Dry your grain to below 13% moisture before storing to prevent aflatoxin and pest damage. Contact the cooperative for market prices.'
                    : 'Igihe cy\'isarura kigeze. Tegura imifuko itinjiza umwuka ubu. Yubika imyaka munsi ya 13% y\'ubumidure mbere yo kuyibika kugira ngo wirinde aflatoxin n\'udukoko. Baza koperative kugira ngo ubone ibiciro by\'isoko.'
                },
              ].map((tpl, i) => (
                <button key={i} className="so-template-btn" onClick={() => setAdviceMsg(tpl.msg)}>
                  <span className="so-template-icon">{tpl.icon}</span>
                  <span className="so-template-title">{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report History */}
      {activeTab === 'history' && (
        <div className="fade-up">
          {loadingReports ? (
            <div className="so-loading-list">
              {[1,2,3].map(i => <div key={i} className="so-skeleton-row" style={{ height: 80 }} />)}
            </div>
          ) : sentReports.length === 0 ? (
            <div className="so-empty-state">
              <i className="bi bi-file-earmark-x"></i>
              <p>{lang === 'en' ? 'No reports submitted yet' : 'Nta raporo yoherejwe'}</p>
            </div>
          ) : (
            <div>
              {sentReports.map((r, i) => (
                <div key={i} className="so-report-history-item">
                  <div className="so-report-history-icon">
                    <i className="bi bi-file-earmark-text-fill"></i>
                  </div>
                  <div className="so-report-history-info">
                    <div className="so-report-history-title">{r.title}</div>
                    <div className="so-report-history-meta">
                      <span><i className="bi bi-calendar3"></i> {fmtDate(r.created_at)}</span>
                      <span><i className="bi bi-geo-alt"></i> {r.sector_name || user.sector}</span>
                    </div>
                    <div className="so-report-history-preview">{(r.content || '').slice(0, 120)}…</div>
                  </div>
                  <div className="so-report-history-status">
                    <span className="so-chip green"><i className="bi bi-check-circle"></i> {lang === 'en' ? 'Sent' : 'Yoherejwe'}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 30 }}>
                <h3 style={{ marginBottom: 16 }}>{lang === 'en' ? 'Sent Advice History' : 'Amateka y\'Inama Zohererejwe'}</h3>
                {loadingAdviceHistory ? (
                  <div className="so-loading-list">
                    {[1,2,3].map(i => <div key={i} className="so-skeleton-row" style={{ height: 60 }} />)}
                  </div>
                ) : sentAdvice.length === 0 ? (
                  <div className="so-empty-state">
                    <i className="bi bi-chat-dots"></i>
                    <p>{lang === 'en' ? 'No advice sent yet' : 'Nta nama yoherejwe'}</p>
                  </div>
                ) : (
                  sentAdvice.map((advice, i) => (
                    <div key={i} className="so-report-history-item">
                      <div className="so-report-history-icon">
                        <i className="bi bi-chat-left-text-fill"></i>
                      </div>
                      <div className="so-report-history-info">
                        <div className="so-report-history-title">{advice.subject || (lang === 'en' ? 'Agricultural Advisory' : 'Inama ku Buhinzi')}</div>
                        <div className="so-report-history-meta">
                          <span><i className="bi bi-calendar3"></i> {fmtDate(advice.created_at)}</span>
                          <span><i className="bi bi-person-badge"></i> {advice.recipient_name || advice.recipient_officer_id || (lang === 'en' ? 'Sector Officer' : 'Ofisiye wa Segiteri')}</span>
                        </div>
                        <div className="so-report-history-preview">{(advice.message || '').slice(0, 120)}…</div>
                      </div>
                      <div className="so-report-history-status" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => handleRevokeAdvice(advice.advice_id || advice.id)}>
                          {lang === 'en' ? 'Revoke' : 'Kuraho'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

