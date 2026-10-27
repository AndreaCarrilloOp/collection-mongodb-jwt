<template>
  <section class="auth-panel" aria-labelledby="auth-title">
    <p class="eyebrow">Acceso al catálogo</p>
    <h2 id="auth-title">{{ isRegister ? 'Crear cuenta' : 'Iniciar sesión' }}</h2>
    <p class="auth-intro">{{ isRegister ? 'Regístrese para acceder a Jazz Collection.' : 'Ingrese sus credenciales para consultar el catálogo.' }}</p>
    <p v-if="registered && !isRegister" class="message success" role="status">Cuenta creada. Ya puede iniciar sesión.</p>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>

    <form @submit.prevent="submit">
      <template v-if="isRegister">
        <label for="auth-name">Nombre</label>
        <input id="auth-name" v-model.trim="name" class="u-full-width" autocomplete="name" required maxlength="100" />
      </template>
      <label for="auth-email">Correo electrónico</label>
      <input id="auth-email" v-model.trim="email" class="u-full-width" type="email" autocomplete="email" required />
      <label for="auth-password">Contraseña</label>
      <input id="auth-password" v-model="password" class="u-full-width" type="password" :autocomplete="isRegister ? 'new-password' : 'current-password'" minlength="8" required />
      <button class="button button-primary auth-submit" type="submit" :disabled="busy">
        {{ busy ? 'Procesando...' : isRegister ? 'Registrarse' : 'Entrar' }}
      </button>
    </form>
    <p class="auth-switch">
      {{ isRegister ? '¿Ya tiene una cuenta?' : '¿Todavía no tiene una cuenta?' }}
      <router-link :to="isRegister ? '/login' : '/register'">{{ isRegister ? 'Iniciar sesión' : 'Crear una cuenta' }}</router-link>
    </p>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginSession } from './auth.js'
const route = useRoute()
const router = useRouter()
const isRegister = computed(() => route.name === 'register')
const registered = computed(() => route.query.registered === '1')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
watch(isRegister, () => { error.value = ''; password.value = '' })

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const endpoint = isRegister.value ? 'register' : 'login'
    const response = await fetch('/api/auth/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, email: email.value, password: password.value })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No fue posible completar la operación')
    password.value = ''
    if (isRegister.value) {
      await router.replace({ name: 'login', query: { registered: '1' } })
    } else {
      loginSession(data)
      const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//') ? route.query.redirect : '/album'
      await router.replace(redirect)
    }
  } catch (e) {
    error.value = e.message || 'Ocurrió un error de conexión'
  } finally {
    busy.value = false
  }
}
</script>
