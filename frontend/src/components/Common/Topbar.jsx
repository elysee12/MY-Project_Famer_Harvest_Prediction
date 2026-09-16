import React from 'react';
import LangBtn from './LangBtn';
import { LuArrowLeft } from 'react-icons/lu';

export default function Topbar({ title, sub, onBack, actions, lang, setLang, hideLangBtn = false }) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Left Section - Back Button + Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          minWidth: 0
        }}>
          {onBack && (
            <button 
              onClick={onBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0d9488';
                e.currentTarget.style.borderColor = '#0d9488';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <LuArrowLeft size={20} strokeWidth={2.5} />
            </button>
          )}
          
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 17,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: sub ? 3 : 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {title}
            </div>
            {sub && (
              <div style={{
                fontSize: 12,
                color: '#64748b',
                fontWeight: 500,
                letterSpacing: '0.1px'
              }}>
                {sub}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Language Switcher + Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0
        }}>
          {!hideLangBtn && <LangBtn lang={lang} setLang={setLang} />}
          {actions}
        </div>
      </div>
    </div>
  );
}
