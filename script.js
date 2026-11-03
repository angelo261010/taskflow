'use strict';

// TaskFlow: aplicação sem frameworks, API ou backend.
// Os dados são guardados somente no localStorage deste navegador.

const STORAGE_KEY = 'taskflow_tasks_v1';
const THEME_KEY = 'taskflow_theme_v1';
const STATUSES = ['todo', 'doing', 'done'];
const STATUS_NAMES = { todo: 'A Fazer', doing: 'Em Andamento', done: 'Concluída' };
const PRIORITY_NAMES = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

let tasks = loadTasks();
let draggedTaskId = null;
let toastTimeout;

const $ = (selector) => document.querySelector(selector);
const elements = {
  modal: $('#taskModal'), form: $('#taskForm'), title: $('#taskTitle'),
  description: $('#taskDescription'), priority: $('#taskPriority'),
  dueDate: $('#taskDueDate'), status: $('#taskStatus'), category: $('#taskCategory'),
  id: $('#taskId'), error: $('#formError'), search: $('#searchInput'),
  priorityFilter: $('#priorityFilter'), statusFilter: $('#statusFilter')
};

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(task => task && typeof task.id === 'string' &&
      typeof task.title === 'string' && STATUSES.includes(task.status));
  } catch (error) {
    console.error('Não foi possível carregar as tarefas:', error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Não foi possível salvar as tarefas:', error);
    showToast('Não foi possível salvar. Verifique o armazenamento do navegador.');
  }
}

function createId() {
  return (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFilteredTasks() {
  const term = elements.search.value.trim().toLocaleLowerCase('pt-BR');
  const priority = elements.priorityFilter.value;
  const status = elements.statusFilter.value;
  return tasks.filter(task => {
    const matchesTitle = !term || task.title.toLocaleLowerCase('pt-BR').includes(term);
    const matchesPriority = !priority || task.priority === priority;
    const matchesStatus = !status || task.status === status;
    return matchesTitle && matchesPriority && matchesStatus;
  });
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function formatDate(dateString) {
  if (!dateString) return 'Sem prazo';
  // Construir a data no horário local evita diferenças de fuso em datas YYYY-MM-DD.
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = task.dueDate.split('-').map(Number);
  return new Date(year, month - 1, day) < today;
}

function renderTask(task) {
  const overdue = isOverdue(task);
  const description = task.description
    ? `<p class="task-description">${escapeHTML(task.description)}</p>` : '';
  const category = task.category
    ? `<span class="category-tag">${escapeHTML(task.category)}</span>` : '<span></span>';
  const moveOptions = STATUSES.filter(status => status !== task.status)
    .map(status => `<button type="button" data-action="move" data-id="${escapeHTML(task.id)}" data-status="${status}">Mover: ${STATUS_NAMES[status]}</button>`).join('');
  return `
    <article class="task-card" draggable="true" data-task-id="${escapeHTML(task.id)}">
      <div class="task-card-top">
        <span class="priority ${task.priority}">${PRIORITY_NAMES[task.priority] || 'Média'}</span>
        <button class="task-menu" type="button" data-action="edit" data-id="${escapeHTML(task.id)}" aria-label="Editar ${escapeHTML(task.title)}" title="Editar tarefa">···</button>
      </div>
      <h4>${escapeHTML(task.title)}</h4>
      ${description}
      <div class="task-meta">
        ${category}
        <span class="due ${overdue ? 'overdue' : ''}">${overdue ? '⚠ Atrasada · ' : '◷ '}${formatDate(task.dueDate)}</span>
      </div>
      <div class="task-actions">
        <button type="button" data-action="edit" data-id="${escapeHTML(task.id)}">Editar</button>
        <button type="button" data-action="delete" data-id="${escapeHTML(task.id)}">Excluir</button>
      </div>
      ${moveOptions ? `<div class="task-actions">${moveOptions}</div>` : ''}
    </article>`;
}

function render() {
  const filtered = getFilteredTasks();
  const listIds = { todo: '#todoList', doing: '#doingList', done: '#doneList' };
  const countIds = { todo: '#todoCount', doing: '#doingCount', done: '#doneColumnCount' };

  STATUSES.forEach(status => {
    const inColumn = filtered.filter(task => task.status === status);
    $(listIds[status]).innerHTML = inColumn.length
      ? inColumn.map(renderTask).join('')
      : `<div class="empty-state">${tasks.length ? 'Nenhuma tarefa corresponde aos filtros.' : 'Nenhuma tarefa por aqui ainda.'}</div>`;
    $(countIds[status]).textContent = inColumn.length;
  });

  const total = tasks.length;
  const pending = tasks.filter(task => task.status === 'todo').length;
  const doing = tasks.filter(task => task.status === 'doing').length;
  const done = tasks.filter(task => task.status === 'done').length;
  $('#totalCount').textContent = total;
  $('#pendingCount').textContent = pending;
  $('#progressCount').textContent = doing;
  $('#doneCount').textContent = done;

  const rate = total ? Math.round((done / total) * 100) : 0;
  $('#completionRate').textContent = `${rate}%`;
  $('#progressFill').style.width = `${rate}%`;
  $('#progressFoot').textContent = total
    ? `${done} de ${total} tarefa(s) concluída(s).`
    : 'Comece adicionando sua primeira tarefa.';

  renderChart({ todo: pending, doing, done });
}

function renderChart(counts) {
  const chart = $('#distributionChart');
  const values = [counts.todo, counts.doing, counts.done];
  const max = Math.max(...values);
  if (!max) {
    chart.innerHTML = '<div class="chart-empty">Adicione tarefas para visualizar os dados.</div>';
    return;
  }
  const statuses = [
    { key: 'todo', label: 'A Fazer' },
    { key: 'doing', label: 'Andamento' },
    { key: 'done', label: 'Concluídas' }
  ];
  chart.innerHTML = statuses.map(item => {
    const height = Math.max(5, (counts[item.key] / max) * 58);
    return `<div class="chart-bar-group"><div class="chart-bar ${item.key}" style="height:${height}px" title="${counts[item.key]} tarefa(s)"></div><small>${counts[item.key]}</small></div>`;
  }).join('');
}

function openModal(task = null, initialStatus = 'todo') {
  elements.form.reset();
  elements.id.value = task?.id || '';
  elements.title.value = task?.title || '';
  elements.description.value = task?.description || '';
  elements.priority.value = task?.priority || 'media';
  elements.dueDate.value = task?.dueDate || '';
  elements.status.value = task?.status || initialStatus;
  elements.category.value = task?.category || '';
  elements.error.textContent = '';
  $('#modalTitle').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
  $('#saveTaskButton').textContent = task ? 'Salvar alterações' : 'Salvar tarefa';
  elements.modal.classList.add('open');
  elements.modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => elements.title.focus(), 30);
}

function closeModal() {
  elements.modal.classList.remove('open');
  elements.modal.setAttribute('aria-hidden', 'true');
  elements.form.reset();
  elements.id.value = '';
  elements.error.textContent = '';
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
}

function saveTask(event) {
  event.preventDefault();
  const title = elements.title.value.trim();
  if (!title) {
    elements.error.textContent = 'Informe um título para a tarefa.';
    elements.title.focus();
    return;
  }

  const id = elements.id.value;
  const existing = tasks.find(task => task.id === id);
  const taskData = {
    id: id || createId(),
    title,
    description: elements.description.value.trim(),
    priority: elements.priority.value,
    dueDate: elements.dueDate.value,
    status: elements.status.value,
    category: elements.category.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    tasks = tasks.map(task => task.id === id ? taskData : task);
    showToast('Tarefa atualizada com sucesso.');
  } else {
    tasks.unshift(taskData);
    showToast('Tarefa criada com sucesso.');
  }
  saveTasks();
  render();
  closeModal();
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (task) openModal(task);
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  if (!confirm(`Deseja excluir a tarefa "${task.title}"?`)) return;
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  render();
  showToast('Tarefa excluída.');
}

function moveTask(id, status) {
  if (!STATUSES.includes(status)) return;
  const task = tasks.find(item => item.id === id);
  if (!task || task.status === status) return;
  task.status = status;
  task.updatedAt = new Date().toISOString();
  saveTasks();
  render();
  showToast(`Tarefa movida para "${STATUS_NAMES[status]}".`);
}

function handleTaskAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id, status } = button.dataset;
  if (action === 'edit') editTask(id);
  if (action === 'delete') deleteTask(id);
  if (action === 'move') moveTask(id, status);
}

