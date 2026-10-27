import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { database } from './db.js'

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
const error = (message, status = 400) => json({ error: message }, status)
const collections = { albums: 'albums', artists: 'artists', subgenres: 'subgenres' }
const required = { albums: ['title','release_year','label','artist_id','subgenre_id'], artists: ['name','country','main_instrument'], subgenres: ['name','origin_decade','origin_place','characteristics'] }
const defaults = { albums: '/images/albums/default.webp', artists: '/images/artists/default.webp', subgenres: '/images/subgenres/default.webp' }
function auth(request) {
  const token = /^Bearer (.+)$/i.exec(request.headers.get('authorization') || '')?.[1]
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }) } catch { return null }
}
const clean = doc => { if (!doc) return null; const { _id, ...rest } = doc; return rest }
async function nextId(db, resource) {
  const result = await db.collection('counters').findOneAndUpdate({ _id: resource }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  return String(result.seq)
}
async function withNames(db, doc) {
  if (!doc) return null
  const [artist, subgenre] = await Promise.all([
    db.collection('artists').findOne({ id: doc.artist_id }),
    db.collection('subgenres').findOne({ id: doc.subgenre_id })
  ])
  return { ...clean(doc), artist_name: artist?.name || '', subgenre_name: subgenre?.name || '' }
}
async function relationsValid(db, body) {
  const [artist, subgenre] = await Promise.all([
    db.collection('artists').findOne({ id: String(body.artist_id) }),
    db.collection('subgenres').findOne({ id: String(body.subgenre_id) })
  ])
  return Boolean(artist && subgenre)
}
async function handle(request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean)
  const apiAt = parts.indexOf('api')
  const path = apiAt >= 0 ? parts.slice(apiAt + 1) : parts.slice(parts.indexOf('functions') + 2)
  const [resource, id] = path
  const method = request.method
  if (resource === 'auth') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return error('Configuración JWT incompleta', 500)
    if (id === 'me' && method === 'GET') {
      const identity = auth(request)
      if (!identity) return error('Token ausente, inválido o expirado', 401)
      const db = await database()
      if (!ObjectId.isValid(identity.sub)) return error('Sesión no válida', 401)
      const user = await db.collection('users').findOne({ _id: new ObjectId(identity.sub) })
      if (!user) return error('Sesión no válida', 401)
      return json({ user: { name: user.name, email: user.email, role: user.role } })
    }
    if (method !== 'POST') return error('Método no permitido', 405)
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return error('Correo válido y contraseña de al menos 8 caracteres requeridos')
    const db = await database()
    const users = db.collection('users')
    if (id === 'register') {
      const name = String(body.name || '').trim()
      if (!name) return error('El nombre es obligatorio')
      const passwordHash = await bcrypt.hash(password, 12)
      try { await users.insertOne({ name, email, passwordHash, role: 'user', createdAt: new Date() }) }
      catch (e) { if (e.code === 11000) return error('Correo ya registrado', 409); throw e }
      return json({ message: 'Usuario registrado' }, 201)
    }
    if (id === 'login') {
      const user = await users.findOne({ email })
      if (!user || !await bcrypt.compare(password, user.passwordHash)) return error('Credenciales incorrectas', 401)
      const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h', algorithm: 'HS256' })
      return json({ token, user: { name: user.name, email: user.email, role: user.role } })
    }
    return error('Ruta no encontrada', 404)
  }
  if (!collections[resource] || path.length > 2) return error('Recurso no encontrado', 404)
  if (!['GET','POST','PUT','DELETE'].includes(method)) return error('Método no permitido', 405)
  // También las consultas requieren JWT: el catálogo no se expone antes del login.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return error('Configuración JWT incompleta', 500)
  const user = auth(request)
  if (!user) return error('Token ausente, inválido o expirado', 401)
  if (user.role !== 'user' && user.role !== 'admin') return error('No tiene permisos', 403)
  // Autenticación: JWT válido. Autorización: solo admin modifica el catálogo.
  if (method !== 'GET' && user.role !== 'admin') return error('Solo el administrador puede modificar el catálogo', 403)
  const db = await database()
  const collection = db.collection(resource)
  if (method === 'GET') {
    if (id) {
      const doc = await collection.findOne({ id })
      if (!doc) return error('Registro no encontrado', 404)
      return json(resource === 'albums' ? await withNames(db, doc) : clean(doc))
    }
    const docs = await collection.find({}).toArray()
    docs.sort((a,b) => Number(a.id)-Number(b.id))
    return json(resource === 'albums' ? await Promise.all(docs.map(doc => withNames(db,doc))) : docs.map(clean))
  }
  const body = method === 'DELETE' ? {} : await request.json().catch(() => ({}))
  // El Proyecto 1 también admitía POST /:recurso/:id para actualizar.
  const operation = method === 'POST' && id ? (body._method === 'DELETE' ? 'DELETE' : 'PUT') : method
  if (operation === 'DELETE') {
    if (!id) return error('Falta el identificador')
    if (resource !== 'albums' && await db.collection('albums').findOne({ [resource === 'artists' ? 'artist_id' : 'subgenre_id']: id })) return error('Existen álbumes relacionados', 409)
    const result = await collection.deleteOne({ id })
    return result.deletedCount ? new Response(null, { status: 204 }) : error('Registro no encontrado', 404)
  }
  if (operation === 'PUT' && !id) return error('Falta el identificador')
  if (required[resource].some(key => body[key] === undefined || body[key] === null || String(body[key]).trim() === '')) return error('Faltan campos obligatorios')
  if (resource === 'albums' && !await relationsValid(db, body)) return error('Artista o subgénero no existe')
  const fields = Object.fromEntries(Object.keys(body).filter(key => !['_id','id','_method','artist_name','subgenre_name'].includes(key)).map(key => [key,body[key]]))
  if (resource === 'albums') { fields.artist_id = String(fields.artist_id); fields.subgenre_id = String(fields.subgenre_id) }
  fields.image ||= defaults[resource]
  if (operation === 'POST') {
    const newId = await nextId(db, resource)
    await collection.insertOne({ id: newId, ...fields })
    const doc = await collection.findOne({ id: newId })
    return json(resource === 'albums' ? await withNames(db,doc) : clean(doc), 201)
  }
  const result = await collection.updateOne({ id }, { $set: fields })
  if (!result.matchedCount) return error('Registro no encontrado', 404)
  const doc = await collection.findOne({ id })
  return json(resource === 'albums' ? await withNames(db,doc) : clean(doc))
}
export default async (request) => {
  try { return await handle(request) }
  catch (e) { console.error(e); return error('Error interno del servidor', 500) }
}
