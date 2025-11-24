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

const pretix = usePretix()
const apiUrl = ref('')
const apiToken = ref('')

const connect = () => {
  pretix.setConfig(apiUrl.value, apiToken.value)
  navigateTo('/events')
}

onMounted(() => {
  if (pretix.apiUrl.value && pretix.apiToken.value) {
    navigateTo('/events')
  } else {
    // Initialize inputs if global state has values (e.g. from localStorage but not both set?)
    apiUrl.value = pretix.apiUrl.value
    apiToken.value = pretix.apiToken.value
  }
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

