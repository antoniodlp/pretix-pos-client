<template>
  <div class="container">
    <div class="header">
      <h1>Select Event</h1>
      <button class="btn btn-secondary" @click="logout">
        Disconnect
      </button>
    </div>

    <EventSelector
      v-if="pretix.apiUrl.value && pretix.apiToken.value"
      :api-url="pretix.apiUrl.value"
      :api-token="pretix.apiToken.value"
      @event-selected="handleEventSelected"
    />
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Box Office'
})

const pretix = usePretix()

const logout = () => {
  pretix.setConfig('', '')
  navigateTo('/')
}

const handleEventSelected = (event: any) => {
  navigateTo(`/pos/${event.organizer}/${event.slug}`)
}

onMounted(() => {
  if (!pretix.apiUrl.value || !pretix.apiToken.value) {
    navigateTo('/')
  }
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
