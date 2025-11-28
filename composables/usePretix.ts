import { ref } from 'vue'
import axios from 'axios'

export interface PretixEvent {
  name: { en: string }
  slug: string
  organizer: string
  live: boolean
  date_from: string
  date_to: string
}

export interface PretixItem {
  id: number
  name: { en: string }
  description: { en: string }
  default_price: string
  tax_rate: string
  admission: boolean
  active: boolean
  available_from?: string | null
  available_until?: string | null
  variations?: PretixVariation[]
  all_sales_channels: boolean
  limit_sales_channels: string[]
}

export interface PretixVariation {
  id: number
  value: { en: string }
  default_price: string
  active: boolean
  available_from?: string | null
  available_until?: string | null
}

export interface PretixQuota {
  id: number
  name: string
  size: number | null
  available_number: number | null
  available?: boolean
  items: number[]
  variations: number[]
}

export const usePretix = () => {
  const apiUrl = useState<string>('pretix_api_url', () => '')
  const apiToken = useState<string>('pretix_api_token', () => '')

  // Initialize from localStorage on client side
  if (typeof window !== 'undefined' && !apiUrl.value) {
    const savedUrl = localStorage.getItem('pretix_api_url')
    const savedToken = localStorage.getItem('pretix_api_token')
    if (savedUrl) apiUrl.value = savedUrl
    if (savedToken) apiToken.value = savedToken
  }

  const setConfig = (url: string, token: string) => {
    apiUrl.value = url
    apiToken.value = token

    if (typeof window !== 'undefined') {
      localStorage.setItem('pretix_api_url', url)
      localStorage.setItem('pretix_api_token', token)
    }
  }

  const getHeaders = () => ({
    Authorization: `Token ${apiToken.value}`,
    'Content-Type': 'application/json'
  })

  const searchEvents = async (query: string): Promise<PretixEvent[]> => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.get(`${apiUrl.value}/api/v1/organizers/`, {
        headers: getHeaders()
      })

      const organizers = response.data.results
      const allEvents: PretixEvent[] = []

      for (const organizer of organizers) {
        try {
          const eventsResponse = await axios.get(
            `${apiUrl.value}/api/v1/organizers/${organizer.slug}/events/`,
            {
              headers: getHeaders(),
              params: {
                search: query,
                live: true
              }
            }
          )
          const events = eventsResponse.data.results.map((event: any) => ({
            ...event,
            organizer: organizer.slug
          }))
          allEvents.push(...events)
        } catch (error) {
          console.error(`Error fetching events for ${organizer.slug}:`, error)
        }
      }

      return allEvents.filter((event) => {
        const name = event.name?.en || (typeof event.name === 'object' ? Object.values(event.name)[0] : event.name) || ''
        return String(name).toLowerCase().includes(query.toLowerCase())
      })
    } catch (error: any) {
      throw new Error(`Failed to search events: ${error.message}`)
    }
  }

  const getEvent = async (
    organizer: string,
    eventSlug: string
  ): Promise<PretixEvent> => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.get(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/`,
        {
          headers: getHeaders()
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to fetch event: ${error.message}`)
    }
  }

  const getEventItems = async (
    organizer: string,
    eventSlug: string
  ): Promise<PretixItem[]> => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.get(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/items/`,
        {
          headers: getHeaders()
        }
      )
      return response.data.results.filter((item: PretixItem) => {
        const now = new Date()
        const availableFrom = item.available_from ? new Date(item.available_from) : null
        const availableUntil = item.available_until ? new Date(item.available_until) : null

        const isAvailable =
          (!availableFrom || now >= availableFrom) &&
          (!availableUntil || now <= availableUntil)

        const isChannelAvailable =
          item.all_sales_channels ||
          (item.limit_sales_channels && item.limit_sales_channels.includes('api.pos'))

        return item.active && isChannelAvailable && isAvailable
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch items: ${error.message}`)
    }
  }

  const getQuotas = async (
    organizer: string,
    eventSlug: string
  ): Promise<PretixQuota[]> => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.get(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/quotas/`,
        {
          headers: getHeaders(),
          params: {
            with_availability: true
          }
        }
      )
      return response.data.results
    } catch (error: any) {
      throw new Error(`Failed to fetch quotas: ${error.message}`)
    }
  }

  const createOrder = async (
    organizer: string,
    eventSlug: string,
    positions: Array<{
      item: number
      variation?: number
      price: string
      attendee_name?: string
      attendee_email?: string
    }>,
    email: string,
    name: string,
    phone: string
  ) => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.post(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/orders/`,
        {
          positions,
          email,
          invoice_address: {
            name,
            street: 'POS Sale',
            zipcode: '00000',
            city: 'POS',
            country: 'US',
            internal_reference: phone
          },
          payment_provider: 'manual',
          fees: [],
          sales_channel: 'api.pos'
        },
        {
          headers: getHeaders()
        }
      )
      return response.data
    } catch (error: any) {
      console.error('Order creation failed:', error.response?.data)
      const errorMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message
      throw new Error(`Failed to create order: ${errorMsg}`)
    }
  }

  const markOrderAsPaid = async (
    organizer: string,
    eventSlug: string,
    orderCode: string
  ) => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.post(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/orders/${orderCode}/mark_paid/`,
        {},
        {
          headers: getHeaders()
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to mark order as paid: ${error.message}`)
    }
  }

  const getOrder = async (
    organizer: string,
    eventSlug: string,
    orderCode: string
  ) => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.get(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/orders/${orderCode}/`,
        {
          headers: getHeaders()
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to fetch order: ${error.message}`)
    }
  }

  const getOrderPdf = async (
    organizer: string,
    eventSlug: string,
    orderCode: string
  ): Promise<Blob> => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    const fetchPdf = async (retries = 3, delay = 1000): Promise<Blob> => {
      try {
        const response = await axios.get(
          `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/orders/${orderCode}/download/pdf/`,
          {
            headers: getHeaders(),
            responseType: 'blob'
          }
        )
        return response.data
      } catch (error: any) {
        if (error.response && error.response.status === 409 && retries > 0) {
          // PDF not ready, wait and retry
          await new Promise((resolve) => setTimeout(resolve, delay))
          return fetchPdf(retries - 1, delay * 2)
        }
        throw new Error(`Failed to download PDF: ${error.message}`)
      }
    }

    return fetchPdf()
  }

  const getOrders = async (
    organizer: string,
    eventSlug: string,
    page: number = 1
  ) => {
    if (!apiUrl.value || !apiToken.value) {
      throw new Error('API URL and token must be configured')
    }

    try {
      const response = await axios.get(
        `${apiUrl.value}/api/v1/organizers/${organizer}/events/${eventSlug}/orders/`,
        {
          headers: getHeaders(),
          params: {
            page,
            ordering: '-datetime',
            sales_channel: 'api.pos'
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }
  }

  return {
    setConfig,
    apiUrl,
    apiToken,
    searchEvents,
    getEvent,
    getEventItems,
    getQuotas,
    createOrder,
    markOrderAsPaid,
    getOrder,
    getOrderPdf,
    getOrders
  }
}
