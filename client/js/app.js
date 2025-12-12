/**
 * Symposium UI Mockup
 * Main application logic with two-tier tab navigation
 */

// =============================================================================
// STATE
// =============================================================================

const state = {
  mode: 'convo', // 'convo' or 'manage'
  modelMode: 'standard', // 'standard' or 'high'
  
  // Two-tier navigation
  mainTab: 'library', // library, collections, agents, scheduler, integrations, subscriptions, organizations
  subTab: 'cards', // varies by main tab
  selectedCollectionId: null, // for collections sub-tab
  
  activeContextIds: ['col-001'],
  
  // Data
  messages: [],
  cards: [],
  collections: [],
  schemas: [],
  tags: [],
  agents: [],
  schedulerSources: [],
  schedulerQueries: [],
  schedulerOutputs: [],
  schedulerCleanups: [],
  schedulerLogs: [],
  integrations: [],
  subscriptions: [],
  organizations: [],
  
  // Completion
  completionVisible: false,
  completionIndex: 0,
  currentCommand: null,
};

// Sub-tabs configuration for each main tab
const subTabConfig = {
  library: [
    { id: 'cards', label: 'Cards', icon: 'file-text' },
    { id: 'drafts', label: 'Drafts', icon: 'edit-3' },
    { id: 'schemas', label: 'Schemas', icon: 'grid' },
    { id: 'tags', label: 'Tags', icon: 'tag' },
  ],
  collections: [], // Dynamically populated from state.collections
  scheduler: [
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'queries', label: 'Queries', icon: 'layers' },
    { id: 'agents', label: 'Agents', icon: 'cpu' },
    { id: 'outputs', label: 'Outputs', icon: 'send' },
    { id: 'cleanups', label: 'Cleanups', icon: 'trash-2' },
    { id: 'logs', label: 'Logs', icon: 'list' },
  ],
  integrations: null,
  subscriptions: null,
  organizations: null,
};

// =============================================================================
// COMPLETION DATA
// =============================================================================

// Dynamic resource mapping
const dynamicResourceMap = {
  'cards': { stateKey: 'cards', displayField: 'title', icon: '📄' },
  'drafts': { stateKey: 'cards', filter: c => c.type === 'draft', displayField: 'title', icon: '✏️' },
  'schemas': { stateKey: 'schemas', displayField: 'name', icon: '📐' },
  'tags': { stateKey: 'tags', displayField: 'name', icon: '🏷️' },
  'collections': { stateKey: 'collections', displayField: 'name', icon: '📁' },
  'agents': { stateKey: 'agents', displayField: 'name', icon: '🤖' },
  'sources': { stateKey: 'schedulerSources', displayField: 'name', icon: '📥' },
  'queries': { stateKey: 'schedulerQueries', displayField: 'name', icon: '🔄' },
  'outputs': { stateKey: 'schedulerOutputs', displayField: 'name', icon: '📤' },
  'cleanups': { stateKey: 'schedulerCleanups', displayField: 'name', icon: '🧹' },
  'integrations': { stateKey: 'integrations', displayField: 'name', icon: '🔌' },
  'subscriptions': { stateKey: 'subscriptions', displayField: 'name', icon: '📡' },
  'organizations': { stateKey: 'organizations', displayField: 'name', icon: '🏢' }
};

const completionTree = {
  '@/': {
    label: 'Target Context',
    type: 'target',
    children: {
      'library/': {
        label: 'Library',
        children: {
          'schemas': { label: 'Schema definitions', final: true },
          'tags': { label: 'Tag definitions', final: true },
          'cards': { label: 'All cards', final: true },
          'drafts': { label: 'All drafts', final: true },
        }
      },
      'cards/': { label: 'Specific card', dynamic: 'cards' },
      'drafts/': { label: 'Specific draft', dynamic: 'drafts' },
      'collections/': { label: 'Specific collection', dynamic: 'collections' },
      'schemas/': { label: 'Specific schema', dynamic: 'schemas' },
      'tags/': { label: 'Specific tag', dynamic: 'tags' },
      'agents/': { label: 'Specific agent', dynamic: 'agents' },
      'scheduler/': {
        label: 'Scheduler',
        children: {
          'sources': { label: 'All sources', final: true },
          'sources/': { label: 'Specific source', dynamic: 'sources' },
          'queries': { label: 'All queries', final: true },
          'queries/': { label: 'Specific query', dynamic: 'queries' },
          'outputs': { label: 'All outputs', final: true },
          'outputs/': { label: 'Specific output', dynamic: 'outputs' },
          'cleanups': { label: 'All cleanups', final: true },
          'cleanups/': { label: 'Specific cleanup', dynamic: 'cleanups' },
          'agents': { label: 'All scheduled agents', final: true },
          'agents/': { label: 'Specific agent', dynamic: 'agents' },
        }
      },
      'integrations': { label: 'All integrations', final: true },
      'integrations/': { label: 'Specific integration', dynamic: 'integrations' },
      'subscriptions': { label: 'All subscriptions', final: true },
      'subscriptions/': { label: 'Specific subscription', dynamic: 'subscriptions' },
      'organizations': { label: 'All organizations', final: true },
      'organizations/': { label: 'Specific organization', dynamic: 'organizations' },
    }
  },
  '#/': {
    label: 'Operation',
    type: 'operation',
    children: {
      'create/': {
        label: 'Create new',
        children: {
          'card': { label: 'Create new card', final: true },
          'collection': { label: 'Create new collection', final: true },
          'schema': { label: 'Create new schema', final: true },
          'tag': { label: 'Create new tag', final: true },
          'agent': { label: 'Create new agent', final: true },
        }
      },
      'edit/': {
        label: 'Edit existing',
        children: {
          'card': { label: 'Edit card', dynamic: 'cards' },
          'card/': { label: 'Select card to edit', dynamic: 'cards' },
          'collection': { label: 'Edit collection', dynamic: 'collections' },
          'collection/': { label: 'Select collection to edit', dynamic: 'collections' },
          'schema': { label: 'Edit schema', dynamic: 'schemas' },
          'schema/': { label: 'Select schema to edit', dynamic: 'schemas' },
          'tag': { label: 'Edit tag', dynamic: 'tags' },
          'tag/': { label: 'Select tag to edit', dynamic: 'tags' },
          'agent': { label: 'Edit agent', dynamic: 'agents' },
          'agent/': { label: 'Select agent to edit', dynamic: 'agents' },
        }
      },
      'duplicate/': {
        label: 'Duplicate',
        children: {
          'card': { label: 'Duplicate card', dynamic: 'cards' },
          'card/': { label: 'Select card to duplicate', dynamic: 'cards' },
          'agent': { label: 'Duplicate agent', dynamic: 'agents' },
          'agent/': { label: 'Select agent to duplicate', dynamic: 'agents' },
        }
      },
      'publish/': {
        label: 'Publish',
        children: {
          'collection': { label: 'Publish collection', dynamic: 'collections' },
          'collection/': { label: 'Select collection to publish', dynamic: 'collections' },
        }
      },
    }
  }
};

// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
  // Views
  convoView: document.getElementById('convo-view'),
  manageView: document.getElementById('manage-view'),
  messagesContainer: document.getElementById('messages-container'),
  resourceContent: document.getElementById('resource-content'),
  
  // Main/Sub tabs
  mainTabs: document.getElementById('main-tabs'),
  subNav: document.getElementById('sub-nav'),
  subTabs: document.getElementById('sub-tabs'),
  
  // Input
  inputField: document.getElementById('input-field'),
  inputHighlight: document.getElementById('input-highlight'),
  sendBtn: document.getElementById('send-btn'),
  
  // Mode toggle
  modeConvo: document.getElementById('mode-convo'),
  modeManage: document.getElementById('mode-manage'),
  
  // Model
  modelToggle: document.getElementById('model-toggle'),
  modelSettingsBtn: document.getElementById('model-settings-btn'),
  
  // Modals
  modalOverlay: document.getElementById('modal-overlay'),
  activeContextBtn: document.getElementById('active-context-btn'),
  collectionsList: document.getElementById('collections-list'),
  
  // Manage error
  manageError: document.getElementById('manage-error'),
  
  // Completion
  completionHelper: document.getElementById('completion-helper'),
  completionPath: document.querySelector('.completion-path'),
  completionList: document.querySelector('.completion-list'),
};

// =============================================================================
// INITIALIZATION
// =============================================================================

async function init() {
  await loadData();
  
  // Initialize Feather icons
  if (typeof feather !== 'undefined') {
    feather.replace({ width: 20, height: 20, 'stroke-width': 1.5 });
  }
  
  renderMessages();
  renderMainTabs();
  updateSubTabs();
  renderContent();
  renderCollections();
  
  setupEventListeners();
}

async function loadData() {
  try {
    const [messages, cards, collections, schemas, tags, agents, schedulerSources, schedulerQueries, schedulerOutputs, schedulerCleanups, schedulerLogs, integrations, subscriptions, organizations] = await Promise.all([
      fetch('/api/messages').then(r => r.json()),
      fetch('/api/cards').then(r => r.json()),
      fetch('/api/collections').then(r => r.json()),
      fetch('/api/schemas').then(r => r.json()),
      fetch('/api/tags').then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/scheduler-sources').then(r => r.json()),
      fetch('/api/scheduler-queries').then(r => r.json()),
      fetch('/api/scheduler-outputs').then(r => r.json()),
      fetch('/api/scheduler-cleanups').then(r => r.json()),
      fetch('/api/scheduler-logs').then(r => r.json()),
      fetch('/api/integrations').then(r => r.json()),
      fetch('/api/subscriptions').then(r => r.json()),
      fetch('/api/organizations').then(r => r.json()),
    ]);
    
    state.messages = messages;
    state.cards = cards;
    state.collections = collections;
    state.schemas = schemas;
    state.tags = tags;
    state.agents = agents;
    state.schedulerSources = schedulerSources;
    state.schedulerQueries = schedulerQueries;
    state.schedulerOutputs = schedulerOutputs;
    state.schedulerCleanups = schedulerCleanups;
    state.schedulerLogs = schedulerLogs;
    state.integrations = integrations;
    state.subscriptions = subscriptions;
    state.organizations = organizations;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
  // Mode toggle
  elements.modeConvo.addEventListener('click', () => setMode('convo'));
  elements.modeManage.addEventListener('click', () => setMode('manage'));
  
  // Model toggle
  elements.modelToggle.addEventListener('click', toggleModelMode);
  
  // Model settings
  elements.modelSettingsBtn.addEventListener('click', () => openModal('model-settings'));
  
  // Active context
  elements.activeContextBtn.addEventListener('click', () => openModal('active-context'));
  
  // Modal close
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });
  
  // Input handling
  elements.inputField.addEventListener('input', handleInput);
  elements.inputField.addEventListener('keydown', handleKeydown);
  elements.inputField.addEventListener('blur', () => {
    setTimeout(() => {
      if (!elements.completionHelper.contains(document.activeElement)) {
        hideCompletion();
      }
    }, 200);
  });
  
  // Send button
  elements.sendBtn.addEventListener('click', handleSend);
  
  // Main tabs
  elements.mainTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.main-tab');
    if (tab) {
      const tabId = tab.dataset.tab;
      setMainTab(tabId);
    }
  });
}

// =============================================================================
// TAB NAVIGATION
// =============================================================================

