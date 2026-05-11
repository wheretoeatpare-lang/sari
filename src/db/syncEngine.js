import { db, getUnsyncedQueue, markSynced } from './database'
import { supabase, isSupabaseConfigured } from './supabase'

let isSyncing = false

export async function syncToSupabase() {
  if (!isSupabaseConfigured() || isSyncing || !navigator.onLine) return

  isSyncing = true
  console.log('[Sync] Starting sync...')

  try {
    const queue = await getUnsyncedQueue()
    if (queue.length === 0) {
      console.log('[Sync] Nothing to sync.')
      return
    }

    // Deduplicate - take latest op per record
    const dedupMap = new Map()
    for (const item of queue) {
      const key = `${item.table_name}:${item.record_id}`
      if (!dedupMap.has(key) || item.id > dedupMap.get(key).id) {
        dedupMap.set(key, item)
      }
    }

    for (const [, queueItem] of dedupMap) {
      await syncRecord(queueItem)
    }

    console.log('[Sync] Sync complete.')
  } catch (err) {
    console.error('[Sync] Error:', err)
  } finally {
    isSyncing = false
  }
}

async function syncRecord(queueItem) {
  const { id: queueId, table_name, record_id, operation } = queueItem

  try {
    let record
    if (table_name === 'customers') {
      record = await db.customers.get(record_id)
    } else if (table_name === 'transactions') {
      record = await db.transactions.get(record_id)
    } else {
      return
    }

    if (!record) return

    const payload = buildPayload(table_name, record)

    if (operation === 'INSERT' && !record.remote_id) {
      const { data, error } = await supabase.from(table_name).insert(payload).select().single()
      if (error) throw error
      await markSynced(queueId, table_name, record_id, data.id)

      // If transaction, sync items too
      if (table_name === 'transactions') {
        await syncTransactionItems(record_id, data.id)
      }
    } else if (operation === 'UPDATE' && record.remote_id) {
      const { error } = await supabase.from(table_name).update(payload).eq('id', record.remote_id)
      if (error) throw error
      await markSynced(queueId, table_name, record_id, record.remote_id)
    } else if (record.remote_id) {
      // Has remote ID, do upsert
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
      if (!error) {
        await db.transaction_items.update(item.id, { synced: 1 })
      }
    }
  } catch (err) {
    console.error('[Sync] Failed to sync transaction items:', err)
  }
}

function buildPayload(table, record) {
  if (table === 'customers') {
    return {
      name: record.name,
      phone: record.phone || null,
      address: record.address || null,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }
  }
  if (table === 'transactions') {
    return {
      customer_id: record.remote_id || null, // Supabase remote customer id
      type: record.type,
      amount: record.amount,
      notes: record.notes,
      created_at: record.created_at,
    }
  }
  return record
}

// Set up online listener to auto sync
export function initSyncEngine() {
  window.addEventListener('online', () => {
    console.log('[Sync] Internet restored! Syncing...')
    setTimeout(syncToSupabase, 1000)
  })

  // Also sync every 2 minutes if online
  setInterval(() => {
    if (navigator.onLine) syncToSupabase()
  }, 2 * 60 * 1000)

  // Sync on startup
  if (navigator.onLine) {
    setTimeout(syncToSupabase, 3000)
  }
}
