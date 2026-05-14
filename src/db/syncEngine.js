import { db, getUnsyncedQueue, markSynced } from './database'
import { supabase, isSupabaseConfigured } from './supabase'

let isSyncing = false

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─── Download from Supabase to local Dexie ───────────────────
export async function downloadFromSupabase() {
  if (!isSupabaseConfigured() || !navigator.onLine) return

  const userId = await getCurrentUserId()
  if (!userId) return

  console.log('[Sync] Downloading data from Supabase...')

  try {
    const { data: customers } = await supabase
      .from('customers').select('*').eq('user_id', userId)

    const { data: transactions } = await supabase
      .from('transactions').select('*').eq('user_id', userId)

    const txIds = (transactions || []).map(t => t.id)
    let items = []
    if (txIds.length > 0) {
      const { data: itemData } = await supabase
        .from('transaction_items').select('*').in('transaction_id', txIds)
      items = itemData || []
    }

    await db.customers.clear()
    await db.transactions.clear()
    await db.transaction_items.clear()
    await db.sync_queue.clear()

    // Insert customers
    const remoteToLocalCustomer = {}
    for (const c of customers || []) {
      const localId = await db.customers.add({
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        created_at: c.created_at,
        updated_at: c.updated_at,
        synced: 1,
        remote_id: c.id,
      })
      remoteToLocalCustomer[c.id] = localId
    }

    // Insert transactions
    const remoteToLocalTx = {}
    for (const t of transactions || []) {
      const localCustomerId = remoteToLocalCustomer[t.customer_id] ?? null
      const localTxId = await db.transactions.add({
        customer_id: localCustomerId,
        type: t.type,
        amount: t.amount,
        notes: t.notes || '',
        created_at: t.created_at,
        synced: 1,
        remote_id: t.id,
      })
      remoteToLocalTx[t.id] = localTxId
    }

    // Insert transaction items
    for (const item of items) {
      const localTxId = remoteToLocalTx[item.transaction_id]
      if (!localTxId) continue
      await db.transaction_items.add({
        transaction_id: localTxId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        synced: 1,
      })
    }

    console.log('[Sync] Download complete!', {
      customers: customers?.length,
      transactions: transactions?.length,
      items: items?.length
    })
  } catch (err) {
    console.error('[Sync] Download failed:', err)
  }
}

// ─── Upload: customers FIRST, then transactions ───────────────
export async function syncToSupabase() {
  if (!isSupabaseConfigured() || isSyncing || !navigator.onLine) return

  const userId = await getCurrentUserId()
  if (!userId) return

  isSyncing = true
  console.log('[Sync] Starting sync...')

  try {
    const queue = await getUnsyncedQueue()
    if (queue.length === 0) {
      console.log('[Sync] Nothing to sync.')
      return
    }

    // Deduplicate — keep latest queue entry per record
    // BUT: if any entry for a key is DELETE, that wins
    const dedupMap = new Map()
    for (const item of queue) {
      const key = `${item.table_name}:${item.record_id}`
      const existing = dedupMap.get(key)
      if (!existing) {
        dedupMap.set(key, item)
      } else if (item.operation === 'DELETE') {
        // DELETE always wins
        dedupMap.set(key, item)
      } else if (existing.operation !== 'DELETE' && item.id > existing.id) {
        dedupMap.set(key, item)
      }
    }

    // Sync CUSTOMERS first
    for (const [, queueItem] of dedupMap) {
      if (queueItem.table_name === 'customers') {
        await syncRecord(queueItem, userId)
      }
    }

    // Then sync TRANSACTIONS
    for (const [, queueItem] of dedupMap) {
      if (queueItem.table_name === 'transactions') {
        await syncRecord(queueItem, userId)
      }
    }

    console.log('[Sync] Sync complete.')
  } catch (err) {
    console.error('[Sync] Error:', err)
  } finally {
    isSyncing = false
  }
}

