import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

const MAX_FILE_BYTES = 4 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface ImageGalleryUploadProps {
  values: string[]
  onChange: (images: string[]) => void
  label?: string
  hint?: string
}

export function ImageGalleryUpload({ values, onChange, label, hint }: ImageGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const additions: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setError('Please choose image files only.')
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setError('Each image must be smaller than 4 MB.')
        continue
      }
      additions.push(await readFileAsDataUrl(file))
    }
    if (additions.length) onChange([...values, ...additions])
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div className="flex flex-wrap gap-3">
        {values.map((src, index) => (
          <div key={index} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-brand-500"
        >
          <Plus size={18} />
          <span className="text-[11px] font-medium">Add</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
