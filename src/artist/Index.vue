<template>
  <section class="catalog-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Entidad secundaria</p>
        <h2>Artistas</h2>
        <p>Intérpretes y compositores relacionados con los álbumes del catálogo.</p>
      </div>
      <router-link class="button button-primary" to="/artist/create" v-if="session.user?.role === 'admin'">Nuevo artista</router-link>
    </div>

    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="loading" class="message">Cargando registros...</p>

    <div v-if="!loading" class="card-grid" aria-label="Registros del catálogo">
      <article v-for="artist in pageItems" :key="artist.id" class="catalog-card">
        <img class="catalog-image" :src="artist.image" :alt="'Imagen de ' + artist.name" />
        <div class="card-body">
          <p class="meta">{{ artist.country }} · {{ artist.birth_year }}</p>
          <h3>{{ artist.name }}</h3>
          <p><strong>Instrumento:</strong> {{ artist.main_instrument }}</p>
          <div class="card-actions">
            <router-link class="button small-button" :to="'/artist/show/' + artist.id">Ver</router-link>
            <router-link class="button small-button" :to="'/artist/edit/' + artist.id" v-if="session.user?.role === 'admin'">Editar</router-link>
            <button class="button small-button danger-button" type="button" @click="deleteArtist(artist.id)" v-if="session.user?.role === 'admin'">Eliminar</button>
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
    return { artists: [], page: 1, loading: true, error: '' }
  },
  computed: {
    items() { return this.artists },
    totalPages() { return Math.max(1, Math.ceil(this.items.length / 6)) },
    pageItems() { return this.items.slice((this.page - 1) * 6, this.page * 6) }
  },
  methods: {
    allArtists() {
      this.loading = true
      this.error = ''
      fetch('/api/artists', { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error('No fue posible consultar los artistas')
          return response.json()
        })
        .then((result) => {
          this.artists = result
          this.page = Math.min(this.page, this.totalPages)
        })
        .catch((error) => {
          this.error = error.message
        })
        .finally(() => { this.loading = false })
    },
    deleteArtist(id) {
      if (!window.confirm('¿Desea eliminar este artista? Los álbumes relacionados deben eliminarse o reasignarse primero.')) return
      fetch('/api/artists/' + id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ _method: 'DELETE' })
      })
        .then((response) => {
          if (!response.ok && response.status !== 204) {
            return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible eliminar el artista')))
          }
          this.allArtists()
        })
        .catch((error) => {
          this.error = error.message
        })
    }
  },
  mounted() {
    this.allArtists()
  }
}
</script>
