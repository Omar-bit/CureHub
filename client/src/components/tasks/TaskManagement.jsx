import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { SearchBar } from '../ui/search-bar';
import { ConfirmDialog } from '../ui/confirm-dialog';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { taskAPI, patientAPI } from '../../services/api';
import { showSuccess, showError } from '../../lib/toast';
import { splitPatientName } from '../../lib/patient';
import { useAgenda } from '../../contexts/AgendaContext';
import {
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  X,
} from 'lucide-react';

const TaskManagement = () => {
  const { updateIncompleteTaskCount } = useAgenda();
  const [tasks, setTasks] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [completionFilter, setCompletionFilter] = useState('');

  const renderPatientLabel = (patient) => {
    if (!patient) return '';
    if (patient.name) {
      const { firstName, lastName } = splitPatientName(patient.name);
      const full = `${firstName} ${lastName}`.trim();
      if (full) return full;
    }
    return (
      `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
      patient.name ||
      ''
    );
  };

  const matchesSearchTerm = (task, term) => {
    const lowered = term.toLowerCase();
    if (task.title && task.title.toLowerCase().includes(lowered)) return true;
    if (task.description && task.description.toLowerCase().includes(lowered))
      return true;

    const patientList =
      (task.patients && task.patients.length > 0
        ? task.patients
        : task.patient
          ? [task.patient]
          : []) || [];

    return patientList.some((patient) =>
      renderPatientLabel(patient).toLowerCase().includes(lowered)
    );
  };

  const priorityLabels = {
    LOW: 'Faible',
    MEDIUM: 'Moyenne',
    HIGH: 'Haute',
    URGENT: 'Urgente',
  };

  const categoryLabels = {
    RENDEZ_VOUS: 'Rendez-vous',
    DOCUMENTS: 'Documents',
    CONTACTER: 'Contacter',
    PAIEMENTS: 'Paiements',
    AUTRE: 'Autre',
  };

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadPatients();
    loadStats();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];

    if (searchTerm) {
      filtered = filtered.filter((task) => matchesSearchTerm(task, searchTerm));
    }

    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((task) => task.category === categoryFilter);
    }

    if (completionFilter !== '') {
      const isCompleted = completionFilter === 'true';
      filtered = filtered.filter((task) => task.completed === isCompleted);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, priorityFilter, categoryFilter, completionFilter]);

  const loadTasks = async () => {
    try {
      const data = await taskAPI.getAll();
      setTasks(data);
    } catch (error) {
      showError('Erreur lors du chargement des tâches');
      console.error('Failed to load tasks:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await patientAPI.getAll();
      setPatients(data?.patients || data || []);
    } catch (error) {
      showError('Erreur lors du chargement des patients');
      console.error('Failed to load patients:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await taskAPI.getStats();
      setStats(data);
      // Update the context with the incomplete task count
      updateIncompleteTaskCount(data.pendingTasks || 0);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingTask) {
        await taskAPI.update(editingTask.id, formData);
        showSuccess('Tâche mise à jour avec succès');
      } else {
        await taskAPI.create(formData);
        showSuccess('Tâche créée avec succès');
      }

      setShowForm(false);
      setEditingTask(null);
      await loadTasks();
      await loadStats();
    } catch (error) {
      showError(
        editingTask
          ? 'Erreur lors de la mise à jour'
          : 'Erreur lors de la création'
      );
      console.error('Failed to save task:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleToggleCompletion = async (taskId) => {
    try {
      await taskAPI.toggleCompletion(taskId);
      await loadTasks();
      await loadStats();
    } catch (error) {
      showError('Erreur lors de la mise à jour du statut');
      console.error('Failed to toggle completion:', error);
    }
  };

  const handleDeleteTask = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteDialog(true);
    setShowForm(false);
    setEditingTask(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setTaskToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      await taskAPI.delete(taskToDelete);
      showSuccess('Tâche supprimée avec succès');
      await loadTasks();
      await loadStats();
    } catch (error) {
      showError('Erreur lors de la suppression');
      console.error('Failed to delete task:', error);
    } finally {
      setShowDeleteDialog(false);
      setTaskToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setCategoryFilter('');
    setCompletionFilter('');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4'></div>
          <p className='text-gray-500'>Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <TaskForm
        task={editingTask}
        patients={patients}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        onDelete={handleDeleteTask}
        isLoading={formLoading}
      />
    );
  }

  return (
    <div className='p-4 sm:p-6 h-full flex flex-col bg-orange-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <h1 className='text-xl font-semibold text-orange-900'>Tâches</h1>
          <Button
            onClick={handleCreateTask}
            size='sm'
            className='bg-orange-500 hover:bg-orange-600 text-white rounded-full'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        {/* <Button
          variant='ghost'
          size='sm'
          className='text-orange-700 hover:text-orange-900'
        >
          <X className='h-4 w-4' />
        </Button> */}
      </div>

      {/* Search Bar */}
      <div className='mb-6'>
        <SearchBar
          placeholder='Saisie rapide'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='bg-white rounded-full border-orange-200 focus:border-orange-500 shadow-sm'
        />
      </div>

      {/* Filter Tabs */}
      <div className='flex flex-wrap gap-2 mb-6'>
        <Button
          variant={completionFilter === '' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setCompletionFilter('')}
          className={`rounded-full ${completionFilter === ''
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'border-orange-300 text-orange-700 hover:bg-orange-100'
            }`}
        >
          À faire
        </Button>

        <Button
          variant={completionFilter === 'false' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setCompletionFilter('false')}
          className={`rounded-full ${completionFilter === 'false'
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'border-orange-300 text-orange-700 hover:bg-orange-100'
            }`}
        >
          À venir
        </Button>

        <Button
          variant={completionFilter === 'true' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setCompletionFilter('true')}
          className={`rounded-full ${completionFilter === 'true'
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'border-orange-300 text-orange-700 hover:bg-orange-100'
            }`}
        >
          Effectuées
        </Button>
      </div>

      {/* Old Filters Section - Keep hidden for functionality but use new design above */}
      <div className='hidden'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'></div>
      </div>

      {/* Tasks List */}
      <div className='flex-1 overflow-y-auto space-y-3'>
        {filteredTasks.length === 0 ? (
          <div className='text-center py-12'>
            <Calendar className='h-12 w-12 text-orange-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-orange-900 mb-2'>
              {tasks.length === 0 ? 'Aucune tâche' : 'Aucune tâche trouvée'}
            </h3>
            <p className='text-orange-600 mb-4'>
              {tasks.length === 0
                ? 'Créez votre première tâche pour commencer'
                : 'Essayez de modifier vos filtres'}
            </p>
            {tasks.length === 0 && (
              <Button
                onClick={handleCreateTask}
                className='bg-orange-500 hover:bg-orange-600 rounded-full'
              >
                <Plus className='h-4 w-4 mr-2' />
                Créer une tâche
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleCompletion={handleToggleCompletion}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onPatientClick={() => { }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={confirmDelete}
        title='Supprimer la tâche'
        message='Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.'
        confirmText='Supprimer'
        cancelText='Annuler'
        variant='destructive'
      />
    </div>
  );
};

export default TaskManagement;
