'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  userRole: string;
  userName: string;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-container">
        <div className="card">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="nav-logo">Zedny LMS - Admin</div>
          <ul className="nav-menu">
            <li><a href="/admin" className="nav-link">Dashboard</a></li>
            <li><a href="/admin/users" className="nav-link">Users</a></li>
            <li><a href="/admin/courses" className="nav-link">Courses</a></li>
            <li><a href="/admin/reports" className="nav-link">Reports</a></li>
            <li>
              <button 
                onClick={handleLogout}
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
            <h1 className="card-title">
              Welcome back, {dashboardData?.userName}!
            </h1>
          </div>
          <p>Role: {dashboardData?.userRole}</p>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="card">
            <h3 style={{ color: '#3498db', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
              {dashboardData?.stats.totalUsers || 0}
            </h3>
            <p style={{ color: '#666' }}>Total Users</p>
            <p style={{ fontSize: '0.875rem', color: '#27ae60' }}>
              {dashboardData?.stats.activeUsers || 0} active
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: '#e74c3c', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
              {dashboardData?.stats.totalCourses || 0}
            </h3>
            <p style={{ color: '#666' }}>Total Courses</p>
            <p style={{ fontSize: '0.875rem', color: '#27ae60' }}>
              {dashboardData?.stats.publishedCourses || 0} published
            </p>
          </div>

          <div className="card">
            <h3 style={{ color: '#f39c12', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
              {dashboardData?.stats.totalEnrollments || 0}
            </h3>
            <p style={{ color: '#666' }}>Total Enrollments</p>
            <p style={{ fontSize: '0.875rem', color: '#27ae60' }}>
              {dashboardData?.stats.completedEnrollments || 0} completed
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
          </div>
          
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div>
              {dashboardData.recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '1rem 0',
                    borderBottom: index < dashboardData.recentActivity.length - 1 ? '1px solid #e1e8ed' : 'none'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#333' }}>
                    {activity.title}
                  </h4>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>
                    {activity.description}
                  </p>
                  <p style={{ margin: '0', fontSize: '0.875rem', color: '#999' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No recent activity</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="form-button"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
              onClick={() => router.push('/admin/users')}
            >
              Manage Users
            </button>
            <button 
              className="form-button"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
              onClick={() => router.push('/admin/courses')}
            >
              Manage Courses
            </button>
            <button 
              className="form-button"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
              onClick={() => router.push('/admin/reports')}
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}