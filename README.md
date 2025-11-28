# Pretix POS Client

A modern Point of Sale (POS) interface for [Pretix](https://pretix.eu/), built with Nuxt.js and Vue 3. This application provides a streamlined interface for selling tickets and managing orders at physical event locations.

## Features

- **Event Selection**: Browse and select from live events across multiple organizers
- **Item Management**: Display active items filtered by sales channel and availability dates
- **Shopping Cart**: Add items with variations, adjust quantities, and manage cart contents
- **Order Processing**: Create orders with purchaser details and mark them as paid
- **Ticket Printing**: Download and print official Pretix ticket PDFs with QR codes
- **Order History**: View past orders and reprint tickets as needed
- **Persistent Configuration**: API credentials are saved locally for convenience

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager
- A Pretix instance with API access
- Pretix API token with appropriate permissions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pretix-pos-client
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### Pretix API Setup

1. Log in to your Pretix instance
2. Navigate to **Settings** → **API** → **API Tokens**
3. Create a new API token with the following permissions:
   - View events
   - View items
   - View quotas
   - Create orders
   - View orders
   - Modify orders

### Creating the api.pos Sales Channel

Before configuring items, you need to create the `api.pos` sales channel in Pretix:

1. Log in to your Pretix instance
2. Navigate to **Organizer Settings** → **Sales channels**
3. Click **Create a new sales channel**
4. Fill in the following:
   - **Identifier**: `api.pos` (must be exactly this)
   - **Label**: `POS` or `Point of Sale` (can be anything descriptive)
   - **Type**: Select `API`
5. Click **Save**

### Sales Channel Configuration

For items to appear in the POS, ensure they are configured correctly in Pretix:

1. Go to **Products** → **Items** → Select an item
2. Navigate to the **Availability** tab
3. Either:
   - Check "Available in all sales channels" (item will appear everywhere), OR
   - Uncheck "Available in all sales channels" and select `api.pos` in "Limit to sales channels"

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Static Generation

Generate a static version of the application:
```bash
npm run generate
```

## Usage

### First-Time Setup

1. Open the application in your browser
2. Enter your Pretix API URL (e.g., `https://tickets.test.com`)
3. Enter your API token
4. Click "Connect"

> **Note**: Your API credentials are stored in your browser's local storage and will persist across sessions. This means you won't need to re-enter them unless you clear your browser data or use a different browser/device.

### Selling Tickets

1. Select an event from the events list
2. Browse available items and add them to the cart
3. For items with variations, select the appropriate variation before adding
4. Adjust quantities as needed using the +/- buttons
5. Enter purchaser details (email, name, phone)
6. Click "Complete Sale" to process the order
7. Print tickets using the "Print Tickets" button

> **Note**: All orders created through this POS are automatically assigned to the `api.pos` sales channel in Pretix.

### Viewing Past Orders

1. Click the "Past Orders" button in the POS header
2. Browse orders with pagination
3. Click "Reprint" on any order to download and print tickets again

## Item Filtering

The POS automatically filters items based on:

- **Active Status**: Only active items are shown
- **Sales Channel**: Items must be available on the `api.pos` channel or all channels
- **Availability Dates**: Items outside their `available_from` and `available_until` window are hidden

## Technology Stack

- **Framework**: Nuxt.js 3.8
- **UI Library**: Vue 3 with Composition API
- **HTTP Client**: Axios
- **Utilities**: VueUse
- **Styling**: Custom CSS

## Project Structure

```
pretix-pos-client/
├── assets/
│   └── css/
│       └── main.css          # Global styles
├── components/
│   └── EventSelector.vue     # Event selection component
├── composables/
│   └── usePretix.ts         # Pretix API integration
├── pages/
│   ├── index.vue            # API configuration page
│   ├── events.vue           # Event selection page
│   └── pos/
│       └── [organizer]/
│           └── [event].vue  # Main POS interface
├── public/
│   └── favicon.ico          # Application favicon
├── nuxt.config.ts           # Nuxt configuration
└── package.json             # Project dependencies
```

## Troubleshooting

### Items Not Appearing

If items are not showing in the POS:
1. Verify the item is marked as "Active" in Pretix
2. Check the sales channel configuration (see Configuration section)
3. Ensure the current date is within the item's availability window

### API Connection Issues

If you cannot connect to the API:
1. Verify the API URL is correct (include `https://` and no trailing slash)
2. Check that your API token has the required permissions
3. Ensure your Pretix instance is accessible from your network
4. Make sure the CORS settings in your Pretix instance allow requests from your POS client

### Ticket Printing Issues

If tickets won't print:
1. Allow popups in your browser for this application
2. Wait a few seconds after order creation for PDF generation
3. Check that the order was successfully marked as paid

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

This license is compatible with [Pretix](https://pretix.eu/), which is also licensed under Apache 2.0.

## Support

For issues related to:
- **This POS client**: [https://github.com/antoniodlp/pretix-pos-client/issues](https://github.com/antoniodlp/pretix-pos-client/issues)
- **Pretix itself**: Visit [pretix.eu](https://pretix.eu/) or their documentation
