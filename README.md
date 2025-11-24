# Pretix POS Client

A Nuxt 3 Vue.js Point of Sale (POS) client for Pretix event management system. This application allows you to connect to a Pretix instance, search for events, view available tickets, and process sales with ticket printing capabilities.

## Features

- 🔌 Connect to Pretix API with configurable URL and token
- 🔍 Search and select events by name
- 🎫 View available tickets with pricing and variations
- 🛒 Shopping cart functionality with quantity management
- 💳 Process sales and create orders in Pretix
- 🖨️ Print tickets after successful sale
- 📱 Responsive design for desktop and tablet use

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Configuration

1. On the home page, enter your Pretix API URL (e.g., `https://pretix.example.com`)
2. Enter your Pretix API token
3. The configuration is saved in your browser's localStorage

## Usage

1. **Configure API**: Enter your Pretix API URL and token on the home page
2. **Search Events**: Type an event name and click "Search" to find events
3. **Select Event**: Click on an event from the search results
4. **View Tickets**: Browse available tickets for the selected event
5. **Add to Cart**: Click "Add to Cart" on tickets you want to sell
6. **Manage Cart**: Adjust quantities or remove items from the cart
7. **Complete Sale**: Click "Complete Sale" to process the order
8. **Print Tickets**: After a successful sale, click "Print Tickets" to print the order

## API Requirements

This application requires a Pretix instance with API access. You'll need:
- A Pretix organizer account
- An API token with appropriate permissions (read events, create orders, confirm orders)

## Project Structure

```
├── assets/
│   └── css/
│       └── main.css          # Global styles
├── components/
│   └── EventSelector.vue     # Event search and selection component
├── composables/
│   └── usePretix.ts          # Pretix API integration
├── pages/
│   ├── index.vue             # Home page with API configuration
│   └── pos/
│       └── [organizer]/
│           └── [event].vue   # POS interface page
└── nuxt.config.ts            # Nuxt configuration
```

## Technologies

- **Nuxt 3** - Vue.js framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Axios** - HTTP client for API requests
- **VueUse** - Vue composition utilities

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Notes

- The application stores API credentials in localStorage
- Ticket availability is checked against Pretix quotas
- Orders are automatically confirmed after creation
- Printing opens a new window with formatted ticket content

