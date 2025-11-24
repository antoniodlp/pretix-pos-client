<template>
  <div class="pos-container">
    <div class="pos-header">
      <div>
        <h1>{{ eventName || 'POS Interface' }}</h1>
        <p v-if="organizer && event">{{ organizer }} / {{ event }}</p>
      </div>
      <button class="btn btn-secondary" @click="showOrdersModal = true">Past Orders</button>
      <button class="btn btn-secondary" @click="goHome">Change Event</button>
    </div>

    <div v-if="showOrdersModal" class="modal-overlay" @click.self="showOrdersModal = false">
      <div class="modal-content card">
        <div class="modal-header">
          <h2>Past Orders</h2>
          <button class="btn btn-secondary" @click="showOrdersModal = false">Close</button>
        </div>
        
        <div v-if="loadingOrders" class="loading-orders">
          Loading orders...
        </div>
        
        <div v-else class="orders-list">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in pastOrders" :key="order.code">
                <td>{{ order.code }}</td>
                <td>{{ new Date(order.datetime).toLocaleString() }}</td>
                <td>{{ order.invoice_address?.name || 'N/A' }}</td>
                <td>{{ order.email || 'N/A' }}</td>
                <td>{{ order.invoice_address?.internal_reference || 'N/A' }}</td>
                <td>{{ formatPrice(order.total) }}</td>
                <td>{{ order.status }}</td>
                <td>
                  <button class="btn btn-primary btn-sm" @click="reprintOrder(order)">
                    Reprint
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="pagination">
            <button 
              class="btn btn-secondary" 
              :disabled="currentPage === 1"
              @click="loadOrders(currentPage - 1)"
            >
              Previous
            </button>
            <span>Page {{ currentPage }}</span>
            <button 
              class="btn btn-secondary" 
              :disabled="!hasNextPage"
              @click="loadOrders(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Loading tickets...</p>
    </div>

    <div v-else-if="error" class="error-card card">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadTickets">Retry</button>
    </div>

    <div v-else class="pos-layout">
      <div class="tickets-section">
        <h2>Available Tickets</h2>
        <div v-if="tickets.length === 0" class="card">
          <p>No tickets available for this event.</p>
        </div>
        <div v-else class="tickets-grid grid grid-3">
          <div
            v-for="ticket in tickets"
            :key="ticket.id"
            class="ticket-card card"
            :class="{ 'out-of-stock': !isAvailable(ticket) }"
          >
            <h3>{{ getLocaledString(ticket.name) }}</h3>
            <p class="ticket-description">{{ getLocaledString(ticket.description) }}</p>
            <div class="ticket-price">
              {{ formatPrice(ticket.default_price) }}
            </div>
            <div v-if="ticket.variations && ticket.variations.length > 0" class="variations">
              <select
                v-model="selectedVariations[ticket.id]"
                class="input"
                @change="updateVariationPrice(ticket)"
              >
                <option :value="null">Select variation</option>
                <option
                  v-for="variation in ticket.variations"
                  :key="variation.id"
                  :value="variation.id"
                  :disabled="!isVariationAvailable(ticket, variation)"
                >
                  {{ getLocaledString(variation.value) }} - {{ formatPrice(variation.default_price) }}
                  {{ !isVariationAvailable(ticket, variation) ? '(Unavailable)' : '' }}
                </option>
              </select>
            </div>
            <div class="ticket-actions">
              <button
                class="btn btn-primary"
                :disabled="!isAvailable(ticket)"
                @click="addToCart(ticket)"
              >
                Add to Cart
              </button>
            </div>
            <div v-if="!isAvailable(ticket)" class="stock-status">
              Out of Stock
            </div>
            <!-- Debug info -->
            <div style="font-size: 10px; color: #999; margin-top: 4px;">
              {{ getQuotaDebug(ticket) }}
            </div>
          </div>
        </div>
      </div>

      <div class="cart-section">
        <div class="cart-card card">
          <h2>Cart</h2>
          <div v-if="cart.length === 0" class="empty-cart">
            <p>Cart is empty</p>
          </div>
          <div v-else>
            <div class="cart-items">
              <div
                v-for="(item, index) in cart"
                :key="index"
                class="cart-item"
              >
                <div class="cart-item-info">
                  <div class="cart-item-name">{{ item.name }}</div>
                  <div v-if="item.variation" class="cart-item-variation">
                    {{ item.variationName }}
                  </div>
                  <div class="cart-item-price">{{ formatPrice(item.price) }}</div>
                </div>
                <div class="cart-item-controls">
                  <button
                    class="btn btn-secondary"
                    @click="updateQuantity(index, item.quantity - 1)"
                  >
                    -
                  </button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button
                    class="btn btn-secondary"
                    @click="updateQuantity(index, item.quantity + 1)"
                  >
                    +
                  </button>
                  <button
                    class="btn btn-danger"
                    @click="removeFromCart(index)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <div class="cart-total">
              <div class="total-line">
                <span>Total:</span>
                <span class="total-amount">{{ formatPrice(totalAmount) }}</span>
              </div>
            </div>
            <div class="purchaser-details">
              <h3>Purchaser Details</h3>
              <div class="form-group">
                <label>Email</label>
                <input v-model="purchaserEmail" type="email" class="input" placeholder="customer@example.com">
              </div>
              <div class="form-group">
                <label>Name</label>
                <input v-model="purchaserName" type="text" class="input" placeholder="John Doe">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input v-model="purchaserPhone" type="tel" class="input" placeholder="+1234567890">
              </div>
            </div>

            <div class="cart-actions">
              <button
                class="btn btn-success"
                :disabled="cart.length === 0 || processing || !isValidPurchaser"
                @click="processSale"
              >
                {{ processing ? 'Processing...' : 'Complete Sale' }}
              </button>
              <button
                class="btn btn-secondary"
                :disabled="cart.length === 0"
                @click="clearCart"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        <div v-if="lastOrder" class="order-card card">
          <h3>Last Order</h3>
          <p><strong>Order Code:</strong> {{ lastOrder.code }}</p>
          <p><strong>Total:</strong> {{ formatPrice(lastOrder.total) }}</p>
          <p><strong>Status:</strong> {{ lastOrder.status }}</p>
          <div class="order-actions">
            <button class="btn btn-primary" @click="printTickets">
              Print Tickets
            </button>
            <button class="btn btn-secondary" @click="viewOrderDetails">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { PretixItem, PretixQuota, PretixVariation } from '~/composables/usePretix'

