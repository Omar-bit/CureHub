import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Calendar,
  User,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  MoreVertical,
  FileText,
  Phone,
  CreditCard,
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};

const categoryIcons = {
  RENDEZ_VOUS: Calendar,
  DOCUMENTS: FileText,
  CONTACTER: Phone,
  PAIEMENTS: CreditCard,
  AUTRE: MoreVertical,
};

const categoryColors = {
  RENDEZ_VOUS: 'text-blue-600',
  DOCUMENTS: 'text-purple-600',
  CONTACTER: 'text-green-600',
  PAIEMENTS: 'text-orange-600',
  AUTRE: 'text-gray-600',
};

const TaskCard = ({
  task,
  onToggleCompletion,
  onEdit,
  onDelete,
  onPatientClick,
}) => {
  const CategoryIcon = categoryIcons[task.category] || MoreVertical;
  const isOverdue =
    task.deadline &&
    !task.completed &&
    isAfter(new Date(), new Date(task.deadline));

  const handleToggleCompletion = (e) => {
    e.stopPropagation();
    onToggleCompletion(task.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  const handlePatientClick = (e) => {
    e.stopPropagation();
    if (task.patient && onPatientClick) {
      onPatientClick(task.patient);
    }
  };

  return (
    <Card
      className={`p-4 mb-3 transition-all duration-200 hover:shadow-md cursor-pointer bg-white border-orange-200 rounded-lg ${
        task.completed ? 'opacity-75' : ''
      } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-3 flex-1'>
          {/* Category Icon */}
          <div
            className={`p-2 rounded-full ${
              task.category === 'CONTACTER' ? 'bg-green-100' : 'bg-orange-100'
            }`}
          >
            <CategoryIcon
              className={`h-4 w-4 ${
                task.category === 'CONTACTER'
                  ? 'text-green-600'
                  : 'text-orange-600'
              }`}
            />
          </div>

          {/* Task Content */}
          <div className='flex-1 min-w-0'>
            {/* Title */}
            <h3
              className={`font-semibold text-gray-900 mb-1 ${
                task.completed ? 'line-through text-gray-500' : ''
              }`}
            >
              {task.title.toUpperCase()}
            </h3>

            {/* Description */}
            {task.description && (
              <p
                className={`text-sm text-gray-600 mb-2 ${
                  task.completed ? 'line-through' : ''
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Patient and Deadline Info */}
            <div className='flex items-center space-x-4 text-sm text-gray-600'>
              {/* Patient */}
              {task.patient && (
                <button
                  onClick={handlePatientClick}
                  className='flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors'
                >
                  <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600'>
                    {task.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{task.patient.name}</span>
                </button>
              )}

              {/* Deadline */}
              {task.deadline && (
                <div
                  className={`flex items-center space-x-1 text-xs ${
                    isOverdue ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  <span>
                    avant le{' '}
                    {format(new Date(task.deadline), 'dd/MM/yyyy', {
                      locale: fr,
                    })}
                  </span>
                  {isOverdue && (
                    <AlertCircle className='h-3 w-3 text-red-500' />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Checkbox - Moved to the right */}
        <div className='flex items-center space-x-2 ml-2'>
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleCompletion}
            className='w-5 h-5 rounded-full'
          />
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
