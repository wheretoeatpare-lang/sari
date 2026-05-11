import Dexie from 'dexie'

export const db = new Dexie('UtangTrackerDB')

db.version(1).stores({
  customers: '++id, name, phone, address, created_at, updated_at, synced, remote_id',
  transactions: '++id, customer_id, type, amount, notes, created_at, synced, remote_id',
  transaction_items: '++id, transaction_id, description, quantity, unit_price, total_price, synced',
  sync_queue: '++id, table_name, record_id, operation, created_at',
})

// ─── Customers ───────────────────────────────────────────────

export async function addCustomer(data) {
  const now = new Date().toISOString()
  const id = await db.customers.add({
    ...data,
    created_at: now,
    updated_at: now,
    synced: 0,
    remote_id: null,
  })
  await db.sync_queue.add({ table_name: 'customers', record_id: id, operation: 'INSERT', created_at: now })
  return id
}

export async function updateCustomer(id, data) {
  const now = new Date().toISOString()
  await db.customers.update(id, { ...data, updated_at: now, synced: 0 })
  await db.sync_queue.add({ table_name: 'customers', record_id: id, operation: 'UPDATE', created_at: now })
}

export async function getAllCustomers() {
  return db.customers.orderBy('name').toArray()
}

export async function getCustomerById(id) {
  return db.customers.get(Number(id))
}

// ─── Transactions ────────────────────────────────────────────

export async function addTransaction(txData, items = []) {
  const now = new Date().toISOString()
  const txId = await db.transactions.add({
    customer_id: txData.customer_id,
    type: txData.type, // 'utang' | 'bayad'
    amount: txData.amount,
    notes: txData.notes || '',
    created_at: txData.created_at || now,
    synced: 0,
    remote_id: null,
  })

  for (const item of items) {
    await db.transaction_items.add({
      transaction_id: txId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      synced: 0,
    })
  }

  await db.sync_queue.add({ table_name: 'transactions', record_id: txId, operation: 'INSERT', created_at: now })
  return txId
}

export async function getTransactionsByCustomer(customerId) {
  return db.transactions
    .where('customer_id')
    .equals(Number(customerId))
    .reverse()
    .sortBy('created_at')
}

export async function getTransactionItems(transactionId) {
  return db.transaction_items
    .where('transaction_id')
    .equals(Number(transactionId))
    .toArray()
}

export async function getAllTransactions() {
  return db.transactions.orderBy('created_at').reverse().toArray()
}

// ─── Balance Calculation ─────────────────────────────────────

export async function getCustomerBalance(customerId) {
  const txns = await db.transactions
    .where('customer_id')
    .equals(Number(customerId))
    .toArray()

  let balance = 0
  for (const t of txns) {
    if (t.type === 'utang') balance += Number(t.amount)
    else if (t.type === 'bayad') balance -= Number(t.amount)
  }
  return balance
}

export async function getTotalUtang() {
  const customers = await db.customers.toArray()
  let total = 0
  for (const c of customers) {
    const bal = await getCustomerBalance(c.id)
    if (bal > 0) total += bal
  }
  return total
}

export async function getTodayPayments() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const payments = await db.transactions
    .where('created_at')
    .between(startOfDay, endOfDay)
    .filter(t => t.type === 'bayad')
    .toArray()

  return payments.reduce((sum, p) => sum + Number(p.amount), 0)
}

export async function getRecentTransactions(limit = 10) {
  const txns = await db.transactions.orderBy('created_at').reverse().limit(limit).toArray()
  const result = []
  for (const t of txns) {
    const customer = await db.customers.get(t.customer_id)
    result.push({ ...t, customer })
  }
  return result
}

export async function getCustomersWithBalances() {
  const customers = await db.customers.orderBy('name').toArray()
  const result = []
  for (const c of customers) {
    const balance = await getCustomerBalance(c.id)
    result.push({ ...c, balance })
  }
  return result
}

// ─── Unsynced records ─────────────────────────────────────────

export async function getUnsyncedQueue() {
  return db.sync_queue.toArray()
}

export async function markSynced(queueId, table, recordId, remoteId) {
  await db.sync_queue.delete(queueId)
  if (table === 'customers') await db.customers.update(recordId, { synced: 1, remote_id: remoteId })
  if (table === 'transactions') await db.transactions.update(recordId, { synced: 1, remote_id: remoteId })
}
