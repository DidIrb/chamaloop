import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [mpesaInputs, setMpesaInputs] = useState({});
  const [actionLoading, setActionLoading] = useState('');
  const [success, setSuccess] = useState('');

  // Reports
  const now = new Date();
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportLoading, setReportLoading] = useState('');

  const handleDownloadReport = async (format) => {
    setReportLoading(format);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/reports/${format}?year=${reportYear}&month=${reportMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to generate report.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ChamaLoop_Report_${reportMonth}_${reportYear}.${format === 'word' ? 'docx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setReportLoading('');
    }
  };

  const fetchDashboard = async () => {
    try {
      const [roundRes, membersRes] = await Promise.all([
        api.get('/rounds/active'),
        api.get('/members'),
      ]);
      setData(roundRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleStartRound = async () => {
    if (!selectedRecipient) return setError('Please select a recipient for this round.');
    setActionLoading('start');
    setError('');
    try {
      await api.post('/rounds', { recipient_member_id: selectedRecipient });
      setSuccess('New round started successfully.');
      setSelectedRecipient('');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start round.');
    } finally {
      setActionLoading('');
    }
  };

  const handleCloseRound = async () => {
    if (!window.confirm('Are you sure you want to close this round? This will be permanently recorded in the history ledger.')) return;
    setActionLoading('close');
    setError('');
    try {
      await api.put(`/rounds/${data.round.round_id}/close`);
      setSuccess('Round closed and saved to history ledger.');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close round.');
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkPaid = async (memberId) => {
    setActionLoading(`pay-${memberId}`);
    setError('');
    try {
      await api.put(`/rounds/${data.round.round_id}/contributions/${memberId}/pay`, {
        mpesa_code: mpesaInputs[memberId] || ''
      });
      setSuccess('Contribution marked as paid.');
      setMpesaInputs(prev => ({ ...prev, [memberId]: '' }));
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as paid.');
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkLate = async (memberId) => {
    setActionLoading(`late-${memberId}`);
    setError('');
    try {
      await api.put(`/rounds/${data.round.round_id}/contributions/${memberId}/late`);
      setSuccess('Member marked as late. Fine applied.');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as late.');
    } finally {
      setActionLoading('');
    }
  };

  const paidCount = data?.contributions?.filter(c => c.status === 'paid').length || 0;
  const totalMembers = data?.contributions?.length || 0;

  if (loading) return <Layout><div className="loading">Loading dashboard...</div></Layout>;

  return (
    <Layout>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">
        {data?.round ? `Round ${data.round.round_number} · Active` : 'No active round'}
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success" onClick={() => setSuccess('')}>{success}</div>}

      {/* No active round — start one */}
      {!data?.round && (
        <div className="form-card">
          <div className="form-title">Start a New Round</div>
          <div className="field">
            <label>Select this round's recipient</label>
            <select value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)}>
              <option value="">— Choose a member —</option>
              {members.map(m => (
                <option key={m.member_id} value={m.member_id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn primary"
            onClick={handleStartRound}
            disabled={actionLoading === 'start'}
          >
            {actionLoading === 'start' ? 'Starting...' : 'Start round'}
          </button>
        </div>
      )}

      {/* Active round */}
      {data?.round && (
        <>
          {/* Summary cards */}
          <div className="cards">
            <div className="card">
              <div className="card-label">Total payout</div>
              <div className="card-value green">KES {Number(data.round.payout_amount).toLocaleString()}</div>
            </div>
            <div className="card">
              <div className="card-label">Paid so far</div>
              <div className="card-value">{paidCount} / {totalMembers}</div>
            </div>
            <div className="card">
              <div className="card-label">Outstanding</div>
              <div className="card-value orange">
                KES {Number(data.round.payout_amount - (data.totalPaid || 0)).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Recipient box */}
          <div className="recipient-box">
            <div>
              <div className="recipient-label">This round's recipient</div>
              <div className="recipient-name">{data.round.recipient_name}</div>
              <div className="recipient-sub">
                Receives KES {Number(data.round.payout_amount).toLocaleString()} when all contributions are in
              </div>
            </div>
            <span className="badge paid">Round {data.round.round_number}</span>
          </div>

          {/* Contributions table */}
          <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>M-Pesa code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.contributions.map(c => (
                  <tr key={c.member_id}>
                    <td>{c.name}</td>
                    <td style={{ color: '#777', fontSize: '12px' }}>
                      {c.mpesa_code || '—'}
                    </td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            placeholder="M-Pesa code"
                            value={mpesaInputs[c.member_id] || ''}
                            onChange={(e) => setMpesaInputs(prev => ({ ...prev, [c.member_id]: e.target.value }))}
                            style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', width: '120px' }}
                          />
                          <button
                            className="btn sm primary"
                            onClick={() => handleMarkPaid(c.member_id)}
                            disabled={actionLoading === `pay-${c.member_id}`}
                          >
                            Mark paid
                          </button>
                          <button
                            className="btn sm danger"
                            onClick={() => handleMarkLate(c.member_id)}
                            disabled={actionLoading === `late-${c.member_id}`}
                          >
                            Late
                          </button>
                        </div>
                      )}
                      {c.status === 'paid' && <span style={{ color: '#777', fontSize: '12px' }}>—</span>}
                      {c.status === 'late' && (
                        <span style={{ color: '#A32D2D', fontSize: '12px' }}>
                          Fine: KES {Number(c.fine_amount).toLocaleString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Close round button */}
          <button
            className="btn"
            style={{ borderColor: '#1D9E75', color: '#0F6E56' }}
            onClick={handleCloseRound}
            disabled={actionLoading === 'close'}
          >
            {actionLoading === 'close' ? 'Closing...' : 'Close round & record in history'}
          </button>
        </>
      )}

      {/* Monthly Reports */}
      <div className="form-card" style={{ marginTop: '2rem' }}>
        <div className="form-title">Monthly Reports</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Month</label>
            <select value={reportMonth} onChange={(e) => setReportMonth(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '13.5px' }}>
              {['January','February','March','April','May','June','July','August','September','October','November','December']
                .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Year</label>
            <input
              type="number" value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              style={{ width: '90px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '13.5px' }}
            />
          </div>
          <button
            className="btn primary"
            onClick={() => handleDownloadReport('word')}
            disabled={!!reportLoading}
          >
            {reportLoading === 'word' ? 'Generating...' : '↓ Download Word'}
          </button>
          <button
            className="btn"
            style={{ borderColor: '#1D9E75', color: '#0F6E56' }}
            onClick={() => handleDownloadReport('pdf')}
            disabled={!!reportLoading}
          >
            {reportLoading === 'pdf' ? 'Generating...' : '↓ Download PDF'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