function setMainTab(tabId) {
  state.mainTab = tabId;
  
  // Set default sub-tab for tabs that have them
  if (tabId === 'library') {
    state.subTab = 'cards';
    state.selectedCollectionId = null;
  } else if (tabId === 'collections') {
    state.subTab = null;
    state.selectedCollectionId = state.collections[0]?.id || null;
  } else if (tabId === 'scheduler') {
    state.subTab = 'schedule';
    state.selectedCollectionId = null;
  } else {
    state.subTab = null;
    state.selectedCollectionId = null;
  }
  
  renderMainTabs();
  updateSubTabs();
  renderContent();
}

function setSubTab(subTabId) {
  state.subTab = subTabId;
  state.selectedCollectionId = null;
  renderSubTabs();
  renderContent();
}

function setSelectedCollection(collectionId) {
  state.selectedCollectionId = collectionId;
  state.subTab = null;
  renderSubTabs();
  renderContent();
}

function renderMainTabs() {
  const tabs = elements.mainTabs.querySelectorAll('.main-tab');
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === state.mainTab);
  });
  
  // Re-render feather icons
  if (typeof feather !== 'undefined') {
    feather.replace({ width: 20, height: 20, 'stroke-width': 1.5 });
  }
}

function updateSubTabs() {
  const config = getSubTabsForMainTab(state.mainTab);
  
  if (config && config.length > 0) {
    elements.subNav.classList.add('visible');
    renderSubTabs();
  } else {
    elements.subNav.classList.remove('visible');
  }
}

function getSubTabsForMainTab(mainTab) {
  if (mainTab === 'collections') {
    // Dynamic sub-tabs from collections
    return state.collections.map(col => ({
      id: col.id,
      label: col.name,
      icon: 'folder',
      isCollection: true,
    }));
  }
  return subTabConfig[mainTab] || null;
}

function renderSubTabs() {
  const config = getSubTabsForMainTab(state.mainTab);
  if (!config) return;
  
  elements.subTabs.innerHTML = config.map(tab => {
    const isActive = tab.isCollection 
      ? state.selectedCollectionId === tab.id
      : state.subTab === tab.id;
    
    return `
      <button class="sub-tab ${isActive ? 'active' : ''}" 
              data-subtab="${tab.id}" 
              data-collection="${tab.isCollection || false}">
        <i data-feather="${tab.icon}"></i>
        <span>${tab.label}</span>
      </button>
    `;
  }).join('');
  
  // Re-render feather icons
  if (typeof feather !== 'undefined') {
    feather.replace({ width: 16, height: 16, 'stroke-width': 1.5 });
  }
  
  // Add click handlers
  elements.subTabs.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const isCollection = tab.dataset.collection === 'true';
      if (isCollection) {
        setSelectedCollection(tab.dataset.subtab);
      } else {
        setSubTab(tab.dataset.subtab);
      }
    });
  });
}

// =============================================================================
// MODE HANDLING
// =============================================================================

function setMode(mode) {
  state.mode = mode;
  
  elements.modeConvo.classList.toggle('active', mode === 'convo');
  elements.modeManage.classList.toggle('active', mode === 'manage');
  
  elements.convoView.classList.toggle('active', mode === 'convo');
  elements.manageView.classList.toggle('active', mode === 'manage');
  
  elements.inputField.placeholder = mode === 'convo' 
    ? 'Type a message or use @/ to target context...'
    : 'Use #/ for operations, @/ to target context...';
  
  if (mode === 'manage') {
    updateSubTabs();
    renderContent();
  }
  
  validateInput();
}

function toggleModelMode() {
  state.modelMode = state.modelMode === 'standard' ? 'high' : 'standard';
  
  const label = elements.modelToggle.querySelector('.model-label');
  label.textContent = state.modelMode === 'standard' ? 'Std' : 'High';
  elements.modelToggle.classList.toggle('high-mode', state.modelMode === 'high');
}

// =============================================================================
// CONTENT RENDERING
// =============================================================================

function renderContent() {
  switch (state.mainTab) {
    case 'library':
      renderLibraryContent();
      break;
    case 'collections':
      renderCollectionContent();
      break;
    case 'agents':
      renderAgentsContent();
      break;
    case 'scheduler':
      renderSchedulerContent();
      break;
    case 'integrations':
      renderIntegrationsContent();
      break;
    case 'subscriptions':
      renderSubscriptionsContent();
      break;
    case 'organizations':
      renderOrganizationsContent();
      break;
    default:
      renderEmptyState();
  }
}

function renderLibraryContent() {
  if (state.subTab === 'cards') {
    renderCardsList();
  } else if (state.subTab === 'drafts') {
    renderDraftsList();
  } else if (state.subTab === 'schemas') {
    renderSchemasList();
  } else if (state.subTab === 'tags') {
    renderTagsList();
  }
}

