import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { LoadingPage } from "./components/ui/index.jsx";

import Landing from "./pages/public/Landing.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

import SeekerDashboard from "./pages/capital-seeker/SeekerDashboard.jsx";
import MyListings from "./pages/capital-seeker/MyListings.jsx";
import ListingForm from "./pages/capital-seeker/ListingForm.jsx";
import ListingDetail from "./pages/capital-seeker/ListingDetail.jsx";
import InterestInbox from "./pages/capital-seeker/InterestInbox.jsx";
import Documents from "./pages/capital-seeker/Documents.jsx";
import PostUpdates from "./pages/capital-seeker/PostUpdates.jsx";
import SeekerProfile from "./pages/capital-seeker/SeekerProfile.jsx";
import ListingScore from "./pages/capital-seeker/ListingScore.jsx";
import ListingReport from "./pages/capital-seeker/ListingReport.jsx";
import ScoresHub from "./pages/capital-seeker/ScoresHub.jsx";
import AccessLogs from "./pages/capital-seeker/AccessLogs.jsx";
import Connections from "./pages/shared/Connections.jsx";
import ConnectionDetail from "./pages/shared/ConnectionDetail.jsx";

import InvestorDashboard from "./pages/investor/InvestorDashboard.jsx";
import Discover from "./pages/investor/Discover.jsx";
import ListingDetailInv from "./pages/investor/ListingDetail.jsx";

import SavedDeals from "./pages/investor/SavedDeals.jsx";
import SentInterests from "./pages/investor/SentInterests.jsx";
import InvestorProfile from "./pages/investor/InvestorProfile.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminListings from "./pages/admin/AdminListings.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminInterests from "./pages/admin/AdminInterests.jsx";

import AdminReviewCenter from "./pages/admin/AdminReviewCenter.jsx";

function RequireAuth({ children, role, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  const allowedRoles = roles || (role ? [role] : null);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dest =
      user.role === "CAPITAL_SEEKER"
        ? "/seeker"
        : user.role === "INVESTOR"
          ? "/investor"
          : "/admin";
    return <Navigate to={dest} replace />;
  }
  return children;
}

function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (user) {
    const dest =
      user.role === "CAPITAL_SEEKER"
        ? "/seeker"
        : user.role === "INVESTOR"
          ? "/investor"
          : "/admin";
    return <Navigate to={dest} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuth>
            <Login />
          </RedirectIfAuth>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuth>
            <Register />
          </RedirectIfAuth>
        }
      />

      <Route
        path="/seeker"
        element={
          <RequireAuth role="CAPITAL_SEEKER">
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<SeekerDashboard />} />
        <Route path="listings" element={<MyListings />} />
        <Route path="listings/new" element={<ListingForm mode="create" />} />
        <Route path="listings/:id" element={<ListingDetail />} />
        <Route path="listings/:id/edit" element={<ListingForm mode="edit" />} />
        <Route path="listings/:id/score" element={<ListingScore />} />
        <Route path="listings/:id/report" element={<ListingReport />} />
        <Route path="inbox" element={<InterestInbox />} />
        <Route path="documents" element={<Documents />} />
        <Route path="updates" element={<PostUpdates />} />
        <Route path="score" element={<ScoresHub />} />
        <Route path="access-logs" element={<AccessLogs />} />
        <Route path="profile" element={<SeekerProfile />} />
      </Route>

      <Route
        path="/investor"
        element={
          <RequireAuth role="INVESTOR">
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<InvestorDashboard />} />
        <Route path="discover" element={<Discover />} />
        <Route path="listings/:id" element={<ListingDetailInv />} />
        <Route path="listings/:id/report" element={<ListingReport />} />
        <Route path="saved" element={<SavedDeals />} />
        <Route path="interests" element={<SentInterests />} />
        <Route path="profile" element={<InvestorProfile />} />
      </Route>

      {/* Shared — accessible by CAPITAL_SEEKER and INVESTOR */}
      <Route
        path="/connections"
        element={
          <RequireAuth roles={["CAPITAL_SEEKER", "INVESTOR"]}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Connections />} />
        <Route path=":id" element={<ConnectionDetail />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth role="ADMIN">
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="interests" element={<AdminInterests />} />
        <Route path="review-center" element={<AdminReviewCenter />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
