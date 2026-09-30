// contratos del customer-service (/api/v1/vehicles y /api/v1/vehicle-types)

// vehículo como lo responde el backend.
// la placa llega en dos presentaciones: sin guion (ABC123) para enviar y con guion
// (ABC-123) para mostrar, así ninguna pantalla inventa su propio formato.
export interface VehicleResponse {
  id: number;
  licensePlate: string;
  licensePlateFormatted: string;
  vehicleType: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  brand: string;
  model: string;
  color: string;
  createdAt: string;
}

// cuerpo que esperan POST y PUT /api/v1/vehicles
export interface VehicleRequest {
  licensePlate: string;
  vehicleType: string;
  brand: string;
  model: string;
  color: string;
}

// tipo de vehículo del catálogo (endpoint público del customer-service)
export interface VehicleTypeResponse {
  id: number;
  code: string;
  name: string;
  sizeFactor: number;
  displayOrder: number;
}