import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDownload,
  FiKey,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
} from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Admin.css';

const getCredits = (user) => Number(user.subscription?.votingCredits || 0);
const getUsedCredits = (user) => Number(user.subscription?.usedVotingCredits || 0);
const formatAmount = (value) =>
  `INR ${(Number(value || 0) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN');
};

const getPlanRows = (user) => {
  const rows = [];
  if (user.subscription?.orderId || user.subscription?.planDuration) {
    rows.push({ ...user.subscription, current: true });
  }

  return rows.concat(
    (user.subscriptionHistory || [])
      .slice()
      .reverse()
      .map((subscription) => ({ ...subscription, current: false })),
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [passwordForms, setPasswordForms] = useState({});
  const [creditForms, setCreditForms] = useState({});
  const [validityForms, setValidityForms] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem('companyAdminToken');

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        localStorage.removeItem('companyAdminToken');
        navigate('/admin', { replace: true });
        return;
      }
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      navigate('/admin', { replace: true });
      return;
    }
    fetchUsers();
  }, [fetchUsers, navigate, token]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.organization,
        user.phone,
        user.contact,
        user.username,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, users]);

  const totalCredits = users.reduce((sum, user) => sum + getCredits(user), 0);
  const activeUsers = users.filter((user) => user.subscription?.isValid).length;

  const updateUser = (updatedUser) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
  };

  const resetPassword = async (userId) => {
    const password = passwordForms[userId] || '';

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setPasswordForms((forms) => ({ ...forms, [userId]: '' }));
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const addFreeCredits = async (userId) => {
    const form = creditForms[userId] || {};

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/free-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          credits: form.credits,
          validityDays: form.validityDays || 365,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add free credits');
      }

      updateUser(data.user);
      setCreditForms((forms) => ({
        ...forms,
        [userId]: { credits: '', validityDays: 365 },
      }));
      toast.success('Free credits added with a zero amount invoice');
    } catch (error) {
      toast.error(error.message || 'Failed to add free credits');
    }
  };

  const updateValidity = async (userId, orderId) => {
    const formKey = `${userId}:${orderId}`;
    const endDate = validityForms[formKey] || '';

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(
        `${apiUrl}/api/admin/users/${userId}/subscriptions/${encodeURIComponent(
          orderId,
        )}/validity`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endDate }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update validity');
      }

      updateUser(data.user);
      setValidityForms((forms) => ({ ...forms, [formKey]: '' }));
      toast.success('Validity updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update validity');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/invoice/${orderId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || 'Failed to download invoice');
    }
  };

  const logout = () => {
    localStorage.removeItem('companyAdminToken');
    navigate('/admin', { replace: true });
  };

  return (
    <main className="company-admin-dashboard">
      <header className="company-admin-topbar">
        <div>
          <span className="company-admin-kicker"><FiUserCheck /> Company Admin</span>
          <h1>User Credit Dashboard</h1>
        </div>
        <div className="company-admin-topbar__actions">
          <button onClick={fetchUsers} type="button"><FiRefreshCw /> Refresh</button>
          <button onClick={logout} type="button"><FiLogOut /> Logout</button>
        </div>
      </header>

      <section className="company-admin-stats">
        <div><span>Total Users</span><strong>{users.length}</strong></div>
        <div><span>Active Subscriptions</span><strong>{activeUsers}</strong></div>
        <div><span>Available Credits</span><strong>{totalCredits}</strong></div>
      </section>

      <section className="company-admin-toolbar">
        <label>
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users, email, company, phone"
          />
        </label>
      </section>

      <section className="company-admin-users">
        {loading ? (
          <div className="company-admin-empty">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="company-admin-empty">No users found.</div>
        ) : (
          filteredUsers.map((user) => {
            const orderId = user.subscription?.orderId;
            const creditForm = creditForms[user.id] || { credits: '', validityDays: 365 };
            const planRows = getPlanRows(user);

            return (
              <article className="company-admin-user" key={user.id}>
                <div className="company-admin-user__main">
                  <div>
                    <h2>{user.name || user.email}</h2>
                    <p>{user.organization || 'No organization'} | {user.email}</p>
                    <p>{user.phone || user.contact || 'No phone'} | {user.district || 'No district'}, {user.state || 'No state'}</p>
                  </div>
                  <div className="company-admin-credit-box">
                    <span>Credits</span>
                    <strong>{getCredits(user)}</strong>
                    <small>Used {getUsedCredits(user)}</small>
                  </div>
                </div>

                <div className="company-admin-details">
                  <span>Plan: {user.subscription?.planDuration || 'N/A'}</span>
                  <span>Status: {user.subscription?.isValid ? 'Active' : 'Inactive'}</span>
                  <span>Start: {formatDate(user.subscription?.startDate)}</span>
                  <span>End: {formatDate(user.subscription?.endDate)}</span>
                  <span>Amount: {formatAmount(user.subscription?.amount)}</span>
                </div>

                <div className="company-admin-plans">
                  <div className="company-admin-plans__header">
                    <strong>Plans / Subscription Details</strong>
                    <span>{planRows.length} record{planRows.length === 1 ? '' : 's'}</span>
                  </div>

                  {planRows.length === 0 ? (
                    <div className="company-admin-plan-empty">No subscription records.</div>
                  ) : (
                    <div className="company-admin-plan-table">
                      <div className="company-admin-plan-row company-admin-plan-row--head">
                        <span>Plan</span>
                        <span>Credits</span>
                        <span>Used</span>
                        <span>Validity</span>
                        <span>Amount</span>
                        <span>Invoice</span>
                      </div>
                      {planRows.map((plan, index) => (
                        <div
                          className="company-admin-plan-row"
                          key={`${plan.orderId || plan.paymentId || 'plan'}-${index}`}
                        >
                          <span>
                            {plan.planDuration || 'Voting Subscription'}
                            {plan.current && <em>Current</em>}
                          </span>
                          <span>{Number(plan.votingCredits || 0)}</span>
                          <span>{Number(plan.usedVotingCredits || 0)}</span>
                          <span className="company-admin-validity-cell">
                            <small>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</small>
                            {plan.orderId && (
                              <span>
                                <input
                                  type="date"
                                  value={validityForms[`${user.id}:${plan.orderId}`] || ''}
                                  onChange={(event) =>
                                    setValidityForms((forms) => ({
                                      ...forms,
                                      [`${user.id}:${plan.orderId}`]: event.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() => updateValidity(user.id, plan.orderId)}
                                >
                                  Save
                                </button>
                              </span>
                            )}
                          </span>
                          <span>{formatAmount(plan.amount)}</span>
                          <span>
                            {plan.orderId ? (
                              <button
                                className="company-admin-plan-invoice"
                                type="button"
                                onClick={() => downloadInvoice(plan.orderId)}
                              >
                                <FiDownload /> PDF
                              </button>
                            ) : (
                              'N/A'
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="company-admin-actions">
                  <form
                    className="company-admin-action"
                    onSubmit={(event) => {
                      event.preventDefault();
                      resetPassword(user.id);
                    }}
                  >
                    <label>Reset Password</label>
                    <div>
                      <input
                        type="password"
                        value={passwordForms[user.id] || ''}
                        onChange={(event) =>
                          setPasswordForms((forms) => ({
                            ...forms,
                            [user.id]: event.target.value,
                          }))
                        }
                        placeholder="New password"
                        autoComplete="new-password"
                      />
                      <button type="submit">
                        <FiKey /> Reset
                      </button>
                    </div>
                  </form>

                  <div className="company-admin-action">
                    <label>Add Free Credits</label>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={creditForm.credits}
                        onChange={(event) =>
                          setCreditForms((forms) => ({
                            ...forms,
                            [user.id]: { ...creditForm, credits: event.target.value },
                          }))
                        }
                        placeholder="Credits"
                      />
                      <input
                        type="number"
                        min="1"
                        value={creditForm.validityDays}
                        onChange={(event) =>
                          setCreditForms((forms) => ({
                            ...forms,
                            [user.id]: { ...creditForm, validityDays: event.target.value },
                          }))
                        }
                        placeholder="Days"
                      />
                      <button type="button" onClick={() => addFreeCredits(user.id)}>
                        Add
                      </button>
                    </div>
                  </div>

                  {orderId && (
                    <button
                      className="company-admin-invoice"
                      type="button"
                      onClick={() => downloadInvoice(orderId)}
                    >
                      <FiDownload /> Invoice
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
      <ToastContainer position="top-right" autoClose={3000} />
    </main>
  );
};

export default AdminDashboard;
