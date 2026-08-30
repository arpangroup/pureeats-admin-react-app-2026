import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import { Spinner } from '@/components/ui/Feedback'

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_IMAGES = 5

/** Live-mode only — uploads/deletes hit the server immediately, no "Save" step (the restaurant must already exist to attach images to). */
export function RestaurantImageGallery({ restaurantId }: { restaurantId: number }) {
  const { data: images, isLoading, reload } = useAsync(() => restaurantService.listImages(restaurantId), [restaurantId])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const count = images?.length ?? 0
  const atLimit = count >= MAX_IMAGES

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (count >= MAX_IMAGES) {
          setError(`A store can have at most ${MAX_IMAGES} images.`)
          break
        }
        if (file.size > MAX_FILE_BYTES) {
          setError('Each image must be smaller than 2 MB.')
          continue
        }
        await restaurantService.uploadGalleryImage(restaurantId, file)
      }
      reload()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(mediaId: number) {
    setError(null)
    try {
      await restaurantService.deleteGalleryImage(restaurantId, mediaId)
      reload()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Failed to remove image.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {isLoading ? (
          <div className="flex h-20 w-20 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          (images ?? []).map((img) => (
            <div key={img.id} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
        {!atLimit && !isLoading && (
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-brand-500">
            {uploading ? <Spinner /> : <Plus size={18} />}
            <span className="text-[11px] font-medium">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
        Up to {MAX_IMAGES} images, max 2 MB each.{atLimit ? ' Limit reached.' : ''}
      </p>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
