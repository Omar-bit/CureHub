import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  LogOut,
  Shield,
  Search,
  MoreHorizontal,
  TrendingUp,
  UserPlus,
  Activity,
  Eye,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { showSuccess, showError } from '../../lib/toast';

// Dashboard Stats Component
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='h-8 w-8 animate-spin text-orange-500' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-slate-300'>
              Total Users
            </CardTitle>
            <Users className='h-4 w-4 text-orange-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-white'>
              {stats?.overview?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-slate-300'>
              Total Doctors
            </CardTitle>
            <UserCheck className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-white'>
              {stats?.overview?.totalDoctors || 0}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-slate-300'>
              Total Patients
            </CardTitle>
            <UserPlus className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-white'>
              {stats?.overview?.totalPatients || 0}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-slate-300'>
              Total Appointments
            </CardTitle>
            <Calendar className='h-4 w-4 text-purple-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-white'>
              {stats?.overview?.totalAppointments || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users by Role & Appointments by Status */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader>
            <CardTitle className='text-white flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-orange-500' />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats?.usersByRole?.map((item) => (
                <div
                  key={item.role}
                  className='flex items-center justify-between'
                >
                  <span className='text-slate-300'>{item.role}</span>
                  <Badge variant='secondary' className='bg-slate-700'>
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='bg-slate-800 border-slate-700'>
          <CardHeader>
            <CardTitle className='text-white flex items-center gap-2'>
              <Activity className='h-5 w-5 text-orange-500' />
              Appointments by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats?.appointmentsByStatus?.map((item) => (
                <div
                  key={item.status}
                  className='flex items-center justify-between'
                >
                  <span className='text-slate-300'>{item.status}</span>
                  <Badge
                    variant='secondary'
                    className={
                      item.status === 'COMPLETED'
                        ? 'bg-green-900 text-green-300'
                        : item.status === 'CANCELLED'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-slate-700'
                    }
                  >
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader>
          <CardTitle className='text-white'>Recent Appointments</CardTitle>
          <CardDescription className='text-slate-400'>
            Last 10 appointments in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className='border-slate-700'>
                <TableHead className='text-slate-300'>Title</TableHead>
                <TableHead className='text-slate-300'>Patient</TableHead>
                <TableHead className='text-slate-300'>Doctor</TableHead>
                <TableHead className='text-slate-300'>Date</TableHead>
                <TableHead className='text-slate-300'>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentAppointments?.map((apt) => (
                <TableRow key={apt.id} className='border-slate-700'>
                  <TableCell className='text-white'>
                    {apt.title || 'Appointment'}
                  </TableCell>
                  <TableCell className='text-slate-300'>
                    {apt.patientName || 'N/A'}
                  </TableCell>
                  <TableCell className='text-slate-300'>
                    {apt.doctorName}
                  </TableCell>
                  <TableCell className='text-slate-300'>
                    {new Date(apt.startTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={
                        apt.status === 'COMPLETED'
                          ? 'bg-green-900 text-green-300'
                          : apt.status === 'CANCELLED'
                          ? 'bg-red-900 text-red-300'
                          : apt.status === 'SCHEDULED'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-slate-700'
                      }
                    >
                      {apt.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      showSuccess('User status updated');
      fetchUsers();
    } catch (error) {
      showError('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminAPI.deleteUser(userToDelete);
      showSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      showError('Failed to delete user');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500' />
          <Input
            placeholder='Search users...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 bg-slate-700 border-slate-600 text-white'
          />
        </div>
        <Button
          variant='outline'
          onClick={fetchUsers}
          className='border-slate-600 text-slate-300'
        >
          <RefreshCw className='h-4 w-4 mr-2' />
          Refresh
        </Button>
      </div>

      <Card className='bg-slate-800 border-slate-700'>
        <CardContent className='pt-6'>
          {isLoading ? (
            <div className='flex items-center justify-center h-32'>
              <RefreshCw className='h-6 w-6 animate-spin text-orange-500' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700'>
                  <TableHead className='text-slate-300'>Name</TableHead>
                  <TableHead className='text-slate-300'>Email</TableHead>
                  <TableHead className='text-slate-300'>Role</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='text-slate-300'>Verified</TableHead>
                  <TableHead className='text-slate-300'>Created</TableHead>
                  <TableHead className='text-slate-300'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className='border-slate-700'>
                    <TableCell className='text-white'>
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${
                            user.lastName || ''
                          }`.trim()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className='text-slate-300'>
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary' className='bg-slate-700'>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className='bg-green-900 text-green-300'>
                          Active
                        </Badge>
                      ) : (
                        <Badge className='bg-red-900 text-red-300'>
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isEmailVerified ? (
                        <CheckCircle className='h-4 w-4 text-green-500' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-500' />
                      )}
                    </TableCell>
                    <TableCell className='text-slate-300'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='bg-slate-800 border-slate-700'>
                          <DropdownMenuItem
                            className='text-slate-300 focus:bg-slate-700'
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            {user.isActive ? (
                              <>
                                <Ban className='h-4 w-4 mr-2' />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className='h-4 w-4 mr-2' />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-red-400 focus:bg-slate-700'
                            onClick={() => {
                              setUserToDelete(user.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className='flex items-center justify-between mt-4'>
            <p className='text-sm text-slate-400'>
              Showing {users.length} of {pagination.total} users
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                className='border-slate-600 text-slate-300'
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                className='border-slate-600 text-slate-300'
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className='bg-slate-800 border-slate-700'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-white'>
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-slate-400'>
              This action cannot be undone. This will permanently delete the
              user and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-slate-700 text-white border-slate-600'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className='bg-red-600 hover:bg-red-700'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main Admin Dashboard Page
const AdminDashboardPage = () => {
  const { admin, logout, isLoading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!authLoading && !admin) {
      navigate('/admin/login', { replace: true });
    }
  }, [admin, authLoading, navigate]);

  useEffect(() => {
    // Set active tab based on URL
    const path = location.pathname;
    if (path.includes('/users')) {
      setActiveTab('users');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-900'>
        <RefreshCw className='h-8 w-8 animate-spin text-orange-500' />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      path: '/admin/dashboard/users',
    },
  ];

  return (
    <div className='min-h-screen bg-slate-900'>
      {/* Header */}
      <header className='bg-slate-800 border-b border-slate-700 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center'>
              <Shield className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-white'>Admin Portal</h1>
              <p className='text-sm text-slate-400'>
                Welcome, {admin.name || admin.email}
              </p>
            </div>
          </div>
          <Button
            variant='ghost'
            onClick={handleLogout}
            className='text-slate-300 hover:text-white hover:bg-slate-700'
          >
            <LogOut className='h-4 w-4 mr-2' />
            Logout
          </Button>
        </div>
      </header>

      <div className='flex'>
        {/* Sidebar */}
        <aside className='w-64 bg-slate-800 border-r border-slate-700 min-h-[calc(100vh-73px)]'>
          <nav className='p-4 space-y-2'>
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <item.icon className='h-5 w-5' />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-6'>
          {activeTab === 'dashboard' && <DashboardStats />}
          {activeTab === 'users' && <UserManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
