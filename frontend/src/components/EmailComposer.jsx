import React, { useState, useEffect } from 'react';
import { MailOpen, Check, Edit3, Send } from 'lucide-react';

export default function EmailComposer({ contacts, drafts, onSaveDraft, onStartSendCampaign, sending }) {
  const selectedContacts = contacts.filter(c => c.selected);
  const [activeContactId, setActiveContactId] = useState(selectedContacts[0]?.id || null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Sync editor fields when active contact changes or drafts are generated
  useEffect(() => {
    if (activeContactId && drafts[activeContactId]) {
      setSubject(drafts[activeContactId].subject || '');
      setBody(drafts[activeContactId].body || '');
    } else {
      setSubject('');
      setBody('');
    }
  }, [activeContactId, drafts]);

  // Handle active contact change safely
  const handleContactClick = (id) => {
    // Save current active draft text first
    if (activeContactId && drafts[activeContactId]) {
      onSaveDraft(activeContactId, subject, body);
    }
    setActiveContactId(id);
  };

  const handleSaveCurrentDraft = () => {
    if (activeContactId) {
      onSaveDraft(activeContactId, subject, body);
      alert('Draft saved successfully!');
    }
  };

  const activeContact = selectedContacts.find(c => c.id === activeContactId);

  return (
    <div className="card" style={{ width: '100%' }}>
      <div className="card-title">
        <MailOpen size={20} />
        <span>Confirm & Personalize Draft Emails</span>
      </div>

      {selectedContacts.length === 0 ? (
        <div style={{ textAlignment: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)', border: '1px dashed rgba(255, 255, 255, 0.08)', borderRadius: '10px' }}>
          Please select at least one contact in the grid above to compose emails.
        </div>
      ) : (
        <div className="preview-pane-layout">
          {/* Contacts Sidebar list */}
          <div className="contacts-list-sidebar">
            {selectedContacts.map((contact) => {
              const hasDraft = !!drafts[contact.id];
              return (
                <button
                  key={contact.id}
                  onClick={() => handleContactClick(contact.id)}
                  className={`sidebar-contact-item ${activeContactId === contact.id ? 'active' : ''}`}
                >
                  <div className="flex-between">
                    <h4>{contact.name || 'HR Recruiter'}</h4>
                    {hasDraft && <Check size={14} style={{ color: 'var(--success-color)' }} />}
                  </div>
                  <p>{contact.company} • {contact.email}</p>
                </button>
              );
            })}
          </div>

          {/* Editor Workspace */}
          <div className="editor-workspace">
            {activeContact ? (
              <>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                    Emailing {activeContact.name || 'Recruiter'} at {activeContact.company}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    To: <strong>{activeContact.email}</strong>
                  </p>
                </div>

                {drafts[activeContactId] ? (
                  <>
                    <div className="form-group">
                      <label>Email Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="form-control"
                        disabled={sending}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <label>Email Body</label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="form-control"
                        style={{ flex: 1, minHeight: '220px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: '1.5' }}
                        disabled={sending}
                      />
                    </div>

                    <div className="flex-row" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        onClick={handleSaveCurrentDraft}
                        className="btn btn-secondary"
                        style={{ width: 'auto' }}
                        disabled={sending}
                      >
                        <Edit3 size={16} />
                        Save Draft Changes
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '280px', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '1rem' }}>No AI draft has been generated for this contact yet.</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click "Personalize & Preview Emails" below the table to generate drafts.</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Select a contact from the list on the left to review their email draft.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedContacts.length > 0 && Object.keys(drafts).length > 0 && (
        <div className="margin-top" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              // Ensure the active draft changes are saved first
              if (activeContactId && drafts[activeContactId]) {
                onSaveDraft(activeContactId, subject, body);
              }
              onStartSendCampaign();
            }}
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.875rem 2.5rem', fontSize: '1rem' }}
            disabled={sending || Object.keys(drafts).length === 0}
          >
            <Send size={18} />
            {sending ? 'Sending Emails...' : 'Send Bulk Emails (Automated)'}
          </button>
        </div>
      )}
    </div>
  );
}
