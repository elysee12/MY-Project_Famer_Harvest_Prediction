import React, { useState, useEffect } from 'react';
import { T, API_BASE } from '../../constants/constants';
import { 
  LuLeaf, LuDroplet, LuSprout, LuCircleCheck, LuCircleAlert, 
  LuPencilLine, LuTrash2, LuPlus, LuCalendar, LuHistory
} from 'react-icons/lu';
import { useToast, ToastContainer } from '../../components/Common/Toast';
import ConfirmModal from '../../components/Common/ConfirmModal';

export default function SeasonConfiguration({ user, lang }) {
  const t = T[lang];
  const { toasts, showToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [allConfigs, setAllConfigs] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    season_name: '',
    crop_type: 'Rice',
    seed_variety: 'Kigoli',
    fertilizer_type: 'DAP',
    has_irrigation: true
  });
  
  const cooperativeId = user.cooperative_id;
  const cooperativeName = user.cooperative_name || 'Your Cooperative';
  
  // Detect crop type from cooperative name
  useEffect(() => {
    if (cooperativeName.toLowerCase().includes('rice')) {
      setForm(f => ({ ...f, crop_type: 'Rice' }));
    } else if (cooperativeName.toLowerCase().includes('maize')) {
      setForm(f => ({ ...f, crop_type: 'Maize' }));
    }
  }, [cooperativeName]);
  
  // Fetch all configurations
  useEffect(() => {
    if (!cooperativeId) return;
    fetchAllConfigurations();
  }, [cooperativeId]);
  
  const fetchAllConfigurations = async () => {
    setConfigsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cooperative/season-configs/${cooperativeId}`);
      const data = await res.json();
      
      if (data.success) {
        setAllConfigs(data.configurations || []);
        const active = data.configurations?.find(c => c.is_active);
        setActiveConfig(active || null);
      }
    } catch (e) {
      console.error('Failed to fetch configurations:', e);
    }
    setConfigsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.season_name.trim()) {
      showToast(
        lang === 'en' ? 'Please enter a season name' : "Andika izina ry'igihe",
        'warning'
      );
      return;
    }
    
    setLoading(true);
    
    try {
      const url = editingConfigId 
        ? `${API_BASE}/api/cooperative/season-config/${editingConfigId}`
        : `${API_BASE}/api/cooperative/season-config`;
      
      const method = editingConfigId ? 'PUT' : 'POST';
      
      const body = editingConfigId ? {
        season_name: form.season_name,
        crop_type: form.crop_type,
        seed_variety: form.seed_variety,
        fertilizer_type: form.fertilizer_type,
        has_irrigation: form.has_irrigation
      } : {
        cooperative_id: cooperativeId,
        season_name: form.season_name,
        crop_type: form.crop_type,
        seed_variety: form.seed_variety,
        fertilizer_type: form.fertilizer_type,
        has_irrigation: form.has_irrigation
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.success) {
        showToast(
          editingConfigId
            ? (lang === 'en' ? 'Configuration updated successfully!' : 'Amakuru yahinduwe neza!')
            : (lang === 'en' ? 'Configuration saved successfully!' : 'Byabitswe Neza!'),
          'success'
        );
        await fetchAllConfigurations();
        setShowForm(false);
        setEditingConfigId(null);
        // Reset form
        setForm({
          season_name: '',
          crop_type: cooperativeName.toLowerCase().includes('rice') ? 'Rice' : 'Maize',
          seed_variety: cooperativeName.toLowerCase().includes('rice') ? 'Kigoli' : 'SC627',
          fertilizer_type: 'DAP',
          has_irrigation: true
        });
      } else {
        showToast(data.error || 'Failed to save configuration', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
    
    setLoading(false);
  };
  
  const handleEdit = (config) => {
    console.log('handleEdit called with config:', config);
    setEditingConfigId(config.config_id);
    setForm({
      season_name: config.season_name,
      crop_type: config.crop_type,
      seed_variety: config.seed_variety,
      fertilizer_type: config.fertilizer_type,
      has_irrigation: Boolean(config.has_irrigation)
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = (config) => {
    console.log('handleDelete called with config:', config);
    setConfirmConfig({
      type: 'danger',
      title: lang === 'en' ? 'Delete Configuration' : 'Gusiba Amakuru',
      message: lang === 'en'
        ? `Are you sure you want to delete the configuration for "${config.season_name}"?`
        : `Uremeza gusiba amakuru ya "${config.season_name}"?`,
      subMessage: lang === 'en'
        ? 'This action cannot be undone. All data will be permanently removed.'
        : 'Iyi gikorwa ntishobora gusubirwaho. Amakuru yose azasibwa burundu.',
      confirmLabel: lang === 'en' ? 'Yes, Delete' : 'Yego, Siba',
      cancelLabel: lang === 'en' ? 'Cancel' : 'Kureka',
      onConfirm: () => doDelete(config.config_id),
    });
  };
  
  const doDelete = async (configId) => {
    console.log('doDelete called with configId:', configId);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cooperative/season-config/${configId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(
          lang === 'en' ? 'Configuration deleted successfully!' : 'Amakuru yasibwe neza!',
          'success'
        );
        await fetchAllConfigurations();
        setConfirmConfig(null);
      } else {
        showToast(data.error || (lang === 'en' ? 'Failed to delete configuration' : 'Gusiba amakuru byanze'), 'error');
      }
    } catch (e) {
      showToast(
        lang === 'en' ? `Delete error: ${e.message}` : `Ikosa ryo gusiba: ${e.message}`,
        'error'
      );
    }
    setActionLoading(false);
  };
  
  // Seed varieties by crop
  const seedVarieties = {
    Rice: ['Kigoli', 'Yunani', 'Intsinzi', 'Hybrid IR64', 'Local'],
    Maize: ['SC627', 'PHB30G19', 'ZM521', 'Improved', 'Local']
  };
  
  const currentVarieties = seedVarieties[form.crop_type] || seedVarieties.Rice;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmConfig && (
        <ConfirmModal 
          config={confirmConfig} 
          onClose={() => setConfirmConfig(null)} 
        />
      )}
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 24,
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LuLeaf size={28} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                {lang === 'en' ? 'Season Configuration' : 'Ibihe by\'Ihinga'}
              </h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 14 }}>
                {cooperativeName}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingConfigId(null);
              setForm({
                season_name: '',
                crop_type: cooperativeName.toLowerCase().includes('rice') ? 'Rice' : 'Maize',
                seed_variety: cooperativeName.toLowerCase().includes('rice') ? 'Kigoli' : 'SC627',
                fertilizer_type: 'DAP',
                has_irrigation: true
              });
            }}
            style={{
              background: showForm ? 'rgba(255,255,255,0.2)' : 'white',
              color: showForm ? 'white' : '#0891b2',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <LuPlus size={18} />
            {lang === 'en' ? (showForm ? 'Cancel' : 'New Configuration') : (showForm ? 'Kureka' : 'Amakuru Mashya')}
          </button>
        </div>
      </div>

      {/* Active Configuration Banner */}
      {activeConfig && !showForm && (
        <div style={{
          background: '#d1fae5',
          border: '2px solid #059669',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'start',
          gap: 16
        }}>
          <LuCircleCheck size={28} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#065f46', marginBottom: 6 }}>
              {lang === 'en' ? '✓ Active Configuration' : '✓ Amakuru Akora'}
            </div>
            <div style={{ fontSize: 14, color: '#047857', marginBottom: 8 }}>
              <strong>{activeConfig.season_name}</strong> • {activeConfig.crop_type} • {activeConfig.seed_variety} • {activeConfig.fertilizer_type}
            </div>
            <div style={{ fontSize: 13, color: '#065f46' }}>
              {lang === 'en'
                ? 'All cooperative farmers will use these settings for their predictions'
                : 'Abahinzi bose mu koperative bazakoresha aya makuru'}
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: 16,
          padding: '32px',
          marginBottom: 24
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <LuCalendar size={22} />
            {editingConfigId 
              ? (lang === 'en' ? 'Edit Configuration' : 'Hindura Amakuru')
              : (lang === 'en' ? 'New Season Configuration' : 'Amakuru Mashya y\'Igihe')}
          </h2>

          <div style={{ display: 'grid', gap: 24 }}>
            {/* Season Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 8
              }}>
                {lang === 'en' ? 'Season Name' : 'Izina ry\'Igihe'} *
              </label>
              <input
                type="text"
                value={form.season_name}
                onChange={(e) => setForm({ ...form, season_name: e.target.value })}
                placeholder={lang === 'en' ? 'e.g., 2026 Season B' : 'Urugero: 2026 Igihe cya B'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>

            {/* Crop Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 8
              }}>
                <LuSprout size={16} style={{ display: 'inline', marginRight: 6 }} />
                {lang === 'en' ? 'Crop Type' : 'Ubwoko bw\'Igihingwa'} *
              </label>
              <select
                value={form.crop_type}
                onChange={(e) => setForm({ 
                  ...form, 
                  crop_type: e.target.value,
                  seed_variety: seedVarieties[e.target.value]?.[0] || 'Improved'
                })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit'
                }}
              >
                <option value="Rice">Rice (Umuceri)</option>
                <option value="Maize">Maize (Ibigori)</option>
              </select>
            </div>

            {/* Seed Variety */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 12
              }}>
                {lang === 'en' ? 'Seed Variety' : 'Ubwoko bw\'Imbuto'} *
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10
              }}>
                {currentVarieties.map(variety => (
                  <button
                    key={variety}
                    type="button"
                    onClick={() => setForm({ ...form, seed_variety: variety })}
                    style={{
                      padding: '12px 16px',
                      border: form.seed_variety === variety ? '2px solid #0891b2' : '2px solid #e2e8f0',
                      borderRadius: 10,
                      background: form.seed_variety === variety ? '#e0f2fe' : 'white',
                      color: form.seed_variety === variety ? '#0891b2' : '#334155',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {variety}
                  </button>
                ))}
              </div>
            </div>

            {/* Fertilizer Type */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 12
              }}>
                <LuDroplet size={16} style={{ display: 'inline', marginRight: 6 }} />
                {lang === 'en' ? 'Fertilizer Provided' : 'Ifumbire Itangwa'} *
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 10
              }}>
                {['DAP', 'UREA', 'NPK', 'No Fertilizer'].map(fert => (
                  <button
                    key={fert}
                    type="button"
                    onClick={() => setForm({ ...form, fertilizer_type: fert })}
                    style={{
                      padding: '12px 16px',
                      border: form.fertilizer_type === fert ? '2px solid #059669' : '2px solid #e2e8f0',
                      borderRadius: 10,
                      background: form.fertilizer_type === fert ? '#d1fae5' : 'white',
                      color: form.fertilizer_type === fert ? '#059669' : '#334155',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {fert}
                  </button>
                ))}
              </div>
            </div>

            {/* Irrigation Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              background: '#f8fafc',
              borderRadius: 12,
              border: '2px solid #e2e8f0'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4, fontSize: 13 }}>
                  {lang === 'en'
                    ? 'Wetland Irrigation Available?'
                    : 'Kuhira mu cyuzi biraboneka?'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {lang === 'en'
                    ? 'Enable if farms have irrigation channels'
                    : 'Emeza niba imirima ifite imiyoboro yo kuhira'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, has_irrigation: !form.has_irrigation })}
                style={{
                  width: 56,
                  height: 32,
                  borderRadius: 99,
                  border: 'none',
                  background: form.has_irrigation ? '#059669' : '#cbd5e1',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: 4,
                  left: form.has_irrigation ? 28 : 4,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 24,
              padding: '16px',
              background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            {loading ? (
              <>
                <div className="spin" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                {lang === 'en' ? 'Saving...' : 'Biri Kubikwa...'}
              </>
            ) : (
              <>
                <LuCircleCheck size={20} />
                {lang === 'en' ? 'Save Configuration' : 'Bika Amakuru'}
              </>
            )}
          </button>
        </form>
      )}

      {/* Configurations List */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '24px'
      }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <LuHistory size={22} />
          {lang === 'en' ? 'Configuration History' : 'Amateka y\'Amakuru'}
          <span style={{
            background: '#e0f2fe',
            color: '#0891b2',
            padding: '4px 12px',
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 700,
            marginLeft: 'auto'
          }}>
            {allConfigs.length} {lang === 'en' ? 'records' : 'amakuru'}
          </span>
        </h2>

        {configsLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div className="spin" style={{ margin: '0 auto 10px', width: 40, height: 40 }}></div>
            <div>{lang === 'en' ? 'Loading configurations...' : 'Gutegura amakuru...'}</div>
          </div>
        ) : allConfigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <LuLeaf size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {lang === 'en' ? 'No Configurations Yet' : 'Nta Makuru'}
            </div>
            <div style={{ fontSize: 14 }}>
              {lang === 'en'
                ? 'Click "New Configuration" to create your first season configuration'
                : 'Kanda "Amakuru Mashya" kugirango ukore amakuru yambere'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {allConfigs.map((config, idx) => {
              console.log(`Rendering config ${idx}:`, config);
              return (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  border: config.is_active ? '2px solid #059669' : '1px solid #e2e8f0',
                  borderRadius: 12,
                  background: config.is_active ? '#f0fdf4' : '#fafafa',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Active Badge */}
                {config.is_active && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: 20,
                    background: '#059669',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {lang === 'en' ? '✓ Active' : '✓ Akora'}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: 16,
                  marginTop: config.is_active ? 10 : 0
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: config.is_active ? '#d1fae5' : '#f1f5f9',
                    color: config.is_active ? '#059669' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <LuLeaf size={28} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#0f172a',
                      marginBottom: 8
                    }}>
                      {config.season_name}
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12,
                      marginBottom: 12
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lang === 'en' ? 'Crop Type' : 'Igihingwa'}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                          {config.crop_type}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lang === 'en' ? 'Seed Variety' : 'Ubwoko bw\'Imbuto'}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                          {config.seed_variety}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lang === 'en' ? 'Fertilizer' : 'Ifumbire'}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                          {config.fertilizer_type}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lang === 'en' ? 'Irrigation' : 'Kuhira'}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: config.has_irrigation ? '#059669' : '#94a3b8' }}>
                          {config.has_irrigation ? (lang === 'en' ? 'Yes' : 'Yego') : (lang === 'en' ? 'No' : 'Oya')}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {lang === 'en' ? 'Created:' : 'Byakozwe:'} {config.created_at ? new Date(config.created_at).toLocaleDateString() : '—'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    flexShrink: 0
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Edit button clicked for config:', config);
                        handleEdit(config);
                      }}
                      title={lang === 'en' ? 'Edit Configuration' : 'Hindura Amakuru'}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        border: '2px solid #0891b2',
                        background: '#e0f2fe',
                        color: '#0891b2',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#0369a1';
                        e.target.style.background = '#bae6fd';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#0891b2';
                        e.target.style.background = '#e0f2fe';
                      }}
                    >
                      <LuPencilLine size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Delete button clicked for config:', config);
                        handleDelete(config);
                      }}
                      title={lang === 'en' ? 'Delete Configuration' : 'Siba Amakuru'}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        border: '2px solid #dc2626',
                        background: '#fee2e2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#b91c1c';
                        e.target.style.background = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.background = '#fee2e2';
                      }}
                    >
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

