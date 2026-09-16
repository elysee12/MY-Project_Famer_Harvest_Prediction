import React from 'react';
import { LuGlobe } from 'react-icons/lu';

export default function LangBtn({ lang, setLang }) {
  return (
    <button 
      onClick={() => setLang(l => l === "en" ? "rw" : "en")}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        borderRadius: 8,
        background: '#0d9488',
        border: '1px solid #0d9488',
        color: 'white',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        letterSpacing: '0.3px',
        textTransform: 'uppercase'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#0f766e';
        e.currentTarget.style.borderColor = '#0f766e';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#0d9488';
        e.currentTarget.style.borderColor = '#0d9488';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <LuGlobe size={15} strokeWidth={2.5} />
      <span style={{ fontWeight: 700, fontSize: 13 }}>{lang === "en" ? "EN" : "RW"}</span>
      <div style={{
        width: 1,
        height: 14,
        background: 'rgba(255, 255, 255, 0.3)',
        margin: '0 2px'
      }} />
      <span style={{ fontSize: 11, fontWeight: 600 }}>
        {lang === "en" ? "Kinyarwanda" : "English"}
      </span>
    </button>
  );
}
