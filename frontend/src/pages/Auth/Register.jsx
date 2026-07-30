import React, { useState, useEffect } from 'react';
import { T, API_BASE, GASHORA_CELLS } from '../../constants/constants';

export default function Register({ lang, setLang, onLogin, onBack, isModal }) {
  const t = T[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("farmer"); // "farmer" or "cooperative"
  const [cell, setCell] = useState("");
  const [cellId, setCellId] = useState(null);
  const [village, setVillage] = useState("");
  const [villageId, setVillageId] = useState(null);
  const [cooperativeId, setCooperativeId] = useState("");
  const [farmHa, setFarmHa] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  // Data from API
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);

  // Fetch cells on mount
  useEffect(() => {
    fetchCells();
    fetchCooperatives();
  }, []);

  // Fetch villages when cell changes
  useEffect(() => {
    if (cellId) {
      fetchVillages(cellId);
    } else {
      setVillages([]);
      setVillage("");
      setVillageId(null);
    }
  }, [cellId]);

  const fetchCells = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cells`);
      const data = await res.json();
      if (data.success) {
        setCells(data.cells || []);
      }
    } catch (e) {
      console.log("Error fetching cells:", e);
    }
  };

  const fetchVillages = async (cId) => {
    try {
      const res = await fetch(`${API_BASE}/api/villages?cell_id=${cId}`);
      const data = await res.json();
      if (data.success) {
        setVillages(data.villages || []);
      }
    } catch (e) {
      console.log("Error fetching villages:", e);
    }
  };

  const fetchCooperatives = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cooperatives`);
      const data = await res.json();
      if (data.success) {
        setCooperatives(data.cooperatives || []);
      }
    } catch (e) {
      console.log("Error fetching cooperatives:", e);
    }
  };

  const normalizePhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('250') && digits.length === 12) {
      return `0${digits.slice(3)}`;
    }
    return digits;
  };

  const isValidRwandaPhone = (value) => {
    const normalized = normalizePhone(value);
    const allowedPrefixes = ['072', '073', '074', '075', '078', '079'];
    return normalized.length === 10 && normalized.startsWith('07') && allowedPrefixes.includes(normalized.slice(0, 3));
  };

  const checkEmail = async (emailVal) => {
    if (!emailVal || !emailVal.includes('@')) return;
    try {
      const res = await fetch(`${API_BASE}/api/check-email?email=${encodeURIComponent(emailVal.trim().toLowerCase())}`);
      const data = await res.json();
      if (data.exists) {
        setError("This email is already taken. Please use another email or login.");
      } else if (error === "This email is already taken. Please use another email or login.") {
        setError("");
      }
    } catch (e) {
      console.log("Email check error:", e);
    }
  };

  const handleRegister = async () => {
    setError(""); 
    setSuccess("");

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword || !cell || !village || !farmHa) {
      setError(t.allRequired);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.pwMismatch);
      return;
    }

    if (password.length < 6) {
      setError(lang === "en" ? "Password must be at least 6 characters long." : "Ijambo ry'ibanga rigomba kuba rimwe na rimwe 6.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError(t.invalidEmail);
      return;
    }

    if (/[A-Z]/.test(email.trim())) {
      setError(t.noCapsEmail);
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setError(t.emailGmailRequired);
      return;
    }

    if (!isValidRwandaPhone(phone)) {
      setError(phone.replace(/\D/g, '').length !== 10 ? t.notValidPhone : t.invalidRwPhone);
      return;
    }

    if (role === "cooperative" && !cooperativeId) {
      setError(lang === "en" ? "Please select a cooperative." : "Hitamo kooperative.");
      return;
    }

    if (!agreedTerms) {
      setError(t.mustAgree);
      return;
    }

    setLoading(true);
    try {
      const regData = {
        name, 
        email: email.trim().toLowerCase(), 
        phone: normalizePhone(phone),
        password: password,
        role: role, // "farmer" or "cooperative"
        sector: "Gashora", // Fixed to Gashora
        cell_id: cellId ? parseInt(cellId) : null, // Ensure integer
        village_id: villageId ? parseInt(villageId) : null, // Ensure integer
        cooperative_id: role === "cooperative" ? (cooperativeId ? parseInt(cooperativeId) : null) : null,
        farm_size_ha: parseFloat(farmHa) || 0,
      };

      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setRegisteredEmail(regData.email);
        setSuccess(
          lang === "rw"
            ? "Konti yawe yafunguwe neza! Ubu ushobora kwinjira. 🎉"
            : "Account created successfully! You can now login. 🎉"
        );
      } else {
        let errMsg = data.error || "Registration failed.";
        if (data.email_error) errMsg += ` (${data.email_error})`;
        setError(errMsg);
      }
    } catch (e) {
      setLoading(false);
      setError("Server connection failed.");
      console.log("Registration API error:", e);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setRole("farmer");
    setCell("");
    setCellId(null);
    setVillage("");
    setVillageId(null);
    setCooperativeId("");
    setFarmHa("");
    setAgreedTerms(false);
    setError("");
    setSuccess("");
    setRegisteredEmail("");
  };

  const containerContent = (
    <div className="auth-container" style={{ margin: isModal ? "0 auto" : undefined, padding: isModal ? "10px" : undefined }}>
      
      {/* Title and subtitle outside the card */}
      <div className="auth-title-container" style={{ marginTop: isModal ? 10 : 20 }}>
        <h1 className="auth-title-main">{t.appName}</h1>
        <p className="auth-title-sub">{t.appSub}</p>
      </div>

      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--g900)" }}>{t.register}</h2>
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
                {lang === 'rw' ? 'Habaye Ikibazo' : 'Registration Error'}
              </div>
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>{error}</div>
            </div>
          </div>
        )}
        
        {success && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
            border: '2px solid #2dd4bf',
            borderRadius: 14,
            padding: '24px',
            marginBottom: 20,
          }}>
            {/* Title with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, background: '#0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-check-circle-fill" style={{ color: 'white', fontSize: 28 }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#0f3d38', margin: 0 }}>
                  {lang === 'rw' ? 'Konti Yafunguwe Neza! 🎉' : 'Registration Complete! 🎉'}
                </div>
                <div style={{ fontSize: 13, color: '#0f766e', margin: 0, fontWeight: 500 }}>
                  {lang === 'rw' ? 'Ubu ushobora kwinjira' : 'You Can Now Login'}
                </div>
              </div>
            </div>

            {/* Email Highlight Box */}
            <div style={{ background: 'white', border: '2px solid #5eead4', borderRadius: 12, padding: '16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="bi bi-envelope-check-fill" style={{ color: '#0d9488', fontSize: 24, flexShrink: 0 }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                  {lang === 'rw' ? 'Email yawe' : 'Your registered email'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#047857', wordBreak: 'break-all' }}>
                  {registeredEmail || email}
                </div>
              </div>
            </div>

            {/* Step-by-step Instructions */}
            <div style={{ background: 'rgba(22, 163, 74, 0.05)', borderRadius: 12, padding: '16px', marginBottom: 18, borderLeft: '4px solid #0d9488' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0f3d38', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-list-check" style={{ fontSize: 18 }}></i>
                {lang === 'rw' ? 'Ingero z\'inyongera' : 'Next Steps'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, background: '#0d9488', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 14 }}>1</div>
                  <div style={{ fontSize: 13, color: '#0f766e', lineHeight: 1.5, flex: 1 }}>
                    {lang === 'rw' ? 'Kanda buto ya "Komeza ku kwinjira" hano hasi' : 'Click the "Go to Login" button below'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, background: '#0d9488', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 14 }}>2</div>
                  <div style={{ fontSize: 13, color: '#0f766e', lineHeight: 1.5, flex: 1 }}>
                    {lang === 'rw' ? 'Injiza email n\'ijambo ry\'ibanga wakoresheje' : 'Enter your email and password'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, background: '#0d9488', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 14 }}>3</div>
                  <div style={{ fontSize: 13, color: '#0f766e', lineHeight: 1.5, flex: 1 }}>
                    {lang === 'rw' ? 'Tangira gukoresha sisitemu' : 'Start using the system immediately'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!success && (
          <>
        {/* Role Selection */}
        <div className="fgrp">
          <label className="flabel"><i className="bi bi-person-badge"></i> {lang === "en" ? "Registration Type" : "Ubwoko bwo Kwiyandikisha"} *</label>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input 
                type="radio" 
                name="role" 
                value="farmer" 
                checked={role === "farmer"} 
                onChange={(e) => setRole(e.target.value)}
                style={{ accentColor: "var(--g700)" }}
              />
              <span style={{ fontSize: 14 }}>{lang === "en" ? "Standard Farmer" : "Umuhinzi Usanzwe"}</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input 
                type="radio" 
                name="role" 
                value="cooperative" 
                checked={role === "cooperative"} 
                onChange={(e) => setRole(e.target.value)}
                style={{ accentColor: "var(--g700)" }}
              />
              <span style={{ fontSize: 14 }}>{lang === "en" ? "Cooperative Member" : "Umunyamuryango wa Kooperative"}</span>
            </label>
          </div>
        </div>

        <div className="fgrp">
          <label className="flabel"><i className="bi bi-person"></i> {t.fullName} *</label>
          <input 
            className="academic-input" 
            placeholder={lang === "rw" ? "Urugero: Amina Uwimana" : "e.g. Amina Uwimana"} 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div className="fgrp">
          <label className="flabel"><i className="bi bi-envelope"></i> Email Address *</label>
          <input 
            className="academic-input" 
            type="email" 
            placeholder="user@gmail.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onBlur={e => checkEmail(e.target.value)}
          />
        </div>

        <div className="fgrp">
          <label className="flabel"><i className="bi bi-telephone"></i> {lang === "en" ? "Phone Number" : "Nimero ya Telefone"} *</label>
          <input 
            className="academic-input" 
            type="tel" 
            placeholder="+250 78x xxx xxx" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
          />
        </div>

        {/* Password Fields with Eye Icon */}
        <div className="fgrp">
          <label className="flabel"><i className="bi bi-key"></i> {t.password} *</label>
          <div style={{ position: "relative" }}>
            <input 
              className="academic-input" 
              type={showPassword ? "text" : "password"}
              placeholder={lang === "en" ? "Enter password (min 6 characters)" : "Injiza ijambo ry'ibanga (nibura 6)"}
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />
            <i 
              className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "var(--s600)",
                fontSize: "18px"
              }}
            ></i>
          </div>
        </div>

        <div className="fgrp">
          <label className="flabel"><i className="bi bi-key-fill"></i> {t.confirmPw} *</label>
          <div style={{ position: "relative" }}>
            <input 
              className="academic-input" 
              type={showConfirmPassword ? "text" : "password"}
              placeholder={lang === "en" ? "Re-enter password" : "Ongera winjize ijambo ry'ibanga"}
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />
            <i 
              className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "var(--s600)",
                fontSize: "18px"
              }}
            ></i>
          </div>
        </div>

        {/* Sector (locked to Gashora) */}
        <div className="fgrp">
          <label className="flabel"><i className="bi bi-geo-alt"></i> {lang === "en" ? "Sector" : "Segiteri"}</label>
          <div className="academic-input" style={{ background: "#f3f4f6", cursor: "not-allowed", color: "#6b7280" }}>
            Gashora
          </div>
        </div>

        {/* Cell Dropdown */}
        <div className="fgrp">
          <label className="flabel"><i className="bi bi-geo"></i> {lang === "en" ? "Cell" : "Akagari"} *</label>
          <select 
            className="academic-input" 
            value={cell} 
            onChange={e => {
              const selectedCell = cells.find(c => c.cell_name === e.target.value);
              setCell(e.target.value);
              setCellId(selectedCell ? selectedCell.cell_id : null);
            }}
          >
            <option value="">{lang === "rw" ? "Hitamo akagari…" : "Select cell…"}</option>
            {cells.map(c => <option key={c.cell_id} value={c.cell_name}>{c.cell_name}</option>)}
          </select>
        </div>

        {/* Village Dropdown (cascading) */}
        <div className="fgrp">
          <label className="flabel"><i className="bi bi-house"></i> {lang === "en" ? "Village" : "Umudugudu"} *</label>
          <select 
            className="academic-input" 
            value={village} 
            onChange={e => {
              const selectedVillage = villages.find(v => v.village_name === e.target.value);
              setVillage(e.target.value);
              setVillageId(selectedVillage ? selectedVillage.village_id : null);
            }}
            disabled={!cell}
          >
            <option value="">{lang === "rw" ? "Hitamo umudugudu…" : "Select village…"}</option>
            {villages.map(v => <option key={v.village_id} value={v.village_name}>{v.village_name}</option>)}
          </select>
        </div>

        {/* Cooperative Dropdown (only if role = cooperative) */}
        {role === "cooperative" && (
          <div className="fgrp">
            <label className="flabel"><i className="bi bi-people"></i> {lang === "en" ? "Cooperative" : "Kooperative"} *</label>
            <select 
              className="academic-input" 
              value={cooperativeId} 
              onChange={e => setCooperativeId(e.target.value)}
            >
              <option value="">{lang === "rw" ? "Hitamo kooperative…" : "Select cooperative…"}</option>
              {cooperatives.map(coop => (
                <option key={coop.cooperative_id} value={coop.cooperative_id}>
                  {coop.cooperative_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="fgrp">
          <label className="flabel"><i className="bi bi-rulers"></i> {t.farmSizeHa} *</label>
          <input 
            className="academic-input" 
            type="number" 
            step="0.1" 
            placeholder="e.g. 0.5" 
            value={farmHa} 
            onChange={e => setFarmHa(e.target.value)} 
          />
        </div>

        <div 
          className="fgrp" 
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", marginBottom: 16 }} 
          onClick={() => setAgreedTerms(!agreedTerms)}
        >
          <input 
            type="checkbox" 
            checked={agreedTerms} 
            onChange={e => setAgreedTerms(e.target.checked)} 
            style={{ width: 18, height: 18, accentColor: "var(--g700)", cursor: "pointer" }} 
          />
          <span style={{ fontSize: 12, color: "var(--s600)", lineHeight: 1.3 }}>{t.agreeTerms}</span>
        </div>
          </>
        )}

        {!success ? (
          <button
            className="auth-btn"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? <><div className="spin" />{t.creatingAccount}</> : <><i className="bi bi-person-plus"></i> {t.registerBtn}</>}
          </button>
        ) : (
          <button
            className="auth-btn"
            onClick={() => { onLogin(); resetForm(); }}
            style={{ background: 'linear-gradient(135deg,#0f3d38,#0d9488)', border: 'none' }}
          >
            <i className="bi bi-box-arrow-in-right" style={{ marginRight: 8 }}></i>
            {lang === "en" ? "Go to Login" : "Komeza ku kwinjira"}
          </button>
        )}

        <div style={{ textAlign: "center", marginTop: 16, display: success ? 'none' : 'block' }}>
          <span onClick={() => { onLogin(); resetForm(); }} className="auth-link-forgot" style={{ fontSize: 13, cursor: "pointer" }}>
            {t.alreadyHave} <strong>{t.signInHere}</strong>
          </span>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, fontSize: 11, color: "var(--s500)", fontWeight: 500 }}>
          <i className="bi bi-check2-circle" style={{ marginRight: 4 }}></i> {lang === "rw" ? "Sisitemu y'Ubuhinzi bwa Gashora" : "Gashora Agricultural System"} · UNIVERSITY OF KIGALI
        </div>
      </div>

      {/* Back Link (only if not a modal) */}
      {!isModal && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ cursor: "pointer", textDecoration: "underline", color: "white", fontSize: 13, fontWeight: 600 }} onClick={onBack}>
            ← {lang === "en" ? "Back to Login" : "Gusubira ku Kwinjira"}
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
