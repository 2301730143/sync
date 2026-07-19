import { Draggable } from '@hello-pangea/dnd';
import { Link2, Sparkles } from 'lucide-react';
import { Avatar } from '../common/Common';
import { PRIORITY_META } from '../../utils/taskMeta';
import { deadlineLabel, isOverdue } from '../../utils/format';

export default function TaskCard({ task, index, onClick }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`card p-3.5 cursor-pointer transition-shadow ${snapshot.isDragging ? 'shadow-glow' : 'hover:border-signal/30'}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-ink2-primary leading-snug">{task.title}</p>
            {task.source === 'AI' && <Sparkles size={13} className="text-signal shrink-0 mt-0.5" title="AI-generated" />}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`badge ${PRIORITY_META[task.priority]?.className}`}>{PRIORITY_META[task.priority]?.label}</span>
              {task.dependsOn?.length > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-ink2-faint" title="Has dependencies">
                  <Link2 size={11} /> {task.dependsOn.length}
                </span>
              )}
            </div>
            {task.owner ? (
              <Avatar name={task.owner.name} size={22} />
            ) : (
              <span className="text-xs text-ink2-faint">Unassigned</span>
            )}
          </div>

          {task.deadline && (
            <p className={`text-xs mt-2 ${isOverdue(task.deadline, task.status) ? 'text-alert font-medium' : 'text-ink2-faint'}`}>
              {deadlineLabel(task.deadline)}
            </p>
          )}
        </div>
      )}
    </Draggable>
  );
}
