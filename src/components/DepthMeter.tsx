import { motion } from 'framer-motion'
import type { DepthLayer } from '../core/types'
import { DEPTH_LAYERS, getProgressToTarget } from '../core/depthRubric'

interface Props {
  currentDepth: DepthLayer
  targetDepth: DepthLayer
  trajectoryVector: DepthLayer[]
  compact?: boolean
}

export function DepthMeter({ currentDepth, targetDepth, trajectoryVector, compact }: Props) {
  const progress = getProgressToTarget(currentDepth, targetDepth)
  const targetMeta = DEPTH_LAYERS[targetDepth]

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as DepthLayer[]).map(layer => {
          const meta = DEPTH_LAYERS[layer]
          const reached = currentDepth >= layer
          const isTarget = layer === targetDepth
          return (
            <div key={layer} className="relative">
              <motion.div
                className="w-3 h-7 rounded-full"
                style={{ backgroundColor: reached ? meta.color : '#ede9e0' }}
                animate={{ opacity: reached ? 1 : 0.35 }}
              />
              {isTarget && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-ink" />
              )}
            </div>
          )
        })}
        <span className="font-sans text-sm font-semibold ml-1" style={{ color: '#5a5670' }}>
          L{currentDepth} → L{targetDepth}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5 bg-white shadow-warm" style={{ border: '1.5px solid rgba(26,24,37,0.07)' }}>
      {/* Layer bar */}
      <div className="flex gap-2 mb-4">
        {([1, 2, 3, 4] as DepthLayer[]).map(layer => {
          const meta = DEPTH_LAYERS[layer]
          const isActive = currentDepth === layer
          const isReached = currentDepth > layer
          const isTarget = layer === targetDepth

          return (
            <motion.div
              key={layer}
              className="flex-1 rounded-xl p-3 relative cursor-default select-none overflow-hidden"
              style={{
                backgroundColor: isActive ? meta.color : isReached ? meta.bgColor : '#fafaf8',
                border: `2px solid ${isActive ? meta.color : isTarget ? `${meta.color}50` : 'transparent'}`,
                boxShadow: isActive ? `0 4px 16px ${meta.color}35` : 'none',
              }}
              animate={{ backgroundColor: isActive ? meta.color : isReached ? meta.bgColor : '#fafaf8' }}
              transition={{ duration: 0.35 }}
            >
              {isTarget && !isActive && (
                <motion.div className="absolute top-1 right-1.5 font-mono text-xs font-bold"
                  style={{ color: meta.color, fontSize: '0.55rem' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  ▲
                </motion.div>
              )}
              <div className="font-display font-black text-lg leading-none text-bulge mb-0.5"
                style={{ color: isActive ? '#fff' : meta.color }}>
                {layer}
              </div>
              <div className="font-sans text-xs font-semibold leading-tight"
                style={{ color: isActive ? 'rgba(255,255,255,0.85)' : '#5a5670' }}>
                {meta.tag}
              </div>
              {isTarget && (
                <div className="font-sans font-bold leading-none mt-1"
                  style={{ color: isActive ? 'rgba(255,255,255,0.65)' : meta.color, fontSize: '0.6rem' }}>
                  target
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm" style={{ color: '#7a7570' }}>
            Progress toward Layer {targetDepth} · {targetMeta.tag}
          </span>
          <span className="font-display font-extrabold text-base text-bulge-color"
            style={{ color: targetMeta.color }}>
            {progress}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#ede9e0' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: targetMeta.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Trajectory */}
      {trajectoryVector.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t" style={{ borderColor: '#ede9e0' }}>
          <span className="font-sans text-sm" style={{ color: '#7a7570' }}>Path:</span>
          {trajectoryVector.map((d, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="font-display font-extrabold text-sm px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: DEPTH_LAYERS[d].bgColor,
                color: DEPTH_LAYERS[d].color,
                border: `1.5px solid ${DEPTH_LAYERS[d].color}40`,
              }}
            >
              L{d}
            </motion.span>
          ))}
          {trajectoryVector.length >= 2 && (
            <span className="font-sans text-sm" style={{ color: '#7a7570' }}>
              · {trajectoryVector.length} attempts
            </span>
          )}
        </div>
      )}
    </div>
  )
}
