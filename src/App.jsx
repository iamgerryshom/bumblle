import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainScreen from "./screens/MainScreen";
import LoginScreen from "./screens/LoginScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import PaymentScreen from "./screens/PaymentScreen";
import PaymentInformationConfirmationScreen from "./screens/PaymentInformationConfirmationScreen";
import PaymentProcessingScreen from "./screens/PaymentProcessingScreen";
import HomeScreen from "./screens/HomeScreen";
import VideoCallScreen from "./screens/VideoCallScreen";
import PaypalPaymentScreen from "./screens/PaypalPaymentScreen";
import EmployeeTransactionScreen from "./screens/EmployeeTransactionScreen";
import CreateEmployeeScreen from "./screens/CreateEmployeeScreen";
import EmployeesScreen from "./screens/EmployeesScreen";
import PaymentSuccessScreen from "./screens/PaymentSuccessScreen";
import PaymentFailedScreen from "./screens/PaymentFailedScreen";




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
        <Route path="/payment" element={<PaymentScreen />} />

        {/* Payment Information Confirmation Screen */}
        <Route path="/payment-information-confirmation" element={<PaymentInformationConfirmationScreen />} />

        {/* Payment Information Confirmation Screen */}
        <Route path="/payment-processing" element={<PaymentProcessingScreen />} />

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