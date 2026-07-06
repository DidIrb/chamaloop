import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const MemberHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <Layout><div className="loading">Loading history...</div></Layout>;

  // Total paid and total fines across all rounds for this member
  const totalPaid = history.reduce((sum, round) => {
    const c = round.contributions[0];
    return sum + (c?.amount_paid ? parseFloat(c.amount_paid) : 0);
  }, 0);

  const totalFines = history.reduce((sum, round) => {
    const c = round.contributions[0];
    return sum + (c?.fine_amount ? parseFloat(c.fine_amount) : 0);
  }, 0);

  const roundsReceived = history.filter(r => r.recipient_name === user?.name).length;

  return (
    <Layout>
      <div className="page-title">My History</div>
      <div className="page-sub">Your personal contribution record across all rounds</div>

      {error && <div className="alert error">{error}</div>}

      {/* Summary cards */}
      {history.length > 0 && (
        <div className="cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-label">Total contributed</div>
            <div className="card-value green">KES {Number(totalPaid).toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="card-label">Rounds received</div>
            <div className="card-value">{roundsReceived}</div>
          </div>
          <div className="card">
            <div className="card-label">Total fines</div>
            <div className="card-value orange">
              {totalFines > 0 ? `KES ${Number(totalFines).toLocaleString()}` : 'None'}
            </div>
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="form-card" style={{ textAlign: 'center', color: '#777', padding: '2rem' }}>
          No completed rounds yet. Your history will appear here once rounds are closed.
        </div>
      )}

      {/* History table */}
      {history.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Recipient</th>
                <th>My amount</th>
                <th>M-Pesa code</th>
                <th>Date paid</th>
                <th>Fine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(round => {
                const c = round.contributions[0];
                const isRecipient = round.recipient_name === user?.name;
                return (
                  <tr key={round.round_id} style={{ background: isRecipient ? '#f0faf6' : 'white' }}>
                    <td style={{ fontWeight: 600, color: '#0F6E56' }}>
                      Round {round.round_number}
                      {isRecipient && (
                        <span className="badge paid" style={{ marginLeft: '6px', fontSize: '10px' }}>
                          Received
                        </span>
                      )}
                    </td>
                    <td>{round.recipient_name}</td>
                    <td>
                      {c?.amount_paid > 0
                        ? `KES ${Number(c.amount_paid).toLocaleString()}`
                        : '—'}
                    </td>
                    <td style={{ color: '#777', fontSize: '12px', fontFamily: 'monospace' }}>
                      {c?.mpesa_code || '—'}
                    </td>
                    <td style={{ color: '#777', fontSize: '12px' }}>
                      {c?.date_paid
                        ? new Date(c.date_paid).toLocaleDateString('en-KE', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td style={{ color: c?.fine_amount > 0 ? '#A32D2D' : '#777', fontSize: '13px' }}>
                      {c?.fine_amount > 0
                        ? `KES ${Number(c.fine_amount).toLocaleString()}`
                        : '—'}
                    </td>
                    <td>
                      {c && <span className={`badge ${c.status}`}>{c.status}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default MemberHistory;
