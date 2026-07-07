import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service'; // Adjust path
import { ToasterService } from '../../../shared/components/Toaster/toast';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  standalone: false,
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;

  constructor(
    private productService: ProductService,
    private toast: ToasterService,
  ) {}

  filteredProducts: Product[] = [];
  categories: any[] = [];
  selectedCategory: string = 'All';

  ngOnInit(): void {
    // Use the method that handles the loading state
    this.loadProducts();

    // Load Categories
    this.productService.getCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Could not load categories', err),
    });
  }

  filterByCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
    if (categoryName === 'All') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter((p) => p.category === categoryName);
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/product.jpeg';
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        console.log(data);
        
        this.products = data;
        // Initialize with all products selected
        this.filteredProducts = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.showError('Failed to load products.');
      },
    });
  }
}
