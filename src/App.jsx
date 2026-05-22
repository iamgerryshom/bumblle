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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Logi Screen */}
        <Route path="/" element={<MainScreen />} />

        {/* Main Screen */}
        <Route path="/home" element={<MainScreen />} />

        {/* Checkout Screen */}
        <Route path="/checkout" element={<CheckoutScreen />} />

        {/* Payment Screen */}
        <Route path="/mpesa-detail" element={<MpesaDetailsScreen />} />

        {/* Payment Information Confirmation Screen */}
        <Route path="/mpesa-review" element={<MpesaReviewScreen />} />

        {/* Payment Information Confirmation Screen */}
        <Route path="/mpesa-processing" element={<MpesaProcessingScreen />} />

        {/* Payment Information Confirmation Screen */}
        <Route path="/paypal-payment" element={<PaypalPaymentScreen />} />

        <Route path="/employee-transaction" element={<EmployeeTransactionScreen />} />

        <Route path="/create-employee" element={<CreateEmployeeScreen />} />

        <Route path="/employees" element={<EmployeesScreen />} />

        <Route path="/payment-failed" element={<PaymentFailedScreen />} />

        <Route path="/payment-success" element={<PaymentSuccessScreen />} />


      </Routes>
    </BrowserRouter>
  );
}