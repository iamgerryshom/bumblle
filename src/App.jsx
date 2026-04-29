import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainScreen from "./screens/MainScreen";
import LoginScreen from "./screens/LoginScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import PaymentScreen from "./screens/PaymentScreen";
import PaymentInformationConfirmationScreen from "./screens/PaymentInformationConfirmationScreen";
import PaymentProcessingScreen from "./screens/PaymentProcessingScreen";
import HomeScreen from "./screens/HomeScreen";
import VideoCallScreen from "./screens/VideoCallScreen";


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

      </Routes>
    </BrowserRouter>
  );
}