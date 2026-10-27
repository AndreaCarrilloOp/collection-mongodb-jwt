<template>
  <section class="detail-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Entidad secundaria</p>
        <h2>{{ pageTitle }}</h2>
      </div>
      <router-link class="button" to="/artist">Volver</router-link>
    </div>

    <p v-if="error" class="message error">{{ error }}</p>

    <div class="detail-layout">
      <div class="detail-image-panel">
        <img class="detail-image" :src="artist.image || '/images/artists/default.webp'" :alt="artist.name || 'Artista de jazz'" />
      </div>

      <!-- En show se muestran datos legibles, sin controles que parezcan editables. -->
      <div class="detail-content">
      <article v-if="show" class="detail-readonly" aria-label="Información del artista">
        <dl class="detail-facts">
          <div class="detail-fact detail-fact--wide"><dt>Nombre</dt><dd class="detail-primary">{{ artist.name || '—' }}</dd></div>
          <div class="detail-fact"><dt>País</dt><dd>{{ artist.country || '—' }}</dd></div>
          <div class="detail-fact"><dt>Año de nacimiento</dt><dd>{{ artist.birth_year ?? '—' }}</dd></div>
          <div class="detail-fact detail-fact--wide"><dt>Instrumento principal</dt><dd>{{ artist.main_instrument || '—' }}</dd></div>
          <div class="detail-fact detail-fact--wide"><dt>Descripción</dt><dd class="detail-description">{{ artist.description || 'Sin descripción' }}</dd></div>
        </dl>
      </article>

      <form v-else class="detail-form" @submit.prevent>
        <div class="field field--wide">
          <label for="nameInput">Nombre</label>
          <input id="nameInput" type="text" v-model="artist.name" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="countryInput">País</label>
          <input id="countryInput" type="text" v-model="artist.country" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="birthInput">Año de nacimiento</label>
          <input id="birthInput" type="number" v-model.number="artist.birth_year" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="instrumentInput">Instrumento principal</label>
          <input id="instrumentInput" type="text" v-model="artist.main_instrument" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="imageInput">Imagen (ruta)</label>
          <input id="imageInput" type="text" v-model="artist.image" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="descriptionInput">Descripción</label>
          <textarea id="descriptionInput" v-model="artist.description" rows="3" :disabled="session.user?.role !== 'admin'"></textarea>
        </div>
        <div v-if="(edit || create) && session.user?.role === 'admin'" class="form-actions field--wide">
          <button v-if="edit" class="button button-primary" type="button" @click="updateArtist">Actualizar</button>
          <button v-if="create" class="button button-primary" type="button" @click="createArtist">Crear</button>
        </div>
      </form>
      <section v-if="show" class="related-section">
      <h3>Álbumes relacionados</h3>
      <div class="related-list">
        <router-link v-for="album in relatedAlbums" :key="album.id" class="related-item" :to="'/album/show/' + album.id">
          <span>{{ album.title }}</span>
          <span class="meta">{{ album.release_year }}</span>
        </router-link>
      </div>
      </section>
      </div>
    </div>
  </section>
</template>

<script>
import { session } from '../auth.js'
export default {
  setup() { return { session } },
  props: ['create', 'edit', 'show'],
  data() {
    return {
      albums: [],
      error: '',
      artist: {
        name: '',
        country: '',
        birth_year: '',
        main_instrument: '',
        description: '',
        image: '/images/artists/default.webp'
      }
    }
  },
  computed: {
    pageTitle() {
      if (this.create) return 'Crear artista'
      if (this.edit) return 'Editar artista'
      return 'Detalle del artista'
    },
    relatedAlbums() {
      return this.albums.filter((album) => String(album.artist_id) === String(this.artist.id))
    }
  },
  created() {
    if (!this.create && this.$route.params.id) this.findArtist(this.$route.params.id)
    if (this.show) this.loadAlbums()
  },
  methods: {
    loadAlbums() {
      fetch('/api/albums')
        .then((response) => response.json())
        .then((result) => {
          this.albums = result
        })
    },
    findArtist(id) {
      fetch('/api/artists/' + id)
        .then((response) => {
          if (!response.ok) throw new Error('Artista no encontrado')
          return response.json()
        })
        .then((result) => {
          this.artist = result
        })
        .catch((error) => {
          this.error = error.message
        })
    },
    updateArtist() {
      fetch('/api/artists/' + this.$route.params.id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(this.artist)
      })
        .then((response) => {
          if (!response.ok) return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible actualizar')))
          return response.json()
        })
        .then(() => this.$router.push('/artist'))
        .catch((error) => {
          this.error = error.message
        })
    },
    createArtist() {
      fetch('/api/artists', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(this.artist)
      })
        .then((response) => {
          if (!response.ok) return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible crear')))
          return response.json()
        })
        .then(() => this.$router.push('/artist'))
        .catch((error) => {
          this.error = error.message
        })
    }
  }
}
</script>
