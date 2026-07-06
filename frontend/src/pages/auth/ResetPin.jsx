import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';

const ResetPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinChange = (value, index) => {
    if (isNaN(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      document.getElementById(`newpin-${index + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`newpin-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinValue = pin.join('');
    if (!email || !code || pinValue.length !== 4) {
      return setError('Please fill in all fields and enter a complete PIN.');
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-pin', { email, code, new_pin: pinValue });
      navigate('/login', { state: { message: 'PIN reset successfully. You can now sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Chama<span>Loop</span></div>
        <div className="auth-sub">Enter your reset code and new PIN</div>

        {error && <div className="alert error">{error}</div>}

        <div className="field">
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="your@email.com"
          />
        </div>
        <div className="field">
          <label>6-digit reset code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            placeholder="Enter the code from your email"
            maxLength={6}
          />
        </div>
        <div className="field">
          <label>New 4-digit PIN</label>
          <div className="pin-row">
            {pin.map((digit, i) => (
              <input
                key={i}
                id={`newpin-${i}`}
                className="pin-box"
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(e.target.value, i)}
                onKeyDown={(e) => handlePinKeyDown(e, i)}
              />
            ))}
          </div>
        </div>

        <button
          className="btn primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset PIN'}
        </button>

        <div className="auth-footer" style={{ marginTop: '1rem' }}>
          <Link to="/login">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPin;
