// Description: Entity type → color, icon name, and label mapping. All colors reference
// CSS variables. Icon names map to Lucide React components.

export const entityConfig = {
  CONCEPT: {
    color: 'var(--entity-concept)',
    raw: '#6366f1',
    icon: 'Brain',
    label: 'Concept',
  },
  PERSON: {
    color: 'var(--entity-person)',
    raw: '#f59e0b',
    icon: 'User',
    label: 'Person',
  },
  TECHNOLOGY: {
    color: 'var(--entity-technology)',
    raw: '#10b981',
    icon: 'Cpu',
    label: 'Technology',
  },
  BOOK: {
    color: 'var(--entity-book)',
    raw: '#ef4444',
    icon: 'BookOpen',
    label: 'Book',
  },
  ORGANIZATION: {
    color: 'var(--entity-organization)',
    raw: '#06b6d4',
    icon: 'Building2',
    label: 'Organization',
  },
  EVENT: {
    color: 'var(--entity-event)',
    raw: '#f97316',
    icon: 'Calendar',
    label: 'Event',
  },
  UNKNOWN: {
    color: 'var(--entity-unknown)',
    raw: '#6b7280',
    icon: 'HelpCircle',
    label: 'Unknown',
  },
}

export function getEntityConfig(type) {
  return entityConfig[type?.toUpperCase()] || entityConfig.UNKNOWN
}

export function getEntityColor(type) {
  return getEntityConfig(type).color
}

export function getEntityRawColor(type) {
  return getEntityConfig(type).raw
}

export const entityTypes = Object.keys(entityConfig).filter((t) => t !== 'UNKNOWN')
