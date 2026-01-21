import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
// import { DashboardPage } from '../pages/DashboardPage';
import LineageExplorer from '../pages/ETLLineageVisualization';
import EntityGalaxyGraph from "../pages/TestPage"
import EntityDerivationGraph from "../pages/TestPage2"

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path='/login' element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <EntityGalaxyGraph />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard if authenticated, otherwise to login */}
      <Route path='/' element={<Navigate to='/dashboard' replace />} />
      <Route path='*' element={<Navigate to='/dashboard' replace />} />
    </Routes>
  );
};
