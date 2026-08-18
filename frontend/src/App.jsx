import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { LoginModal } from './components/Auth/LoginModal';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar } from './components/Layout/Sidebar';

import { OwnerDashboard } from './components/Dashboard/OwnerDashboard';
import { ManagerDashboard } from './components/Dashboard/ManagerDashboard';
import { EmployeeDashboard } from './components/Dashboard/EmployeeDashboard';

import { CreateInvoiceModal } from './components/Billing/CreateInvoiceModal';
import { InvoiceList } from './components/Billing/InvoiceList';
import { InvoicePrintTemplate } from './components/Billing/InvoicePrintTemplate';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { CustomerLedger } from './components/Customers/CustomerLedger';
import { EmployeeManager } from './components/Employees/EmployeeManager';
import { AuditLogsModal } from './components/Security/AuditLogsModal';
import { CompanyModal } from './components/Settings/CompanyModal';
import { ChangePasswordModal } from './components/Auth/ChangePasswordModal';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  if (!currentUser) {
    return <LoginModal />;
  }

  const handleOpenNewBilling = () => {
    setEditingInvoice(null);
    setShowBillingModal(true);
  };

  const handleEditBill = (inv) => {
    setEditingInvoice(inv);
    setShowBillingModal(true);
  };

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'OWNER':
        return (
          <OwnerDashboard
            onOpenBilling={handleOpenNewBilling}
            onOpenAudit={() => setShowAuditModal(true)}
          />
        );
      case 'MANAGER':
        return (
          <ManagerDashboard
            onOpenBilling={handleOpenNewBilling}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'EMPLOYEE':
        return (
          <EmployeeDashboard
            onOpenBilling={handleOpenNewBilling}
            onSelectInvoiceForPrint={(inv) => setPrintInvoice(inv)}
          />
        );
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardByRole();
      case 'billing':
        return (
          <InvoiceList
            onOpenBilling={handleOpenNewBilling}
            onSelectInvoiceForPrint={(inv) => setPrintInvoice(inv)}
            onEditInvoice={handleEditBill}
          />
        );
      case 'inventory':
        return <InventoryManager />;
      case 'customers':
        return <CustomerLedger />;
      case 'employees':
        return <EmployeeManager />;
      case 'audit':
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Security Compliance & Audit Logs</h2>
            <AuditLogsModal isOpen={true} onClose={() => setActiveTab('dashboard')} />
          </div>
        );
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenBilling={handleOpenNewBilling}
        onOpenAudit={() => setShowAuditModal(true)}
        onOpenCompanyModal={() => setShowCompanyModal(true)}
        onChangePassword={() => setShowChangePassModal(true)}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderMainContent()}
        </main>
      </div>

      {/* Point of Sale Billing Modal */}
      <CreateInvoiceModal
        isOpen={showBillingModal}
        editingInvoice={editingInvoice}
        onClose={() => {
          setShowBillingModal(false);
          setEditingInvoice(null);
        }}
        onPrintInvoice={(inv) => setPrintInvoice(inv)}
      />

      {/* Printable Invoice Modal */}
      <InvoicePrintTemplate
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />

      {/* Security Audit Modal */}
      <AuditLogsModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

      {/* Company Management & Creation Modal */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
      />

      {/* User Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
