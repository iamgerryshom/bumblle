import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainScreen from "./screens/MainScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import MpesaDetailsScreen from "./screens/MpesaDetailsScreen";
import MpesaReviewScreen from "./screens/MpesaReviewScreen";
import PaypalPaymentScreen from "./screens/PaypalPaymentScreen";
import EmployeeTransactionScreen from "./screens/EmployeeTransactionScreen";
import CreateEmployeeScreen from "./screens/CreateEmployeeScreen";
import EmployeesScreen from "./screens/EmployeesScreen";
import PaymentSuccessScreen from "./screens/PaymentSuccessScreen";
import PaymentFailedScreen from "./screens/PaymentFailedScreen";
import MpesaProcessingScreen from "./screens/MpesaProcessingScreen";
import LoanScreen from "./screens/LoanScreen";
import MaintenanceScreen from "./screens/MaintenanceScreen";


import VideosPage from "./screens/VidesPage";



import AnalyticsTracker from "./components/AnalyticsTracker"; // 👈 ADD THIS


export default function App() {
  const MAINTENANCE_MODE = false;

  return (
    <BrowserRouter>
      <AnalyticsTracker />

      <Routes>
        {MAINTENANCE_MODE ? (
          <Route path="*" element={<MaintenanceScreen />} />
        ) : (
          <>
            <Route path="/" element={<MainScreen />} />
            <Route path="/home" element={<MainScreen />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/mpesa-detail" element={<MpesaDetailsScreen />} />
            <Route path="/mpesa-review" element={<MpesaReviewScreen />} />
            <Route path="/mpesa-processing" element={<MpesaProcessingScreen />} />
            <Route path="/paypal-payment" element={<PaypalPaymentScreen />} />
            <Route path="/employee-transaction" element={<EmployeeTransactionScreen />} />
            <Route path="/create-employee" element={<CreateEmployeeScreen />} />
            <Route path="/employees" element={<EmployeesScreen />} />
            <Route path="/payment-failed" element={<PaymentFailedScreen />} />
            <Route path="/payment-success" element={<PaymentSuccessScreen />} />
            <Route path="/videos" element={<VideosPage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}