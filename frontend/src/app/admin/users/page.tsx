'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/users?${params}`);
      
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.data);
        setPagination(data.pagination);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#e74c3c';
      case 'INSTRUCTOR': return '#3498db';
      case 'SUPER_INSTRUCTOR': return '#9b59b6';
      case 'LEARNER': return '#27ae60';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#27ae60';
      case 'INACTIVE': return '#f39c12';
      case 'DEACTIVATED': return '#e74c3c';
      case 'LOCKED': return '#c0392b';
      default: return '#666';
    }
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="nav-logo">Zedny LMS - Admin</div>
          <ul className="nav-menu">
            <li><a href="/admin" className="nav-link">Dashboard</a></li>
            <li><a href="/admin/users" className="nav-link" style={{ color: '#3498db' }}>Users</a></li>
            <li><a href="/admin/courses" className="nav-link">Courses</a></li>
            <li><a href="/admin/reports" className="nav-link">Reports</a></li>
            <li>
              <button 
                onClick={() => router.push('/login')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#333',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">User Management</h1>
          </div>

          {/* Filters */}
          <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="SUPER_INSTRUCTOR">Super Instructor</option>
                  <option value="LEARNER">Learner</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DEACTIVATED">Deactivated</option>
                  <option value="LOCKED">Locked</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="form-button" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
              Search
            </button>
          </form>

          {/* Users Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>
                          <span style={{ 
                            color: getRoleColor(user.role),
                            fontWeight: '500'
                          }}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: getStatusColor(user.status),
                            fontWeight: '500'
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>{formatDate(user.lastLoginAt)}</td>
                        <td>
                          <button
                            style={{
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '1.5rem'
                }}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      background: pagination.page <= 1 ? '#f5f5f5' : 'white',
                      cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    Previous
                  </button>
                  
                  <span>
                    Page {pagination.page} of {pagination.totalPages} 
                    ({pagination.total} total users)
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      background: pagination.page >= pagination.totalPages ? '#f5f5f5' : 'white',
                      cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}