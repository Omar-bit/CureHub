import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import TaskCard from './tasks/TaskCard';
import TaskForm from './tasks/TaskForm';
import { Button } from './ui/button';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PatientTasksTab = ({ patient, onPatientClick }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      fetchPatientTasks();
    }
  }, [patient?.id]);

  const fetchPatientTasks = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      const response = await taskAPI.getAll({ patientId: patient.id });
      setTasks(response || []);
    } catch (error) {
      console.error('Error fetching patient tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (taskId) => {
    try {
      await taskAPI.toggleCompletion(taskId);
      toast.success('Statut de la tâche mis à jour');
      fetchPatientTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      await taskAPI.delete(taskId);
      toast.success('Tâche supprimée avec succès');
      fetchPatientTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression de la tâche');
    }
  };

  const handleSubmit = async (taskData) => {
    setSubmitting(true);
    try {
      // Ensure the patient is included in the task
      const dataToSubmit = {
        ...taskData,
        patientIds: [patient.id],
      };

      if (editingTask) {
        await taskAPI.update(editingTask.id, dataToSubmit);
        toast.success('Tâche mise à jour avec succès');
      } else {
        await taskAPI.create(dataToSubmit);
        toast.success('Tâche créée avec succès');
      }

      setShowTaskForm(false);
      setEditingTask(null);
      fetchPatientTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(
        editingTask
          ? 'Erreur lors de la mise à jour de la tâche'
          : 'Erreur lors de la création de la tâche'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleDeleteFromForm = async () => {
    if (editingTask) {
      await handleDelete(editingTask.id);
      setShowTaskForm(false);
      setEditingTask(null);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );
  }

  if (showTaskForm) {
    return (
      <div className='space-y-4'>
        <TaskForm
          task={editingTask}
          patients={[patient]}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={handleDeleteFromForm}
          isLoading={submitting}
          readOnlyPatients={true}
        />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with Add Button */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Tâches liées au patient
        </h3>
        <Button
          onClick={() => setShowTaskForm(true)}
          size='sm'
          className='flex items-center gap-2'
        >
          <Plus className='w-4 h-4' />
          Nouvelle tâche
        </Button>
      </div>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <div className='space-y-3'>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleCompletion={handleToggleCompletion}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPatientClick={onPatientClick}
            />
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <AlertCircle className='w-12 h-12 mx-auto mb-4 text-gray-400' />
          <p className='text-gray-600 mb-4'>Aucune tâche pour ce patient</p>
          <Button
            onClick={() => setShowTaskForm(true)}
            variant='outline'
            className='flex items-center gap-2'
          >
            <Plus className='w-4 h-4' />
            Créer une tâche
          </Button>
        </div>
      )}
    </div>
  );
};

export default PatientTasksTab;
