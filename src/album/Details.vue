<template>
  <section class="detail-page">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Entidad principal</p>
        <h2>{{ pageTitle }}</h2>
      </div>
      <router-link class="button" to="/album">Volver</router-link>
    </div>

    <p v-if="error" class="message error">{{ error }}</p>

    <div class="detail-layout">
      <div class="detail-image-panel">
        <img class="detail-image" :src="album.image || '/images/albums/default.webp'" :alt="album.title || 'Álbum de jazz'" />
      </div>

      <!-- La vista show es texto de solo lectura, nunca un formulario deshabilitado. -->
      <div class="detail-content">
      <article v-if="show" class="detail-readonly" aria-label="Información del álbum">
        <dl class="detail-facts">
          <div class="detail-fact detail-fact--wide"><dt>Título</dt><dd class="detail-primary">{{ album.title || '—' }}</dd></div>
          <div class="detail-fact"><dt>Año de lanzamiento</dt><dd>{{ album.release_year ?? '—' }}</dd></div>
          <div class="detail-fact"><dt>Sello discográfico</dt><dd>{{ album.label || '—' }}</dd></div>
          <div class="detail-fact"><dt>Artista</dt><dd><router-link v-if="album.artist_id" :to="'/artist/show/' + album.artist_id">{{ album.artist_name || artistName }}</router-link><span v-else>—</span></dd></div>
          <div class="detail-fact"><dt>Subgénero</dt><dd><router-link v-if="album.subgenre_id" :to="'/subgenre/show/' + album.subgenre_id">{{ album.subgenre_name || subgenreName }}</router-link><span v-else>—</span></dd></div>
          <div class="detail-fact detail-fact--wide"><dt>Descripción</dt><dd class="detail-description">{{ album.description || 'Sin descripción' }}</dd></div>
        </dl>
      </article>

      <form v-else class="detail-form" @submit.prevent>
        <div class="field field--wide">
          <label for="titleInput">Título</label>
          <input id="titleInput" type="text" v-model="album.title" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="yearInput">Año de lanzamiento</label>
          <input id="yearInput" type="number" v-model.number="album.release_year" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="labelInput">Sello discográfico</label>
          <input id="labelInput" type="text" v-model="album.label" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field">
          <label for="artistInput">Artista</label>
          <select id="artistInput" v-model="album.artist_id" :disabled="session.user?.role !== 'admin'">
            <option value="">Seleccione un artista</option>
            <option v-for="item in artists" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="field">
          <label for="subgenreInput">Subgénero</label>
          <select id="subgenreInput" v-model="album.subgenre_id" :disabled="session.user?.role !== 'admin'">
            <option value="">Seleccione un subgénero</option>
            <option v-for="item in subgenres" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="field field--wide">
          <label for="imageInput">Imagen (ruta)</label>
          <input id="imageInput" type="text" v-model="album.image" :disabled="session.user?.role !== 'admin'" />
        </div>
        <div class="field field--wide">
          <label for="descriptionInput">Descripción</label>
          <textarea id="descriptionInput" v-model="album.description" rows="3" :disabled="session.user?.role !== 'admin'"></textarea>
        </div>
        <div v-if="(edit || create) && session.user?.role === 'admin'" class="form-actions field--wide">
          <button v-if="edit" class="button button-primary" type="button" @click="updateAlbum">Actualizar</button>
          <button v-if="create" class="button button-primary" type="button" @click="createAlbum">Crear</button>
        </div>
      </form>
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
      artists: [],
      subgenres: [],
      error: '',
      album: {
        title: '',
        release_year: '',
        label: '',
        description: '',
        image: '/images/albums/default.webp',
        artist_id: '',
        subgenre_id: ''
      }
    }
  },
  computed: {
    artistName() {
      return this.artists.find(item => String(item.id) === String(this.album.artist_id))?.name || 'Ver artista'
    },
    subgenreName() {
      return this.subgenres.find(item => String(item.id) === String(this.album.subgenre_id))?.name || 'Ver subgénero'
    },
    pageTitle() {
      if (this.create) return 'Crear álbum'
      if (this.edit) return 'Editar álbum'
      return 'Detalle del álbum'
    }
  },
  created() {
    this.loadRelations()
    if (!this.create && this.$route.params.id) this.findAlbum(this.$route.params.id)
  },
  methods: {
    loadRelations() {
      Promise.all([
        fetch('/api/artists').then((response) => response.json()),
        fetch('/api/subgenres').then((response) => response.json())
      ])
        .then(([artists, subgenres]) => {
          this.artists = artists
          this.subgenres = subgenres
        })
        .catch(() => {
          this.error = 'No fue posible cargar las entidades relacionadas'
        })
    },
    findAlbum(id) {
      fetch('/api/albums/' + id, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error('Álbum no encontrado')
          return response.json()
        })
        .then((result) => {
          this.album = result
        })
        .catch((error) => {
          this.error = error.message
        })
    },
    updateAlbum() {
      fetch('/api/albums/' + this.$route.params.id, {
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        body: JSON.stringify(this.album)
      })
        .then((response) => {
          if (!response.ok) return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible actualizar')))
          return response.json()
        })
        .then(() => this.$router.push('/album'))
        .catch((error) => {
          this.error = error.message
        })
    },
    createAlbum() {
      fetch('/api/albums', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(this.album)
      })
        .then((response) => {
          if (!response.ok) return response.json().then((body) => Promise.reject(new Error(body.error || 'No fue posible crear')))
          return response.json()
        })
        .then(() => this.$router.push('/album'))
        .catch((error) => {
          this.error = error.message
        })
    }
  }
}
</script>
