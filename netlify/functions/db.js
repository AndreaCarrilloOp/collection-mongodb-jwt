import dns from 'node:dns'
import { MongoClient } from 'mongodb'

// Solamente configurar DNS alternativos cuando el entorno lo requiera.
const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',').map(s => s.trim()).filter(Boolean)
if (dnsServers?.length) dns.setServers(dnsServers)

let clientPromise
export async function database() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI')
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI)
    clientPromise = client.connect().catch(error => {
      clientPromise = null
      throw error
    })
  }
  const client = await clientPromise
  return client.db(process.env.MONGODB_DB || 'jazz_collection')
}
