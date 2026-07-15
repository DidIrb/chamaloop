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
  const [form, setForm] = useState({
    name: '', phone_number: '', pin: ['', '', '', ''],
    business_name: '', business_type: '', business_location: ''
  });

  // Reset PIN state
  const [resetTarget, setResetTarget] = useState(null);
  const [newPin, setNewPin] = useState(['', '', '', '']);

  // Rotation edit state
  const [rotationEdit, setRotationEdit] = useState({});

  // Business info edit state
  const [businessTarget, setBusinessTarget] = useState(null);
  const [businessForm, setBusinessForm] = useState({ business_name: '', business_type: '', business_location: '' });

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
      await api.post('/members', {
        name: form.name, phone_number: form.phone_number, pin: pinValue,
        business_name: form.business_name || undefined,
        business_type: form.business_type || undefined,
        business_location: form.business_location || undefined,
      });
      setSuccess('Member added successfully.');
      setForm({ name: '', phone_number: '', pin: ['', '', '', ''], business_name: '', business_type: '', business_location: '' });
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

  const openBusinessModal = (m) => {
    setBusinessTarget(m);
    setBusinessForm({
      business_name: m.business_name || '',
      business_type: m.business_type || '',
      business_location: m.business_location || '',
    });
    setError('');
  };

  const handleUpdateBusiness = async () => {
    setActionLoading('business');
    try {
      await api.put(`/members/${businessTarget.member_id}/business`, businessForm);
      setSuccess(`Business info updated for ${businessTarget.name}.`);
      setBusinessTarget(null);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update business info.');
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
              <th>Business</th>
              <th>Rotation order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#777', padding: '2rem' }}>No members yet. Add one below.</td></tr>
            )}
            {members.map((m, i) => (
              <tr key={m.member_id}>
                <td style={{ color: '#777', fontSize: '12px' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{m.name}</td>
                <td style={{ color: '#777' }}>{m.phone_number}</td>
                <td style={{ color: '#777', fontSize: '12px' }}>
                  {m.business_name
                    ? <span>{m.business_name}{m.business_type ? ` · ${m.business_type}` : ''}</span>
                    : <span style={{ color: '#bbb' }}>—</span>
                  }
                </td>
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn sm" onClick={() => openBusinessModal(m)}>Business</button>
                    <button
                      className="btn sm"
                      onClick={() => { setResetTarget(m); setNewPin(['', '', '', '']); setError(''); }}
                    >
                      Reset PIN
                    </button>
                  </div>
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
        <div className="field-row col3" style={{ marginBottom: '1rem' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Business name <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <input name="business_name" value={form.business_name} onChange={handleFormChange} placeholder="e.g. Mama Mboga" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Business type <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <input name="business_type" value={form.business_type} onChange={handleFormChange} placeholder="e.g. Retail" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Business location <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <input name="business_location" value={form.business_location} onChange={handleFormChange} placeholder="e.g. Gikomba Market" />
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

      {/* Business info modal */}
      {businessTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="form-card" style={{ width: '400px', margin: 0 }}>
            <div className="form-title">Business Info — {businessTarget.name}</div>
            <div className="field">
              <label>Business name</label>
              <input
                value={businessForm.business_name}
                onChange={(e) => setBusinessForm(f => ({ ...f, business_name: e.target.value }))}
                placeholder="e.g. Mama Mboga"
              />
            </div>
            <div className="field">
              <label>Business type</label>
              <input
                value={businessForm.business_type}
                onChange={(e) => setBusinessForm(f => ({ ...f, business_type: e.target.value }))}
                placeholder="e.g. Retail, Transport, Agriculture"
              />
            </div>
            <div className="field">
              <label>Business location</label>
              <input
                value={businessForm.business_location}
                onChange={(e) => setBusinessForm(f => ({ ...f, business_location: e.target.value }))}
                placeholder="e.g. Gikomba Market, Nairobi"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setBusinessTarget(null)}>Cancel</button>
              <button
                className="btn primary"
                style={{ flex: 1 }}
                onClick={handleUpdateBusiness}
                disabled={actionLoading === 'business'}
              >
                {actionLoading === 'business' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

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
