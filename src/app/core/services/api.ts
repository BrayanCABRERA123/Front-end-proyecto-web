import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// wrapper genérico sobre HttpClient para consumir el backend real
// cuando esté disponible; los services de cada feature lo inyectan
// en lugar de usar HttpClient directamente
@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string) {
    return this.http.get<T>(`${this.baseUrl}/${path}`);
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body);
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(`${this.baseUrl}/${path}`, body);
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${this.baseUrl}/${path}`);
  }
}
