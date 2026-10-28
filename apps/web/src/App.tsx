import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { GuestOnly, RequireAuth } from "./auth/guards";
import { AppLayout } from "./components/authLayout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MarketsPage } from "./pages/MarketsPage";
import { InstrumentPage } from "./pages/InstrumentPage";
import { OrdersPage } from "./pages/OrdersPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/instruments/:symbol" element={<InstrumentPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
