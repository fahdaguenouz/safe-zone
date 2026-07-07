import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { MediaService } from '../../services/media.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { ToasterService } from '../../shared/components/Toaster/toast';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProfileUpdateDialogComponent } from './update/update.profile.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

interface SellerStats {
  productCount: number;
  totalStock: number;
  totalValue: number;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false,
})
export class ProfileComponent implements OnInit {
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  user: User | null = null;
  myProducts: Product[] = [];
  sellerStats: SellerStats | null = null;
  memberSince: string = 'Recently';
  
  private deleteDialogRef: MatDialogRef<any> | null = null;
  private productToDelete: Product | null = null;

  constructor(
    private tokenStorage: TokenStorageService,
    private dialog: MatDialog,
    private mediaService: MediaService,
    private userService: UserService,
    private authService: AuthService,
    private toast: ToasterService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.user = u;
        this.calculateMemberSince();
        
        // Load seller products if user is a seller
        if (u.role === 'SELLER') {
          this.loadSellerProducts();
        }
      }
    });

    this.userService.getProfile().subscribe({
      next: (fullProfile) => {
        const mergedUser = { ...this.user, ...fullProfile };
        this.user = mergedUser as User;
        this.authService.setLoggedInUser(this.user);
      },
      error: (err) => {
        console.error('Failed to fetch full profile:', err);
        this.toast.showError('Could not load complete profile data.');
      }
    });
  }

  calculateMemberSince(): void {
    // Mock calculation - in real app, use createdAt from user data
    const dates = ['January 2024', 'February 2024', 'March 2024', 'Member since 2023'];
    this.memberSince = dates[Math.floor(Math.random() * dates.length)];
  }

  loadSellerProducts(): void {
    this.productService.getMyProducts().subscribe({
      next: (products) => {
        this.myProducts = products;
        this.calculateSellerStats();
      },
      error: () => {
        this.toast.showError('Failed to load your products');
      }
    });
  }

  calculateSellerStats(): void {
    if (!this.myProducts.length) {
      this.sellerStats = { productCount: 0, totalStock: 0, totalValue: 0 };
      return;
    }

    const stats = this.myProducts.reduce((acc, product) => ({
      productCount: acc.productCount + 1,
      totalStock: acc.totalStock + (product.stockQuantity || 0),
      totalValue: acc.totalValue + ((product.price || 0) * (product.stockQuantity || 0))
    }), { productCount: 0, totalStock: 0, totalValue: 0 });

    this.sellerStats = stats;
  }

  openUpdateDialog() {
    const dialogRef = this.dialog.open(ProfileUpdateDialogComponent, {
      width: '450px',
      data: this.user,
      panelClass: 'profile-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.processUpdate(result);
      }
    });
  }

private processUpdate(result: any) {
  if (result.file) {
    this.mediaService.uploadImage(result.file).subscribe({
      next: (media) => {
        if (!media || media.length === 0) {
          this.toast.showError('Image upload failed');
          return;
        }

        const imageUrl = media[0].imageUrl;

        this.finalizeUpdate(result, imageUrl);
      },
      error: (err) => {
        console.error(err);
        this.toast.showError('Image upload failed');
      },
    });
  } else {
    this.finalizeUpdate(result);
  }
}

 private finalizeUpdate(formValues: any, avatarUrl?: string) {
  const payload = {
    firstName: formValues.firstName,
    lastName: formValues.lastName,
    ...(avatarUrl && { avatarMediaId: avatarUrl }),
  };

  this.userService.updateProfile(payload).subscribe({
    next: (updated) => {

      this.user = {
        ...this.user!,
        ...updated,
      };

      this.authService.setLoggedInUser(this.user);

      this.toast.showSuccess('Profile updated successfully!');
    },
    error: (err) => {
      console.error(err);
      this.toast.showError('Failed to update profile');
    },
  });
}

  openDeleteDialog(product: Product) {
    this.productToDelete = product;
    this.deleteDialogRef = this.dialog.open(this.deleteDialog, {
      data: { product },
      panelClass: 'delete-dialog-panel',
      autoFocus: false
    });
  }

  closeDeleteDialog() {
    if (this.deleteDialogRef) {
      this.deleteDialogRef.close();
      this.deleteDialogRef = null;
      this.productToDelete = null;
    }
  }

  confirmDelete(productId: string) {
    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.toast.showSuccess('Product deleted');
        this.myProducts = this.myProducts.filter(p => p.id !== productId);
        this.calculateSellerStats();
        this.closeDeleteDialog();
      },
      error: () => {
        this.toast.showError('Delete failed');
        this.closeDeleteDialog();
      }
    });
  }
}