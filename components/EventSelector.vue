<template>
  <div class="event-selector">
    <div class="card">
      <h2>Select Event</h2>
      
      <div v-if="loading" class="loading-message">
        Loading events...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="events.length === 0" class="empty-message">
        No upcoming events found.
      </div>

      <div v-else class="events-list">
        <div
          v-for="event in events"
          :key="`${event.organizer}-${event.slug}`"
          class="event-card"
          @click="selectEvent(event)"
        >
          <h3>{{ getLocaledString(event.name) }}</h3>
          <p class="event-meta">
            <span>{{ event.organizer }}</span>
            <span v-if="event.date_from">
              {{ formatDate(event.date_from) }}
              <span v-if="event.date_to"> - {{ formatDate(event.date_to) }}</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PretixEvent } from '~/composables/usePretix'

const props = defineProps<{
  apiUrl: string
  apiToken: string
}>()

const emit = defineEmits<{
  eventSelected: [event: PretixEvent]
}>()

const events = ref<PretixEvent[]>([])
const loading = ref(false)
const error = ref('')

const pretix = usePretix()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getLocaledString = (obj: any): string => {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj.en || Object.values(obj)[0] || ''
}

const loadEvents = async () => {
  loading.value = true
  error.value = ''

  try {
    pretix.setConfig(props.apiUrl, props.apiToken)
    // Fetch all events (empty search query)
    const results = await pretix.searchEvents('')
    
    // Filter for events happening today or in the future
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Start of today

    events.value = results.filter(event => {
      const endDate = event.date_to ? new Date(event.date_to) : (event.date_from ? new Date(event.date_from) : null)
      if (!endDate) return false
      return endDate >= now
    })

    if (events.value.length === 0) {
      // error.value = 'No upcoming events found.' 
      // Handled by template v-else-if
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load events'
    events.value = []
  } finally {
    loading.value = false
  }
}

const selectEvent = (event: PretixEvent) => {
  emit('eventSelected', event)
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.event-selector {
  margin-bottom: 32px;
}

.event-selector h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #1f2937;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 24px;
  color: #6b7280;
}

.error-message {
  padding: 12px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  margin-bottom: 20px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.event-card:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.event-card h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: #1f2937;
}

.event-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}
</style>

