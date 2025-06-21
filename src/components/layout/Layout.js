import { Outlet } from 'react-router-dom';
import Sidebar from "./Sidebar.js"; // Sidebar

const Layout = () => {
  return (
    <div className="d-flex">
      <Sidebar />         {/* Sidebar */}
      <main className="flex-grow-1 p-4">
        <Outlet />       {/* Page content like Dashboard or Projects */}
      </main>
    </div>
  );
};

export default Layout;