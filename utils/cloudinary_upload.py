"""
Cloudinary upload utility for handling file uploads
"""
import cloudinary
import cloudinary.uploader
from django.conf import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
    api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
    api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
)


def upload_to_cloudinary(file, folder='menu_items', resource_type='auto'):
    """
    Upload a file to Cloudinary
    
    Args:
        file: File object or file path
        folder: Cloudinary folder name (default: 'menu_items')
        resource_type: Type of resource ('image', 'video', 'auto')
    
    Returns:
        dict: Upload result containing 'url', 'public_id', etc.
        None: If upload fails
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type=resource_type,
            transformation=[
                {'width': 1000, 'height': 1000, 'crop': 'limit'},
                {'quality': 'auto'},
                {'fetch_format': 'auto'},
            ]
        )
        return {
            'url': result.get('secure_url'),
            'public_id': result.get('public_id'),
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format'),
        }
    except Exception as e:
        print(f"[Cloudinary Upload Error] {str(e)}")
        return None


def delete_from_cloudinary(public_id, resource_type='image'):
    """
    Delete a file from Cloudinary
    
    Args:
        public_id: Public ID of the resource to delete
        resource_type: Type of resource ('image', 'video', 'raw')
    
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"[Cloudinary Delete Error] {str(e)}")
        return False
