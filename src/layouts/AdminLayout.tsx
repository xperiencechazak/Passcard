import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
