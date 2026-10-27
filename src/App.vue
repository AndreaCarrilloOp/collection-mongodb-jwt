<template>
  <div id="app" class="app-shell" :class="{ 'app-shell--auth': !session.user }">
    <header class="site-header">
      <div>
        <p class="eyebrow">Proyecto 2 - Catálogos temáticos</p>
        <h1>Jazz Collection</h1>
        <p class="subtitle">Catálogo de la mejor música jazz</p>
      </div>
      <div class="record-mark" aria-hidden="true">♪</div>
    </header>

    <nav v-if="session.user" class="main-nav" aria-label="Navegación principal">
      <router-link class="button" active-class="button-primary" to="/album">Álbumes</router-link>
      <router-link class="button" active-class="button-primary" to="/artist">Artistas</router-link>
      <router-link class="button" active-class="button-primary" to="/subgenre">Subgéneros</router-link>
      <span class="nav-account">
        <span class="account-name">{{ session.user.name }}</span>
        <button class="button" type="button" @click="signOut">Cerrar sesión</button>
      </span>
    </nav>

    <main class="site-main">
      <router-view />
    </main>

    <footer class="site-footer">
      <span>Proyecto académico - Sistemas Distribuidos</span>
      <span>Vue + Netlify Functions + MongoDB Atlas</span>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { session, logout } from './auth.js'
const router = useRouter()
function signOut() {
  logout()
  router.replace('/login')
}
</script>
