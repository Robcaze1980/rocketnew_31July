import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import storageService from '../../../utils/storageService';

const ProfilePhotoUpload = ({ currentPhoto, onPhotoChange, userId }) => {
  const [previewUrl, setPreviewUrl] = useState(currentPhoto);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadError(null);
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      setIsUploading(true);

      try {
        // Create preview URL immediately for better UX
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload to Supabase storage
        const uploadResult = await storageService.uploadProfilePhoto(file, userId);
        
        if (uploadResult.success) {
          const photoUrl = uploadResult.data.url;
          setPreviewUrl(photoUrl);
          
          // Call parent handler with the uploaded URL
          if (onPhotoChange) {
            await onPhotoChange(photoUrl);
          }
        } else {
          setUploadError(uploadResult.error || 'Failed to upload photo');
          // Reset preview on error
          setPreviewUrl(currentPhoto);
        }
      } catch (error) {
        setUploadError('Failed to upload photo. Please try again.');
        setPreviewUrl(currentPhoto);
        console.log('Photo upload error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemovePhoto = async () => {
    if (isUploading) return;
    
    setIsUploading(true);
    setUploadError(null);

    try {
      setPreviewUrl(null);
      
      // Call parent handler to remove photo
      if (onPhotoChange) {
        await onPhotoChange(null);
      }
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError('Failed to remove photo. Please try again.');
      console.log('Photo removal error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-card shadow-soft">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/assets/images/no_image.png';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="User" size={48} className="text-muted-foreground" />
            </div>
          )}
        </div>
        
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-soft hover:bg-destructive/90 transition-smooth"
            title="Remove photo"
          >
            <Icon name="X" size={16} color="white" />
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          loading={isUploading}
          iconName="Upload"
          iconPosition="left"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : previewUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>

        {uploadError && (
          <div className="text-sm text-destructive text-center max-w-xs">
            {uploadError}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, GIF, or WebP. Max size 5MB.
        <br />
        <span className="text-xs text-muted-foreground/60">
          Photos are stored securely in Supabase Storage
        </span>
      </p>
    </div>
  );
};

export default ProfilePhotoUpload;