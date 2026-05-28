import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './Dashboard';
import Upload from './Upload';
import clsx from 'clsx';

function NavItem({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-primary/10 text-primary font-semibold" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {children}
    </Link>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ className: 'font-sans' }} />
      <div className="flex h-screen bg-slate-50 font-sans">
        {/* Sidebar */}
        <aside className="w-72 bg-surface border-r border-border flex flex-col shadow-sm z-10">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary flex items-center">
              <span className="bg-primary/10 p-2 rounded-xl mr-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
                </svg>
              </span>
              Breathe ESG
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem to="/" icon={LayoutDashboard}>Review Dashboard</NavItem>
            <NavItem to="/upload" icon={UploadCloud}>Data Ingestion</NavItem>
          </nav>
          <div className="p-6 mt-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md">
                JD
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">John Doe</p>
                <p className="text-xs text-muted-foreground">ESG Analyst</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="relative p-8 max-w-7xl mx-auto min-h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
