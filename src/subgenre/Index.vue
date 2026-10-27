<template>
  <section class="catalog-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Entidad secundaria</p>
        <h2>Subgéneros</h2>
        <p>Estilos que permiten organizar y navegar el catálogo.</p>
      </div>
      <router-link class="button button-primary" to="/subgenre/create" v-if="session.user?.role === 'admin'">Nuevo subgénero</router-link>
    </div>

    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="loading" class="message">Cargando registros...</p>

    <div v-if="!loading" class="card-grid" aria-label="Registros del catálogo">
      <article v-for="subgenre in pageItems" :key="subgenre.id" class="catalog-card">
        <img class="catalog-image" :src="subgenre.image" :alt="'Imagen de ' + subgenre.name" />
        <div class="card-body">
          <p class="meta">{{ subgenre.origin_decade }} · {{ subgenre.origin_place }}</p>
          <h3>{{ subgenre.name }}</h3>
          <p class="clamp">{{ subgenre.characteristics }}</p>
          <div class="card-actions">
            <router-link class="button small-button" :to="'/subgenre/show/' + subgenre.id">Ver</router-link>
            <router-link class="button small-button" :to="'/subgenre/edit/' + subgenre.id" v-if="session.user?.role === 'admin'">Editar</router-link>
            <button class="button small-button danger-button" type="button" @click="deleteSubgenre(subgenre.id)" v-if="session.user?.role === 'admin'">Eliminar</button>
          </div>
        </div>
      </article>
    </div>
    <nav v-if="totalPages > 1" class="catalog-pagination" aria-label="Páginas del catálogo">
      <span class="pagination-total">{{ items.length }} registros</span>
      <div class="pagination-controls">
        <button class="button small-button" type="button" :disabled="page === 1" @click="page--">Anterior</button>
        <span class="pagination-count" aria-live="polite">{{ page }} / {{ totalPages }}</span>
        <button class="button small-button" type="button" :disabled="page === totalPages" @click="page++">Siguiente</button>
      </div>
    </nav>
  </section>
</template>

<script>
import { session } from '../auth.js'
export default {
  setup() { return { session } },
  data() {
    return { subgenres: [], page: 1, loading: true, error: '' }
  },
  computed: {
    items() { return this.subgenres },
    totalPages() { return Math.max(1, Math.ceil(this.items.length / 6)) },
    pageItems() { return this.items.slice((this.page - 1) * 6, this.page * 6) }
  },
  methods: {
    allSubgenres() {
      this.loading = true
      this.error = ''
      fetch('/api/subgenres')
        .then((response) => {
          if (!response.ok) throw new Error('No fue posible consultar los subgéneros')
          return response.json()
        })
        .then((result) => {
          this.subgenres = result
          this.page = Math.min(this.page, this.totalPages)
        })
        .catch((error) => {
          this.error = error.message
        })
        .finally(() => { this.loading = false })
    },
    deleteSubgenre(id) {
      if (!window.confirm('¿Desea eliminar este subgénero? Los álbumes relacionados deben eliminarse o reasignarse primero.')) return
      fetch('/api/subgenres/' + id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ _method: 'DELETE' })
      })
        .then((response) => {
          if (!response.ok && response.status !== 204) {
            return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible eliminar el subgénero')))
          }
          this.allSubgenres()
        })
        .catch((error) => {
          this.error = error.message
        })
    }
  },
  mounted() {
    this.allSubgenres()
  }
}
</script>
