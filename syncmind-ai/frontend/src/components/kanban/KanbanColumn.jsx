import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

export default function KanbanColumn({ column, tasks, onTaskClick }) {
  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-medium text-ink2-primary">{column.title}</h3>
        <span className="text-xs text-ink2-faint bg-surface-raised rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-2xl p-2 space-y-2.5 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-surface-raised/60' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
