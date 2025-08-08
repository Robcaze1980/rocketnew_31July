import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import Login from "pages/login";
import Dashboard from "pages/dashboard";
import Register from "pages/register";
import EditSale from "pages/edit-sale";
import UserProfile from "pages/user-profile";
import AddNewSale from "pages/add-new-sale";
import SalesGrid from "pages/sales-grid";
import ManagerDashboard from "pages/manager-dashboard";
import TeamReports from "pages/team-reports";
import DepartmentKPIs from "pages/department-kpis";
import PerformanceAnalytics from "pages/performance-analytics";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your routes here */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/edit-sale/:id" element={<EditSale />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/add-new-sale" element={<AddNewSale />} />
          <Route path="/sales-grid" element={<SalesGrid />} />

          {/* Manager-only routes */}
          <Route path="/manager-dashboard/*" element={<ManagerDashboard />} />
          <Route path="/department-kpis" element={<DepartmentKPIs />} />
          <Route path="/team-reports" element={<TeamReports />} />

          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
