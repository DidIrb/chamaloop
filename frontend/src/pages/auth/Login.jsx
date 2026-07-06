import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [phone_number, setPhoneNumber] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Show success message if redirected from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  // If already logged in redirect to correct dashboard
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handlePinChange = (value, index) => {
    if (isNaN(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinValue = pin.join('');
    if (!phone_number || pinValue.length !== 4) {
      return setError('Please enter your phone number and complete 4-digit PIN.');
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { phone_number, pin: pinValue });
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setPin(['', '', '', '']);
      document.getElementById('pin-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Chama<span>Loop</span></div>
        <div className="auth-sub">Sign in to your account</div>

        {success && <div className="alert success">{success}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="field">
          <label>Phone number</label>
          <input
            type="tel"
            value={phone_number}
            onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
            placeholder="0712345678"
          />
        </div>

        <div className="field">
          <label>Enter your PIN</label>
          <div className="pin-row">
            {pin.map((digit, i) => (
              <input
                key={i}
                id={`pin-${i}`}
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
          style={{ width: '100%', marginTop: '0.75rem' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="auth-footer" style={{ marginTop: '1rem' }}>
          <Link to="/forgot-pin">Forgot your PIN?</Link>
        </div>
        <div className="auth-footer">
          New group? <Link to="/register">Register your Chama</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
