import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroPlusCircle, heroPencilSquare, heroCheckCircle,
  heroXCircle, heroXMark, heroTrash, heroPlus
} from '@ng-icons/heroicons/outline';
import { PackageService } from '../../../core/services/api.service';
import { Package } from '../../../shared/models';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  viewProviders: [provideIcons({ heroPlusCircle, heroPencilSquare, heroCheckCircle, heroXCircle, heroXMark, heroTrash, heroPlus })],
  template: `
    <div class="p-8">
      <div class="flex items-start justify-between mb-7">
        <div>
          <h1 class="font-display text-3xl font-bold text-stone-900 mb-1">Packages</h1>
          <p class="text-stone-400 text-sm">Manage your DJ service packages and pricing</p>
        </div>
        <button (click)="openCreate()" class="btn-primary">
          <ng-icon name="heroPlusCircle" class="w-4 h-4"/>New Package
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-20 gap-3 text-stone-400">
        <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>Loading…
      </div>

      <!-- Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-3 gap-5">
        <div *ngFor="let p of packages" class="card p-6 flex flex-col">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1 min-w-0 pr-3">
              <h3 class="font-display text-lg font-bold text-stone-900 mb-1">{{ p.name }}</h3>
              <p class="text-xs text-stone-400 leading-relaxed">{{ p.description }}</p>
            </div>
            <div class="font-display text-2xl font-bold text-accent shrink-0">\${{ p.basePrice }}</div>
          </div>

          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs text-stone-400 flex items-center gap-1">⏱ {{ p.duration }}h</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                  [class.bg-emerald-100]="p.isActive" [class.text-emerald-700]="p.isActive"
                  [class.bg-red-100]="!p.isActive" [class.text-red-600]="!p.isActive">
              {{ p.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <ul class="flex flex-col gap-2 mb-5 flex-1">
            <li *ngFor="let f of p.features" class="flex items-start gap-2 text-sm text-stone-600">
              <span class="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>{{ f }}
            </li>
          </ul>

          <div class="flex gap-2 pt-4 border-t border-stone-100">
            <button (click)="editPackage(p)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border border-stone-200 bg-stone-50 text-stone-600 hover:border-accent hover:text-accent transition-all">
              <ng-icon name="heroPencilSquare" class="w-4 h-4"/>Edit
            </button>
            <button (click)="toggleActive(p)" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                    [class.border-red-200]="p.isActive" [class.bg-red-50]="p.isActive" [class.text-red-600]="p.isActive"
                    [class.hover:bg-red-600]="p.isActive" [class.hover:text-white]="p.isActive"
                    [class.border-emerald-200]="!p.isActive" [class.bg-emerald-50]="!p.isActive" [class.text-emerald-700]="!p.isActive"
                    [class.hover:bg-emerald-600]="!p.isActive" [class.hover:text-white]="!p.isActive">
              <ng-icon [name]="p.isActive ? 'heroXCircle' : 'heroCheckCircle'" class="w-4 h-4"/>
              {{ p.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" (click)="closeForm()">
        <div class="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-display text-xl font-bold text-stone-900">{{ editMode ? 'Edit Package' : 'New Package' }}</h3>
            <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors border-0 bg-transparent">
              <ng-icon name="heroXMark" class="w-5 h-5 text-stone-400"/>
            </button>
          </div>
          <form [formGroup]="form" (ngSubmit)="savePackage()" class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Package Name</label>
                <input type="text" formControlName="name" class="form-input" placeholder="e.g. Premium Package"/>
              </div>
              <div>
                <label class="form-label">Base Price ($)</label>
                <input type="number" formControlName="basePrice" class="form-input" placeholder="800"/>
              </div>
            </div>
            <div>
              <label class="form-label">Description</label>
              <textarea formControlName="description" rows="2" class="form-input resize-none" placeholder="Brief description…"></textarea>
            </div>
            <div>
              <label class="form-label">Duration (hours)</label>
              <input type="number" formControlName="duration" class="form-input" placeholder="4"/>
            </div>
            <div>
              <label class="form-label">Features</label>
              <div formArrayName="features" class="flex flex-col gap-2 mb-2">
                <div *ngFor="let f of featuresArray.controls; let i = index" class="flex gap-2">
                  <input type="text" [formControlName]="i" class="form-input flex-1" placeholder="Feature description…"/>
                  <button type="button" (click)="removeFeature(i)" class="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all border-0 shrink-0">
                    <ng-icon name="heroTrash" class="w-4 h-4"/>
                  </button>
                </div>
              </div>
              <button type="button" (click)="addFeature()" class="flex items-center gap-2 w-full py-2 rounded-xl border-2 border-dashed border-stone-300 text-stone-400 hover:border-accent hover:text-accent text-sm font-semibold transition-all bg-transparent">
                <ng-icon name="heroPlus" class="w-4 h-4"/>Add Feature
              </button>
            </div>
            <div class="flex gap-3 justify-end pt-2">
              <button type="button" (click)="closeForm()" class="btn-ghost">Cancel</button>
              <button type="submit" [disabled]="form.invalid || isSaving" class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isSaving ? 'Saving…' : 'Save Package' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class AdminPackagesComponent implements OnInit {
  packages: Package[] = [];
  isLoading = true;
  showForm = false;
  editMode = false;
  isSaving = false;
  editingId: string | null = null;
  form: FormGroup;

  constructor(private packageService: PackageService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      basePrice: [null, [Validators.required, Validators.min(1)]],
      duration: [null, [Validators.required, Validators.min(1)]],
      features: this.fb.array([this.fb.control('')])
    });
  }

  ngOnInit() {
    this.packageService.getPackages().subscribe({
      next: r => { this.packages = r.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get featuresArray() { return this.form.get('features') as FormArray; }
  addFeature() { this.featuresArray.push(this.fb.control('')); }
  removeFeature(i: number) { if (this.featuresArray.length > 1) this.featuresArray.removeAt(i); }

  openCreate() {
    this.editMode = false; this.editingId = null; this.form.reset();
    while (this.featuresArray.length > 1) this.featuresArray.removeAt(1);
    this.featuresArray.at(0).setValue(''); this.showForm = true;
  }

  editPackage(p: Package) {
    this.editMode = true; this.editingId = p._id;
    while (this.featuresArray.length > 0) this.featuresArray.removeAt(0);
    (p.features || ['']).forEach(f => this.featuresArray.push(this.fb.control(f)));
    this.form.patchValue({ name: p.name, description: p.description, basePrice: p.basePrice, duration: p.duration });
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  savePackage() {
    if (this.form.invalid) return;
    this.isSaving = true;
    const payload = { ...this.form.value, features: this.form.value.features.filter((f: string) => f.trim()) };
    const obs = this.editMode && this.editingId
      ? this.packageService.updatePackage(this.editingId, payload)
      : this.packageService.createPackage(payload);
    obs.subscribe({
      next: r => {
        if (this.editMode) { const i = this.packages.findIndex(p => p._id === this.editingId); if (i > -1) this.packages[i] = r.data; }
        else this.packages.push(r.data);
        this.isSaving = false; this.closeForm();
      },
      error: () => { this.isSaving = false; }
    });
  }

  toggleActive(p: Package) {
    this.packageService.updatePackage(p._id, { isActive: !p.isActive }).subscribe({
      next: r => { const i = this.packages.findIndex(x => x._id === p._id); if (i > -1) this.packages[i] = r.data; }
    });
  }
}
