<template>
  <div class="container">
    <div class="header">
      <h1>Select Event</h1>
      <button class="btn btn-secondary" @click="logout">
        Disconnect
      </button>
    </div>

    <EventSelector
      v-if="apiUrl && apiToken"
      :api-url="apiUrl"
      :api-token="apiToken"
      @event-selected="handleEventSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiUrl = ref('')
const apiToken = ref('')

const loadConfig = () => {
  if (typeof window !== 'undefined') {
    apiUrl.value = localStorage.getItem('pretix_api_url') || ''
    apiToken.value = localStorage.getItem('pretix_api_token') || ''

    if (!apiUrl.value || !apiToken.value) {
      navigateTo('/')
    }
  }
}

const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pretix_api_url')
    localStorage.removeItem('pretix_api_token')
    navigateTo('/')
  }
}

const handleEventSelected = (event: any) => {
  navigateTo(`/pos/${event.organizer}/${event.slug}`)
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 32px;
  color: #1f2937;
  margin: 0;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}
</style>