const route = useRoute()
const router = useRouter()

const organizer = route.params.organizer as string
const event = route.params.event as string

const pretix = usePretix()
const tickets = ref<PretixItem[]>([])
const quotas = ref<PretixQuota[]>([])
const loading = ref(true)
const error = ref('')
const eventName = ref('')
const selectedVariations = ref<Record<number, number | null>>({})
const processing = ref(false)
const lastOrder = ref<any>(null)
const showOrdersModal = ref(false)
const loadingOrders = ref(false)
const pastOrders = ref<any[]>([])
const currentPage = ref(1)
const hasNextPage = ref(false)

const loadOrders = async (page = 1) => {
  loadingOrders.value = true
  try {
    const data = await pretix.getOrders(organizer, event, page)
    pastOrders.value = data.results
    hasNextPage.value = !!data.next
    currentPage.value = page
  } catch (err: any) {
    alert(`Failed to load orders: ${err.message}`)
  } finally {
    loadingOrders.value = false
  }
}

watch(showOrdersModal, (newValue) => {
  if (newValue) {
    loadOrders()
  }
})

const reprintOrder = async (order: any) => {
  try {
    const pdfBlob = await pretix.getOrderPdf(
      organizer,
      event,
      order.code
    )
    const url = window.URL.createObjectURL(pdfBlob)
    const printWindow = window.open(url, '_blank')
    
    if (!printWindow) {
      alert('Please allow popups to print tickets')
      return
    }
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 60000)
  } catch (err: any) {
    alert(`Failed to print tickets: ${err.message}`)
  }
}

interface CartItem {
  itemId: number
  variationId?: number
  name: string
  variationName?: string
  price: string
  quantity: number
}

const cart = ref<CartItem[]>([])

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity
  }, 0).toFixed(2)
})

const purchaserEmail = ref('')
const purchaserName = ref('')
const purchaserPhone = ref('')

const isValidPurchaser = computed(() => {
  return purchaserEmail.value && purchaserName.value && purchaserPhone.value
})

