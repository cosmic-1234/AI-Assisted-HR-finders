import React, { useEffect, useRef } from 'react';
import { Terminal, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

export default function ProgressPanel({ currentCount, totalCount, sending, logs, onClear }) {
  const terminalEndRef = useRef(null);

  // Auto scroll terminal to the bottom as logs accumulate
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const percentage = totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0;
  
  const successCount = logs.filter(l => l.type === 'success').length;
  const errorCount = logs.filter(l => l.type === 'error').length;

  return (
    <div className="card" style={{ width: '100%' }}>
      <div className="card-title">
        <Terminal size={20} />
        <span>Campaign Sending Progress</span>
        {sending && <span className="spinner" style={{ marginLeft: 'auto', width: '16px', height: '16px' }}></span>}
      </div>

      <div className="progress-header">
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {sending ? (
            <span>Sending emails... <strong>{currentCount} of {totalCount}</strong></span>
          ) : currentCount === totalCount && totalCount > 0 ? (
            <span style={{ color: 'var(--success-color)' }}>Campaign Completed!</span>
          ) : (
            <span>Campaign Idle</span>
          )}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{percentage}%</div>
      </div>

      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Sending Stats Card Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Targeted</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.25rem' }}>{totalCount}</div>
        </div>
        <div style={{ background: 'var(--success-glow)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <CheckCircle size={10} /> Sent
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-color)', marginTop: '0.25rem' }}>{successCount}</div>
        </div>
        <div style={{ background: 'var(--error-glow)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--error-color)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <XCircle size={10} /> Failed
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error-color)', marginTop: '0.25rem' }}>{errorCount}</div>
        </div>
      </div>

      {/* Terminal logs */}
      <div className="log-terminal">
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Terminal awaiting execution logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              <span className="log-time">[{log.timestamp}]</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
        <div ref={terminalEndRef}></div>
      </div>

      {logs.length > 0 && !sending && (
        <div className="margin-top" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClear} className="btn btn-secondary" style={{ width: 'auto' }}>
            <RefreshCw size={14} /> Clear Logs
          </button>
        </div>
      )}
    </div>
  );
}
