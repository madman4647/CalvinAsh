import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMenu } from 'react-icons/fi';

function SortableItem({ item, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id || item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-4 p-4 rounded-lg border bg-white ${
        isDragging ? 'shadow-lg border-primary-400 opacity-90' : 'border-gray-200 hover:border-primary-300'
      } transition-all`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-800 text-white font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800">{item.name || item.committeeName}</p>
        {item.type && (
          <p className="text-xs text-gray-500 capitalize">{item.type}</p>
        )}
      </div>
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-primary-600 cursor-grab active:cursor-grabbing p-1"
        aria-label="Drag to reorder"
      >
        <FiMenu size={20} />
      </button>
    </div>
  );
}

export default function DragDropRanking({ items = [], onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => (i.id || i._id) === active.id);
    const newIndex = items.findIndex((i) => (i.id || i._id) === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    onReorder && onReorder(newItems);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items to rank. Submit applications first.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id || i._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItem key={item.id || item._id} item={item} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
