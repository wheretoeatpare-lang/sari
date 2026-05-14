import Dexie from 'dexie'

export const db = new Dexie('UtangTrackerDB')

// Version 1 - original schema (keep this so Dexie can migrate properly)
db.version(1).stores({
  customers: '++id, name, phone, address, created_at, updated_at, synced, remote_id',
  transactions: '++id, customer_id, type, amount, notes, created_at, synced, remote_id',
  transaction_items: '++id, transaction_id, description, quantity, unit_price, total_price, synced',
  sync_queue: '++id, table_name, record_id, operation, created_at',
})

// Version 2 - added remote_id to sync_queue so DELETE can reference Supabase row
db.version(2).stores({
  customers: '++id, name, phone, address, created_at, updated_at, synced, remote_id',
  transactions: '++id, customer_id, type, amount, notes, created_at, synced, remote_id',
  transaction_items: '++id, transaction_id, description, quantity, unit_price, total_price, synced',
  sync_queue: '++id, table_name, record_id, operation, remote_id, created_at',
})

// ─── Customers ───────────────────────────────────────────────

export async function addCustomer(data) {
  try {
    const now = new Date().toISOString()
    const id = await db.customers.add({
      ...data,
      created_at: now,
      updated_at: now,
      synced: 0,
      remote_id: null,
    })
    await db.sync_queue.add({ table_name: 'customers', record_id: id, operation: 'INSERT', remote_id: null, created_at: now })
    return id
  } catch (err) {
    console.error('[DB] addCustomer failed:', err)
    throw err
  }
}

export async function updateCustomer(id, data) {
  try {
    const now = new Date().toISOString()
    await db.customers.update(id, { ...data, updated_at: now, synced: 0 })
    await db.sync_queue.add({ table_name: 'customers', record_id: id, operation: 'UPDATE', remote_id: null, created_at: now })
  } catch (err) {
    console.error('[DB] updateCustomer failed:', err)
    throw err
  }
}

export async function getAllCustomers() {
  try {
    return await db.customers.orderBy('name').toArray()
  } catch (err) {
    console.error('[DB] getAllCustomers failed:', err)
    return []
  }
}

export async function getCustomerById(id) {
  try {
    return await db.customers.get(Number(id))
  } catch (err) {
    console.error('[DB] getCustomerById failed:', err)
    return null
  }
}

// ─── Transactions ────────────────────────────────────────────

