import React, { useState } from 'react';
import { UserCheck, Trash2, Plus, Sparkles, AlertTriangle } from 'lucide-react';

export default function ContactList({ contacts, onToggleSelect, onToggleSelectAll, onUpdateContact, onAddContact, onDeleteContact, onGenerateDrafts, generatingDrafts }) {
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (id, field, value) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const handleSaveEdit = (id, field) => {
    onUpdateContact(id, field, editValue.trim());
    setEditingCell(null);
  };

  const handleKeyDown = (e, id, field) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const selectedCount = contacts.filter(c => c.selected).length;
  const allSelected = contacts.length > 0 && selectedCount === contacts.length;

  return (
    <div className="card" style={{ width: '100%' }}>
      <div className="card-title">
        <UserCheck size={20} />
        <span>Review Extracted HR Contacts</span>
        {contacts.length > 0 && (
          <span className="badge-count" style={{ marginLeft: '0.5rem' }}>
            {selectedCount} / {contacts.length} Selected
          </span>
        )}
      </div>

      {contacts.length === 0 ? (
        <div style={{ textAlignment: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)', border: '1px dashed rgba(255, 255, 255, 0.08)', borderRadius: '10px' }}>
          No contacts found yet. Use the campaign panel to search, or add a contact manually below.
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => onToggleSelectAll(e.target.checked)}
                      className="custom-checkbox"
                    />
                  </th>
                  <th>Name</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>LinkedIn</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={contact.selected}
                        onChange={() => onToggleSelect(contact.id)}
                        className="custom-checkbox"
                      />
                    </td>
                    
                    {/* Inline Editable Name */}
                    <td 
                      className="td-editable"
                      onClick={() => editingCell?.id !== contact.id || editingCell?.field !== 'name' ? handleStartEdit(contact.id, 'name', contact.name) : null}
                    >
                      {editingCell?.id === contact.id && editingCell?.field === 'name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(contact.id, 'name')}
                          onKeyDown={(e) => handleKeyDown(e, contact.id, 'name')}
                          autoFocus
                        />
                      ) : (
                        contact.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Double-click to set</span>
                      )}
                    </td>

                    {/* Inline Editable Title */}
                    <td 
                      className="td-editable"
                      onClick={() => editingCell?.id !== contact.id || editingCell?.field !== 'title' ? handleStartEdit(contact.id, 'title', contact.title) : null}
                    >
                      {editingCell?.id === contact.id && editingCell?.field === 'title' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(contact.id, 'title')}
                          onKeyDown={(e) => handleKeyDown(e, contact.id, 'title')}
                          autoFocus
                        />
                      ) : (
                        contact.title || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Double-click to set</span>
                      )}
                    </td>

                    {/* Inline Editable Company */}
                    <td 
                      className="td-editable"
                      onClick={() => editingCell?.id !== contact.id || editingCell?.field !== 'company' ? handleStartEdit(contact.id, 'company', contact.company) : null}
                    >
                      {editingCell?.id === contact.id && editingCell?.field === 'company' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(contact.id, 'company')}
                          onKeyDown={(e) => handleKeyDown(e, contact.id, 'company')}
                          autoFocus
                        />
                      ) : (
                        contact.company
                      )}
                    </td>

                    {/* Inline Editable Email */}
                    <td 
                      className="td-editable"
                      onClick={() => editingCell?.id !== contact.id || editingCell?.field !== 'email' ? handleStartEdit(contact.id, 'email', contact.email) : null}
                    >
                      {editingCell?.id === contact.id && editingCell?.field === 'email' ? (
                        <input
                          type="email"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(contact.id, 'email')}
                          onKeyDown={(e) => handleKeyDown(e, contact.id, 'email')}
                          autoFocus
                        />
                      ) : (
                        <div className="flex-row">
                          <span>{contact.email}</span>
                          {contact.isPredicted ? (
                            <span className="badge badge-warning" title="Predicted format. Double-click to modify.">
                              <AlertTriangle size={10} /> Guess
                            </span>
                          ) : (
                            <span className="badge badge-success" title="Verified email address.">Real</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Inline Editable LinkedIn */}
                    <td 
                      className="td-editable"
                      onClick={() => editingCell?.id !== contact.id || editingCell?.field !== 'linkedin' ? handleStartEdit(contact.id, 'linkedin', contact.linkedin) : null}
                    >
                      {editingCell?.id === contact.id && editingCell?.field === 'linkedin' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(contact.id, 'linkedin')}
                          onKeyDown={(e) => handleKeyDown(e, contact.id, 'linkedin')}
                          autoFocus
                        />
                      ) : (
                        contact.linkedin ? (
                          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--secondary-color)', textDecoration: 'none' }}>
                            View Profile
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )
                      )}
                    </td>

                    {/* Delete button */}
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => onDeleteContact(contact.id)} 
                        className="file-remove-btn" 
                        title="Delete contact"
                        style={{ margin: '0 auto' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Buttons: Add Custom Row & Generate Drafts */}
      <div className="flex-between margin-top">
        <button onClick={onAddContact} className="btn btn-secondary" style={{ width: 'auto' }}>
          <Plus size={16} />
          Add Custom Contact
        </button>
        
        {contacts.length > 0 && (
          <button
            onClick={onGenerateDrafts}
            className="btn btn-primary"
            style={{ width: 'auto' }}
            disabled={selectedCount === 0 || generatingDrafts}
          >
            {generatingDrafts ? (
              <>
                <span className="spinner"></span>
                Generating Emails...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Personalize & Preview Emails
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
