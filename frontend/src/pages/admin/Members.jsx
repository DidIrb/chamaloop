import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // Add member form
  const [form, setForm] = useState({ name: '', phone_number: '', pin: ['', '', '', ''] });

  // Reset PIN state
  const [resetTarget, setResetTarget] = useState(null);
  const [newPin, setNewPin] = useState(['', '', '', '']);

  // Rotation edit state
  const [rotationEdit, setRotationEdit] = useState({});

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) {
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePinChange = (value, index, setter, current) => {
    if (isNaN(value)) return;
    const updated = [...current];
    updated[index] = value;
    setter(updated);
    if (value && index < 3) {
      document.getElementById(`pin-add-${index + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (e, index, prefix) => {
    if (e.key === 'Backspace' && index > 0) {
      document.getElementById(`${prefix}-${index - 1}`)?.focus();
    }
  };

  const handleAddMember = async () => {
    const pinValue = form.pin.join('');
    if (!form.name || !form.phone_number || pinValue.length !== 4) {
      return setError('Please fill in all fields and enter a complete PIN.');
    }
    setActionLoading('add');
    setError('');
    try {
      await api.post('/members', { name: form.name, phone_number: form.phone_number, pin: pinValue });
      setSuccess('Member added successfully.');
      setForm({ name: '', phone_number: '', pin: ['', '', '', ''] });
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateRotation = async (memberId) => {
    const order = rotationEdit[memberId];
    if (!order) return;
    setActionLoading(`rotation-${memberId}`);
    try {
      await api.put(`/members/${memberId}/rotation`, { rotation_order: order });
      setSuccess('Rotation order updated.');
      setRotationEdit(prev => ({ ...prev, [memberId]: '' }));
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update rotation.');
    } finally {
      setActionLoading('');
    }
  };

  const handleResetPin = async () => {
    const pinValue = newPin.join('');
    if (pinValue.length !== 4) return setError('Please enter a complete 4-digit PIN.');
    setActionLoading('reset-pin');
    try {
      await api.put(`/members/${resetTarget.member_id}/reset-pin`, { new_pin: pinValue });
      setSuccess(`PIN reset for ${resetTarget.name}.`);
      setResetTarget(null);
      setNewPin(['', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset PIN.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Layout><div className="loading">Loading members...</div></Layout>;

  return (
    <Layout>
      <div className="page-title">Members</div>
      <div className="page-sub">{members.length} member{members.length !== 1 ? 's' : ''} in the group</div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success" onClick={() => setSuccess('')}>{success}</div>}

      {/* Members table */}
      <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Rotation order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#777', padding: '2rem' }}>No members yet. Add one below.</td></tr>
            )}
            {members.map((m, i) => (
              <tr key={m.member_id}>
                <td style={{ color: '#777', fontSize: '12px' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{m.name}</td>
                <td style={{ color: '#777' }}>{m.phone_number}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ minWidth: '24px' }}>{m.rotation_order}</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="New #"
                      value={rotationEdit[m.member_id] || ''}
                      onChange={(e) => setRotationEdit(prev => ({ ...prev, [m.member_id]: e.target.value }))}
                      style={{ width: '64px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                    />
                    {rotationEdit[m.member_id] && (
                      <button
                        className="btn sm primary"
                        onClick={() => handleUpdateRotation(m.member_id)}
                        disabled={actionLoading === `rotation-${m.member_id}`}
                      >
                        Save
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    className="btn sm"
                    onClick={() => { setResetTarget(m); setNewPin(['', '', '', '']); setError(''); }}
                  >
                    Reset PIN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add member form */}
      <div className="form-card">
        <div className="form-title">Add New Member</div>
        <div className="field-row col2" style={{ marginBottom: '1rem' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Full name</label>
            <input name="name" value={form.name} onChange={handleFormChange} placeholder="Member's full name" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Phone number</label>
            <input name="phone_number" value={form.phone_number} onChange={handleFormChange} placeholder="0712345678" />
          </div>
        </div>
        <div className="field">
          <label>Assign a 4-digit PIN</label>
          <div className="pin-row" style={{ justifyContent: 'flex-start' }}>
            {form.pin.map((digit, i) => (
              <input
                key={i}
                id={`pin-add-${i}`}
                className="pin-box"
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(e.target.value, i, (updated) => setForm(f => ({ ...f, pin: updated })), form.pin)}
                onKeyDown={(e) => handlePinKeyDown(e, i, 'pin-add')}
              />
            ))}
          </div>
        </div>
        <button
          className="btn primary"
          onClick={handleAddMember}
          disabled={actionLoading === 'add'}
        >
          {actionLoading === 'add' ? 'Adding...' : 'Add member'}
        </button>
      </div>

      {/* Reset PIN modal */}
      {resetTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="form-card" style={{ width: '360px', margin: 0 }}>
            <div className="form-title">Reset PIN — {resetTarget.name}</div>
            <div className="field">
              <label>New 4-digit PIN</label>
              <div className="pin-row" style={{ justifyContent: 'flex-start' }}>
                {newPin.map((digit, i) => (
                  <input
                    key={i}
                    id={`pin-reset-${i}`}
                    className="pin-box"
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(e.target.value, i, setNewPin, newPin)}
                    onKeyDown={(e) => handlePinKeyDown(e, i, 'pin-reset')}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setResetTarget(null)}>Cancel</button>
              <button
                className="btn primary"
                style={{ flex: 1 }}
                onClick={handleResetPin}
                disabled={actionLoading === 'reset-pin'}
              >
                {actionLoading === 'reset-pin' ? 'Saving...' : 'Save PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Members;
