/** Place names for orientation. Rank 1 is visible from far away, rank 3 only when close. */
export interface City {
  name: string
  lon: number
  lat: number
  rank: 1 | 2 | 3
  /** Capital or major city: listed in the 3D tour menu. */
  cap?: true
  /** Camera heading of the oblique 3D view (default 20). */
  bearing?: number
}

/** Zoom level from which each rank is labeled. */
export const CITY_MIN_ZOOM: Record<City['rank'], number> = { 1: 3, 2: 5.2, 3: 7.6 }

export const CITIES: City[] = [
  // 3D tour cities (capitals and the largest metropolises)
  { name: 'São Paulo', lon: -46.63, lat: -23.55, rank: 1, cap: true },
  { name: 'Rio de Janeiro', lon: -43.17, lat: -22.91, rank: 1, cap: true, bearing: 160 },
  { name: 'Brasília', lon: -47.88, lat: -15.79, rank: 1, cap: true },
  { name: 'Manaus', lon: -60.022, lat: -3.119, rank: 1, cap: true },
  { name: 'Belém', lon: -48.502, lat: -1.456, rank: 1, cap: true },
  { name: 'Porto Alegre', lon: -51.23, lat: -30.033, rank: 1, cap: true, bearing: 330 },
  { name: 'Curitiba', lon: -49.27, lat: -25.43, rank: 2, cap: true },
  { name: 'Florianópolis', lon: -48.548, lat: -27.595, rank: 2, cap: true, bearing: 300 },
  { name: 'Santarém', lon: -54.708, lat: -2.443, rank: 2 },
  { name: 'Macapá', lon: -51.07, lat: 0.035, rank: 2, cap: true },
  { name: 'Boa Vista', lon: -60.67, lat: 2.82, rank: 2, cap: true },
  { name: 'Porto Velho', lon: -63.9, lat: -8.76, rank: 2, cap: true },
  { name: 'Rio Branco', lon: -67.81, lat: -9.97, rank: 2, cap: true },
  { name: 'Tefé', lon: -64.711, lat: -3.354, rank: 2 },
  { name: 'Parintins', lon: -56.736, lat: -2.628, rank: 2 },
  { name: 'Itacoatiara', lon: -58.444, lat: -3.139, rank: 2 },
  { name: 'Caxias do Sul', lon: -51.18, lat: -29.168, rank: 2 },
  { name: 'Pelotas', lon: -52.34, lat: -31.77, rank: 2 },
  { name: 'Santa Maria', lon: -53.81, lat: -29.69, rank: 2 },
  { name: 'Manacapuru', lon: -60.621, lat: -3.299, rank: 3 },
  { name: 'Iranduba', lon: -60.186, lat: -3.284, rank: 3 },
  { name: 'Rio Preto da Eva', lon: -59.7, lat: -2.7, rank: 3 },
  { name: 'Presidente Figueiredo', lon: -60.02, lat: -2.03, rank: 3 },
  { name: 'Autazes', lon: -59.13, lat: -3.58, rank: 3 },
  { name: 'Novo Airão', lon: -60.94, lat: -2.62, rank: 3 },
  { name: 'Canoas', lon: -51.18, lat: -29.92, rank: 3 },
  { name: 'Novo Hamburgo', lon: -51.13, lat: -29.69, rank: 3 },
  { name: 'São Leopoldo', lon: -51.15, lat: -29.76, rank: 3 },
  { name: 'Gramado', lon: -50.87, lat: -29.38, rank: 3 },
  { name: 'Lajeado', lon: -51.96, lat: -29.47, rank: 3 },
  { name: 'Belo Horizonte', lon: -43.94, lat: -19.92, rank: 1, cap: true, bearing: 200 },
  { name: 'Salvador', lon: -38.51, lat: -12.97, rank: 1, cap: true, bearing: 330 },
  { name: 'Fortaleza', lon: -38.52, lat: -3.73, rank: 1, cap: true, bearing: 300 },
  { name: 'Recife', lon: -34.88, lat: -8.05, rank: 1, cap: true, bearing: 270 },
  { name: 'Goiânia', lon: -49.25, lat: -16.68, rank: 2, cap: true },
  { name: 'Campo Grande', lon: -54.63, lat: -20.47, rank: 2, cap: true },
  { name: 'Cuiabá', lon: -56.1, lat: -15.6, rank: 2, cap: true },
  { name: 'São Luís', lon: -44.3, lat: -2.53, rank: 2, cap: true, bearing: 320 },
  { name: 'Natal', lon: -35.21, lat: -5.79, rank: 2, cap: true, bearing: 280 },
  { name: 'João Pessoa', lon: -34.86, lat: -7.12, rank: 2, cap: true, bearing: 280 },
  { name: 'Maceió', lon: -35.74, lat: -9.67, rank: 2, cap: true, bearing: 270 },
  { name: 'Aracaju', lon: -37.07, lat: -10.91, rank: 2, cap: true, bearing: 300 },
  { name: 'Teresina', lon: -42.8, lat: -5.09, rank: 2, cap: true },
  { name: 'Vitória', lon: -40.34, lat: -20.31, rank: 2, cap: true, bearing: 250 },
  { name: 'Palmas', lon: -48.33, lat: -10.18, rank: 2, cap: true },
  { name: 'Campinas', lon: -47.06, lat: -22.91, rank: 2 },
  { name: 'Santos', lon: -46.33, lat: -23.96, rank: 3 },
  { name: 'Buenos Aires', lon: -58.38, lat: -34.6, rank: 1, cap: true, bearing: 250 },
  { name: 'Montevideo', lon: -56.19, lat: -34.9, rank: 1, cap: true },
  { name: 'Santiago', lon: -70.65, lat: -33.45, rank: 1, cap: true, bearing: 270 },
  { name: 'Lima', lon: -77.04, lat: -12.05, rank: 1, cap: true, bearing: 80 },
  { name: 'Bogotá', lon: -74.07, lat: 4.71, rank: 1, cap: true, bearing: 100 },
  { name: 'Quito', lon: -78.5, lat: -0.19, rank: 1, cap: true, bearing: 90 },
  { name: 'La Paz', lon: -68.15, lat: -16.5, rank: 1, cap: true, bearing: 30 },
  { name: 'Asunción', lon: -57.63, lat: -25.28, rank: 2, cap: true },
  { name: 'Caracas', lon: -66.9, lat: 10.49, rank: 1, cap: true, bearing: 180 },
  { name: 'Panama City', lon: -79.52, lat: 8.98, rank: 2, cap: true },
]
