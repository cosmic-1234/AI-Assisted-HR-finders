import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Building2 } from 'lucide-react';

export default function SearchPanel({ onSearch, loading, isConfigValid }) {
  const [companiesText, setCompaniesText] = useState('');
  const [role, setRole] = useState('');
  const [country, setCountry] = useState('India');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companiesText.trim()) return alert('Please enter at least one company.');
    if (!role.trim()) return alert('Please enter the target role.');
    
    // Split by commas, trim, and filter empty strings
    const companies = companiesText
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
      
    onSearch({ companies, role, country });
  };

  return (
    <div className="card">
      <div className="card-title">
        <Search size={20} />
        <span>Create Job Campaign</span>
      </div>

      {!isConfigValid && (
        <div style={{ padding: '0.875rem', background: 'var(--error-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.85rem', color: '#fca5a5', marginBottom: '1.25rem' }}>
          Please complete your <strong>Setup Configuration</strong> (API key, SMTP, and Resume PDF) in the panel on the left before searching.
        </div>
      )}

      <form onSubmit={handleSubmit} className="main-panel-content">
        {/* Companies list */}
        <div className="form-group">
          <label>Target Companies</label>
          <div className="input-wrapper">
            <Building2 size={16} />
            <input
              type="text"
              value={companiesText}
              onChange={(e) => setCompaniesText(e.target.value)}
              placeholder="e.g. TCS, Infosys, Wipro, Google"
              className="form-control"
              disabled={loading || !isConfigValid}
            />
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            Separate multiple companies with commas.
          </small>
        </div>

        {/* Target Role */}
        <div className="form-group">
          <label>Target Role</label>
          <div className="input-wrapper">
            <Briefcase size={16} />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Marketing Intern"
              className="form-control"
              disabled={loading || !isConfigValid}
            />
          </div>
        </div>

        {/* Target Country */}
        <div className="form-group">
          <label>Country</label>
          <div className="input-wrapper">
            <MapPin size={16} />
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India"
              className="form-control"
              disabled={loading || !isConfigValid}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !isConfigValid || !companiesText || !role}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Searching HR Contacts...
            </>
          ) : (
            <>
              <Search size={18} />
              Search HR Contacts
            </>
          )}
        </button>
      </form>
    </div>
  );
}
