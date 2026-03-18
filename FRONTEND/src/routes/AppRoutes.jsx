import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import AppLayout from "../components/layout/AppLayout";
import AdminLayout from "../components/layout/AdminLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import HomePage from "../pages/customer/HomePage";
import DashboardPage from "../pages/customer/DashboardPage";
import CartPage from "../pages/customer/CartPage";
import ProductDetailsPage from "../pages/customer/ProductDetailsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import CategoryPage from "../pages/customer/categoryPage";
import ProductDetailsPlaceholder from "../pages/customer/ProductDetailsPage";
import ItemsPage from "../pages/customer/ItemsPage";
import OrderPage from "../pages/OrderPage";
import OrderDetailPage from "../pages/OrderDetailPage";
import OrderSuccessPage from "../pages/customer/OrderSuccessPage";
import OrderSelectAddressComponent from "../components/OrderSelectAddressComponent";
import OrderPaymentComponent from "../components/orderPaymentComponent";
import OrderConfirmationCODComponent from "../components/OrderConfirmationCODComponents";
import AboutInfoPage from "../pages/customer/AboutInfoPage";
import ContactInfoPage from "../pages/customer/ContactInfoPage";
import PaymentsInfoPage from "../pages/customer/PaymentsInfoPage";
import PrivacyInfoPage from "../pages/customer/PrivacyInfoPage";
import ReturnsInfoPage from "../pages/customer/ReturnsInfoPage";
import SecurityInfoPage from "../pages/customer/SecurityInfoPage";
import ShippingInfoPage from "../pages/customer/ShippingInfoPage";
import TermsInfoPage from "../pages/customer/TermsInfoPage";

function RedirectCategoriesToShop() {
  const location = useLocation();
  return <Navigate to={`/shop${location.search || ""}`} replace />;
}

function RedirectIfAdmin({ children }) {
  const { currentUser } = useSelector((state) => state.auth);
  if (currentUser?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children ?? <Outlet />;
}

function ProtectedRoute() {
  const { currentUser } = useSelector((state) => state.auth);
  return Boolean(currentUser) ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { currentUser } = useSelector((state) => state.auth);
  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={
          <RedirectIfAdmin>
            <LoginPage />
          </RedirectIfAdmin>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAdmin>
            <RegisterPage />
          </RedirectIfAdmin>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RedirectIfAdmin>
            <ForgotPasswordPage />
          </RedirectIfAdmin>
        }
      />

      {/* Public - with Navbar/Footer */}
      <Route element={<RedirectIfAdmin />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shop" element={<CategoryPage />} />
          <Route path="/categories" element={<RedirectCategoriesToShop />} />
          <Route path="/products" element={<HomePage />} />

          <Route path="/items/:id" element={<ItemsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route path="/info/about" element={<AboutInfoPage />} />
          <Route path="/info/contact" element={<ContactInfoPage />} />
          <Route path="/info/payments" element={<PaymentsInfoPage />} />
          <Route path="/info/privacy" element={<PrivacyInfoPage />} />
          <Route path="/info/returns" element={<ReturnsInfoPage />} />
          <Route path="/info/security" element={<SecurityInfoPage />} />
          <Route path="/info/shipping" element={<ShippingInfoPage />} />
          <Route path="/info/terms" element={<TermsInfoPage />} />
        </Route>
      </Route>

      {/* Protected - with Navbar/Footer */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          {/* Checkout flow */}
          <Route
            path="/checkout/address"
            element={<OrderSelectAddressComponent />}
          />
          <Route path="/checkout/payment" element={<OrderPaymentComponent />} />
          <Route
            path="/checkout/beforeorderconfirm"
            element={<OrderConfirmationCODComponent />}
          />
          <Route path="/checkout/success" element={<OrderSuccessPage />} />
        </Route>

        {/* Admin - full-screen, no Navbar/Footer */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <RedirectIfAdmin>
            <Navigate to="/" replace />
          </RedirectIfAdmin>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
