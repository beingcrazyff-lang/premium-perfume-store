/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import ProductDetails from './pages/ProductDetails';
import Support from './pages/Support';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-charcoal-950 font-sans text-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Checkout />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<Support />} />
            <Route path="/shipping" element={<Support />} />
            <Route path="/returns" element={<Support />} />
            <Route path="/faq" element={<Support />} />
            <Route path="/privacy" element={<Support />} />
            <Route path="/terms" element={<Support />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
