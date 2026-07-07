import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: false,
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedImageIndex = 0;
  isLoading = true;
  seller: User | null = null;
  quantity = 1;
  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(id).subscribe({
        next: (data) => {
          this.product = data;
          this.isLoading = false;
          this.fetchSellerInfo(data.sellerId);
        },
        error: () => (this.isLoading = false),
      });
    }
  }

  fetchSellerInfo(sellerId: string) {
    this.productService.getUserById(sellerId).subscribe({
      next: (user) => (this.seller = user),
      error: () => console.error('Could not fetch seller info'),
    });
  }

  changeImage(index: number) {
    this.selectedImageIndex = index;
  }

  nextImage() {
    if (!this.product?.media?.length) {
      return;
    }

    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.media.length;
  }
  prevImage() {
    if (!this.product?.media?.length) {
      return;
    }

    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.product.media.length) % this.product.media.length;
  }

  incrementQty() {
    if (this.product && this.quantity < this.product.stockQuantity) {
      this.quantity++;
    }
  }

  decrementQty() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/product.jpeg';
  }
}
