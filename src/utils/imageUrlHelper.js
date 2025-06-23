// utils/imageUrlHelper.js

/**
 * Converts localhost image URLs to proper production URLs
 * This handles the mixed content issue when running in production
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/uploads/images/placeholder-project.jpg';
  
  // If it's already a full URL with https, return as is
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's an absolute path, return as is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // If it contains localhost, replace with production domain
  if (imageUrl.includes('localhost:3001')) {
    // In production, replace localhost URLs with your backend URL
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://api.carbonprospect.com';
    return imageUrl.replace('http://localhost:3001', backendUrl);
  }
  
  // Default case - prepend with a forward slash to make it relative
  return `/${imageUrl}`;
};

/**
 * Usage example in components:
 * 
 * import { getImageUrl } from './utils/imageUrlHelper';
 * 
 * <img 
 *   src={getImageUrl(product.image_url)} 
 *   alt={product.name}
 *   onError={(e) => {
 *     e.target.onerror = null;
 *     e.target.src = '/uploads/images/placeholder-project.jpg';
 *   }}
 * />
 */