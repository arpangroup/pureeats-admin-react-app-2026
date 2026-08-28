import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { classNames } from '@/lib/format'

const MAX_FILE_BYTES = 4 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface ImageUploadProps {
  value: string | null | undefined
  onChange: (dataUrl: string | null) => void
  label?: string
  hint?: string
  /** Tailwind height/aspect classes for the drop target — defaults to a square tile. */
  className?: string
  fullWidth?: boolean
}

export function ImageUpload({ value, onChange, label, hint, className, fullWidth }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image must be smaller than 4 MB.')
      return
    }
    setIsLoading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      onChange(dataUrl)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={classNames(
          'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500 dark:hover:border-brand-500',
          fullWidth ? 'h-48 w-full' : 'h-28 w-28',
          className,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {isLoading ? (
          <Loader2 size={22} className="animate-spin" />
        ) : value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center">
            <ImagePlus size={fullWidth ? 26 : 20} />
            <span className="text-xs font-medium">Click or drop to upload</span>
          </div>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