function clearFilters() {
  elements.search.value = '';
  elements.priorityFilter.value = '';
  elements.statusFilter.value = '';
  render();
}

function setupDragAndDrop() {
  $('#kanban').addEventListener('dragstart', event => {
    const card = event.target.closest('.task-card');
    if (!card) return;
    draggedTaskId = card.dataset.taskId;
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedTaskId);
  });

  $('#kanban').addEventListener('dragend', event => {
    const card = event.target.closest('.task-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(column => column.classList.remove('drag-over'));
    draggedTaskId = null;
  });

  document.querySelectorAll('[data-dropzone]').forEach(zone => {
    zone.addEventListener('dragover', event => {
      event.preventDefault();
      zone.closest('.kanban-column').classList.add('drag-over');
      event.dataTransfer.dropEffect = 'move';
    });
    zone.addEventListener('dragleave', event => {
      if (!zone.contains(event.relatedTarget)) zone.closest('.kanban-column').classList.remove('drag-over');
    });
    zone.addEventListener('drop', event => {
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain') || draggedTaskId;
      zone.closest('.kanban-column').classList.remove('drag-over');
      moveTask(id, zone.dataset.dropzone);
    });
  });
}

function setupTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') document.body.classList.add('dark');
  updateThemeButton();
  $('#themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
    updateThemeButton();
  });
}

function updateThemeButton() {
  $('#themeToggle').textContent = document.body.classList.contains('dark') ? '☀' : '☾';
  $('#themeToggle').title = document.body.classList.contains('dark') ? 'Ativar tema claro' : 'Ativar tema escuro';
}

function setupExport() {
  // O botão de exportação fica disponível pelo atalho Ctrl/Cmd + Shift + E.
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      exportTasks();
    }
  });
}

function exportTasks() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Backup JSON exportado.');
}

function setDates() {
  const now = new Date();
  $('#todayLabel').textContent = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  $('#fullDate').textContent = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function init() {
  setDates();
  setupTheme();
  setupDragAndDrop();
  setupExport();
  render();

  $('#openTaskModal').addEventListener('click', () => openModal());
  $('#closeTaskModal').addEventListener('click', closeModal);
  $('#cancelTask').addEventListener('click', closeModal);
  elements.form.addEventListener('submit', saveTask);
  elements.search.addEventListener('input', render);
  elements.priorityFilter.addEventListener('change', render);
  elements.statusFilter.addEventListener('change', render);
  $('#clearFilters').addEventListener('click', clearFilters);
  $('#kanban').addEventListener('click', handleTaskAction);
  document.querySelectorAll('[data-add-status]').forEach(button => {
    button.addEventListener('click', () => openModal(null, button.dataset.addStatus));
  });

  elements.modal.addEventListener('click', event => {
    if (event.target === elements.modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && elements.modal.classList.contains('open')) closeModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
