/**
 * Canvas Mode - Branch Visualization
 * Handles rendering and interaction for the canvas view
 */

export class CanvasView {
  constructor() {
    this.zoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 2.0;
  }

  /**
   * Render canvas view with branches and nodes
   */
  render(branches, nodes) {
    const orderedBranches = this.orderBranchesForCanvas(branches);
    
    return `
      <div class="canvas-view">
        <!-- Zoom Controls -->
        <div class="canvas-zoom-controls">
          <button class="zoom-btn" id="zoom-out-btn" title="Zoom Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <span class="zoom-level">${Math.round(this.zoom * 100)}%</span>
          <button class="zoom-btn" id="zoom-in-btn" title="Zoom In">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <button class="zoom-btn" id="zoom-reset-btn" title="Reset Zoom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </button>
        </div>

        <!-- Canvas Area -->
        <div class="canvas-area" id="canvas-area">
          <!-- SVG Connectors Layer -->
          <svg class="canvas-connectors" id="canvas-connectors">
            ${this.renderConnectors(orderedBranches, nodes)}
          </svg>
          
          <!-- Canvas Grid -->
          <div class="canvas-grid" style="transform: scale(${this.zoom});" id="canvas-grid">
            ${orderedBranches.map(branch => this.renderBranchColumn(branch, nodes, branches)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Order branches: left branches, trunk center, right branches
   */
  orderBranchesForCanvas(branches) {
    const trunk = branches.find(b => b.branch_type === 'trunk');
    const otherBranches = branches.filter(b => b.branch_type !== 'trunk');
    
    if (!trunk) return branches;
    
    // Alternate left/right
    const leftBranches = [];
    const rightBranches = [];
    
    otherBranches.forEach((branch, index) => {
      if (index % 2 === 0) {
        rightBranches.push(branch);
      } else {
        leftBranches.unshift(branch); // Add to beginning
      }
    });
    
    return [...leftBranches, trunk, ...rightBranches];
  }

  /**
   * Render a branch column
   */
  renderBranchColumn(branch, nodes, allBranches) {
    const isTrunk = branch.branch_type === 'trunk';
    const branchNodes = nodes.filter(n => n.branch_id === branch.id);
    
    // Get branch point node if exists
    let branchPointNode = null;
    if (!isTrunk && branch.branch_point_node_id) {
      branchPointNode = nodes.find(n => n.id === branch.branch_point_node_id);
    }
    
    return `
      <div class="canvas-column ${isTrunk ? 'trunk-column' : ''}" data-branch-id="${branch.id}">
        <!-- Column Header -->
        <div class="canvas-column-header" data-branch-id="${branch.id}">
          <div class="column-header-content">
            <div class="column-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${isTrunk ? '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10"/>' : '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="18" r="3"/><path d="M6 9 l12 9"/>'}
              </svg>
            </div>
            <div class="column-header-info">
              <div class="column-header-title">${branch.name}</div>
              <div class="column-header-meta">${branchNodes.length} nodes</div>
            </div>
          </div>
        </div>

        <!-- Column Nodes -->
        <div class="canvas-column-nodes">
          ${branchPointNode ? this.renderBranchPointNode(branchPointNode) : ''}
          ${branchNodes.map(node => this.renderNode(node, nodes)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render branch point node (grayed out)
   */
  renderBranchPointNode(node) {
    return `
      <div class="canvas-node branch-point" data-node-id="${node.id}">
        ${this.renderNodeContent(node)}
        <div class="node-metadata">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Branch Point
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Render a regular node
   */
  renderNode(node, allNodes) {
    const hasBranches = this.getNodeBranches(node.id, allNodes).length > 0;
    
    return `
      <div class="canvas-node" data-node-id="${node.id}" data-branch-id="${node.branch_id}">
        ${this.renderNodeContent(node)}
        <div class="node-metadata">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            ${node.model}
          </span>
          ${hasBranches ? '<span class="branch-point-badge">⑂ Branches</span>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render node content (prompt + response)
   */
  renderNodeContent(node) {
    return `
      <div class="node-prompt">
        <div class="node-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          User
        </div>
        <div class="node-text">${this.escapeHtml(node.user_prompt)}</div>
      </div>
      <div class="node-response">
        <div class="node-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Assistant
        </div>
        <div class="node-text">${this.formatResponse(node.llm_response)}</div>
      </div>
    `;
  }

  /**
   * Render SVG connectors between nodes
   */
  renderConnectors(branches, nodes) {
    const lines = [];
    
    // For now, return empty - connectors would be calculated after DOM render
    // This requires getting actual node positions
    return '';
  }

  /**
   * Get branches originating from a node
   */
  getNodeBranches(nodeId, allNodes) {
    // This would check state.branches in actual implementation
    return [];
  }

  /**
   * Format response text (basic markdown-like formatting)
   */
  formatResponse(text) {
    if (!text) return '';
    
    // Convert markdown headers to HTML
    let formatted = this.escapeHtml(text);
    formatted = formatted.replace(/^## (.+)$/gm, '<strong>$1</strong>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    
    return formatted;
  }

  /**
   * Escape HTML entities
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Zoom in
   */
  zoomIn() {
    this.zoom = Math.min(this.maxZoom, this.zoom + 0.1);
    return this.zoom;
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.zoom = Math.max(this.minZoom, this.zoom - 0.1);
    return this.zoom;
  }

  /**
   * Reset zoom
   */
  resetZoom() {
    this.zoom = 1.0;
    return this.zoom;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(container, callbacks) {
    // Zoom controls
    const zoomInBtn = container.querySelector('#zoom-in-btn');
    const zoomOutBtn = container.querySelector('#zoom-out-btn');
    const zoomResetBtn = container.querySelector('#zoom-reset-btn');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoomIn();
        if (callbacks.onZoomChange) callbacks.onZoomChange(this.zoom);
      });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoomOut();
        if (callbacks.onZoomChange) callbacks.onZoomChange(this.zoom);
      });
    }
    
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.resetZoom();
        if (callbacks.onZoomChange) callbacks.onZoomChange(this.zoom);
      });
    }

