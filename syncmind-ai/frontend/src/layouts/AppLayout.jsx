import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
