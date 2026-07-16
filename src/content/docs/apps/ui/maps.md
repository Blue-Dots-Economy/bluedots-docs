---
title: Maps
description: How map rendering works and which packages/providers are required.
head: []
---

`MapView` renders schema-backed items as map markers. It does not require map-specific domain code, but it does use field-name heuristics to find coordinates or geocodable address data.

## Packages

| Package | Purpose |
|---------|---------|
| `leaflet` | Map engine |
| `react-leaflet` | React bindings for Leaflet |
| `@types/leaflet` | TypeScript types |
| `@vis.gl/react-google-maps` | Google Maps React bindings |
| `lucide-react` | Optional marker/control icons |

## Provider Registry

The provider system lives in `engine/map/map-registry.ts`.

Providers register themselves:

```ts
registerMapProvider('leaflet', LeafletMapProvider);
```

The active provider is selected by:

```bash
VITE_MAP_PROVIDER="leaflet"
```

Use Google Maps by setting:

```bash
VITE_MAP_PROVIDER="google-maps"
VITE_GOOGLE_MAPS_API_KEY="your-browser-restricted-key"
```

`components/map/providers/index.ts` imports providers so registration runs at startup.

## Marker Generation

`MapView` receives:

- a JSON Schema
- item ids
- item state data
- optional click handler

It filters item data through the public schema before putting data on markers.

## Location Resolution

Resolution order:

1. exact coordinates: `item_latitude`, `item_longitude`, `lat`, `latitude`, `lng`, `lon`, `longitude`
2. postal fields: `pincode`, `postal_code`, `zip`, `zipcode`
3. address fields: `address`, `street_address`, `street`, `full_address`, `house_number`, `building`
4. locality fields: `city`, `town`, `district`, `locality`, `village`, `place`
5. region/country fields: `state`, `province`, `region`, `county`, `country`, `nation`

Exact coordinates produce exact markers. Postal and address fields produce geocoded markers with precision metadata.

## Geocoding

`components/map/geocoding.ts` provides:

- `geocodePincode()`
- `geocodeAddress()`
- `geocodeAddressWithGoogle()`

`VITE_GEOCODING_API_URL` overrides the pincode geocoding endpoint. The default is `api.postalpincode.in`.

Profile create/update uses `VITE_GOOGLE_MAPS_API_KEY` for client-side location/address geocoding when configured, then falls back to the existing non-Google geocoding path. Restrict the Google key by HTTP referrer in Google Cloud because it is exposed to the browser.

## Custom Provider

To add a map provider:

1. Create a provider file under `components/map/providers/`.
2. Implement the map provider props from `engine/types.ts`.
3. Call `registerMapProvider('your-key', YourProvider)`.
4. Import the provider from `components/map/providers/index.ts`.
5. Set `VITE_MAP_PROVIDER=your-key`.

Leaflet remains the default provider. Google Maps is registered at startup and becomes active when `VITE_MAP_PROVIDER=google-maps`.
