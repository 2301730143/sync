import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useProjectContext } from '../context/ProjectContext';
import TaskModal from '../components/tasks/TaskModal';
import { EmptyState } from '../components/common/Common';
import { CalendarDays } from 'lucide-react';

const STATUS_COLOR = {
  TODO: '#8B90A8',
  IN_PROGRESS: '#5B8DEF',
  COMPLETED: '#4ADE80',
};

export default function Timeline() {
  const { tasks } = useProjectContext();
  const [activeTask, setActiveTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const withDeadlines = tasks.filter((t) => t.deadline);

  const events = useMemo(
    () =>
      withDeadlines.map((t) => ({
        id: t.id,
        title: t.title,
        date: t.deadline.slice(0, 10),
        color: STATUS_COLOR[t.status],
        extendedProps: { task: t },
      })),
    [withDeadlines]
  );

  function handleEventClick(info) {
    setActiveTask(info.event.extendedProps.task);
    setModalOpen(true);
  }

  return (
    <div className="p-6">
      {withDeadlines.length === 0 ? (
        <div className="card"><EmptyState icon={CalendarDays} title="No deadlines scheduled" description="Tasks with a deadline will appear here on the calendar." /></div>
      ) : (
        <div className="card p-4 syncmind-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
          />
        </div>
      )}

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} task={activeTask} />
    </div>
  );
}
