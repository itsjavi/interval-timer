import { useAtom } from 'jotai'
import { Volume2, VolumeOff } from 'lucide-react'

import { soundEnabledAtom } from '@/lib/timer-store'

export function SoundToggle() {
  const [soundEnabled, setSoundEnabled] = useAtom(soundEnabledAtom)

  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!soundEnabled)}
      className="hover:opacity-80"
      aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
      title={'Toggle sounds'}
    >
      {soundEnabled ? <Volume2 className="size-5" /> : <VolumeOff className="size-5" />}
    </button>
  )
}
