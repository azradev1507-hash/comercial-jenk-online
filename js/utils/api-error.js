// Error uniforme de la API. `details` es un objeto { campo: mensaje } cuando el backend valida campos.
export class ApiError extends Error {
  constructor(message, status = 0, code = 'unknown', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
