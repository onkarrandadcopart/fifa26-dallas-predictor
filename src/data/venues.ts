export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  isDallas: boolean;
}

export const venues: Venue[] = [
  { id: 'att_stadium', name: 'AT&T Stadium', city: 'Arlington', state: 'TX', capacity: 92967, isDallas: true },
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', capacity: 82500, isDallas: false },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood', state: 'CA', capacity: 70240, isDallas: false },
  { id: 'hard_rock', name: 'Hard Rock Stadium', city: 'Miami Gardens', state: 'FL', capacity: 64767, isDallas: false },
  { id: 'lincoln_financial', name: 'Lincoln Financial Field', city: 'Philadelphia', state: 'PA', capacity: 69796, isDallas: false },
  { id: 'mercedes_benz', name: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA', capacity: 71000, isDallas: false },
  { id: 'bmo_field', name: 'BMO Field', city: 'Toronto', state: 'ON', capacity: 45736, isDallas: false },
  { id: 'bc_place', name: 'BC Place', city: 'Vancouver', state: 'BC', capacity: 54500, isDallas: false },
  { id: 'estadio_azteca', name: 'Estadio Azteca', city: 'Mexico City', state: 'CDMX', capacity: 87523, isDallas: false },
  { id: 'estadio_akron', name: 'Estadio Akron', city: 'Guadalajara', state: 'JAL', capacity: 49850, isDallas: false },
  { id: 'estadio_monterrey', name: 'Estadio BBVA', city: 'Monterrey', state: 'NL', capacity: 53500, isDallas: false },
  { id: 'centurylink', name: 'Lumen Field', city: 'Seattle', state: 'WA', capacity: 68740, isDallas: false },
  { id: 'arrowhead', name: 'GEHA Field at Arrowhead', city: 'Kansas City', state: 'MO', capacity: 76416, isDallas: false },
  { id: 'gillette', name: 'Gillette Stadium', city: 'Foxborough', state: 'MA', capacity: 65878, isDallas: false },
  { id: 'geodis_park', name: 'GEODIS Park', city: 'Nashville', state: 'TN', capacity: 30000, isDallas: false },
  { id: 'nrg', name: 'NRG Stadium', city: 'Houston', state: 'TX', capacity: 72220, isDallas: false },
];

export const dallasVenue = venues[0]!;
