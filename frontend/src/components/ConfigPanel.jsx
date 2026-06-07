import React, { useState, useEffect } from 'react';
import { Settings, Mail, Key, FileText, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ConfigPanel({ config, setConfig, onResumeUploadSuccess }) {
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('jobfinder_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({
          ...prev,
          ...parsed,
          resumeFilename: '', // Reset files on reload for safety
          resumeOriginalName: '',
          resumeText: ''
        }));
      } catch (e) {
        console.error('Error parsing saved config', e);
      }
    }
  }, [setConfig]);

  // Save changes to localStorage (excluding resume data)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    const newConfig = {
      ...config,
      [name]: val
    };
    
    setConfig(newConfig);

    // Save persistable fields
    const toSave = {
      openRouterKey: newConfig.openRouterKey,
      smtpHost: newConfig.smtpHost,
      smtpPort: newConfig.smtpPort,
      smtpSecure: newConfig.smtpSecure,
      smtpUser: newConfig.smtpUser,
      smtpPass: newConfig.smtpPass,
      senderName: newConfig.senderName,
      model: newConfig.model
    };
    localStorage.setItem('jobfinder_config', JSON.stringify(toSave));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume PDF');
      }

      const data = await response.json();
      onResumeUploadSuccess(data.filename, data.originalName, data.text);
    } catch (err) {
      console.error(err);
      alert('Error parsing PDF resume: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeResume = () => {
    onResumeUploadSuccess('', '', '');
  };

  const isConfigValid = 
    config.openRouterKey && 
    config.smtpHost && 
    config.smtpPort && 
    config.smtpUser && 
    config.smtpPass && 
    config.senderName && 
    config.resumeFilename;

  return (
    <div className="card">
      <div className="card-title">
        <Settings size={20} />
        <span>Setup Configuration</span>
        <span style={{ marginLeft: 'auto' }}>
          <span className={`status-indicator ${isConfigValid ? 'ready' : 'not-ready'}`} title={isConfigValid ? "Config Completed" : "Config Incomplete"}></span>
        </span>
      </div>

      <div className="main-panel-content">
        {/* OpenRouter Config */}
        <div className="form-group">
          <label>OpenRouter API Key</label>
          <div className="input-wrapper">
            <Key size={16} />
            <input
              type={showKey ? "text" : "password"}
              name="openRouterKey"
              value={config.openRouterKey}
              onChange={handleChange}
              placeholder="sk-or-v1-..."
              className="form-control"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="form-group">
          <label>AI Model</label>
          <select
            name="model"
            value={config.model}
            onChange={handleChange}
            className="form-control"
          >
            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Free / Recommended)</option>
            <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free)</option>
            <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (Paid)</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini (Paid)</option>
          </select>
        </div>

        {/* Sender Name */}
        <div className="form-group">
          <label>Sender Full Name</label>
          <div className="input-wrapper">
            <Mail size={16} />
            <input
              type="text"
              name="senderName"
              value={config.senderName}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="form-control"
            />
          </div>
        </div>

        {/* SMTP Username */}
        <div className="form-group">
          <label>Sender Email (Gmail)</label>
          <div className="input-wrapper">
            <Mail size={16} />
            <input
              type="email"
              name="smtpUser"
              value={config.smtpUser}
              onChange={handleChange}
              placeholder="username@gmail.com"
              className="form-control"
            />
          </div>
        </div>

        {/* SMTP Password */}
        <div className="form-group">
          <label>Gmail App Password</label>
          <div className="input-wrapper">
            <Key size={16} />
            <input
              type={showPass ? "text" : "password"}
              name="smtpPass"
              value={config.smtpPass}
              onChange={handleChange}
              placeholder="xxxx xxxx xxxx xxxx"
              className="form-control"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            Generate a 16-character "App Password" in your Google Account Security settings.
          </small>
        </div>

        {/* SMTP Server Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.5rem' }}>
          <div className="form-group">
            <label>SMTP Host</label>
            <input
              type="text"
              name="smtpHost"
              value={config.smtpHost}
              onChange={handleChange}
              placeholder="smtp.gmail.com"
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Port</label>
            <input
              type="text"
              name="smtpPort"
              value={config.smtpPort}
              onChange={handleChange}
              placeholder="465"
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            name="smtpSecure"
            id="smtpSecure"
            checked={config.smtpSecure}
            onChange={handleChange}
            className="custom-checkbox"
          />
          <label htmlFor="smtpSecure" style={{ display: 'inline', margin: 0, textTransform: 'none', cursor: 'pointer' }}>
            Use SSL/TLS Secure Connection (Port 465)
          </label>
        </div>

        {/* Resume PDF Upload */}
        <div className="form-group">
          <label>Upload Resume (PDF)</label>
          {!config.resumeFilename ? (
            <div
              className={`file-upload-zone ${dragActive ? 'dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <FileText size={28} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
              {uploading ? (
                <p>Parsing PDF text...</p>
              ) : (
                <p>Drag resume PDF here or <strong>browse</strong></p>
              )}
            </div>
          ) : (
            <div className="file-info">
              <div className="file-info-text">
                <CheckCircle size={16} />
                <span title={config.resumeOriginalName}>{config.resumeOriginalName}</span>
              </div>
              <button onClick={removeResume} className="file-remove-btn" title="Remove PDF">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
