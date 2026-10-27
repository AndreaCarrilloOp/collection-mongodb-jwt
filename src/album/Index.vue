<template>
  <section class="catalog-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Entidad principal</p>
        <h2>Álbumes de jazz</h2>
        <p>Explore los álbumes del catálogo.</p>
      </div>
      <router-link class="button button-primary" to="/album/create" v-if="session.user?.role === 'admin'">Nuevo álbum</router-link>
    </div>

    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="loading" class="message">Cargando álbumes...</p>

    <div v-if="!loading" class="card-grid" aria-label="Registros del catálogo">
      <article v-for="album in pageItems" :key="album.id" class="catalog-card">
        <img class="catalog-image album-image" :src="album.image" :alt="'Imagen de ' + album.title" />
        <div class="card-body">
          <p class="meta">{{ album.release_year }} · {{ album.label }}</p>
          <h3>{{ album.title }}</h3>
          <p><strong>Artista:</strong> {{ album.artist_name }}</p>
          <p><strong>Subgénero:</strong> {{ album.subgenre_name }}</p>
          <div class="card-actions">
            <router-link class="button small-button" :to="'/album/show/' + album.id">Ver</router-link>
            <router-link class="button small-button" :to="'/album/edit/' + album.id" v-if="session.user?.role === 'admin'">Editar</router-link>
            <button class="button small-button danger-button" type="button" @click="deleteAlbum(album.id)" v-if="session.user?.role === 'admin'">Eliminar</button>
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
    return {
      albums: [],
      page: 1,
      loading: true,
      error: ''
    }
  },
  computed: {
    items() { return this.albums },
    totalPages() { return Math.max(1, Math.ceil(this.items.length / 6)) },
    pageItems() { return this.items.slice((this.page - 1) * 6, this.page * 6) }
  },
  methods: {
    allAlbums() {
      this.loading = true
      this.error = ''
      fetch('/api/albums', { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error('No fue posible consultar los álbumes')
          return response.json()
        })
        .then((result) => {
          this.albums = result
          this.page = Math.min(this.page, this.totalPages)
        })
        .catch((error) => {
          this.error = error.message
        })
        .finally(() => {
          this.loading = false
        })
    },
    deleteAlbum(id) {
      if (!window.confirm('¿Desea eliminar este álbum?')) return

      fetch('/api/albums/' + id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ _method: 'DELETE' })
      })
        .then((response) => {
          if (!response.ok && response.status !== 204) {
            throw new Error('No fue posible eliminar el álbum')
          }
          this.allAlbums()
        })
        .catch((error) => {
          this.error = error.message
        })
    }
  },
  mounted() {
    this.allAlbums()
  }
}
</script>