async function syncRecord(queueItem, userId) {
  const { id: queueId, table_name, record_id, operation } = queueItem

  try {
    // ── HANDLE DELETE ──────────────────────────────────────────
    if (operation === 'DELETE') {
      if (table_name === 'transactions') {
        // We stored the remote_id in the queue for deletes
        const remoteId = queueItem.remote_id
        if (remoteId) {
          // Delete transaction_items from Supabase first
          await supabase
            .from('transaction_items')
            .delete()
            .eq('transaction_id', remoteId)

          // Delete the transaction from Supabase
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', remoteId)

          if (error) throw error
        }
      } else if (table_name === 'customers') {
        const remoteId = queueItem.remote_id
        if (remoteId) {
          const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', remoteId)
          if (error) throw error
        }
      }
      // Remove from sync queue regardless
      await db.sync_queue.delete(queueId)
      return
    }

    // ── HANDLE INSERT / UPDATE ─────────────────────────────────
    let record
    if (table_name === 'customers') {
      record = await db.customers.get(record_id)
    } else if (table_name === 'transactions') {
      record = await db.transactions.get(record_id)
      if (record) {
        const customer = await db.customers.get(record.customer_id)
        record = { ...record, customer_remote_id: customer?.remote_id || null }
      }
    } else {
      return
    }

    if (!record) {
      // Record was deleted locally before sync could run — clean up queue
      await db.sync_queue.delete(queueId)
      return
    }

    const payload = buildPayload(table_name, record, userId)

    if (operation === 'INSERT' && !record.remote_id) {
      const { data, error } = await supabase.from(table_name).insert(payload).select().single()
      if (error) throw error
      await markSynced(queueId, table_name, record_id, data.id)
      if (table_name === 'transactions') {
        await syncTransactionItems(record_id, data.id)
      }
    } else if (operation === 'UPDATE' && record.remote_id) {
      const { error } = await supabase.from(table_name).update(payload).eq('id', record.remote_id)
      if (error) throw error
      if (table_name === 'transactions') {
        // Re-sync items on update too
        await syncTransactionItemsOnUpdate(record_id, record.remote_id)
      }
      await markSynced(queueId, table_name, record_id, record.remote_id)
    } else if (record.remote_id) {
      const { data, error } = await supabase.from(table_name).upsert({ ...payload, id: record.remote_id }).select().single()
      if (error) throw error
      await markSynced(queueId, table_name, record_id, data.id)
    }
  } catch (err) {
    console.error(`[Sync] Failed to sync ${table_name}:${record_id}`, err)
  }
}

async function syncTransactionItems(localTxId, remoteTxId) {
  try {
    const items = await db.transaction_items.where('transaction_id').equals(localTxId).toArray()
    for (const item of items) {
      if (item.synced) continue
      const { error } = await supabase.from('transaction_items').insert({
        transaction_id: remoteTxId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })
      if (!error) await db.transaction_items.update(item.id, { synced: 1 })
    }
  } catch (err) {
    console.error('[Sync] Failed to sync transaction items:', err)
  }
}

// Used when editing a transaction — replace all items in Supabase
async function syncTransactionItemsOnUpdate(localTxId, remoteTxId) {
  try {
    // Delete existing items from Supabase
    await supabase.from('transaction_items').delete().eq('transaction_id', remoteTxId)

    // Re-insert current local items
    const items = await db.transaction_items.where('transaction_id').equals(localTxId).toArray()
    for (const item of items) {
      const { error } = await supabase.from('transaction_items').insert({
        transaction_id: remoteTxId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })
      if (!error) await db.transaction_items.update(item.id, { synced: 1 })
    }
  } catch (err) {
    console.error('[Sync] Failed to update transaction items in Supabase:', err)
  }
}

function buildPayload(table, record, userId) {
  if (table === 'customers') {
    return {
      user_id: userId,
      name: record.name,
      phone: record.phone || null,
      address: record.address || null,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }
  }
  if (table === 'transactions') {
    return {
      user_id: userId,
      customer_id: record.customer_remote_id || null,
      type: record.type,
      amount: record.amount,
      notes: record.notes,
      created_at: record.created_at,
    }
  }
  return record
}

export function initSyncEngine() {
  window.addEventListener('online', () => {
    console.log('[Sync] Internet restored! Syncing...')
    setTimeout(syncToSupabase, 1000)
  })

  setInterval(() => {
    if (navigator.onLine) syncToSupabase()
  }, 2 * 60 * 1000)

  if (navigator.onLine) {
    setTimeout(syncToSupabase, 3000)
  }
}
