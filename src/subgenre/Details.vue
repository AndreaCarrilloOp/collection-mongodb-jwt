<template>
  <section class="detail-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Entidad secundaria</p>
        <h2>{{ pageTitle }}</h2>
      </div>
      <router-link class="button" to="/subgenre">Volver</router-link>
    </div>

    <p v-if="error" class="message error">{{ error }}</p>

    <div class="detail-layout">
      <div class="detail-image-panel">
        <img class="detail-image" :src="subgenre.image || '/images/subgenres/default.webp'" :alt="subgenre.name || 'Subgénero de jazz'" />
      </div>

      <!-- En show los valores no se presentan como input, select o textarea. -->
      <div class="detail-content">
      <article v-if="show" class="detail-readonly" aria-label="Información del subgénero">
        <dl class="detail-facts">
          <div class="detail-fact detail-fact--wide"><dt>Nombre</dt><dd class="detail-primary">{{ subgenre.name || '—' }}</dd></div>
          <div class="detail-fact"><dt>Década de origen</dt><dd>{{ subgenre.origin_decade || '—' }}</dd></div>
          <div class="detail-fact"><dt>Lugar de origen</dt><dd>{{ subgenre.origin_place || '—' }}</dd></div>
          <div class="detail-fact detail-fact--wide"><dt>Características</dt><dd>{{ subgenre.characteristics || '—' }}</dd></div>
          <div class="detail-fact detail-fact--wide"><dt>Descripción</dt><dd class="detail-description">{{ subgenre.description || 'Sin descripción' }}</dd></div>
        </dl>
      </article>

      <form v-else class="detail-form" @submit.prevent>
        <div class="field field--wide">
          <label for="nameInput">Nombre</label>
          <input id="nameInput" type="text" v-model="subgenre.name" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="decadeInput">Década de origen</label>
          <input id="decadeInput" type="text" v-model="subgenre.origin_decade" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="placeInput">Lugar de origen</label>
          <input id="placeInput" type="text" v-model="subgenre.origin_place" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="characteristicsInput">Características</label>
          <input id="characteristicsInput" type="text" v-model="subgenre.characteristics" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="imageInput">Imagen (ruta)</label>
          <input id="imageInput" type="text" v-model="subgenre.image" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="descriptionInput">Descripción</label>
          <textarea id="descriptionInput" v-model="subgenre.description" rows="3" :disabled="session.user?.role !== 'admin'"></textarea>
        </div>
        <div v-if="(edit || create) && session.user?.role === 'admin'" class="form-actions field--wide">
          <button v-if="edit" class="button button-primary" type="button" @click="updateSubgenre">Actualizar</button>
          <button v-if="create" class="button button-primary" type="button" @click="createSubgenre">Crear</button>
        </div>
      </form>
      <section v-if="show" class="related-section">
      <h3>Álbumes relacionados</h3>
      <div class="related-list">
        <router-link v-for="album in relatedAlbums" :key="album.id" class="related-item" :to="'/album/show/' + album.id">
          <span>{{ album.title }}</span>
          <span class="meta">{{ album.artist_name }}</span>
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
      subgenre: {
        name: '',
        origin_decade: '',
        origin_place: '',
        characteristics: '',
        description: '',
        image: '/images/subgenres/default.webp'
      }
    }
  },
  computed: {
    pageTitle() {
      if (this.create) return 'Crear subgénero'
      if (this.edit) return 'Editar subgénero'
      return 'Detalle del subgénero'
    },
    relatedAlbums() {
      return this.albums.filter((album) => String(album.subgenre_id) === String(this.subgenre.id))
    }
  },
  created() {
    if (!this.create && this.$route.params.id) this.findSubgenre(this.$route.params.id)
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
    findSubgenre(id) {
      fetch('/api/subgenres/' + id)
        .then((response) => {
          if (!response.ok) throw new Error('Subgénero no encontrado')
          return response.json()
        })
        .then((result) => {
          this.subgenre = result
        })
        .catch((error) => {
          this.error = error.message
        })
    },
    updateSubgenre() {
      fetch('/api/subgenres/' + this.$route.params.id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(this.subgenre)
      })
        .then((response) => {
          if (!response.ok) return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible actualizar')))
          return response.json()
        })
        .then(() => this.$router.push('/subgenre'))
        .catch((error) => {
          this.error = error.message
        })
    },
    createSubgenre() {
      fetch('/api/subgenres', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(this.subgenre)
      })
        .then((response) => {
          if (!response.ok) return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible crear')))
          return response.json()
        })
        .then(() => this.$router.push('/subgenre'))
        .catch((error) => {
          this.error = error.message
        })
    }
  }
}
</script>