const loadConfig = () => {
  if (typeof window !== 'undefined') {
    const apiUrl = localStorage.getItem('pretix_api_url') || ''
    const apiToken = localStorage.getItem('pretix_api_token') || ''
    pretix.setConfig(apiUrl, apiToken)
  }
}

const loadTickets = async () => {
  loading.value = true
  error.value = ''

  try {
    loadConfig()
    const [eventDetails, items, quotasData] = await Promise.all([
      pretix.getEvent(organizer, event),
      pretix.getEventItems(organizer, event),
      pretix.getQuotas(organizer, event)
    ])

    tickets.value = items
    quotas.value = quotasData

    console.log('Event:', eventDetails)
    console.log('Tickets:', items)
    console.log('Quotas:', quotasData)

    if (eventDetails) {
      eventName.value = getLocaledString(eventDetails.name)
    } else if (items.length > 0) {
      // Fallback if event details fail but items load (unlikely)
      eventName.value = event
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load tickets'
  } finally {
    loading.value = false
  }
}

const getLocaledString = (obj: any): string => {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj.en || Object.values(obj)[0] || ''
}

const isAvailable = (ticket: PretixItem): boolean => {
  if (!isDateAvailable(ticket.available_from, ticket.available_until)) return false

  if (ticket.variations && ticket.variations.length > 0) {
    return ticket.variations.some(v => isVariationAvailable(ticket, v))
  }
  return isItemAvailable(ticket.id)
}

const isItemAvailable = (itemId: number): boolean => {
  const relevantQuotas = quotas.value.filter((q) => q.items.includes(itemId))
  return checkQuotas(relevantQuotas)
}

const isVariationAvailable = (ticket: PretixItem, variation: PretixVariation): boolean => {
  if (!isDateAvailable(variation.available_from, variation.available_until)) return false

  const variationQuotas = quotas.value.filter(q => q.variations.includes(variation.id))
  const itemQuotas = quotas.value.filter(q => q.items.includes(ticket.id))
  
  if (variationQuotas.length > 0) {
    if (!checkQuotas(variationQuotas)) return false
  }
  
  if (itemQuotas.length > 0) {
     if (!checkQuotas(itemQuotas)) return false
  }
  
  return true
}

const isDateAvailable = (from?: string | null, until?: string | null): boolean => {
  const now = new Date()
  if (from && new Date(from) > now) return false
  if (until && new Date(until) < now) return false
  return true
}

const checkQuotas = (qs: PretixQuota[]): boolean => {
  if (qs.length === 0) return true
  return qs.every((q) => {
    if (q.available === true) return true
    if (q.available === false) return false
    if (q.size === null) return true
    if (q.available_number === null) return true
    return q.available_number > 0
  })
}

const getQuotaDebug = (ticket: PretixItem) => {
  const itemQuotas = quotas.value.filter((q) => q.items.includes(ticket.id))
  let debug = `Item Qs: ${itemQuotas.map(q => `${q.id}(${q.available_number === undefined ? 'undef' : q.available_number})`).join(',')}`
  
  if (ticket.available_from) debug += ` | From: ${new Date(ticket.available_from).toLocaleString()}`
  if (ticket.available_until) debug += ` | Until: ${new Date(ticket.available_until).toLocaleString()}`
  
  if (ticket.variations && ticket.variations.length > 0) {
    debug += ` | Vars: ${ticket.variations.length}`
  }
  return debug
}

const formatPrice = (price: string) => {
  return `$${parseFloat(price).toFixed(2)}`
}

const addToCart = (ticket: PretixItem) => {
  const variationId = selectedVariations.value[ticket.id]
  let variation: PretixVariation | undefined

  if (variationId && ticket.variations) {
    variation = ticket.variations.find((v) => v.id === variationId)
  }

  const price = variation?.default_price || ticket.default_price
  const name = getLocaledString(ticket.name)
  const variationName = variation ? getLocaledString(variation.value) : undefined

  const existingIndex = cart.value.findIndex(
    (item) => item.itemId === ticket.id && item.variationId === variationId
  )

  if (existingIndex >= 0) {
    cart.value[existingIndex].quantity += 1
  } else {
    cart.value.push({
      itemId: ticket.id,
      variationId: variationId || undefined,
      name,
      variationName,
      price,
      quantity: 1
    })
  }
}

const updateQuantity = (index: number, newQuantity: number) => {
  if (newQuantity <= 0) {
    removeFromCart(index)
  } else {
    cart.value[index].quantity = newQuantity
  }
}

const removeFromCart = (index: number) => {
  cart.value.splice(index, 1)
}

const clearCart = () => {
  cart.value = []
}

const updateVariationPrice = (ticket: PretixItem) => {
  // This is handled in addToCart
}

const processSale = async () => {
  if (cart.value.length === 0) return

  processing.value = true
  error.value = ''

  try {
    loadConfig()

    const positions = cart.value.map((item) => ({
      item: item.itemId,
      variation: item.variationId,
      price: item.price,
      attendee_name: purchaserName.value,
      attendee_email: purchaserEmail.value
    }))

    const order = await pretix.createOrder(
      organizer, 
      event, 
      positions,
      purchaserEmail.value,
      purchaserName.value,
      purchaserPhone.value
    )
    const confirmedOrder = await pretix.markOrderAsPaid(
      organizer,
      event,
      order.code
    )

    lastOrder.value = confirmedOrder
    clearCart()

    // Show success message
    alert(`Order ${confirmedOrder.code} created and paid successfully!`)
  } catch (err: any) {
    error.value = err.message || 'Failed to process sale'
    alert(`Error: ${error.value}`)
  } finally {
    processing.value = false
  }
}

const printTickets = async () => {
  if (!lastOrder.value) return

  try {
    const pdfBlob = await pretix.getOrderPdf(
      organizer,
      event,
      lastOrder.value.code
    )
    const url = window.URL.createObjectURL(pdfBlob)
    const printWindow = window.open(url, '_blank')
    
    if (!printWindow) {
      alert('Please allow popups to print tickets')
      return
    }
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 60000)
  } catch (err: any) {
    alert(`Failed to print tickets: ${err.message}`)
  }
}