function renderDraftsList() {
  const draftCards = state.cards.filter(c => c.type === 'draft');
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${draftCards.length === 0 ? '<div class="empty-state"><p>No draft cards</p></div>' : draftCards.map(card => {
        const schema = state.schemas.find(s => s.id === card.schema_id);
        const tags = state.tags.filter(t => card.tag_ids?.includes(t.id));
        return `
          <article class="resource-item">
            <div class="resource-item-header">
              <div>
                <h3 class="resource-item-title">${card.title}</h3>
                <p class="resource-item-meta">${schema?.name || 'No schema'}</p>
              </div>
              <span class="resource-item-type">${card.type}</span>
            </div>
            <p class="resource-item-preview">${card.context.substring(0, 150)}...</p>
            <div class="resource-item-tags">
              ${tags.map(t => `<span class="resource-tag">${t.name}</span>`).join('')}
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderCardsList() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.cards.map(card => {
        const schema = state.schemas.find(s => s.id === card.schema_id);
        const tags = state.tags.filter(t => card.tag_ids?.includes(t.id));
        return `
          <article class="resource-item">
            <div class="resource-item-header">
              <div>
                <h3 class="resource-item-title">${card.title}</h3>
                <p class="resource-item-meta">${schema?.name || 'No schema'}</p>
              </div>
              <span class="resource-item-type">${card.type}</span>
            </div>
            <p class="resource-item-preview">${card.context.substring(0, 150)}...</p>
            <div class="resource-item-tags">
              ${tags.map(t => `<span class="resource-tag">${t.name}</span>`).join('')}
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderSchemasList() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.schemas.map(schema => `
        <article class="resource-item">
          <div class="resource-item-header">
            <h3 class="resource-item-title">${schema.name}</h3>
          </div>
          <p class="resource-item-preview">${schema.description}</p>
          <p class="resource-item-meta">${schema.fields.length} fields</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderTagsList() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.tags.map(tag => `
        <article class="resource-item">
          <div class="resource-item-header">
            <h3 class="resource-item-title">
              <span style="display:inline-block;width:12px;height:12px;background:${tag.color};border-radius:2px;margin-right:8px;"></span>
              ${tag.name}
            </h3>
          </div>
          <p class="resource-item-preview">${tag.description || 'No description'}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderCollectionContent() {
  if (!state.selectedCollectionId) {
    renderEmptyState('Select a collection');
    return;
  }
  
  const collection = state.collections.find(c => c.id === state.selectedCollectionId);
  const collectionCards = state.cards.filter(c => 
    c.tag_ids?.some(tagId => collection?.tag_filter?.includes(tagId))
  ) || state.cards.slice(0, 5); // Fallback to first 5 cards
  
  elements.resourceContent.innerHTML = `
    <div class="collection-header" style="margin-bottom: var(--space-4);">
      <h2 style="font-size: var(--text-lg); font-weight: var(--weight-semibold);">${collection?.name || 'Collection'}</h2>
      <p style="color: var(--color-ink-lighter); font-size: var(--text-sm);">${collection?.description || ''}</p>
    </div>
    <table class="resource-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Schema</th>
          <th>Preview</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${collectionCards.map(card => {
          const schema = state.schemas.find(s => s.id === card.schema_id);
          return `
            <tr>
              <td class="table-title">${card.title}</td>
              <td>${schema?.name || '-'}</td>
              <td class="table-preview">${card.context.substring(0, 60)}...</td>
              <td class="table-actions">
                <button class="resource-action-btn">View</button>
                <button class="resource-action-btn">Edit</button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderEmptyState(message = 'Coming soon') {
  elements.resourceContent.innerHTML = `
    <div class="empty-state">
      <i data-feather="inbox"></i>
      <h3 class="empty-state-title">${message}</h3>
      <p class="empty-state-desc">This section is under development.</p>
    </div>
  `;
  if (typeof feather !== 'undefined') {
    feather.replace({ width: 48, height: 48, 'stroke-width': 1 });
  }
}

// =============================================================================
// NEW TAB RENDERING
// =============================================================================

function renderAgentsContent() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.agents.map(agent => `
        <article class="resource-item">
          <div class="resource-item-header">
            <div>
              <h3 class="resource-item-title">
                <span style="font-size:1.2em;margin-right:8px;">${agent.icon}</span>
                ${agent.name}
              </h3>
              <p class="resource-item-meta">${agent.config.nodes.length} nodes, ${agent.config.edges.length} edges</p>
            </div>
            <span class="resource-item-type" style="background:${agent.color}20;color:${agent.color};">${agent.status}</span>
          </div>
          <p class="resource-item-preview">${agent.description}</p>
          <p class="resource-item-meta">Executed ${agent.total_executions} times • Avg cost: $${agent.avg_cost.toFixed(2)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSchedulerContent() {
  // Default to schedule if no sub-tab selected
  if (!state.subTab) state.subTab = 'schedule';
  
  switch (state.subTab) {
    case 'schedule':
      renderSchedulerOverview();
      break;
    case 'queries':
      renderSchedulerQueries();
      break;
    case 'agents':
      renderSchedulerAgents();
      break;
    case 'outputs':
      renderSchedulerOutputs();
      break;
    case 'cleanups':
      renderSchedulerCleanups();
      break;
    case 'logs':
      renderSchedulerLogs();
      break;
    default:
      renderEmptyState();
  }
}

function renderSchedulerOverview() {
  const totalSources = state.schedulerSources.length;
  const activeSources = state.schedulerSources.filter(s => s.status === 'active').length;
  const totalQueries = state.schedulerQueries.length;
  const activeQueries = state.schedulerQueries.filter(q => q.status === 'active').length;
  const totalOutputs = state.schedulerOutputs.length;
  const activeOutputs = state.schedulerOutputs.filter(o => o.status === 'active').length;
  const totalCleanups = state.schedulerCleanups.length;
  const activeCleanups = state.schedulerCleanups.filter(c => c.status === 'active').length;
  
  // Generate this week's dates (Sunday to Saturday)
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - currentDay + i);
    weekDays.push({
      name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      date: date.getDate(),
      isToday: i === currentDay,
      events: generateMockEvents(i, date)
    });
  }
  
  elements.resourceContent.innerHTML = `
    <div style="padding: var(--space-4);">
      <!-- Week Navigation -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; gap: var(--space-2); align-items: center;">
          <button class="icon-btn" title="Previous Week">◀</button>
          <span style="font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--color-ink);">This Week</span>
          <button class="icon-btn" title="This Week">Today</button>
          <button class="icon-btn" title="Next Week">▶</button>
        </div>
      </div>
      
      <!-- Week Grid -->
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); margin-bottom: var(--space-4);">
        ${weekDays.map(day => `
          <div style="background: var(--color-paper); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-2); min-height: 200px; ${day.isToday ? 'border-color: var(--color-target); border-width: 2px;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); padding-bottom: var(--space-2); border-bottom: 1px solid var(--border-color);">
              <span style="font-weight: var(--weight-semibold); color: ${day.isToday ? 'var(--color-target)' : 'var(--color-ink)'};">${day.name}</span>
              <span style="font-size: var(--text-sm); color: var(--color-ink-lighter);">${day.date}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--space-1);">
              ${day.events.length > 0 ? day.events.map(event => `
                <div style="background: var(--color-accent-subtle); border-left: 3px solid var(--color-ink-light); padding: var(--space-1); border-radius: var(--radius-sm); font-size: var(--text-xs);">
                  <div style="font-weight: var(--weight-medium); color: var(--color-ink);">${event.time}</div>
                  <div style="color: var(--color-ink-lighter);">${event.name}</div>
                </div>
              `).join('') : `
                <div style="text-align: center; padding: var(--space-3); color: var(--color-ink-lighter); font-size: var(--text-xs);">No events</div>
              `}
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Pipeline Stats -->
      <div style="background: var(--color-paper); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-4);">
        <h3 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-3); color: var(--color-ink);">System Pipeline Status</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-3);">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="width: 32px; height: 32px; background: var(--color-accent-subtle); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">📥</div>
              <div>
                <div style="font-size: var(--text-xs); color: var(--color-ink-lighter);">INTAKE</div>
                <div style="font-weight: var(--weight-semibold); color: var(--color-ink);">Sources</div>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: var(--weight-semibold); margin-bottom: var(--space-1); color: var(--color-ink);">${totalSources}</div>
            <div style="font-size: var(--text-xs); color: var(--color-ink-light);">● ${activeSources} active</div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-3);">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="width: 32px; height: 32px; background: var(--color-accent-subtle); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">🔄</div>
              <div>
                <div style="font-size: var(--text-xs); color: var(--color-ink-lighter);">PROCESSING</div>
                <div style="font-weight: var(--weight-semibold); color: var(--color-ink);">Queries</div>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: var(--weight-semibold); margin-bottom: var(--space-1); color: var(--color-ink);">${totalQueries}</div>
            <div style="font-size: var(--text-xs); color: var(--color-ink-light);">● ${activeQueries} active</div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-3);">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="width: 32px; height: 32px; background: var(--color-accent-subtle); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">📤</div>
              <div>
                <div style="font-size: var(--text-xs); color: var(--color-ink-lighter);">OUTPUT</div>
                <div style="font-weight: var(--weight-semibold); color: var(--color-ink);">Outputs</div>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: var(--weight-semibold); margin-bottom: var(--space-1); color: var(--color-ink);">${totalOutputs}</div>
            <div style="font-size: var(--text-xs); color: var(--color-ink-light);">● ${activeOutputs} active</div>
          </div>
          
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--space-3);">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <div style="width: 32px; height: 32px; background: var(--color-accent-subtle); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">🧹</div>
              <div>
                <div style="font-size: var(--text-xs); color: var(--color-ink-lighter);">MAINTENANCE</div>
                <div style="font-weight: var(--weight-semibold); color: var(--color-ink);">Cleanups</div>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: var(--weight-semibold); margin-bottom: var(--space-1); color: var(--color-ink);">${totalCleanups}</div>
            <div style="font-size: var(--text-xs); color: var(--color-ink-light);">● ${activeCleanups} active</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to generate mock events for the weekly calendar
function generateMockEvents(dayIndex, date) {
  const events = [];
  
  // Add some mock scheduled events based on actual data
  if (dayIndex === 1) { // Monday
    events.push({ time: '09:00', name: 'Weekly Research Papers', color: '#3b82f6' });
  }
  
  if (dayIndex === 5) { // Friday
    events.push({ time: '17:00', name: 'Weekly Client Summary', color: '#8b5cf6' });
    events.push({ time: '17:05', name: 'Email Weekly Summary', color: '#ec4899' });
  }
  
  // Add daily events
  if (dayIndex >= 1 && dayIndex <= 5) { // Monday-Friday
    events.push({ time: '22:00', name: 'Client Emails', color: '#3b82f6' });
  }
  
  // Cleanup on Sunday early morning
  if (dayIndex === 0) {
    events.push({ time: '02:00', name: 'Archive Old Emails', color: '#f59e0b' });
  }
  
  // Daily cleanup
  events.push({ time: '03:00', name: 'Delete Failed Imports', color: '#f59e0b' });
  
  return events;
}

function renderSchedulerSources() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.schedulerSources.map(source => `
        <article class="resource-item">
          <div class="resource-item-header">
            <div>
              <h3 class="resource-item-title">${source.name}</h3>
              <p class="resource-item-meta">${source.type.toUpperCase()} • ${source.schedule.cron || source.schedule.trigger}</p>
            </div>
            <span class="resource-item-type" style="background:${source.status === 'active' ? '#10b981' : '#6b7280'}20;color:${source.status === 'active' ? '#10b981' : '#6b7280'};">${source.status}</span>
          </div>
          <p class="resource-item-preview">${source.description}</p>
          <p class="resource-item-meta">Last run: ${new Date(source.last_execution).toLocaleString()} • ${source.last_result_count} results • ${source.total_cards_created} cards created</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSchedulerQueries() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.schedulerQueries.map(query => `
        <article class="resource-item">
          <div class="resource-item-header">
            <div>
              <h3 class="resource-item-title">${query.name}</h3>
              <p class="resource-item-meta">${query.type.toUpperCase()} • ${query.config.model}</p>
            </div>
            <span class="resource-item-type" style="background:var(--color-query-bg);color:var(--color-query);">${query.status}</span>
          </div>
          <p class="resource-item-preview">${query.description}</p>
          <p class="resource-item-meta">Sources: ${query.source_ids.length} • Last run: ${new Date(query.last_execution).toLocaleString()} • ${query.total_cards_created} cards created</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSchedulerAgents() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.agents.map(agent => `
        <article class="resource-item">
          <div class="resource-item-header">
            <div>
              <h3 class="resource-item-title">
                <span style="font-size:1.2em;margin-right:8px;">${agent.icon}</span>
                ${agent.name}
              </h3>
              <p class="resource-item-meta">${agent.config.nodes.length} nodes, ${agent.config.edges.length} edges</p>
            </div>
            <span class="resource-item-type" style="background:var(--color-agent-bg);color:var(--color-agent);">${agent.status}</span>
          </div>
          <p class="resource-item-preview">${agent.description}</p>
          <p class="resource-item-meta">Executed ${agent.total_executions} times • Avg cost: $${agent.avg_cost.toFixed(2)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSchedulerOutputs() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.schedulerOutputs.map(output => `
        <article class="resource-item">
          <div class="resource-item-header">
            <div>
              <h3 class="resource-item-title">${output.name}</h3>
              <p class="resource-item-meta">${output.type.toUpperCase()}</p>
            </div>
            <span class="resource-item-type" style="background:var(--color-output-bg);color:var(--color-output);">${output.status}</span>
          </div>
          <p class="resource-item-preview">${output.description}</p>
          <p class="resource-item-meta">Queries: ${output.query_ids.length} • Last sent: ${new Date(output.last_execution).toLocaleString()} • ${output.total_sends} total sends</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSchedulerCleanups() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.schedulerCleanups.map(cleanup => `
        <article class="resource-item">
          <div class="resource-item-header">
            <div>
              <h3 class="resource-item-title">${cleanup.name}</h3>
              <p class="resource-item-meta">${cleanup.type.toUpperCase()} • ${cleanup.schedule.cron}</p>
            </div>
            <span class="resource-item-type" style="background:var(--color-cleanup-bg);color:var(--color-cleanup);">${cleanup.status}</span>
          </div>
          <p class="resource-item-preview">${cleanup.description}</p>
          <p class="resource-item-meta">Last run: ${new Date(cleanup.last_execution).toLocaleString()} • ${cleanup.total_cards_affected} cards affected</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSchedulerLogs() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.schedulerLogs.map(log => {
        const statusColor = log.status === 'success' ? '#10b981' : log.status === 'error' ? '#ef4444' : '#f59e0b';
        return `
          <article class="resource-item">
            <div class="resource-item-header">
              <div>
                <h3 class="resource-item-title">${log.resource_name}</h3>
                <p class="resource-item-meta">${log.type.toUpperCase()} • ${new Date(log.timestamp).toLocaleString()}</p>
              </div>
              <span class="resource-item-type" style="background:${statusColor}20;color:${statusColor};">${log.status}</span>
            </div>
            <p class="resource-item-preview">${log.message}</p>
            <p class="resource-item-meta">Duration: ${log.duration_ms}ms • ${JSON.stringify(log.details)}</p>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderIntegrationsContent() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.integrations.map(integration => {
        const statusColor = integration.status === 'connected' ? '#10b981' : '#6b7280';
        return `
          <article class="resource-item">
            <div class="resource-item-header">
              <div>
                <h3 class="resource-item-title">${integration.name}</h3>
                <p class="resource-item-meta">${integration.type.toUpperCase()}</p>
              </div>
              <span class="resource-item-type" style="background:${statusColor}20;color:${statusColor};">${integration.status}</span>
            </div>
            <p class="resource-item-preview">${integration.description}</p>
            ${integration.last_verified ? `<p class="resource-item-meta">Last verified: ${new Date(integration.last_verified).toLocaleString()}</p>` : ''}
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderSubscriptionsContent() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.subscriptions.map(sub => {
        const statusColor = sub.status === 'synced' ? '#10b981' : '#f59e0b';
        return `
          <article class="resource-item">
            <div class="resource-item-header">
              <div>
                <h3 class="resource-item-title">${sub.name}</h3>
                <p class="resource-item-meta">${sub.org_name} › ${sub.think_tank_name}</p>
              </div>
              <span class="resource-item-type" style="background:${statusColor}20;color:${statusColor};">${sub.status}</span>
            </div>
            <p class="resource-item-preview">${sub.description}</p>
            <p class="resource-item-meta">${sub.card_count} cards • ${sub.sync_mode} sync${sub.last_synced_at ? ` • Last synced: ${new Date(sub.last_synced_at).toLocaleString()}` : ''}</p>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderOrganizationsContent() {
  elements.resourceContent.innerHTML = `
    <div class="resource-list">
      ${state.organizations.map(org => {
        const statusColor = org.status === 'connected' ? '#10b981' : org.status === 'pending' ? '#f59e0b' : '#6b7280';
        const memberCount = org.available_think_tanks?.filter(tt => tt.status === 'member').length || 0;
        return `
          <article class="resource-item">
            <div class="resource-item-header">
              <div>
                <h3 class="resource-item-title">${org.name}</h3>
                <p class="resource-item-meta">${org.url}</p>
              </div>
              <span class="resource-item-type" style="background:${statusColor}20;color:${statusColor};">${org.status}</span>
            </div>
            <p class="resource-item-preview">${org.description}</p>
            ${org.status === 'connected' ? `
              <p class="resource-item-meta">
                ${memberCount} Think Tank${memberCount !== 1 ? 's' : ''} • 
                ${org.published_collections?.length || 0} Published • 
                ${org.user_email}
              </p>
            ` : '<p class="resource-item-meta">Not connected</p>'}
          </article>
        `;
      }).join('')}
    </div>
  `;
}

// =============================================================================
// MESSAGES RENDERING
// =============================================================================

function renderMessages() {
  elements.messagesContainer.innerHTML = state.messages.map(msg => {
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = msg.role === 'user' ? '👤' : '●';
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    
    return `
      <article class="message-node ${msg.role}">
        <header class="message-header">
          <span class="message-avatar">${avatar}</span>
          <span class="message-role">${role}</span>
          <time class="message-time">${time}</time>
        </header>
        <div class="message-content">
          ${formatMessageContent(msg.content)}
        </div>
        ${msg.role === 'assistant' ? `
          <div class="message-actions">
            <button class="message-action-btn">Save as Card</button>
            <button class="message-action-btn">Copy</button>
          </div>
        ` : ''}
      </article>
    `;
  }).join('');
  
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function formatMessageContent(content) {
  return content.split('\n\n').map(para => `<p>${para}</p>`).join('');
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

function handleInput() {
  const value = elements.inputField.value;
  updateHighlight(value);
  checkCommands(value);
  elements.inputField.style.height = 'auto';
  elements.inputField.style.height = Math.min(elements.inputField.scrollHeight, 200) + 'px';
  validateInput();
}

function handleKeydown(e) {
  if (state.completionVisible) {
    if (e.key === 'ArrowDown') { e.preventDefault(); navigateCompletion(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); navigateCompletion(-1); }
    else if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); selectCompletion(); }
    else if (e.key === 'Escape') { hideCompletion(); }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function updateHighlight(value) {
  let highlighted = escapeHtml(value);
  highlighted = highlighted.replace(/(@\/[^\s]*)/g, '<span class="target">$1</span>');
  highlighted = highlighted.replace(/(#\/[^\s]*)/g, '<span class="operation">$1</span>');
  elements.inputHighlight.innerHTML = highlighted + '\n';
}

function checkCommands(value) {
  const cursorPos = elements.inputField.selectionStart;
  const textBeforeCursor = value.substring(0, cursorPos);
  const targetMatch = textBeforeCursor.match(/@\/([^\s]*)$/);
  const operationMatch = textBeforeCursor.match(/#\/([^\s]*)$/);
  
  if (targetMatch) showCompletion('@/', targetMatch[1]);
  else if (operationMatch) showCompletion('#/', operationMatch[1]);
  else hideCompletion();
}

function validateInput() {
  const value = elements.inputField.value.trim();
  if (state.mode === 'manage') {
    const hasOperation = /#\/[^\s]+/.test(value);
    elements.manageError.classList.toggle('hidden', hasOperation || !value);
    elements.sendBtn.disabled = !value || !hasOperation;
  } else {
    elements.manageError.classList.add('hidden');
    elements.sendBtn.disabled = !value;
  }
}

// =============================================================================
// COMPLETION HELPER
// =============================================================================

function showCompletion(prefix, path) {
  state.currentCommand = { prefix, path, searchQuery: '' };
  state.completionVisible = true;
  state.completionIndex = 0;
  
  // Determine if we need search (for dynamic resources)
  const tree = completionTree[prefix];
  let needsSearch = false;
  
  if (tree) {
    // Check if current path or any child is dynamic
    let current = tree.children;
    const pathParts = path.split('/').filter(Boolean);
    
    // Navigate to current position
    for (let i = 0; i < pathParts.length; i++) {
      const key = pathParts[i] + '/';
      if (current[key]) {
        if (current[key].dynamic) {
          needsSearch = true;
          break;
        }
        current = current[key].children || {};
      }
    }
    
    // Also check if any immediate children are dynamic
    if (!needsSearch && current) {
      for (const key in current) {
        if (current[key].dynamic) {
          needsSearch = true;
          break;
        }
      }
    }
  }
  
  const searchInput = document.getElementById('completion-search');
  if (needsSearch) {
    searchInput.classList.remove('hidden');
    searchInput.value = '';
    
    // Add search event handler
    const handleSearch = () => {
      state.currentCommand.searchQuery = searchInput.value;
      updateCompletionResults();
    };
    
    searchInput.removeEventListener('input', searchInput._searchHandler);
    searchInput._searchHandler = handleSearch;
    searchInput.addEventListener('input', handleSearch);
    
    // Focus search after a brief delay
    setTimeout(() => searchInput.focus(), 100);
  } else {
    searchInput.classList.add('hidden');
  }
  
  updateCompletionResults();
  elements.completionHelper.classList.remove('hidden');
}

function updateCompletionResults() {
  const { prefix, path, searchQuery } = state.currentCommand;
  const completions = getCompletions(prefix, path, searchQuery);
  const typeClass = prefix === '@/' ? 'target' : 'operation';
  
  elements.completionPath.innerHTML = `<span class="${typeClass}">${prefix}${path}</span>`;
  
  if (completions.length === 0) {
    elements.completionList.innerHTML = '<li class="completion-item" style="color:var(--color-ink-lighter);cursor:default;">No results found</li>';
    return;
  }
  
  elements.completionList.innerHTML = completions.map((item, i) => `
    <li class="completion-item ${i === 0 ? 'selected' : ''}" data-path="${item.path}">
      <span class="completion-item-path ${typeClass}">${item.path}</span>
      <span class="completion-item-desc">${item.label}</span>
    </li>
  `).join('');
  
  elements.completionList.querySelectorAll('.completion-item').forEach((item, i) => {
    item.addEventListener('click', () => { state.completionIndex = i; selectCompletion(); });
  });
  
  state.completionIndex = 0;
}

function hideCompletion() {
  state.completionVisible = false;
  state.currentCommand = null;
  elements.completionHelper.classList.add('hidden');
}

function getCompletions(prefix, path, searchQuery = '') {
  const tree = completionTree[prefix];
  if (!tree) return [];
  
  const parts = path.split('/').filter(Boolean);
  let current = tree.children;
  let basePath = '';
  let dynamicKey = null;
  
  // Navigate to current position in tree
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i] + '/';
    if (current[key]) { 
      if (current[key].dynamic) dynamicKey = current[key].dynamic;
      current = current[key].children || {}; 
      basePath += key; 
    } else return [];
  }
  
  const searchTerm = searchQuery || parts[parts.length - 1] || '';
  const results = [];
  
  // Check if current level has dynamic completion
  const currentKey = parts[parts.length - 1];
  if (currentKey && current[currentKey + '/']?.dynamic) {
    dynamicKey = current[currentKey + '/'].dynamic;
    basePath += currentKey + '/';
  }
  
  // If we need dynamic completion
  if (dynamicKey && dynamicResourceMap[dynamicKey]) {
    return getDynamicCompletions(dynamicKey, basePath, searchTerm);
  }
  
  // Static completion from tree
  for (const [key, item] of Object.entries(current)) {
    if (key.toLowerCase().startsWith(searchTerm.toLowerCase())) {
      results.push({ 
        path: basePath + key, 
        label: item.label, 
        final: item.final,
        dynamic: item.dynamic 
      });
    }
  }
  
  return results.slice(0, 5);
}

function getDynamicCompletions(resourceType, basePath, searchTerm) {
  const config = dynamicResourceMap[resourceType];
  if (!config) return [];
  
  let resources = state[config.stateKey] || [];
  
  // Apply filter if specified
  if (config.filter) {
    resources = resources.filter(config.filter);
  }
  
  // Search by display field (case-sensitive as per requirement)
  if (searchTerm) {
    resources = resources.filter(r => 
      r[config.displayField]?.includes(searchTerm)
    );
  }
  
  // Return top 5 results
  return resources.slice(0, 5).map(resource => ({
    path: basePath + resource.id,
    label: `${config.icon} ${resource.id} - ${resource[config.displayField]}`,
    final: true,
    resourceId: resource.id,
    resourceData: resource
  }));
}

function navigateCompletion(direction) {
  const items = elements.completionList.querySelectorAll('.completion-item');
  if (!items.length) return;
  items[state.completionIndex].classList.remove('selected');
  state.completionIndex = (state.completionIndex + direction + items.length) % items.length;
  items[state.completionIndex].classList.add('selected');
}

function selectCompletion() {
  const items = elements.completionList.querySelectorAll('.completion-item');
  const selected = items[state.completionIndex];
  if (!selected) return;
  
  const path = selected.dataset.path;
  const { prefix } = state.currentCommand;
  const value = elements.inputField.value;
  const cursorPos = elements.inputField.selectionStart;
  const beforeCommand = value.substring(0, cursorPos).replace(new RegExp(`${escapeRegex(prefix)}[^\\s]*$`), '');
  const afterCursor = value.substring(cursorPos);
  
  elements.inputField.value = beforeCommand + prefix + path + (path.endsWith('/') ? '' : ' ') + afterCursor.trimStart();
  handleInput();
  if (!path.endsWith('/')) hideCompletion();
}

// =============================================================================
// SEND HANDLING
// =============================================================================

function handleSend() {
  const value = elements.inputField.value.trim();
  if (!value) return;
  
  if (state.mode === 'manage') {
    const match = value.match(/#\/([^\s]+)/);
    if (match) showGeneratedUI(match[1], value);
  } else {
    addMessage('user', value);
    setTimeout(() => addMessage('assistant', 'This is a simulated response.'), 1000);
  }
  
  elements.inputField.value = '';
  elements.inputHighlight.innerHTML = '';
  elements.inputField.style.height = 'auto';
  validateInput();
}

function addMessage(role, content) {
  state.messages.push({ id: 'msg-' + Date.now(), role, content, timestamp: new Date().toISOString() });
  renderMessages();
}

function showGeneratedUI(operation, prompt) {
  const overlay = document.getElementById('generated-ui-overlay');
  const parts = operation.split('/');
  const action = parts[0];
  const resource = parts[1] || 'item';
  
  overlay.innerHTML = `
    <div class="generated-form">
      <div class="generated-form-header">
        <h2 class="generated-form-title">${action} ${resource}</h2>
        <button class="generated-form-close" onclick="hideGeneratedUI()">&times;</button>
      </div>
      <p class="form-hint" style="margin-bottom:var(--space-4);">Generated from: "${prompt.substring(0, 50)}..."</p>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" class="form-input" value="New ${resource}" />
      </div>
      <div class="form-actions">
        <button class="form-btn form-btn-secondary" onclick="hideGeneratedUI()">Cancel</button>
        <button class="form-btn form-btn-primary" onclick="hideGeneratedUI()">Save</button>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

window.hideGeneratedUI = function() {
  document.getElementById('generated-ui-overlay').classList.add('hidden');
};

// =============================================================================
// MODALS & COLLECTIONS
// =============================================================================

function renderCollections() {
  elements.collectionsList.innerHTML = state.collections.map(col => `
    <div class="collection-item ${state.activeContextIds.includes(col.id) ? 'selected' : ''}" data-id="${col.id}">
      <div class="collection-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div class="collection-info">
        <div class="collection-name">${col.name}</div>
        <div class="collection-count">${col.card_count} cards</div>
      </div>
    </div>
  `).join('');
  
  elements.collectionsList.querySelectorAll('.collection-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      state.activeContextIds = state.activeContextIds.includes(id)
        ? state.activeContextIds.filter(i => i !== id)
        : [...state.activeContextIds, id];
      renderCollections();
      document.querySelector('.context-count').textContent = state.activeContextIds.length;
    });
  });
}

function openModal(modalId) {
  elements.modalOverlay.classList.remove('hidden');
  document.getElementById(`${modalId}-modal`).classList.remove('hidden');
}

function closeModal() {
  elements.modalOverlay.classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// =============================================================================
// UTILITIES
// =============================================================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// START
// =============================================================================

init();
