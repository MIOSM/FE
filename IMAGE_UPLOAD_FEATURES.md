# Image Upload Features

## Overview
The settings component has been updated to include interactive image upload functionality for avatar and cover photos.

## Features

### Avatar Upload
- Click on the avatar preview to open the upload modal
- Drag and drop image files directly onto the upload area
- Click "Browse Files" to select images from your device
- Supports JPG, PNG, GIF, and WebP formats
- Real-time preview of selected images
- Hover effects with shadow and scale animation

### Cover Photo Upload
- Click on the cover photo preview to open the upload modal
- Same drag and drop functionality as avatar
- Wider aspect ratio optimized for cover photos
- Hover effects with shadow and scale animation

### Modal Features
- Modern, responsive design with smooth animations
- Shows current image preview
- File information display (name, size, type)
- Validation for image file types
- Cancel and upload buttons
- Backdrop blur effect

## Technical Implementation

### Components
- `ImageUploadModalComponent`: Reusable modal for image uploads
- Updated `SettingsComponent`: Integrated image upload functionality

### File Structure
```
FE/src/app/
├── pages/settings/
│   ├── settings.component.ts
│   ├── settings.component.html
│   └── settings.component.scss
└── shared/components/image-upload-modal/
    ├── image-upload-modal.component.ts
    ├── image-upload-modal.component.html
    └── image-upload-modal.component.scss
```

### Default Images
- `public/assets/default-avatar.png`: Default avatar placeholder
- `public/assets/default-cover.png`: Default cover photo placeholder

## Usage

1. Navigate to the Settings page
2. Click on either the avatar or cover photo preview
3. In the modal:
   - Drag and drop an image file
   - Or click "Browse Files" to select from device
4. Preview the selected image
5. Click "Upload Image" to confirm
6. The image will be updated in the form

## Styling
- Hover effects with shadow and scale transformation
- Smooth transitions and animations
- Responsive design for different screen sizes
- Modern UI with consistent styling

## Future Enhancements
- Image cropping functionality
- Multiple file format support
- Image compression and optimization
- Progress indicators for large file uploads
- Integration with cloud storage services 