const viewOrderDetails = () => {
  if (!lastOrder.value) return
  alert(`Order Details:\n\nCode: ${lastOrder.value.code}\nTotal: ${formatPrice(lastOrder.value.total)}\nStatus: ${lastOrder.value.status}`)
}

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  loadTickets()
})
</script>

<style scoped>
.pos-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.pos-header {
  background: white;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.pos-header h1 {
  font-size: 28px;
  margin-bottom: 4px;
  color: #1f2937;
}

.pos-header p {
  color: #6b7280;
  font-size: 14px;
}

.loading,
.error-card {
  text-align: center;
  padding: 48px;
}

.pos-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 0 24px 24px;
}

@media (max-width: 1024px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }
}

.tickets-section h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #1f2937;
}

.ticket-card {
  position: relative;
}

.ticket-card.out-of-stock {
  opacity: 0.6;
}

.ticket-card h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #1f2937;
}

.ticket-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  min-height: 40px;
}

.ticket-price {
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 12px;
}

.variations {
  margin-bottom: 12px;
}

.ticket-actions {
  margin-top: 12px;
}

.stock-status {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.cart-card {
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.cart-card h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #1f2937;
}

.empty-cart {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.cart-items {
  margin-bottom: 20px;
}

.cart-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.cart-item-info {
  margin-bottom: 12px;
}

.cart-item-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.cart-item-variation {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.cart-item-price {
  font-weight: 600;
  color: #10b981;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-item-controls .btn {
  padding: 6px 12px;
  font-size: 14px;
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
}

.cart-total {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.purchaser-details {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.purchaser-details h3 {
  margin-bottom: 12px;
  font-size: 18px;
  color: #1f2937;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #4b5563;
}

.form-group .input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.total-line {
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  font-weight: bold;
}

.total-amount {
  color: #10b981;
}

.cart-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-actions .btn {
  width: 100%;
}

.order-card {
  margin-top: 24px;
}

.order-card h3 {
  margin-bottom: 16px;
  font-size: 20px;
  color: #1f2937;
}

.order-card p {
  margin-bottom: 8px;
  color: #4b5563;
}

.order-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.order-actions .btn {
  flex: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table th {
  font-weight: 600;
  color: #4b5563;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>

