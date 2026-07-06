import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const ForgotPin = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return setError('Please enter your email address.');

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-pin', { email });
      setSuccess('If that email is registered, a reset code has been sent. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Chama<span>Loop</span></div>
        <div className="auth-sub">Reset your PIN</div>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        {!success && (
          <>
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
              />
            </div>
            <button
              className="btn primary"
              style={{ width: '100%' }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </>
        )}

        {success && (
          <Link to="/reset-pin" state={{ email }}>
            <button className="btn primary" style={{ width: '100%' }}>
              Enter reset code →
            </button>
          </Link>
        )}

        <div className="auth-footer" style={{ marginTop: '1rem' }}>
          <Link to="/login">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPin;
