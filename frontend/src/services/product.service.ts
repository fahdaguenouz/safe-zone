import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../environments/environment';
import { User } from '../models/user.model';

// Assuming your Gateway routes /products to the Product Service
const PRODUCT_API = `${environment.gatewayUrl}/products`;
const CATEGORY_API = `${environment.gatewayUrl}/categories`;

@Injectable({
  providedIn: 'root',
})
export class ProductService {

  constructor(private http: HttpClient) {}

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(CATEGORY_API);
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(PRODUCT_API);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${PRODUCT_API}/${id}`);
  }

  getMyProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${PRODUCT_API}/me`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(PRODUCT_API, product);
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${PRODUCT_API}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${PRODUCT_API}/${id}`);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(
      `${environment.gatewayUrl}/users/${userId}`
    );
  }
}