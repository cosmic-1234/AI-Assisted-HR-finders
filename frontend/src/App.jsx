import React, { useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import SearchPanel from './components/SearchPanel';
import ContactList from './components/ContactList';
import EmailComposer from './components/EmailComposer';
import ProgressPanel from './components/ProgressPanel';
import { Settings, Search, Users, MailOpen, Terminal as TermIcon, Briefcase, Award } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('config');
  const [config, setConfig] = useState({
    openRouterKey: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '465',
    smtpSecure: true,
    smtpUser: '',
    smtpPass: '',
    senderName: '',
    resumeFilename: '',
    resumeOriginalName: '',
    resumeText: '',
    model: 'google/gemini-2.5-flash'
  });

  const [roleState, setRoleState] = useState('');
  const [companiesState, setCompaniesState] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);

  // Sending Campaign State
  const [sending, setSending] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [logs, setLogs] = useState([]);

  const onResumeUploadSuccess = (filename, originalName, text) => {
    setConfig(prev => ({
      ...prev,
      resumeFilename: filename,
      resumeOriginalName: originalName,
      resumeText: text
    }));
  };

  const handleSearch = async (searchParams) => {
    setLoading(true);
    setRoleState(searchParams.role);
    setCompaniesState(searchParams.companies);
    
    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: searchParams.companies,
          role: searchParams.role,
          country: searchParams.country,
          openRouterKey: config.openRouterKey,
          model: config.model
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Search failed');
      }

      const data = await response.json();
      
      if (data.success) {
        const newContacts = [];
        let idCounter = Date.now();
        
        Object.entries(data.results).forEach(([company, foundList]) => {
          foundList.forEach(c => {
            newContacts.push({
              id: (idCounter++).toString(),
              name: c.name || '',
              title: c.title || 'HR Representative',
              company: company,
              email: c.email || '',
              linkedin: c.linkedin || '',
              isPredicted: c.isPredicted || false,
              selected: true
            });
          });
        });

        setContacts(newContacts);
        setDrafts({}); // Clear older drafts
        setActiveTab('review');
      }
    } catch (err) {
      console.error(err);
      alert('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleToggleSelectAll = (checked) => {
    setContacts(prev => prev.map(c => ({ ...c, selected: checked })));
  };

  const handleUpdateContact = (id, field, value) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDeleteContact = (id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    const updatedDrafts = { ...drafts };
    delete updatedDrafts[id];
    setDrafts(updatedDrafts);
  };

  const handleAddContact = () => {
    const newContact = {
      id: Date.now().toString(),
      name: '',
      title: 'HR Manager',
      company: contacts[0]?.company || 'New Company',
      email: '',
      linkedin: '',
      isPredicted: false,
      selected: true
    };
    setContacts(prev => [...prev, newContact]);
  };

  const handleGenerateDrafts = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    if (selectedContacts.length === 0) return;

    setGeneratingDrafts(true);
    const updatedDrafts = { ...drafts };

    try {
      for (const contact of selectedContacts) {
        if (!contact.email) continue;
        if (updatedDrafts[contact.id]) continue;

        const response = await fetch('http://localhost:5000/api/personalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact,
            role: roleState,
            resumeText: config.resumeText,
            openRouterKey: config.openRouterKey,
            model: config.model
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            updatedDrafts[contact.id] = {
              subject: data.subject,
              body: data.body
            };
            setDrafts({ ...updatedDrafts });
          }
        }
      }
      setActiveTab('composer');
    } catch (err) {
      console.error(err);
      alert('Error generating personalized emails: ' + err.message);
    } finally {
      setGeneratingDrafts(false);
    }
  };

  const handleSaveDraft = (contactId, subject, body) => {
    setDrafts(prev => ({
      ...prev,
      [contactId]: { subject, body }
    }));
  };

  const handleStartSendCampaign = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    const sendable = selectedContacts.filter(c => c.email && drafts[c.id]);

    if (sendable.length === 0) {
      alert('Please make sure you have generated drafts for your selected contacts.');
      return;
    }

    setSending(true);
    setCurrentCount(0);
    setTotalCount(sendable.length);
    setLogs([]);
    setActiveTab('progress');

    const addLog = (type, message) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLogs(prev => [...prev, { timestamp: timeStr, type, message }]);
    };

    addLog('info', `Starting campaign: Sending ${sendable.length} emails...`);

    for (const contact of sendable) {
      const draft = drafts[contact.id];
      addLog('info', `Attempting email to ${contact.name || 'HR'} (${contact.email}) at ${contact.company}...`);

      try {
        const response = await fetch('http://localhost:5000/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig: {
              host: config.smtpHost,
              port: config.smtpPort,
              secure: config.smtpSecure,
              user: config.smtpUser,
              pass: config.smtpPass,
              senderName: config.senderName
            },
            to: contact.email,
            subject: draft.subject,
            body: draft.body,
            resumeFilename: config.resumeFilename
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          addLog('success', `[SENT] successfully to ${contact.name || 'HR'} (${contact.email}) at ${contact.company}`);
        } else {
          throw new Error(data.error || 'Server error');
        }
      } catch (err) {
        addLog('error', `[FAILED] to send to ${contact.name || 'HR'} (${contact.email}): ${err.message}`);
      }

      setCurrentCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    addLog('success', `Cold Email Campaign Complete!`);
    setSending(false);
  };

  const isConfigValid = 
    config.openRouterKey && 
    config.smtpHost && 
    config.smtpPort && 
    config.smtpUser && 
    config.smtpPass && 
    config.senderName && 
    config.resumeFilename;

  const selectedCount = contacts.filter(c => c.selected).length;
  const draftsCount = Object.keys(drafts).length;

  return (
    <div>
      {/* Shell Bar Header */}
      <div className="sap-shellbar">
        <div className="sap-shellbar-left">
          <span className="sap-logo-badge">Apex</span>
          <span className="sap-shellbar-title">Outreach Portal</span>
        </div>
        <div className="sap-shellbar-right">
          <div className="flex-row">
            <span>Model:</span>
            <span className="sap-shellbar-badge" style={{ color: '#6366f1', background: 'rgba(255, 255, 255, 0.05)' }}>
              {config.model.split('/').slice(-1)[0]}
            </span>
          </div>
          {isConfigValid && (
            <div className="flex-row">
              <span className="status-indicator ready"></span>
              <span>System Online</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-container">
        
        {/* Page Header */}
        <div className="sap-page-header">
          <div className="flex-between">
            <div>
              <h1>Outreach Campaign Manager</h1>
              <p>Find, review, and cold-email HR recruiters in India using AI personalizations and local SMTP automation.</p>
            </div>
            {roleState && (
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Role</span>
                <span className="badge badge-success" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{roleState}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fiori KPI Tiles Grid */}
        <div className="sap-kpi-grid">
          <div className="sap-kpi-tile">
            <span className="sap-kpi-title">Targeted Companies</span>
            <span className="sap-kpi-value">{companiesState.length}</span>
          </div>
          <div className="sap-kpi-tile">
            <span className="sap-kpi-title">Extracted HR Contacts</span>
            <span className="sap-kpi-value">{contacts.length}</span>
          </div>
          <div className="sap-kpi-tile">
            <span className="sap-kpi-title">AI Email Drafts Ready</span>
            <span className="sap-kpi-value" style={{ color: draftsCount > 0 ? 'var(--success-color)' : 'inherit' }}>
              {draftsCount} / {selectedCount}
            </span>
          </div>
        </div>

        {/* Fiori Icon Tab Bar (Step Navigation) */}
        <div className="step-tabs">
          <button 
            className={`step-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <div className="flex-row" style={{ justifyContent: 'center' }}>
              <Settings size={14} /> 1. Configuration
            </div>
          </button>

          <button 
            className={`step-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            disabled={!isConfigValid}
          >
            <div className="flex-row" style={{ justifyContent: 'center' }}>
              <Search size={14} /> 2. Search HRs
            </div>
          </button>

          <button 
            className={`step-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
            disabled={contacts.length === 0}
          >
            <div className="flex-row" style={{ justifyContent: 'center' }}>
              <Users size={14} /> 3. Review Contacts
            </div>
          </button>

          <button 
            className={`step-tab ${activeTab === 'composer' ? 'active' : ''}`}
            onClick={() => setActiveTab('composer')}
            disabled={contacts.length === 0}
          >
            <div className="flex-row" style={{ justifyContent: 'center' }}>
              <MailOpen size={14} /> 4. Draft Composer
            </div>
          </button>

          <button 
            className={`step-tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
            disabled={logs.length === 0 && !sending}
          >
            <div className="flex-row" style={{ justifyContent: 'center' }}>
              <TermIcon size={14} /> 5. Campaign Logs
            </div>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-sidebar">
            <ConfigPanel 
              config={config} 
              setConfig={setConfig} 
              onResumeUploadSuccess={onResumeUploadSuccess}
            />
          </div>

          <div className="dashboard-main-content">
            {activeTab === 'config' && (
              <div className="card">
                <div className="card-title">
                  <Award size={18} />
                  <span>Integration Overview</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.6', fontSize: '0.9rem' }}>
                  Welcome to **Apex CareerConnect**. This AI workflow helps job seekers automate outreach:
                  <br /><br />
                  1. **Sidebar Configuration**: Set your credentials, OpenRouter key (for AI tasks), and upload your PDF Resume.
                  <br />
                  2. **Campaign Creation**: Input target companies and your application role.
                  <br />
                  3. **Extract & Clean**: The system queries public indexes to locate HR/recruiter emails matching your target role (e.g., Marketing HR for a Marketing Intern position).
                  <br />
                  4. **Personalize**: The AI drafts individual cold email pitches mapping your resume achievements to the company and role.
                  <br />
                  5. **Send Bulk**: Review the draft emails, edit inline if desired, and send them out programmatically.
                </p>
                {isConfigValid ? (
                  <button onClick={() => setActiveTab('search')} className="btn btn-primary">
                    Proceed to Step 2: Search Contacts
                  </button>
                ) : (
                  <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', fontWeight: 500 }}>
                    * Complete the configuration in the left panel to unlock the search step.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <SearchPanel 
                onSearch={handleSearch} 
                loading={loading}
                isConfigValid={isConfigValid}
              />
            )}

            {activeTab === 'review' && (
              <ContactList 
                contacts={contacts}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onUpdateContact={handleUpdateContact}
                onAddContact={handleAddContact}
                onDeleteContact={handleDeleteContact}
                onGenerateDrafts={handleGenerateDrafts}
                generatingDrafts={generatingDrafts}
              />
            )}

            {activeTab === 'composer' && (
              <EmailComposer 
                contacts={contacts}
                drafts={drafts}
                onSaveDraft={handleSaveDraft}
                onStartSendCampaign={handleStartSendCampaign}
                sending={sending}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressPanel 
                currentCount={currentCount}
                totalCount={totalCount}
                sending={sending}
                logs={logs}
                onClear={() => setLogs([])}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
