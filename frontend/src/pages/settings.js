import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './App.css';
import { Widget } from '@uploadcare/react-widget';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

const Settings = ({ setIsAuthenticated }) => {
  const [subUserEmail, setSubUserEmail] = useState('');
  const [subUserPassword, setSubUserPassword] = useState('');
  const [subUserFullName, setSubUserFullName] = useState('');
  const [subUserRole, setSubUserRole] = useState('user');
  const [subUserProfilePic, setSubUserProfilePic] = useState(null);
  const [subUserPermissions, setSubUserPermissions] = useState({
    voting: true,
    manage: true,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [subUsers, setSubUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const uploadcarePublicKey = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const fetchSubUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sub-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSubUsers(data);
      } else {
        throw new Error(data.message || 'Failed to fetch sub-users');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateSubUser = async (e) => {
    e.preventDefault();

    if (!subUserEmail || !subUserPassword || !subUserFullName) {
      toast.error('Full Name, Email, and Password are required');
      return;
    }

    const permissions = [];
    if (subUserPermissions.voting) permissions.push('/voting/:eventId');
    if (subUserPermissions.manage) permissions.push('/manage');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      let profilePicUrl = '';
      if (subUserProfilePic && subUserProfilePic.uuid && subUserProfilePic.cdnUrl) {
        profilePicUrl = subUserProfilePic.uuid;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sub-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: subUserFullName,
          email: subUserEmail,
          password: subUserPassword,
          role: subUserRole,
          profilePic: profilePicUrl,
          permissions,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create sub-user');
      }

      toast.success('Sub-user created successfully');
      setSubUserFullName('');
      setSubUserEmail('');
      setSubUserPassword('');
      setSubUserRole('user');
      setSubUserProfilePic(null);
      setSubUserPermissions({ voting: true, manage: true });
      setShowCreateForm(false);
      fetchSubUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditSubUser = (userId) => {
    const user = subUsers.find(u => u._id === userId);
    if (!user) {
      toast.error('User not found');
      return;
    }
    setSubUserFullName(user.fullName || '');
    setSubUserEmail(user.email || '');
    setSubUserRole(user.role || 'user');
    setSubUserProfilePic(user.profilePic ? { uuid: user.profilePic, cdnUrl: `https://ucarecdn.com/${user.profilePic}/` } : null);
    setSubUserPermissions({
      voting: user.permissions.includes('/voting/:eventId'),
      manage: user.permissions.includes('/manage'),
    });
    setEditingUserId(userId);
    setShowCreateForm(true);
  };

  const handleUpdateSubUser = async (e) => {
    e.preventDefault();

    if (!subUserEmail || !subUserFullName) {
      toast.error('Full Name and Email are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      let profilePicUrl = subUsers.find(u => u._id === editingUserId)?.profilePic || '';
      if (subUserProfilePic && subUserProfilePic.uuid && subUserProfilePic.cdnUrl) {
        profilePicUrl = subUserProfilePic.uuid;
      }

      const permissions = [];
      if (subUserPermissions.voting) permissions.push('/voting/:eventId');
      if (subUserPermissions.manage) permissions.push('/manage');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sub-users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: subUserFullName,
          email: subUserEmail,
          role: subUserRole,
          profilePic: profilePicUrl,
          permissions,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update sub-user');
      }

      toast.success('Sub-user updated successfully');
      setSubUserFullName('');
      setSubUserEmail('');
      setSubUserRole('user');
      setSubUserProfilePic(null);
      setSubUserPermissions({ voting: true, manage: true });
      setEditingUserId(null);
      setShowCreateForm(false);
      fetchSubUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteSubUser = async (userId) => {
    if (!userId || !window.confirm('Are you sure you want to delete this sub-user?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sub-users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete sub-user');
      }

      toast.success('Sub-user deleted successfully');
      fetchSubUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveSubUser = (e) => {
    e.preventDefault();
    if (editingUserId) {
      handleUpdateSubUser(e);
    } else {
      handleCreateSubUser(e);
    }
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    if (showCreateForm) {
      setEditingUserId(null);
      setSubUserFullName('');
      setSubUserEmail('');
      setSubUserPassword('');
      setSubUserRole('user');
      setSubUserProfilePic(null);
      setSubUserPermissions({ voting: true, manage: true });
    }
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />
      <div className="main-content">
        <Sidebar setIsAuthenticated={setIsAuthenticated} />
        <div className="content">
          <h2>Settings</h2>
          <div className="sub-user-section">
            {showCreateForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button className="modal-close" onClick={toggleCreateForm}>×</button>
                  <form onSubmit={handleSaveSubUser} className="sub-user-form">
                    <h3>{editingUserId ? 'Edit Sub-User' : 'Create Sub-User'}</h3>
                    <div className="form-group">
                      <label>Full Name:</label>
                      <input
                        type="text"
                        value={subUserFullName}
                        onChange={(e) => setSubUserFullName(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={subUserEmail}
                        onChange={(e) => setSubUserEmail(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                    {!editingUserId && (
                      <div className="form-group">
                        <label>Password:</label>
                        <input
                          type="password"
                          value={subUserPassword}
                          onChange={(e) => setSubUserPassword(e.target.value)}
                          className="form-control"
                          required
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Role:</label>
                      <select
                        value={subUserRole}
                        onChange={(e) => setSubUserRole(e.target.value)}
                        className="form-control"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Permissions:</label>
                      <div>
                        <label>
                          <input
                            type="checkbox"
                            checked={subUserPermissions.voting}
                            onChange={() =>
                              setSubUserPermissions((prev) => ({
                                ...prev,
                                voting: !prev.voting,
                              }))
                            }
                          />
                          Access to Voting
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={subUserPermissions.manage}
                            onChange={() =>
                              setSubUserPermissions((prev) => ({
                                ...prev,
                                manage: !prev.manage,
                              }))
                            }
                          />
                          Access to Manage
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Profile Picture:</label>
                      {uploadcarePublicKey ? (
                        <Widget
                          publicKey={uploadcarePublicKey}
                          onChange={(fileInfo) => setSubUserProfilePic(fileInfo)}
                          clearable
                          imagesOnly
                          crop="1:1"
                          maxFileSize={2000000}
                        />
                      ) : (
                        <p style={{ color: 'red' }}>
                          Image upload disabled: Uploadcare public key missing. Check .env configuration.
                        </p>
                      )}
                    </div>
                    <button type="submit" className="btn btn-primary flex items-center">
                      <FaEdit className="mr-2" /> {editingUserId ? 'Update Sub-User' : 'Create Sub-User'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            <div className="sub-users-table">
              <div className="sub-users-header">
                <h3>Sub-Users</h3>
                <button className="btn btn-primary create-sub-user-btn" onClick={toggleCreateForm}>
                  Create Sub-User
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Profile Picture</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subUsers && subUsers.length > 0 ? (
                    subUsers.map((user, index) => (
                      <tr key={user._id || `user-${index}`}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          {user.profilePic && (
                            <img
                              src={`https://ucarecdn.com/${user.profilePic}/-/preview/-/scale_crop/50x50/center/`}
                              alt="Profile"
                              className="profile-pic"
                            />
                          )}
                        </td>
                        <td>{user.permissions.join(', ')}</td>
                        <td className="action-buttons">
                     
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditSubUser(user._id)}
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteSubUser(user._id)}
                            title="Delete"
                          >
                            <FaTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key="no-users">
                      <td colSpan="6">No sub-users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;