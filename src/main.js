import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { session, isAuthenticated, verifySession, installApiAuthentication } from './auth.js'

import App from './App.vue'
import Auth from './Auth.vue'
import albumIndex from './album/Index.vue'
import albumDetails from './album/Details.vue'
import artistIndex from './artist/Index.vue'
import artistDetails from './artist/Details.vue'
import subgenreIndex from './subgenre/Index.vue'
import subgenreDetails from './subgenre/Details.vue'

import './css/normalize.css'
import './css/skeleton.css'
import './css/app.css'

const privatePage = { requiresAuth: true }
const adminPage = { requiresAuth: true, adminOnly: true }
const routes = [
  { path: '/', redirect: () => isAuthenticated() ? '/album' : '/login' },
  { path: '/login', name: 'login', component: Auth, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: Auth, meta: { guestOnly: true } },
  { path: '/album', component: albumIndex, meta: privatePage },
  { path: '/album/show/:id', component: albumDetails, props: { show: true }, meta: privatePage },
  { path: '/album/edit/:id', component: albumDetails, props: { edit: true }, meta: adminPage },
  { path: '/album/create', component: albumDetails, props: { create: true }, meta: adminPage },
  { path: '/artist', component: artistIndex, meta: privatePage },
  { path: '/artist/show/:id', component: artistDetails, props: { show: true }, meta: privatePage },
  { path: '/artist/edit/:id', component: artistDetails, props: { edit: true }, meta: adminPage },
  { path: '/artist/create', component: artistDetails, props: { create: true }, meta: adminPage },
  { path: '/subgenre', component: subgenreIndex, meta: privatePage },
  { path: '/subgenre/show/:id', component: subgenreDetails, props: { show: true }, meta: privatePage },
  { path: '/subgenre/edit/:id', component: subgenreDetails, props: { edit: true }, meta: adminPage },
  { path: '/subgenre/create', component: subgenreDetails, props: { create: true }, meta: adminPage },
  { path: '/:pathMatch(.*)*', redirect: () => isAuthenticated() ? '/album' : '/login' }
]

const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach(async to => {
  const authenticated = isAuthenticated()
  if (to.meta.requiresAuth && (!authenticated || !await verifySession())) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.adminOnly && session.user?.role !== 'admin') return '/album'
  if (to.meta.guestOnly && authenticated) return '/album'
})

installApiAuthentication(router)
createApp(App).use(router).mount('#app')
