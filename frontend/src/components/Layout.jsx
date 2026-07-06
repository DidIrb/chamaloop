import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminNav = () => (
  <nav className="sidebar">
    <div className="logo">Chama<span>Loop</span></div>
    <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Dashboard</NavLink>
    <NavLink to="/admin/members" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Members</NavLink>
    <NavLink to="/admin/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>History Ledger</NavLink>
    <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Group Settings</NavLink>
  </nav>
);

const MemberNav = () => (
  <nav className="sidebar">
    <div className="logo">Chama<span>Loop</span></div>
    <NavLink to="/member/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>My Dashboard</NavLink>
    <NavLink to="/member/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>My History</NavLink>
  </nav>
);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {user?.role === 'admin' ? <AdminNav /> : <MemberNav />}
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-name">Welcome, {user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
