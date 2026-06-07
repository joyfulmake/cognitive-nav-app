import { motion } from 'framer-motion'
import type { DepthLayer } from '../core/types'
import { DEPTH_LAYERS, computePracticeScore } from '../core/depthRubric'

interface Props {
  appMode: 'epistemic' | 'clinical'
  currentDepth: DepthLayer
  targetDepth: DepthLayer
  trajectoryVector: DepthLayer[]
  topic: string
  isComplete: boolean
}

const EPISTEMIC_NODES = [
  { id: 'surface', label: 'Surface Terms', layer: 1 as DepthLayer },
  { id: 'relations', label: 'Causal Relations', layer: 2 as DepthLayer },
  { id: 'tensions', label: 'System Tensions', layer: 3 as DepthLayer },
  { id: 'root', label: 'Root Design', layer: 4 as DepthLayer },
]

const CLINICAL_NODES = [
  { id: 'symptoms', label: 'Presentation', layer: 1 as DepthLayer },
  { id: 'mechanism', label: 'Pathophysiology', layer: 2 as DepthLayer },
  { id: 'decision', label: 'Clinical Decision', layer: 3 as DepthLayer },
  { id: 'root', label: 'Disease Root', layer: 4 as DepthLayer },
]

export function KnowledgeMap({ appMode, currentDepth, targetDepth, trajectoryVector, topic, isComplete }: Props) {
  const nodes = appMode === 'clinical' ? CLINICAL_NODES : EPISTEMIC_NODES
  const score = isComplete ? computePracticeScore(trajectoryVector, {}, targetDepth) : null

  return (
    <div className="border-2 border-ink p-4 bg-white">
      <div className="font-mono text-xs text-muted uppercase tracking-widest mb-1">
        Knowledge map
      </div>
      <div className="font-mono text-xs text-ink font-medium mb-4 truncate">{topic}</div>

      <div className="flex flex-col gap-2 mb-4">
        {nodes.map((node, i) => {
          const meta = DEPTH_LAYERS[node.layer]
          const isLit = currentDepth >= node.layer
          const isTarget = node.layer === targetDepth
          const isCurrent = currentDepth === node.layer

          return (
            <div key={node.id}>
              {/* Connector */}
              {i > 0 && (
                <div className="flex justify-center my-1">
                  <motion.div
                    className="w-0.5 h-3"
                    style={{ backgroundColor: isLit ? meta.color : '#e0ddd5' }}
                    animate={{ opacity: isLit ? 1 : 0.3 }}
                  />
                </div>
              )}

              <motion.div
                className="relative flex items-center gap-2.5 px-3 py-2 border-2"
                style={{
                  borderColor: isTarget
                    ? meta.color
                    : isLit
                    ? `${meta.color}80`
                    : '#e0ddd5',
                  backgroundColor: isCurrent
                    ? meta.bgColor
                    : isLit
                    ? `${meta.bgColor}80`
                    : '#f9f8f4',
                }}
                animate={{
                  boxShadow: isCurrent
                    ? `0 0 12px ${meta.color}50`
                    : isTarget && !isLit
                    ? `0 0 8px ${meta.color}30`
                    : 'none',
                }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="font-mono text-xs font-bold w-6 h-6 flex items-center justify-center flex-shrink-0 border"
                  style={{
                    borderColor: isLit ? meta.color : '#e0ddd5',
                    color: isLit ? meta.color : '#c8c4bc',
                  }}
                >
                  {node.layer}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-mono text-xs font-medium"
                    style={{ color: isLit ? meta.color : '#b0ada6' }}
                  >
                    {node.label}
                  </div>
                  <div
                    className="font-mono text-xs opacity-70"
                    style={{ color: isLit ? meta.color : '#c8c4bc' }}
                  >
                    {meta.tag}
                  </div>
                </div>
                {isTarget && (
                  <motion.div
                    className="font-mono text-xs px-1.5 py-0.5 border flex-shrink-0"
                    style={{
                      borderColor: meta.color,
                      color: meta.color,
                      backgroundColor: meta.bgColor,
                    }}
                    animate={!isLit ? { opacity: [0.6, 1, 0.6] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isLit ? '✓ reached' : 'target'}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-line pt-3">
        {isComplete && score !== null ? (
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted">Practice score</p>
            <span
              className="font-display text-lg font-black"
              style={{
                color: score >= 80 ? '#1a6b3a' : score >= 60 ? '#0c447c' : '#c43d0f',
              }}
            >
              {score}
            </span>
          </div>
        ) : (
          <p className="font-mono text-xs text-muted">
            {isComplete
              ? `Illuminated at Layer ${currentDepth}.`
              : currentDepth < targetDepth
              ? `${targetDepth - currentDepth} layer${targetDepth - currentDepth !== 1 ? 's' : ''} to target.`
              : 'Navigating depth.'}
          </p>
        )}
      </div>
    </div>
  )
}
