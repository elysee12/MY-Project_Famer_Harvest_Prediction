import React from 'react';
import { T } from '../../../constants/constants';
import Topbar from '../../../components/Common/Topbar';

export default function AboutAppScreen({ onNavigate, lang, setLang }) {
  const t = T[lang];
  return (
    <>
      <Topbar title={t.aboutApp} onBack={() => onNavigate("profile")} lang={lang} setLang={setLang} />
      <div className="scroll fade-up">
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}><i className="bi bi-flower3"></i></div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--g900)" }}>{t.appName}</div>
          <div style={{ fontSize: 14, color: "var(--s500)", marginTop: 4 }}>Version 4.0.2-Stable</div>
          <div style={{ fontSize: 13, color: "var(--s600)", marginTop: 20, lineHeight: 1.6 }}>
            {lang === "en" 
              ? "Bugesera Harvest Predictor is a smart farming solution designed to help farmers in Rwanda optimize their yields through high-precision AI models and historical climate analysis."
              : "Sisitemu yo gusesengura imyaka mu Karere ka Bugesera ni igisubizo cy'ubuhinzi bw'ubwenge kigamije gufasha abahinzi b'u Rwanda kongera umusaruro binyuze mu gusesengura imiterere y'ikirere n'imihindukire ya model yacu."}
          </div>
        </div>
        <div className="card">
          <div className="sec-hd" style={{ marginBottom: 12 }}>{lang === "en" ? "Development Team" : "Ikipe yakoze App"}</div>
          <div className="info-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--s100)" }}>
            <span style={{ fontSize: 13, color: "var(--s500)", fontWeight: 700 }} className="info-key">{lang === "en" ? "Lead Developer" : "Umushinga"}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--s800)" }} className="info-val">Cesalie UWIMPUHWE</span>
          </div>
          <div className="info-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--s100)" }}>
            <span style={{ fontSize: 13, color: "var(--s500)", fontWeight: 700 }} className="info-key">Institution</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--s800)" }} className="info-val">UNIVERSITY OF KIGALI</span>
          </div>
          <div className="info-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: 13, color: "var(--s500)", fontWeight: 700 }} className="info-key">Location</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--s800)" }} className="info-val">Kigali, Rwanda</span>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: 20, fontSize: 11, color: "var(--s400)" }}>
          © 2026 {t.appName} Project. All Rights Reserved.
        </div>
      </div>
    </>
  );
}
