import dns from 'node:dns'
const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',').map(s => s.trim()).filter(Boolean)
if (dnsServers?.length) dns.setServers(dnsServers)
import { MongoClient } from 'mongodb'
import { readFile } from 'node:fs/promises'
const uri = process.env.MONGODB_URI
if (!uri) { console.error('Configure MONGODB_URI antes de importar'); process.exit(1) }
const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || 'jazz_collection')
  for (const resource of ['artists','subgenres','albums']) {
    const data = JSON.parse(await readFile(new URL(`../data/${resource}.json`, import.meta.url)))
    const col = db.collection(resource)
    await col.createIndex({ id: 1 }, { unique: true })
    for (const doc of data) await col.updateOne({ id: doc.id }, { $setOnInsert: doc }, { upsert: true })
    const max = Math.max(...data.map(item => Number(item.id)))
    await db.collection('counters').updateOne({ _id: resource }, { $max: { seq: max } }, { upsert: true })
    console.log(`${resource}: ${await col.countDocuments()} documentos`)
  }
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
} finally { await client.close() }
