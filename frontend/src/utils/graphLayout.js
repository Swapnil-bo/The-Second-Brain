// Description: Dagre-based graph layout for React Flow. Converts raw graph nodes/edges into
// positioned React Flow nodes with @dagrejs/dagre. Supports LR and TB directions.

import dagre from '@dagrejs/dagre'

const NODE_WIDTH = 180
const NODE_HEIGHT = 60

export function getLayoutedElements(nodes, edges, direction = 'LR') {
  if (!nodes.length) return { nodes: [], edges: [] }

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    ranksep: 80,
    nodesep: 40,
    edgesep: 20,
    marginx: 40,
    marginy: 40,
  })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export { NODE_WIDTH, NODE_HEIGHT }
