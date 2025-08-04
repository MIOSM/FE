import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload-modal.component.html',
  styleUrl: './image-upload-modal.component.scss'
})
export class ImageUploadModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Upload Image';
  @Input() currentImageUrl = '';
  @Output() closeModal = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<File>();

  isDragOver = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

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

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    if (file.type.startsWith('image/')) {
      this.selectedFile = file;
      this.createPreview(file);
    } else {
      alert('Please select a valid image file.');
    }
  }

  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onUpload(): void {
    if (this.selectedFile) {
      this.imageSelected.emit(this.selectedFile);
      this.close();
    }
  }

  onCancel(): void {
    this.close();
  }

  private close(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.isDragOver = false;
    this.closeModal.emit();
  }
} 