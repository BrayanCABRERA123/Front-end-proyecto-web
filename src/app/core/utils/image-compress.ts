// Reduce una foto antes de guardarla.
//
// Una foto de celular pesa entre 3 y 10 MB; para el reporte basta con 1280 px de lado
// mayor en JPEG, que queda alrededor de 200-400 KB. Así caben muchas fotos en el
// navegador y, cuando exista backend, la subida desde la bahía es más rápida.

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png'];

export function isValidPhoto(file: File): boolean {
  return ALLOWED_PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_BYTES;
}

export function compressImage(file: File, maxSide = 1280, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas'));
        return;
      }
      // fondo blanco para que los PNG con transparencia no queden negros en JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error('toBlob'));
      }, 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };

    img.src = url;
  });
}
