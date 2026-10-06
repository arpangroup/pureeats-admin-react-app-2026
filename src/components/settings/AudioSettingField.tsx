import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Loader2, Music, Play, RotateCcw, Square, Upload } from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { playDefaultChime } from '@/lib/orderSound'

const ACCEPT = '.mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave'
const MAX_BYTES = 2 * 1024 * 1024
const createPreviewElement = () => document.createElement('audio')

function fileNameFromUrl(url: string): string {
  try {
    return decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() ?? url)
  } catch {
    return url
  }
}

/**
 * Settings control for an `audio` field (e.g. the new-order sound): shows which sound is active
 * (the uploaded file, or the built-in default chime when the value is blank), plays it, uploads a
 * replacement MP3/WAV, or resets to the default. Like an image field, uploading only fills in the
 * field's value (the file's URL) - it's saved with the rest of the tab via the normal Save button.
 */
export function AudioSettingField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<ReturnType<typeof createPreviewElement> | null>(null)
  const [uploading, setUploading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasCustom = !!value.trim()

  useEffect(() => () => previewRef.current?.pause(), [])

  function stopPreview() {
    previewRef.current?.pause()
    setPlaying(false)
  }

  function handlePlay() {
    setError(null)
    if (playing) {
      stopPreview()
      return
    }
    if (!hasCustom) {
      playDefaultChime()
      return
    }
    const el = previewRef.current ?? createPreviewElement()
    previewRef.current = el
    el.src = value
    el.onended = () => setPlaying(false)
    el.onerror = () => {
      setPlaying(false)
      setError("This file can't be played - the apps will fall back to the default chime.")
    }
    el.currentTime = 0
    el.play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false)
        setError("This file can't be played - the apps will fall back to the default chime.")
      })
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    const name = file.name.toLowerCase()
    if (!name.endsWith('.mp3') && !name.endsWith('.wav')) {
      setError('Please choose an MP3 or WAV file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('The file must be smaller than 2MB.')
      return
    }
    stopPreview()
    setUploading(true)
    try {
      onChange(await settingsService.uploadAudio(file))
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Music size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{hasCustom ? fileNameFromUrl(value) : 'Default chime'}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{hasCustom ? 'Custom sound (active once saved)' : 'Built-in - no download needed'}</p>
        </div>
        <button type="button" className="btn-secondary shrink-0 px-2.5 py-1.5" onClick={handlePlay} aria-label={playing ? 'Stop' : 'Play sound'}>
          {playing ? <Square size={14} /> : <Play size={14} />}
          <span className="hidden sm:inline">{playing ? 'Stop' : 'Play'}</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary px-2.5 py-1.5 text-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : hasCustom ? 'Replace file' : 'Upload MP3 / WAV'}
        </button>
        {hasCustom && (
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5 text-sm"
            onClick={() => {
              stopPreview()
              setError(null)
              onChange('')
            }}
            disabled={uploading}
          >
            <RotateCcw size={14} /> Use default
          </button>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}
