import React, { useState, useEffect, useCallback } from 'react';
import { fetchOutreachStatsApi, fetchCrmSettingsApi, updateCrmSettingsApi, fetchTemplatesApi, createTemplateApi, deleteTemplateApi, startOutreachApi, stopOutreachApi, generateTemplatesApi } from '../../../utils/huntsApi';
import StatsCards from './StatsCards';
import OutreachControls from './OutreachControls';
import BossAlertSetting from './BossAlertSetting';
import TemplateGenerator from './TemplateGenerator';
import TemplateEditor from './TemplateEditor';

export default function OutreachTab({ token }) {
  const [stats, setStats]             = useState(null);
  const [settings, setSettings]       = useState(null);
  const [templates, setTemplates]     = useState([]);
  const [editBoss, setEditBoss]       = useState(false);
  const [bossUsername, setBossUsername] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading]         = useState(true);

  const loadData = useCallback(() => {
    Promise.all([fetchOutreachStatsApi(token), fetchCrmSettingsApi(token), fetchTemplatesApi(token)])
      .then(([s, cfg, tpls]) => {
        setStats(s); setSettings(cfg); setTemplates(tpls);
        setBossUsername(cfg.boss_alert_username || '');
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Poll for live stats when outreach is active
  useEffect(() => {
    if (stats?.outreach_active) {
      const interval = setInterval(() => fetchOutreachStatsApi(token).then(setStats), 10000);
      return () => clearInterval(interval);
    }
  }, [stats?.outreach_active, token]);

  const saveBossUsername = async () => {
    try {
      const updated = await updateCrmSettingsApi({ boss_alert_username: bossUsername.replace('@', '') }, token);
      setSettings(updated); setEditBoss(false);
    } catch (e) { alert(e.message); }
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.trim()) return;
    try {
      const tpl = await createTemplateApi(newTemplate.trim(), token);
      setTemplates([tpl, ...templates]); setNewTemplate('');
    } catch (err) { alert(err.message); }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await deleteTemplateApi(id, token);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleStart = async () => {
    try {
      if (templates.length === 0) return alert("Please add at least one template first!");
      await startOutreachApi();
      setStats(prev => ({ ...prev, outreach_active: true }));
    } catch (err) { alert(err.message); }
  };

  const handleStop = async () => {
    try {
      await stopOutreachApi();
      setStats(prev => ({ ...prev, outreach_active: false }));
    } catch (err) { alert(err.message); }
  };

  const handleGenerateTemplates = async (e) => {
    e.preventDefault();
    if (!aiTranscript.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateTemplatesApi(aiTranscript.trim(), token);
      setTemplates([...generated, ...templates]); setAiTranscript('');
      alert("Generated 5 new high-converting templates!");
    } catch (err) {
      alert("Failed to generate: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="text-gray-400 text-sm text-center pt-16">Loading outreach data...</div>;

  return (
    <div className="flex flex-col gap-5 p-4">
      <StatsCards stats={stats} />
      <OutreachControls 
        stats={stats} 
        settings={settings} 
        templates={templates} 
        handleStart={handleStart} 
        handleStop={handleStop} 
      />
      <BossAlertSetting 
        settings={settings} 
        editBoss={editBoss} 
        setEditBoss={setEditBoss} 
        bossUsername={bossUsername} 
        setBossUsername={setBossUsername} 
        saveBossUsername={saveBossUsername} 
      />
      <TemplateGenerator 
        stats={stats} 
        isGenerating={isGenerating} 
        aiTranscript={aiTranscript} 
        setAiTranscript={setAiTranscript} 
        handleGenerateTemplates={handleGenerateTemplates} 
      />
      <TemplateEditor 
        stats={stats} 
        templates={templates} 
        newTemplate={newTemplate} 
        setNewTemplate={setNewTemplate} 
        handleAddTemplate={handleAddTemplate} 
        handleDeleteTemplate={handleDeleteTemplate} 
      />
    </div>
  );
}
