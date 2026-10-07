import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Layout from "./components/Layout";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerAssets from "./pages/owner/Assets";
import OwnerBeneficiaries from "./pages/owner/Beneficiaries";
import OwnerSwitch from "./pages/owner/Switch";
import OwnerDocuments from "./pages/owner/Documents";
import OwnerLogs from "./pages/owner/Logs";
import ExecutorDashboard from "./pages/executor/Dashboard";
import ExecutorAssets from "./pages/executor/Assets";
import ExecutorVerification from "./pages/executor/Verification";
import ExecutorProgress from "./pages/executor/Progress";
import BeneficiaryDashboard from "./pages/beneficiary/Dashboard";
import BeneficiaryAssets from "./pages/beneficiary/Assets";
import BeneficiaryVerify from "./pages/beneficiary/Verify";
import VerifierDashboard from "./pages/verifier/Dashboard";
import VerifierRequests from "./pages/verifier/Requests";
import VerifierHistory from "./pages/verifier/History";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminAudit from "./pages/admin/Audit";
import AdminConfig from "./pages/admin/Config";
import AdminIntegrations from "./pages/admin/Integrations";

export const router = createBrowserRouter([
  { path: "/", Component: Login },
  { path: "/register", Component: Register },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/reset-password", Component: ResetPassword },
  {
    path: "/owner",
    Component: Layout,
    children: [
      { index: true, Component: OwnerDashboard },
      { path: "assets", Component: OwnerAssets },
      { path: "beneficiaries", Component: OwnerBeneficiaries },
      { path: "switch", Component: OwnerSwitch },
      { path: "documents", Component: OwnerDocuments },
      { path: "logs", Component: OwnerLogs },
    ],
  },
  {
    path: "/executor",
    Component: Layout,
    children: [
      { index: true, Component: ExecutorDashboard },
      { path: "assets", Component: ExecutorAssets },
      { path: "verification", Component: ExecutorVerification },
      { path: "progress", Component: ExecutorProgress },
    ],
  },
  {
    path: "/beneficiary",
    Component: Layout,
    children: [
      { index: true, Component: BeneficiaryDashboard },
      { path: "assets", Component: BeneficiaryAssets },
      { path: "verify", Component: BeneficiaryVerify },
    ],
  },
  {
    path: "/verifier",
    Component: Layout,
    children: [
      { index: true, Component: VerifierDashboard },
      { path: "requests", Component: VerifierRequests },
      { path: "history", Component: VerifierHistory },
    ],
  },
  {
    path: "/admin",
    Component: Layout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "users", Component: AdminUsers },
      { path: "audit", Component: AdminAudit },
      { path: "config", Component: AdminConfig },
      { path: "integrations", Component: AdminIntegrations },
    ],
  },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);
