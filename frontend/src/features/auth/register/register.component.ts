import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';
import { ToasterService } from '../../../shared/components/Toaster/toast';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage = '';
  roles = [UserRole.CLIENT, UserRole.SELLER];
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToasterService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRole.CLIENT, Validators.required]
    });

    // Subscribe to password changes for strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(value => {
      this.calculatePasswordStrength(value);
    });
  }

  passwordStrength = 0;
  passwordStrengthText = '';
  strengthClass = '';

  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      return;
    }

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9!@#$%^&*]/.test(password)) strength += 25;

    this.passwordStrength = strength;

    if (strength <= 25) {
      this.passwordStrengthText = 'Weak';
      this.strengthClass = 'weak';
    } else if (strength <= 50) {
      this.passwordStrengthText = 'Fair';
      this.strengthClass = 'fair';
    } else if (strength <= 75) {
      this.passwordStrengthText = 'Good';
      this.strengthClass = 'good';
    } else {
      this.passwordStrengthText = 'Strong';
      this.strengthClass = 'strong';
    }
  }

  onRegister() {
    this.isLoading = true;
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.toast.showSuccess('Registration successful! Welcome to Buy 01');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.log(this.registerForm.value);
          
          console.log(err);
          
          this.isLoading = false;
          const errorMsg = err.error?.message || 'Registration failed. Please try again.';
          this.errorMessage = errorMsg;
          this.toast.showError(errorMsg);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }
}