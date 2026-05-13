import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Customers',
    transactions: 'Transactions',
    // Header
    utangTracker: '🏪 Utang Tracker',
    mgaSuki: '👥 Customers',
    mgaTransaksyon: '📊 Transactions',
    // Dashboard
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    howsShop: "How's the store?",
    totalUtangSuki: 'Total Customer Debt',
    totalToPay: 'Total to be paid',
    paymentsToday: "Today's Payments",
    collectedToday: 'Collected today',
    quickActions: 'Quick Actions',
    addUtang: 'Add Debt',
    recordNewDebt: 'Record new debt',
    addBayad: 'Add Payment',
    recordPayment: 'Record payment',
    recentTransactions: 'Recent Transactions',
    seeAll: 'All',
    noTransactions: 'No transactions yet',
    recordFirstDebt: 'Record your first debt!',
    debt: 'Debt',
    payment: 'Payment',
    // Customers page
    allCustomers: 'All Customers',
    withDebt: 'With Debt',
    searchCustomer: 'Search customer...',
    addCustomer: '+ Add Customer',
    noCustomerFound: 'No customer found',
    tryOtherName: 'Try a different name',
    noCustomersYet: 'No customers yet',
    addFirstCustomer: 'Add your first customer!',
    debtRemaining: 'debt remaining',
    overpaid: 'overpaid',
    noDebt: 'no debt',
    // Customer Detail
    utangPaSuki: 'Customer owes',
    needsToPay: 'Needs to pay',
    overpaidLabel: 'Overpaid',
    noDebtLabel: 'No debt',
    allPaid: 'All paid up! 🎉',
    transactionHistory: 'Transaction History',
    noTransactionsYet: 'No transactions yet',
    itemsBought: 'Items Bought:',
    paid: 'Paid',
    borrowed: 'Borrowed',
    // Transaction Modal
    recordDebt: '📝 Record Debt',
    recordPayment2: '💚 Record Payment',
    selectCustomer: '-- Select Customer --',
    customer: 'Customer',
    itemsBoughtLabel: 'Items Bought',
    addItem: 'Add',
    itemName: 'Item name (e.g. Rice 5kg)',
    qty: 'Qty',
    price: 'Price',
    totalDebt: 'Total Debt:',
    orAmount: 'Or, enter debt amount',
    paymentAmount: 'Payment Amount *',
    notes: 'Notes (optional)',
    noteExample: 'e.g. Will pay tomorrow',
    saving: 'Saving...',
    saveRecord: '📝 Record Debt',
    savePayment: '💚 Record Payment',
    // Customer Modal
    editCustomer: '✏️ Edit Customer',
    newCustomer: '➕ New Customer',
    name: 'Name *',
    namePlaceholder: 'Juan dela Cruz',
    phone: 'Phone (optional)',
    address: 'Address (optional)',
    addressPlaceholder: 'Blk 1 Lot 2 Your Street',
    saveChanges: '💾 Save Changes',
    addCustomerBtn: '✅ Add Customer',
    // Edit Transaction Modal
    editTransaction: '✏️ Edit Transaction',
    editDebt: 'Edit Debt',
    editPayment: 'Edit Payment',
    deleteTransaction: 'Delete Transaction',
    confirmDelete: 'Are you sure you want to delete this transaction?',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    // Transactions page
    totalDebtLabel: 'Total Debt',
    totalPaymentLabel: 'Total Payment',
    all: 'All',
    recordDebtBtn: '📝 Record Debt',
    recordPaymentBtn: '💚 Record Payment',
    noTransactionsFilter: 'No transactions',
    recordFirstAction: 'Record the first debt or payment!',
    // Toast messages
    nameRequired: '❌ Name is required!',
    customerUpdated: '✅ Customer updated!',
    customerAdded: '✅ New customer added!',
    errorTryAgain: '❌ Error. Please try again.',
    selectCustomerError: '❌ Please select a customer!',
    enterAmount: '❌ Enter a valid amount!',
    debtRecorded: '📝 Debt recorded!',
    paymentRecorded: '💚 Payment recorded!',
    transactionUpdated: '✅ Transaction updated!',
    transactionDeleted: '🗑️ Transaction deleted!',
    // StatusBar
    syncing: 'Syncing to cloud...',
    offlineMode: 'Offline mode – saved on phone',
    logout: 'Logout',
    // BottomNav
    navDashboard: 'Dashboard',
    navCustomers: 'Customers',
    navTransactions: 'Transactions',
  },
  tl: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Mga Suki',
    transactions: 'Transaksyon',
    // Header
    utangTracker: '🏪 Utang Tracker',
    mgaSuki: '👥 Mga Suki',
    mgaTransaksyon: '📊 Mga Transaksyon',
    // Dashboard
    goodMorning: 'Magandang umaga',
    goodAfternoon: 'Magandang hapon',
    goodEvening: 'Magandang gabi',
    howsShop: 'Paano ang tindahan?',
    totalUtangSuki: 'Total Utang ng mga Suki',
    totalToPay: 'Kabuuang babayaran pa',
    paymentsToday: 'Mga Bayad Ngayon',
    collectedToday: 'Nakolekta ngayong araw',
    quickActions: 'Mabilis na Aksyon',
    addUtang: 'Mag-utang',
    recordNewDebt: 'I-record ang bagong utang',
    addBayad: 'Mag-bayad',
    recordPayment: 'I-record ang bayad',
    recentTransactions: 'Pinakabagong Transaksyon',
    seeAll: 'Lahat',
    noTransactions: 'Wala pang transaksyon',
    recordFirstDebt: 'I-record ang una mong utang!',
    debt: 'Utang',
    payment: 'Bayad',
    // Customers page
    allCustomers: 'Lahat ng Suki',
    withDebt: 'May Utang',
    searchCustomer: 'Hanapin ang suki...',
    addCustomer: '+ Dagdag ng Suki',
    noCustomerFound: 'Walang nakitang suki',
    tryOtherName: 'Subukan ng ibang pangalan',
    noCustomersYet: 'Wala pang suki',
    addFirstCustomer: 'Mag-dagdag ng bagong suki!',
    debtRemaining: 'utang pa',
    overpaid: 'sobrang bayad',
    noDebt: 'wala nang utang',
    // Customer Detail
    utangPaSuki: 'Utang pa ni suki',
    needsToPay: 'Kailangan pang bayaran',
    overpaidLabel: 'Sobrang bayad',
    noDebtLabel: 'Walang utang',
    allPaid: 'Ayos! Bayad na lahat 🎉',
    transactionHistory: 'Kasaysayan ng Transaksyon',
    noTransactionsYet: 'Walang transaksyon pa',
    itemsBought: 'Mga Binili:',
    paid: 'Nagbayad',
    borrowed: 'Nag-utang',
    // Transaction Modal
    recordDebt: '📝 Mag-record ng Utang',
    recordPayment2: '💚 Mag-record ng Bayad',
    selectCustomer: '-- Piliin ang Suki --',
    customer: 'Suki',
    itemsBoughtLabel: 'Mga Binili',
    addItem: 'Dagdag',
    itemName: 'Pangalan ng item (e.g. Bigas 5kg)',
    qty: 'Qty',
    price: 'Presyo',
    totalDebt: 'Total Utang:',
    orAmount: 'O kaya, halaga ng utang',
    paymentAmount: 'Halaga ng Bayad *',
    notes: 'Nota (opsyonal)',
    noteExample: 'e.g. Sabi bayaran bukas',
    saving: 'Nag-se-save...',
    saveRecord: '📝 I-record ang Utang',
    savePayment: '💚 I-record ang Bayad',
    // Customer Modal
    editCustomer: '✏️ I-edit ang Suki',
    newCustomer: '➕ Bagong Suki',
    name: 'Pangalan *',
    namePlaceholder: 'Juan dela Cruz',
    phone: 'Telepono (opsyonal)',
    address: 'Address (opsyonal)',
    addressPlaceholder: 'Blk 1 Lot 2 Kalye Mo',
    saveChanges: '💾 I-save ang Pagbabago',
    addCustomerBtn: '✅ Idagdag ang Suki',
    // Edit Transaction Modal
    editTransaction: '✏️ I-edit ang Transaksyon',
    editDebt: 'I-edit ang Utang',
    editPayment: 'I-edit ang Bayad',
    deleteTransaction: 'Burahin ang Transaksyon',
    confirmDelete: 'Sigurado ka bang gusto mong burahin ang transaksyong ito?',
    cancel: 'Kanselahin',
    delete: 'Burahin',
    save: 'I-save',
    // Transactions page
    totalDebtLabel: 'Kabuuang Utang',
    totalPaymentLabel: 'Kabuuang Bayad',
    all: 'Lahat',
    recordDebtBtn: '📝 I-record ng Utang',
    recordPaymentBtn: '💚 I-record ng Bayad',
    noTransactionsFilter: 'Wala pang transaksyon',
    recordFirstAction: 'I-record ang unang utang o bayad!',
    // Toast messages
    nameRequired: '❌ Kailangan ng pangalan!',
    customerUpdated: '✅ Na-update na ang suki!',
    customerAdded: '✅ Naidagdag ang bagong suki!',
    errorTryAgain: '❌ May error. Subukan ulit.',
    selectCustomerError: '❌ Piliin ang suki!',
    enterAmount: '❌ Mag-enter ng tamang halaga!',
    debtRecorded: '📝 Na-record ang utang!',
    paymentRecorded: '💚 Na-record ang bayad!',
    transactionUpdated: '✅ Na-update ang transaksyon!',
    transactionDeleted: '🗑️ Nabura ang transaksyon!',
    // StatusBar
    syncing: 'Nag-si-sync sa cloud...',
    offlineMode: 'Offline mode – naka-save sa phone',
    logout: 'Logout',
    // BottomNav
    navDashboard: 'Dashboard',
    navCustomers: 'Mga Suki',
    navTransactions: 'Transaksyon',
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'tl')

  function switchLang(newLang) {
    setLang(newLang)
    localStorage.setItem('app-lang', newLang)
  }

  const t = (key) => translations[lang]?.[key] ?? translations['tl'][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