export async function addTransaction(txData, items = []) {
  try {
    const now = new Date().toISOString()
    const txId = await db.transactions.add({
      customer_id: txData.customer_id,
      type: txData.type,
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

    await db.sync_queue.add({ table_name: 'transactions', record_id: txId, operation: 'INSERT', remote_id: null, created_at: now })
    return txId
  } catch (err) {
    console.error('[DB] addTransaction failed:', err)
    throw err
  }
}

export async function updateTransaction(transactionId, { amount, notes }) {
  try {
    const now = new Date().toISOString()
    await db.transactions.update(Number(transactionId), {
      amount,
      notes,
      updated_at: now,
      synced: 0,
    })
    await db.sync_queue.add({
      table_name: 'transactions',
      record_id: Number(transactionId),
      operation: 'UPDATE',
      remote_id: null,
      created_at: now,
    })
  } catch (err) {
    console.error('[DB] updateTransaction failed:', err)
    throw err
  }
}

export async function deleteTransaction(transactionId) {
  try {
    const now = new Date().toISOString()

    // Get remote_id BEFORE deleting — needed to delete from Supabase
    const transaction = await db.transactions.get(Number(transactionId))
    const remoteId = transaction?.remote_id ?? null

    // Delete local items first
    await db.transaction_items
      .where('transaction_id')
      .equals(Number(transactionId))
      .delete()

    // Delete local transaction
    await db.transactions.delete(Number(transactionId))

    // Only queue DELETE sync if it was already pushed to Supabase
    if (remoteId) {
      await db.sync_queue.add({
        table_name: 'transactions',
        record_id: Number(transactionId),
        operation: 'DELETE',
        remote_id: remoteId,
        created_at: now,
      })
    }
  } catch (err) {
    console.error('[DB] deleteTransaction failed:', err)
    throw err
  }
}

export async function updateTransactionItems(transactionId, newItems) {
  try {
    await db.transaction_items
      .where('transaction_id')
      .equals(Number(transactionId))
      .delete()

    if (newItems && newItems.length > 0) {
      const itemsToInsert = newItems.map(item => ({
        transaction_id: Number(transactionId),
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.quantity) * Number(item.unit_price),
        synced: 0,
      }))
      await db.transaction_items.bulkAdd(itemsToInsert)
    }
  } catch (err) {
    console.error('[DB] updateTransactionItems failed:', err)
    throw err
  }
}

export async function getTransactionsByCustomer(customerId) {
  try {
    return await db.transactions
      .where('customer_id')
      .equals(Number(customerId))
      .reverse()
      .sortBy('created_at')
  } catch (err) {
    console.error('[DB] getTransactionsByCustomer failed:', err)
    return []
  }
}

export async function getTransactionItems(transactionId) {
  try {
    return await db.transaction_items
      .where('transaction_id')
      .equals(Number(transactionId))
      .toArray()
  } catch (err) {
    console.error('[DB] getTransactionItems failed:', err)
    return []
  }
}

export async function getAllTransactions() {
  try {
    return await db.transactions.orderBy('created_at').reverse().toArray()
  } catch (err) {
    console.error('[DB] getAllTransactions failed:', err)
    return []
  }
}

// ─── Balance Calculation ─────────────────────────────────────

export async function getCustomerBalance(customerId) {
  try {
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
  } catch (err) {
    console.error('[DB] getCustomerBalance failed:', err)
    return 0
  }
}

export async function getTotalUtang() {
  try {
    const customers = await db.customers.toArray()
    let total = 0
    for (const c of customers) {
      const bal = await getCustomerBalance(c.id)
      if (bal > 0) total += bal
    }
    return total
  } catch (err) {
    console.error('[DB] getTotalUtang failed:', err)
    return 0
  }
}

export async function getTodayPayments() {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const payments = await db.transactions
      .where('created_at')
      .between(startOfDay, endOfDay)
      .filter(t => t.type === 'bayad')
      .toArray()

    return payments.reduce((sum, p) => sum + Number(p.amount), 0)
  } catch (err) {
    console.error('[DB] getTodayPayments failed:', err)
    return 0
  }
}

export async function getRecentTransactions(limit = 10) {
  try {
    const txns = await db.transactions.orderBy('created_at').reverse().limit(limit).toArray()
    const result = []
    for (const t of txns) {
      const customer = await db.customers.get(t.customer_id)
      result.push({ ...t, customer })
    }
    return result
  } catch (err) {
    console.error('[DB] getRecentTransactions failed:', err)
    return []
  }
}

export async function getCustomersWithBalances() {
  try {
    const customers = await db.customers.orderBy('name').toArray()
    const result = []
    for (const c of customers) {
      const balance = await getCustomerBalance(c.id)
      result.push({ ...c, balance })
    }
    return result
  } catch (err) {
    console.error('[DB] getCustomersWithBalances failed:', err)
    return []
  }
}

// ─── Unsynced records ─────────────────────────────────────────

export async function getUnsyncedQueue() {
  try {
    return await db.sync_queue.toArray()
  } catch (err) {
    console.error('[DB] getUnsyncedQueue failed:', err)
    return []
  }
}

export async function markSynced(queueId, table, recordId, remoteId) {
  try {
    await db.sync_queue.delete(queueId)
    if (table === 'customers') await db.customers.update(recordId, { synced: 1, remote_id: remoteId })
    if (table === 'transactions') await db.transactions.update(recordId, { synced: 1, remote_id: remoteId })
  } catch (err) {
    console.error('[DB] markSynced failed:', err)
  }
}