    // Node click handlers
    const nodes = container.querySelectorAll('.canvas-node:not(.branch-point)');
    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const nodeId = node.dataset.nodeId;
        const branchId = node.dataset.branchId;
        if (callbacks.onNodeClick) {
          callbacks.onNodeClick(nodeId, branchId);
        }
      });
    });

    // Branch header click for scrolling
    const headers = container.querySelectorAll('.canvas-column-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const branchId = header.dataset.branchId;
        if (callbacks.onBranchHeaderClick) {
          callbacks.onBranchHeaderClick(branchId);
        }
      });
    });
  }
}

/**
 * Render branch navigation for linear mode
 */
export function renderBranchNavigation(branches, currentBranchId) {
  const currentIndex = branches.findIndex(b => b.id === currentBranchId);
  const currentBranch = branches[currentIndex];
  
  if (!currentBranch) return '';
  
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < branches.length - 1;
  
  return `
    <div class="branch-navigation">
      <button class="branch-nav-btn" id="branch-prev-btn" ${!hasPrev ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      
      <div class="branch-info">
        <div class="branch-name">${currentBranch.name}</div>
        <div class="branch-meta">${currentBranch.branch_type === 'trunk' ? 'Main Thread' : 'Branch'} · ${currentBranch.node_count || 0} nodes</div>
      </div>
      
      <div class="branch-indicators">
        ${branches.map((b, i) => `
          <div class="branch-dot ${i === currentIndex ? 'active' : ''}" data-branch-index="${i}"></div>
        `).join('')}
      </div>
      
      <button class="branch-nav-btn" id="branch-next-btn" ${!hasNext ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  `;
}
