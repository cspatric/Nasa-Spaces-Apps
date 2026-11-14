// Must be imported before any CesiumJS module is used.
;(window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL =
  `${import.meta.env.BASE_URL}cesium/`
