const MAX_SIDE = 480

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler esta imagem. Experimente um PNG ou JPG.'))
    img.src = src
  })
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Não foi possível ler o ficheiro.'))
    r.readAsDataURL(file)
  })
}

/**
 * Reduz o logotipo para no máximo 480 px de lado e converte-o para WebP (mantém a
 * transparência). Fica com poucas dezenas de KB e pode ser guardado junto do torneio.
 */
export async function prepareLogo(file) {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um ficheiro de imagem (PNG, JPG, SVG ou WebP).')
  if (file.size > 10 * 1024 * 1024) throw new Error('A imagem tem mais de 10 MB. Escolha uma mais pequena.')
  const src = await readAsDataUrl(file)
  const img = await loadImage(src)
  const w0 = img.naturalWidth || 480
  const h0 = img.naturalHeight || 480
  const scale = Math.min(1, MAX_SIDE / Math.max(w0, h0))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w0 * scale))
  canvas.height = Math.max(1, Math.round(h0 * scale))
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  let out = canvas.toDataURL('image/webp', 0.9)
  if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/png')
  return out
}
