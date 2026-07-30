import React, { useState } from 'react';
import { T, API_BASE } from '../../constants/constants';

export default function Login({ onLogin, lang, setLang, onRegister, onForgot, onBack, isModal }) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const formattedEmail = email.trim().toLowerCase();
    
    if (!formattedEmail || !pw) {
      setError(t.allRequired);
      return;
    }

    if (formattedEmail.includes("@") && !formattedEmail.endsWith("@gmail.com") && !formattedEmail.endsWith(".gov.rw")) {
      setError(lang === "en" ? "Farmer accounts must use a @gmail.com email address." : "Konti z'abahinzi zigomba gukoresha email ya @gmail.com.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formattedEmail, password: pw })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || t.invalidCreds);
      }
    } catch (_) {
      setLoading(false);
      setError(lang === "en" ? "Unable to connect to server" : "Ntibishoboye guhura na seriveri");
    }
  };

  const containerContent = (
    <div className="auth-container" style={{ margin: isModal ? "0 auto" : undefined, padding: isModal ? "10px" : undefined }}>
      
      {/* Circular Logo */}
      <div className="system-logo-wrap">
        <img src="/logo.svg" alt="Bugesera Harvest Prediction System Logo" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover" }} onError={e => { e.target.src = '/logo.png'; }} />
      </div>

      {/* Title and subtitle outside the card */}
      <div className="auth-title-container" style={{ marginTop: isModal ? 10 : 20 }}>
        <h1 className="auth-title-main">{t.appName}</h1>
        <p className="auth-title-sub">{t.appSub}</p>
      </div>

      <div className="auth-card">
        {/* Centered language toggle pill inside card */}
        <div className="lang-toggle-container">
          <button className={`lang-toggle-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>
            English
          </button>
          <span className="lang-divider">|</span>
          <button className={`lang-toggle-btn ${lang === "rw" ? "active" : ""}`} onClick={() => setLang("rw")}>
            Kinyarwanda
          </button>
        </div>

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
            border: '1.5px solid #fca5a5',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <div style={{ width: 34, height: 34, background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="bi bi-exclamation-lg" style={{ color: 'white', fontSize: 16 }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#7f1d1d', marginBottom: 3 }}>
                {lang === 'rw' ? 'Habaye Ikibazo' : 'Login Error'}
              </div>
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>{error}</div>
            </div>
          </div>
        )}

        <div className="fgrp">
          <label className="flabel">{lang === "en" ? "Farmer ID or Officer ID / Email" : "ID y'Umuhinzi cyangwa Ofisiye / Imeli"}</label>
          <input 
            className="academic-input" 
            type="text" 
            placeholder={lang === "en" ? "e.g. F001, A001, or email" : "Urugero: F001, A001, cyangwa imeli"}
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="fgrp" style={{ position: "relative", marginBottom: 20 }}>
          <input 
            className="academic-input" 
            type={showPw ? "text" : "password"} 
            placeholder={lang === "en" ? "Password" : "Ijambo ry'Ibanga"}
            value={pw} 
            onChange={e => setPw(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ paddingRight: 46, marginBottom: 4 }}
          />
          <button onClick={() => setShowPw(!showPw)} className="pw-toggle" style={{ textTransform: "none", background: "none", border: "none", position: "absolute", right: 12, top: 12, cursor: "pointer" }}>
            {showPw ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
          </button>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <span onClick={onForgot} className="auth-link-forgot">
              {t.forgotPw}
            </span>
          </div>
        </div>

        <button className="auth-btn" onClick={handleLogin} disabled={loading || !email || !pw}>
          {loading ? <><div className="spin" />{t.signingIn}</> : <>{lang === "en" ? "Login" : "Injira"}</>}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <span onClick={onRegister} className="auth-link-register">
            {lang === "en" ? "Don't have an account? " : "Nta konti ufite? "}
            <strong>{lang === "en" ? "Register" : "Iyandikishe"}</strong>
          </span>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, fontSize: 11, color: "var(--s500)", fontWeight: 500 }}>
          <i className="bi bi-check2-circle" style={{ marginRight: 4 }}></i> {lang === "rw" ? "Urunyobwe rw'Ubuhinzi bwa Bugesera" : "Bugesera Agricultural System"} · UNIVERSITY OF KIGALI
        </div>
      </div>

      {/* Demo Accounts Pill Container outside card */}
      <div className="demo-accounts-container" style={{ maxWidth: 420, width: "100%", margin: "20px auto 0 auto", textAlign: "center" }}>
        <div style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
          {lang === "en" ? "Demo Credentials (Click to Fill)" : "Konti zo Kugerageza (Kanda wuzure)"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          <button onClick={() => { setEmail("cesalie@gmail.com"); setPw("harvest2024"); }} className="demo-pill">
            Farmer
          </button>
          <button onClick={() => { setEmail("marie@sector.gov.rw"); setPw("harvest2024"); }} className="demo-pill">
            Sector Officer (Gashora)
          </button>
          <button onClick={() => { setEmail("pascal@district.gov.rw"); setPw("harvest2024"); }} className="demo-pill">
            District Admin
          </button>
        </div>
      </div>

      {/* Home Link (only if not a modal) */}
      {!isModal && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ cursor: "pointer", textDecoration: "underline", color: "white", fontSize: 13, fontWeight: 600 }} onClick={onBack}>
            ← {lang === "en" ? "Back to Homepage" : "Gusubira Ahabanza"}
          </span>
        </div>
      )}

    </div>
  );

  if (isModal) {
    return containerContent;
  }

  return (
    <div className="auth-wrap">
      {containerContent}
    </div>
  );
}
