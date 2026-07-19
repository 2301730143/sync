import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectContext } from '../context/ProjectContext';
import { taskService } from '../services/projectService';
import KanbanColumn from '../components/kanban/KanbanColumn';
import TaskModal from '../components/tasks/TaskModal';
import { KANBAN_COLUMNS } from '../utils/taskMeta';

export default function Kanban() {
  const { tasks, refreshTasks, refreshOverview } = useProjectContext();
  const [localTasks, setLocalTasks] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const displayTasks = localTasks || tasks;

  function openNew() {
    setActiveTask(null);
    setModalOpen(true);
  }
  function openEdit(task) {
    setActiveTask(task);
    setModalOpen(true);
  }
  async function closeModal() {
    setModalOpen(false);
    setLocalTasks(null);
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const newStatus = destination.droppableId;
    const previous = displayTasks;

    // 1. Optimistic update
    const optimistic = displayTasks.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t));
    setLocalTasks(optimistic);

    // 2. Persist
    try {
      await taskService.updateStatus(draggableId, newStatus);
      await Promise.all([refreshTasks(), refreshOverview()]);
      setLocalTasks(null);
    } catch (err) {
      // 3. Roll back on failure
      setLocalTasks(previous);
      toast.error(err.message || 'Could not move task');
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> New task
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={displayTasks.filter((t) => t.status === col.id)}
              onTaskClick={openEdit}
            />
          ))}
        </div>
      </DragDropContext>

      <TaskModal open={modalOpen} onClose={closeModal} task={activeTask} />
    </div>
  );
}
