// Adapted from https://github.com/shuding/liquid-glass

export interface Vec2 {
  x: number
  y: number
}

export interface ShaderOptions {
  width: number
  height: number
  fragment: (uv: Vec2, mouse?: Vec2) => Vec2
  mousePosition?: Vec2
}

function smoothStep(a: number, b: number, t: number): number {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function length(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

function roundedRectSDF(x: number, y: number, width: number, height: number, radius: number): number {
  const qx = Math.abs(x) - width + radius
  const qy = Math.abs(y) - height + radius
  return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius
}

function texture(x: number, y: number): Vec2 {
  return { x, y }
}

// Shader fragment functions for different effects
export const fragmentShaders = {
  liquidGlass: (uv: Vec2): Vec2 => {
    const ix = uv.x - 0.5
    const iy = uv.y - 0.5
    // Widen the lens area to cover almost the entire card (0.45 radius from center)
    // This pushes the refraction distortion right to the edges
    const distanceToEdge = roundedRectSDF(ix, iy, 0.45, 0.45, 0.5)
    const displacement = smoothStep(0.9, 0, distanceToEdge) // Sharper falloff
    const scaled = smoothStep(0, 1, displacement)
    return texture(ix * scaled + 0.5, iy * scaled + 0.5)
  },
}

export class ShaderDisplacementGenerator {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private canvasDPI = 0.2 // Reduced resolution for performance, SVG filter will scale it up

  constructor(private options: ShaderOptions) {
    this.canvas = document.createElement("canvas")
    this.canvas.width = options.width * this.canvasDPI
    this.canvas.height = options.height * this.canvasDPI
    this.canvas.style.display = "none"

    const context = this.canvas.getContext("2d")
    if (!context) {
      throw new Error("Could not get 2D context")
    }
    this.context = context
  }

  updateShader(mousePosition?: Vec2): string {
    const w = this.options.width * this.canvasDPI
    const h = this.options.height * this.canvasDPI

    let maxScale = 0
    const rawValues: number[] = []

    // Calculate displacement values
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const uv: Vec2 = { x: x / w, y: y / h }

        const pos = this.options.fragment(uv, mousePosition)
        const dx = pos.x * w - x
        const dy = pos.y * h - y

        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
        rawValues.push(dx, dy)
      }
    }

    // Improved normalization to prevent artifacts while maintaining intensity
    if (maxScale > 0) {
      maxScale = Math.max(maxScale, 1) // Ensure minimum scale to prevent over-normalization
    } else {
      maxScale = 1
    }

    // Create ImageData and fill it
    const imageData = this.context.createImageData(w, h)
    const data = imageData.data

    // Convert to image data with smoother normalization
    let rawIndex = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = rawValues[rawIndex++]
        const dy = rawValues[rawIndex++]

        // Smooth the displacement values at edges to prevent hard transitions
        const edgeDistance = Math.min(x, y, w - x - 1, h - y - 1)
        const edgeFactor = Math.min(1, edgeDistance / 2) // Smooth within 2 pixels of edge

        const smoothedDx = dx * edgeFactor
        const smoothedDy = dy * edgeFactor

        const r = smoothedDx / maxScale + 0.5
        const g = smoothedDy / maxScale + 0.5

        const pixelIndex = (y * w + x) * 4
        data[pixelIndex] = Math.max(0, Math.min(255, r * 255)) // Red channel (X displacement)
        data[pixelIndex + 1] = Math.max(0, Math.min(255, g * 255)) // Green channel (Y displacement)
        data[pixelIndex + 2] = Math.max(0, Math.min(255, g * 255)) // Blue channel (Y displacement for SVG filter compatibility)
        data[pixelIndex + 3] = 255 // Alpha channel
      }
    }

    this.context.putImageData(imageData, 0, 0)
    return this.canvas.toDataURL()
  }

  destroy(): void {
    this.canvas.remove()
  }
}
