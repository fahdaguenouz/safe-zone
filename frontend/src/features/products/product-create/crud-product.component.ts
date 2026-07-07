import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { ToasterService } from '../../../shared/components/Toaster/toast';
import { forkJoin, of } from 'rxjs';
import { MediaService } from '../../../services/media.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProductMedia } from '../../../models/media.model';

@Component({
  standalone: false,
  selector: 'app-crud-product',
  templateUrl: './crud-product.component.html',
  styleUrls: ['./crud-product.component.scss'],
})
export class AddProductComponent implements OnInit {
  @ViewChild('imagePreviewDialog') imagePreviewDialog!: TemplateRef<any>;

  productForm!: FormGroup;
  maxMedia = 4;
  isEditMode = false;
  productId: string | null = null;
  formSubmitted = false;
  isSubmitting = false;
  isDragOver = false;
  uploadProgress = 0;
  isSubmitMode = false;
  files: File[] = [];
  previewUrls: string[] = [];
  existingMedia: ProductMedia[] = [];
  categories: any[] = [];
  selectedPreviewImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private toast: ToasterService,
    private mediaService: MediaService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.checkEditMode();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [1, [Validators.required, Validators.min(1)]],
      category: ['', [Validators.required]],
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => (this.categories = data),
      error: () => this.toast.showError('Failed to load categories'),
    });
  }

  checkEditMode(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.productService.getProductById(this.productId).subscribe({
        next: (product) => {
          this.productForm.patchValue(product);
          this.existingMedia = product.media || [];

          this.previewUrls = this.existingMedia.map((media) => media.imageUrl);
        },
        error: () => {
          this.toast.showError('Failed to load product');
          this.router.navigate(['/seller-dashboard']);
        },
      });
    }
  }

  // Drag & Drop Handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  onFileSelected(event: any): void {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      this.handleFiles(Array.from(selectedFiles));
    }
  }

  handleFiles(newFiles: File[]): void {
    const validFiles = newFiles.filter((file) => {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        this.toast.showError(`${file.name} is not a valid image file`);
        return false;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.toast.showError(`${file.name} exceeds 2MB limit`);
        return false;
      }
      return true;
    });

    const remainingSlots = this.maxMedia - this.previewUrls.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      this.toast.showWarning(
        `Only ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} can be added`,
      );
    }

    filesToAdd.forEach((file) => {
      this.files.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrls.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeMedia(index: number): void {
    this.previewUrls.splice(index, 1);
    if (index < this.existingMedia.length) {
      this.existingMedia.splice(index, 1);
    } else {
      const fileIndex = index - this.existingMedia.length;
      this.files.splice(fileIndex, 1);
    }
    this.toast.showInfo('Image removed');
  }

  viewImage(url: string): void {
    this.selectedPreviewImage = url;
    this.dialog.open(this.imagePreviewDialog, {
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }

  closePreview(): void {
    this.dialog.closeAll();
    this.selectedPreviewImage = null;
  }

  onSubmit(): void {
    this.isSubmitMode = false;
    this.formSubmitted = true;

    if (this.productForm.invalid) {
      this.toast.showError('Please fill in all required fields correctly');
      return;
    }

    if (this.previewUrls.length === 0) {
      this.toast.showError('At least one product image is required');
      return;
    }

    this.isSubmitting = true;

    // Upload new files first
    if (this.files.length > 0) {
      this.uploadProgress = 0;
      const uploadObservables = this.files.map((file) => this.mediaService.uploadImage(file));

      forkJoin(uploadObservables).subscribe({
        next: (responses: any[]) => {
          console.log('UPLOAD RESPONSES:', responses);
          const newMedia = responses.flatMap((res) => res);
          console.log('MEDIA:', newMedia);
          const finalMedia = [...this.existingMedia, ...newMedia];
          this.saveProduct(finalMedia);
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          this.toast.showError('Failed to upload images');
        },
      });
    } else {
      // No new files, just save with existing
      this.saveProduct(this.existingMedia);
    }
  }

  saveProduct(media: ProductMedia[]): void {
    const payload = {
      ...this.productForm.value,
      media: media,
    };

    const action$ = this.isEditMode
      ? this.productService.updateProduct(this.productId!, payload)
      : this.productService.createProduct(payload);

    action$.subscribe({
      next: () => {
        this.toast.showSuccess(`Product ${this.isEditMode ? 'updated' : 'created'} successfully!`);
        this.router.navigate(['/seller-dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.toast.showError(err.error?.message || 'Operation failed. Please try again.');
      },
    });
  }
}
