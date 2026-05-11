import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import StatusBar from './components/StatusBar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />
      <Toast />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
