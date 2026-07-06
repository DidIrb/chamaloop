import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/rounds/active');
        setData(res.data);
      } catch (err) {
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  // Find this member's own contribution
  const myContribution = data?.contributions?.find(c => c.member_id === user?.member_id);

  return (
    <Layout>
      <div className="page-title">My Dashboard</div>
      <div className="page-sub">
        {data?.round ? `Round ${data.round.round_number} is active` : 'No active round at the moment'}
      </div>

      {error && <div className="alert error">{error}</div>}

      {!data?.round && (
        <div className="form-card" style={{ textAlign: 'center', color: '#777', padding: '2rem' }}>
          There is no active round right now. Your organiser will start one shortly.
        </div>
      )}

      {data?.round && (
        <>
          {/* Who gets the money this round */}
          <div className="recipient-box">
            <div>
              <div className="recipient-label">This round's recipient</div>
              <div className="recipient-name">{data.round.recipient_name}</div>
              <div className="recipient-sub">
                Payout: KES {Number(data.round.payout_amount).toLocaleString()}
              </div>
            </div>
            <span className="badge paid">Round {data.round.round_number}</span>
          </div>

          {/* My contribution status */}
          <div className="form-card">
            <div className="form-title">My Contribution</div>
            {myContribution ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555', fontSize: '13.5px' }}>Status</span>
                  <span className={`badge ${myContribution.status}`}>{myContribution.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555', fontSize: '13.5px' }}>Amount</span>
                  <span style={{ fontWeight: 500 }}>
                    {myContribution.amount_paid > 0
                      ? `KES ${Number(myContribution.amount_paid).toLocaleString()}`
                      : '—'}
                  </span>
                </div>
                {myContribution.mpesa_code && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#555', fontSize: '13.5px' }}>M-Pesa code</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{myContribution.mpesa_code}</span>
                  </div>
                )}
                {myContribution.date_paid && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#555', fontSize: '13.5px' }}>Date paid</span>
                    <span style={{ color: '#777', fontSize: '13px' }}>
                      {new Date(myContribution.date_paid).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {myContribution.fine_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fdecea', borderRadius: '6px', padding: '8px 12px' }}>
                    <span style={{ color: '#A32D2D', fontSize: '13px' }}>Late fine applied</span>
                    <span style={{ color: '#A32D2D', fontWeight: 600 }}>
                      KES {Number(myContribution.fine_amount).toLocaleString()}
                    </span>
                  </div>
                )}
                {myContribution.status === 'pending' && (
                  <div style={{
                    background: '#fef3e2', border: '1px solid #f5d9a0',
                    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#854F0B'
                  }}>
                    Your contribution is pending. Please send your payment via M-Pesa and inform your organiser.
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#777', fontSize: '13.5px' }}>No contribution record found for this round.</p>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default MemberDashboard;
