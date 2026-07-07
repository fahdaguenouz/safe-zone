import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ProductMedia } from '../models/media.model';

@Injectable({ providedIn: 'root' })

export class MediaService {
  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<ProductMedia[]> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<ProductMedia[]>(
    `${environment.gatewayUrl}/api/media/upload`,
    formData
  );
}
}