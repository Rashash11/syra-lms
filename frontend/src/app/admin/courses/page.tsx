'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  status: string;
  image: string | null;
  isActive: boolean;
  hiddenFromCatalog: boolean;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
}

interface CoursesResponse {
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, [search, statusFilter, pagination.page]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/courses?${params}`);
      
      if (response.ok) {
        const data: CoursesResponse = await response.json();
        setCourses(data.data);
        setPagination(data.pagination);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load courses');
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
    fetchCourses();
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '#27ae60';
      case 'DRAFT': return '#f39c12';
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
            <li><a href="/admin/users" className="nav-link">Users</a></li>
            <li><a href="/admin/courses" className="nav-link" style={{ color: '#3498db' }}>Courses</a></li>
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
            <h1 className="card-title">Course Management</h1>
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
                  placeholder="Search by title or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="form-button" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                Search
              </button>
              <button 
                type="button"
                className="form-button" 
                style={{ width: 'auto', padding: '0.5rem 1rem', background: '#27ae60' }}
                onClick={() => router.push('/admin/courses/new')}
              >
                Create Course
              </button>
            </div>
          </form>

          {/* Courses Table */}
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
                      <th>Title</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Active</th>
                      <th>Enrollments</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: '500' }}>{course.title}</div>
                            {course.description && (
                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: '#666',
                                marginTop: '0.25rem'
                              }}>
                                {course.description.length > 100 
                                  ? `${course.description.substring(0, 100)}...`
                                  : course.description
                                }
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{course.code || '-'}</td>
                        <td>
                          <span style={{ 
                            color: getStatusColor(course.status),
                            fontWeight: '500'
                          }}>
                            {course.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: course.isActive ? '#27ae60' : '#e74c3c',
                            fontWeight: '500'
                          }}>
                            {course.isActive ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>{course.enrollmentCount}</td>
                        <td>{formatDate(course.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                              onClick={() => router.push(`/admin/courses/${course.id}`)}
                            >
                              View
                            </button>
                            <button
                              style={{
                                background: '#f39c12',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                              onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                            >
                              Edit
                            </button>
                          </div>
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
                    ({pagination.total} total courses)
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