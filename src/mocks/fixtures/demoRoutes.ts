/** A single point along a demo route for the Delivery Route Simulator admin page. */
export interface DemoRouteWaypoint {
  lat: number
  lng: number
}

export interface DemoRoute {
  id: string
  name: string
  description: string
  waypoints: DemoRouteWaypoint[]
}

/**
 * Canned routes for DeliverySimulatorPage.tsx to play a rider marker across — not real fixture
 * entities (no id/service backs these), just static demo data. Coordinates stay in the same
 * Bangalore-ish range the rest of this app's mock data already uses (see locations.ts's
 * popularGeoPlaces and users.ts's deliveryGuyDetails lastLat/lastLng), with a few intermediate
 * waypoints per route so the path looks like a plausible drive rather than one straight hop.
 */
export const demoRoutes: DemoRoute[] = [
  {
    id: 'koramangala-hsr-short-hop',
    name: 'Koramangala → HSR Layout (short hop)',
    description: 'A quick, mostly-straight run from a Koramangala restaurant to a customer in HSR Layout.',
    waypoints: [
      { lat: 12.9346, lng: 77.6104 }, // Forum Mall, Koramangala (restaurant)
      { lat: 12.931, lng: 77.618 },
      { lat: 12.926, lng: 77.625 },
      { lat: 12.92, lng: 77.632 },
      { lat: 12.9151, lng: 77.6386 }, // Agara Lake, HSR Layout (customer)
    ],
  },
  {
    id: 'indiranagar-electronic-city-cross-town',
    name: 'Indiranagar → Electronic City (cross-town)',
    description: 'A longer cross-town delivery cutting south through the city, good for testing a sustained live-tracking session.',
    waypoints: [
      { lat: 12.9719, lng: 77.6412 }, // 100 Feet Road, Indiranagar (restaurant)
      { lat: 12.965, lng: 77.639 },
      { lat: 12.955, lng: 77.635 },
      { lat: 12.94, lng: 77.63 },
      { lat: 12.925, lng: 77.628 },
      { lat: 12.905, lng: 77.635 },
      { lat: 12.87, lng: 77.655 },
      { lat: 12.8399, lng: 77.677 }, // Electronic City (customer)
    ],
  },
  {
    id: 'whitefield-multi-stop-loop',
    name: 'Whitefield multi-stop loop',
    description: 'A rider circling the ITPL area for several stops before returning near the start — good for testing loop/return behavior instead of a single point A→B hop.',
    waypoints: [
      { lat: 12.9857, lng: 77.7371 }, // ITPL Main Gate, Whitefield (start)
      { lat: 12.99, lng: 77.73 },
      { lat: 12.995, lng: 77.725 },
      { lat: 12.992, lng: 77.718 },
      { lat: 12.985, lng: 77.715 },
      { lat: 12.98, lng: 77.722 },
      { lat: 12.982, lng: 77.73 },
      { lat: 12.9857, lng: 77.7371 }, // back to start
    ],
  },
]
