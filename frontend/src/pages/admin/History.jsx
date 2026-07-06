import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/history');
        setHistory(res.data);
      } catch (err) {
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleExpand = (roundId) => {
    setExpanded(prev => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  if (loading) return <Layout><div className="loading">Loading history...</div></Layout>;

  return (
    <Layout>
      <div className="page-title">History Ledger</div>
      <div className="page-sub">
        Permanent record of all completed rounds — records cannot be deleted or modified
      </div>

      {error && <div className="alert error">{error}</div>}

      {history.length === 0 && (
        <div className="form-card" style={{ textAlign: 'center', color: '#777', padding: '2rem' }}>
          No completed rounds yet. Close your first round from the Dashboard to see it here.
        </div>
      )}

      {/* Lock notice */}
      {history.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#fef3e2', border: '1px solid #f5d9a0',
          borderRadius: '8px', padding: '10px 14px', marginBottom: '1.25rem',
          fontSize: '13px', color: '#854F0B'
        }}>
          <span>🔒</span>
          <span>This ledger is permanent. Records are append-only and cannot be edited or deleted.</span>
        </div>
      )}

      {/* Rounds list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map(round => {
          const isOpen = expanded[round.round_id];
          const paidCount = round.contributions.filter(c => c.status === 'paid').length;
          const lateCount = round.contributions.filter(c => c.status === 'late').length;

          return (
            <div key={round.round_id} className="table-wrap">
              {/* Round header row */}
              <div
                onClick={() => toggleExpand(round.round_id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 160px 140px 120px 40px',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: isOpen ? '#f0faf6' : '#fff',
                  borderBottom: isOpen ? '1px solid #e5e5e5' : 'none',
                  transition: 'background 0.15s'
                }}
              >
                <span style={{ fontWeight: 600, color: '#0F6E56' }}>Round {round.round_number}</span>
                <span style={{ fontWeight: 500 }}>{round.recipient_name}</span>
                <span style={{ color: '#0F6E56', fontWeight: 500 }}>
                  KES {Number(round.payout_amount).toLocaleString()}
                </span>
                <span style={{ color: '#777', fontSize: '12px' }}>
                  {new Date(round.date_conducted).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge paid">{paidCount} paid</span>
                  {lateCount > 0 && <span className="badge late">{lateCount} late</span>}
                </div>
                <span style={{ color: '#777', fontSize: '18px', textAlign: 'center' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>

              {/* Expanded contributions */}
              {isOpen && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#777', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>Member</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#777', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>M-Pesa Code</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#777', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>Amount</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#777', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>Date Paid</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#777', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>Fine</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#777', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {round.contributions.map(c => (
                      <tr key={c.contribution_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px 16px', fontSize: '13.5px' }}>{c.name}</td>
                        <td style={{ padding: '10px 16px', fontSize: '12px', color: '#777' }}>
                          {c.mpesa_code || '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '13.5px' }}>
                          {c.amount_paid > 0 ? `KES ${Number(c.amount_paid).toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '12px', color: '#777' }}>
                          {c.date_paid
                            ? new Date(c.date_paid).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '13px', color: c.fine_amount > 0 ? '#A32D2D' : '#777' }}>
                          {c.fine_amount > 0 ? `KES ${Number(c.fine_amount).toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className={`badge ${c.status}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                    {/* Total fines row */}
                    {round.totalFines > 0 && (
                      <tr style={{ background: '#fef3e2' }}>
                        <td colSpan={4} style={{ padding: '8px 16px', fontSize: '12px', color: '#854F0B', fontWeight: 500 }}>
                          Total fines collected this round
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '13px', color: '#854F0B', fontWeight: 600 }}>
                          KES {Number(round.totalFines).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default History;
