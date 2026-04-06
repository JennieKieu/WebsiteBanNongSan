import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatWidget from "../components/ChatWidget";

export default function MainLayout() {
  return (
    <div className="page-shell">
      <Header />
      <main className="container">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
