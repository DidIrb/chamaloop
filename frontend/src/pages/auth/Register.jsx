import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);

  const [form, setForm] = useState({
    chama_name: '', contribution_amount: '', fine_amount: '',
    meeting_frequency: 'Monthly', admin_name: '', phone_number: '', email: '',
    location_name: '', latitude: null, longitude: null,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      return setError('Geolocation is not supported by your browser.');
    }
    setLocLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setLocLoading(false);
      },
      () => {
        setError('Could not detect location. You can enter it manually or skip.');
        setLocLoading(false);
      }
    );
  };

  const nextStep = () => {
    if (!form.chama_name || !form.contribution_amount) {
      return setError('Chama name and contribution amount are required.');
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    const pinValue = pin.join('');
    if (!form.admin_name || !form.phone_number) {
      return setError('Name and phone number are required.');
    }
    if (pinValue.length !== 4) {
      return setError('Please enter a complete 4-digit PIN.');
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, pin: pinValue });
      navigate('/login', { state: { message: 'Chama registered successfully. You can now log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Chama<span>Loop</span></div>
        <div className="auth-sub">Set up your savings group</div>

        <div className="step-bar">
          <div className={`step ${step >= 1 ? 'done' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'done' : 'active'}`}></div>
          <div className={`step ${step >= 3 ? 'done' : step === 2 ? 'active' : ''}`}></div>
        </div>

        {error && <div className="alert error">{error}</div>}

        {step === 1 && (
          <>
            <div className="form-title">Group Details</div>
            <div className="field">
              <label>Chama name</label>
              <input name="chama_name" value={form.chama_name} onChange={handleChange} placeholder="e.g. Umoja Savings Group" />
            </div>
            <div className="field-row col2">
              <div className="field">
                <label>Contribution amount (KES)</label>
                <input name="contribution_amount" type="number" value={form.contribution_amount} onChange={handleChange} placeholder="e.g. 2000" />
              </div>
              <div className="field">
                <label>Late fine (KES)</label>
                <input name="fine_amount" type="number" value={form.fine_amount} onChange={handleChange} placeholder="e.g. 200" />
              </div>
            </div>
            <div className="field">
              <label>Meeting frequency</label>
              <select name="meeting_frequency" value={form.meeting_frequency} onChange={handleChange}>
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
              </select>
            </div>
            <button className="btn primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={nextStep}>
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-title">Chama Location</div>
            <div className="field">
              <label>Location name <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
              <input name="location_name" value={form.location_name} onChange={handleChange} placeholder="e.g. Westlands, Nairobi" />
            </div>
            <div className="field">
              <label>GPS coordinates <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  readOnly
                  value={form.latitude && form.longitude ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}` : ''}
                  placeholder="Click Detect to auto-fill"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '7px', fontSize: '13.5px', background: '#fafafa', color: '#555' }}
                />
                <button className="btn" onClick={handleDetectLocation} disabled={locLoading} style={{ whiteSpace: 'nowrap' }}>
                  {locLoading ? 'Detecting...' : '📍 Detect'}
                </button>
              </div>
              {form.latitude && <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '5px' }}>✓ Location captured</div>}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn primary" style={{ flex: 2 }} onClick={() => { setError(''); setStep(3); }}>
                Continue →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="form-title">Organiser Account</div>
            <div className="field">
              <label>Full name</label>
              <input name="admin_name" value={form.admin_name} onChange={handleChange} placeholder="Your full name" />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="0712345678" />
            </div>
            <div className="field">
              <label>Email address (for PIN reset)</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
            </div>
            <div className="field">
              <label>Set your 4-digit PIN</label>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </>
        )}

        <div className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

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

  const nextStep = () => {
    if (!form.chama_name || !form.contribution_amount) {
      return setError('Chama name and contribution amount are required.');
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    const pinValue = pin.join('');
    if (!form.admin_name || !form.phone_number) {
      return setError('Name and phone number are required.');
    }
    if (pinValue.length !== 4) {
      return setError('Please enter a complete 4-digit PIN.');
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, pin: pinValue });
      navigate('/login', { state: { message: 'Chama registered successfully. You can now log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Chama<span>Loop</span></div>
        <div className="auth-sub">Set up your savings group</div>

        <div className="step-bar">
          <div className={`step ${step >= 1 ? 'done' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'done' : 'active'}`}></div>
        </div>

        {error && <div className="alert error">{error}</div>}

        {step === 1 && (
          <>
            <div className="form-title">Group Details</div>
            <div className="field">
              <label>Chama name</label>
              <input name="chama_name" value={form.chama_name} onChange={handleChange} placeholder="e.g. Umoja Savings Group" />
            </div>
            <div className="field-row col2">
              <div className="field">
                <label>Contribution amount (KES)</label>
                <input name="contribution_amount" type="number" value={form.contribution_amount} onChange={handleChange} placeholder="e.g. 2000" />
              </div>
              <div className="field">
                <label>Late fine (KES)</label>
                <input name="fine_amount" type="number" value={form.fine_amount} onChange={handleChange} placeholder="e.g. 200" />
              </div>
            </div>
            <div className="field">
              <label>Meeting frequency</label>
              <select name="meeting_frequency" value={form.meeting_frequency} onChange={handleChange}>
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
              </select>
            </div>
            <button className="btn primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={nextStep}>
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-title">Organiser Account</div>
            <div className="field">
              <label>Full name</label>
              <input name="admin_name" value={form.admin_name} onChange={handleChange} placeholder="Your full name" />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="0712345678" />
            </div>
            <div className="field">
              <label>Email address (for PIN reset)</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
            </div>
            <div className="field">
              <label>Set your 4-digit PIN</label>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </>
        )}

        <div className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
