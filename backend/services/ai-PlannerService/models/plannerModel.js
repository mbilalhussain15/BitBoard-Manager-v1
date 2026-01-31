import mongoose from 'mongoose'

const PlanSchema = new mongoose.Schema({
  correlationId: { type: String, unique: true, index: true },
  workspaceId: { type: String, index: true },
  prompt: String,
  plan: Object,
  status: { type: String, enum: ['pending_approval','in_progress','done','failed','rejected'], default: 'pending_approval' },
  attempts: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  errorLogs: [{ at: Date, msg: String }],
  counters: {
    expected: { projects: Number, boards: Number, tasks: Number },
    created: { projects: { type: Number, default: 0 }, boards: { type: Number, default: 0 }, tasks: { type: Number, default: 0 } }
  },
  createdIds: {
    projects: [String],
    boards: [String],
    tasks: [String]
  },
  lookupByTitle: Object,
  lastApprovedAt: Date,
  lastUpdatedAt: Date,

  createdBy: { type: String, index: true },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }

}, { timestamps: true })

PlanSchema.pre('save', function(next) {
  const hours = parseInt(process.env.PLAN_TTL_HOURS || '2', 10) // 2 hours default
  if (!this.expiresAt) this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  next()
})

export default mongoose.model('Ai-Plan', PlanSchema)
