import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const Settings = () => {
  const [form, setForm] = useState({
    chama_name: '',
    contribution_amount: '',
    fine_amount: '',
    meeting_frequency: 'Monthly',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setForm({
          chama_name: res.data.chama_name,
          contribution_amount: res.data.contribution_amount,
          fine_amount: res.data.fine_amount,
          meeting_frequency: res.data.meeting_frequency,
        });
      } catch (err) {
        setError('Failed to load group settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!form.chama_name || !form.contribution_amount) {
      return setError('Chama name and contribution amount are required.');
    }
    setSaving(true);
    setError('');
    try {
      await api.put('/settings', form);
      setSuccess('Group settings updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="loading">Loading settings...</div></Layout>;

  return (
    <Layout>
      <div className="page-title">Group Settings</div>
      <div className="page-sub">Update your Chama configuration</div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="form-card" style={{ maxWidth: '560px' }}>
        <div className="form-title">Chama Configuration</div>

        <div className="field">
          <label>Chama name</label>
          <input
            name="chama_name"
            value={form.chama_name}
            onChange={handleChange}
            placeholder="e.g. Umoja Savings Group"
          />
        </div>

        <div className="field-row col2">
          <div className="field">
            <label>Contribution amount (KES)</label>
            <input
              name="contribution_amount"
              type="number"
              min="1"
              value={form.contribution_amount}
              onChange={handleChange}
              placeholder="e.g. 2000"
            />
          </div>
          <div className="field">
            <label>Late fine (KES)</label>
            <input
              name="fine_amount"
              type="number"
              min="0"
              value={form.fine_amount}
              onChange={handleChange}
              placeholder="e.g. 200"
            />
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

        <div style={{
          background: '#fef3e2', border: '1px solid #f5d9a0',
          borderRadius: '8px', padding: '10px 14px',
          fontSize: '12.5px', color: '#854F0B', marginBottom: '1rem'
        }}>
          Note: Changing the contribution amount will apply to future rounds only. Past rounds in the history ledger are not affected.
        </div>

        <button
          className="btn primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </Layout>
  );
};

export default Settings;
