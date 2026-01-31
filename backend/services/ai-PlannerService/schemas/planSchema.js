export function normalizePlan(workspaceId, raw) {
  const projects = Array.isArray(raw?.projects) ? raw.projects : []
  const cleaned = projects.map(p => ({
    title: String(p.title || '').slice(0, 120),
    description: String(p.description || ''),
    boards: (p.boards || []).map(b => ({
      title: String(b.title || '').slice(0, 120),
      columns: ensureColumns(b.columns),
      tasks: (b.tasks || []).map(t => ({
        title: String(t.title || '').slice(0, 160),
        description: String(t.description || ''),
        column: resolveColumn(ensureColumns(b.columns), t.column)
      }))
    }))
  }))
  return { workspaceId, projects: cleaned }
}

function ensureColumns(cols) {
  const base = ['Backlog','Todo','In Progress','Review','Done']
  const got = Array.isArray(cols) && cols.length ? cols.map(String) : base
  for (const c of base) if (!got.includes(c)) got.push(c)
  return got
}
function resolveColumn(cols, want) {
  if (cols.includes(want)) return want
  return 'Todo'
}
