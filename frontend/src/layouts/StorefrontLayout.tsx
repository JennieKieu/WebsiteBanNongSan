import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ChatbotWidget from '../components/ChatbotWidget'

export default function StorefrontLayout() {
  return (
    <>
      <Header />
      <main className="ns-page">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </>
  )
}
