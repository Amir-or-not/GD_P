// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Components/Home";
import Shop from "./Components/Shop";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Profile from "./Components/Profile";
import ProductDetail from "./Components/Product_detail";
import CartBag from "./Components/Cart-bag";
import Collections from "./Components/Collections";
import Analytics from "./Components/Analytics";
import SeaSwept from "./Components/SeaSwept";
import About from "./Components/About";
import Payment from "./Components/Payment";
// import Navbar from "./Components/Navbar";
function App() {
  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/product/:name" element={<ProductDetail />} />
        <Route path="/cart" element={<CartBag />} />
        <Route path="/collections/hell-fire" element={<Collections />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/collections/sea-swept" element={<SeaSwept />} />
        <Route path="/about" element={<About />} />
        <Route path="/payment/card" element={<Payment />} />
      </Routes>
    </Router>
  );
}

export default App;
