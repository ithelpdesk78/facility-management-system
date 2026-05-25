import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiMenu } from 'react-icons/fi';

function Navbar() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = auth.user?.role === 'SUPER_ADMIN';
  const isManager = auth.user?.role === 'FACILITY_MANAGER';

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="font-bold text-xl">
            FMS
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link to="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded">
              Dashboard
            </Link>
            <Link to="/tickets" className="hover:bg-blue-700 px-3 py-2 rounded">
              Tickets
            </Link>
            <Link to="/tasks" className="hover:bg-blue-700 px-3 py-2 rounded">
              Tasks
            </Link>
            <Link to="/attendance" className="hover:bg-blue-700 px-3 py-2 rounded">
              Attendance
            </Link>
            {(isAdmin || isManager) && (
              <>
                <Link to="/reports" className="hover:bg-blue-700 px-3 py-2 rounded">
                  Reports
                </Link>
                {isAdmin && (
                  <Link to="/users" className="hover:bg-blue-700 px-3 py-2 rounded">
                    Users
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">{auth.user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 px-3 py-2 rounded"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
