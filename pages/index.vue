<template>
  <div class="container">
    <div class="header">
      <h1>Pretix POS Client</h1>
      <div class="config-section">
        <label>
          Pretix API URL:
          <input
            v-model="apiUrl"
            type="text"
            class="input"
            placeholder="https://pretix.example.com"
          />
        </label>
        <label>
          API Token:
          <input
            v-model="apiToken"
            type="password"
            class="input"
            placeholder="Enter your API token"
          />
        </label>
        <button 
          class="btn btn-primary" 
          @click="connect"
          :disabled="!apiUrl || !apiToken"
        >
          Connect
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiUrl = ref('')
const apiToken = ref('')

const connect = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pretix_api_url', apiUrl.value)
    localStorage.setItem('pretix_api_token', apiToken.value)
    navigateTo('/events')
  }
}

const loadConfig = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('pretix_api_url')
    const savedToken = localStorage.getItem('pretix_api_token')
    
    if (savedUrl && savedToken) {
      apiUrl.value = savedUrl
      apiToken.value = savedToken
      navigateTo('/events')
    }
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.header {
  margin-bottom: 32px;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 24px;
  color: #1f2937;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
}

.config-section label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 500;
}
</style>

