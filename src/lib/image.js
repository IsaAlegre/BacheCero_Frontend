export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

// Achica la imagen antes de guardarla en localStorage (tope de ~5 MB).
// Mantiene la proporción, así las cajas (en píxeles del original) siguen calzando.
export function downscale(dataUrl, maxSide = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * s)
      canvas.height = Math.round(img.height * s)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
