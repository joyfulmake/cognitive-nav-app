import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TeamSession } from '../core/types'
import { DEPTH_LAYERS, computeCollectiveDepth } from '../core/depthRubric'
import { NYAYA_RULES } from '../core/nyayaRules'

interface Props {
  team: TeamSession
  currentUserId: string
}

export function TeamPanel({ team, currentUserId }: Props) {
  const [showRules, setShowRules] = useState(false)
  const collectiveDepth = computeCollectiveDepth(team.members.map(m => m.currentDepth))
  const collectiveMeta = DEPTH_LAYERS[collectiveDepth]

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-ink p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-xs text-muted uppercase tracking-widest">Team session</div>
            <h3 className="font-display text-lg font-bold mt-0.5">{team.name}</h3>
          </div>
          <div
            className="px-3 py-1.5 border-2 font-mono text-xs font-medium"
            style={{ borderColor: collectiveMeta.color, color: collectiveMeta.color }}
          >
            Collective L{collectiveDepth}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {team.members.map(member => {
            const meta = DEPTH_LAYERS[member.currentDepth]
            const isMe = member.id === currentUserId
            return (
              <div
                key={member.id}
                className="border p-2.5 flex items-center justify-between"
                style={{ borderColor: meta.color, backgroundColor: meta.bgColor }}
              >
                <div>
                  <div className="font-sans text-xs font-semibold text-ink">
                    {member.name} {isMe && '(you)'}
                  </div>
                  {member.lastQuestion && (
                    <div className="font-mono text-xs text-muted mt-0.5 truncate max-w-40">
                      "{member.lastQuestion}"
                    </div>
                  )}
                </div>
                <span
                  className="font-mono text-xs font-bold px-1.5 py-0.5"
                  style={{ color: meta.color }}
                >
                  L{member.currentDepth}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {team.prickChain.length > 0 && (
        <div className="border-2 border-line p-4">
          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-3">
            Prick chain
          </div>
          <div className="flex flex-col gap-2">
            {team.prickChain.slice(-4).map((p, i) => {
              const from = team.members.find(m => m.id === p.fromMemberId)
              const to = team.members.find(m => m.id === p.toMemberId)
              return (
                <div key={i} className="flex gap-2 items-start">
                  <span className="font-mono text-xs text-muted flex-shrink-0">
                    {from?.name} to {to?.name}:
                  </span>
                  <p className="font-sans text-xs italic text-ink/80">{p.prickText}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowRules(!showRules)}
        className="flex items-center justify-between w-full border-2 border-line p-3 text-left hover:border-ink transition-colors"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Nyaya Darshana rules of Vada
        </span>
        <span className="font-mono text-xs text-muted">{showRules ? 'hide' : 'show'}</span>
      </button>

      {showRules && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-2 border-line p-4 bg-tag-p/20"
        >
          <div className="flex flex-col gap-4">
            {NYAYA_RULES.map(rule => (
              <div key={rule.id}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-sm font-bold text-depth-4">{rule.transliteration}</span>
                  <span className="font-sans text-xs text-depth-4/70">{rule.english}</span>
                </div>
                <div className="font-sans text-sm text-depth-4 mb-1">{rule.sanskrit}</div>
                <p className="font-sans text-xs text-ink/70 leading-relaxed">{rule.application}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
