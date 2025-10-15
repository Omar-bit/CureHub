import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '../lib/toast';
import { api } from '../services/api';
import { Button } from './ui/button';
import { SheetContent, SheetFooter } from './ui/sheet';
import { FormInput, FormSelect, FormTextarea } from './ui/form-field';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ConfirmDialog } from './ui/confirm-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CalendarDays,
  Target,
} from 'lucide-react';

const EventTypeIcon = ({ type }) => {
  switch (type) {
    case 'JOUR':
      return <CalendarDays className='h-4 w-4' />;
    case 'PLAGE':
      return <Clock className='h-4 w-4' />;
    case 'PONCTUEL':
      return <Target className='h-4 w-4' />;
    default:
      return <Calendar className='h-4 w-4' />;
  }
};

const EventTypeLabel = ({ type }) => {
  switch (type) {
    case 'JOUR':
      return 'Jour';
    case 'PLAGE':
      return 'Plage';
    case 'PONCTUEL':
      return 'Ponctuel';
    default:
      return type;
  }
};

const EventFormSheet = ({ event, isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'JOUR',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    blockAppointments: false,
    isRecurring: false,
    color: '#8B5CF6',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'JOUR',
        startDate: event.startDate
          ? new Date(event.startDate).toISOString().split('T')[0]
          : '',
        endDate: event.endDate
          ? new Date(event.endDate).toISOString().split('T')[0]
          : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        blockAppointments: event.blockAppointments || false,
        isRecurring: event.isRecurring || false,
        color: event.color || '#8B5CF6',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        eventType: 'JOUR',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        blockAppointments: false,
        isRecurring: false,
        color: '#8B5CF6',
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const eventData = {
        ...formData,
        // Only include endDate for PLAGE type events
        endDate: formData.eventType === 'PLAGE' ? formData.endDate : null,
        // Only include times for PLAGE and PONCTUEL type events
        startTime: formData.eventType !== 'JOUR' ? formData.startTime : null,
        endTime: formData.eventType === 'PLAGE' ? formData.endTime : null,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (!isOpen) return null;

  const eventTypeOptions = [
    { value: 'JOUR', label: 'Jour' },
    { value: 'PLAGE', label: 'Plage' },
    { value: 'PONCTUEL', label: 'Ponctuel' },
  ];

  return (
    <SheetContent
      title={event ? "Modifier l'évènement" : 'Nouvel évènement'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Event Type */}
        <FormSelect
          label='Type'
          name='eventType'
          value={formData.eventType}
          onChange={handleChange}
          options={eventTypeOptions}
          required
        />

        {/* Date */}
        <FormInput
          label='Date'
          name='startDate'
          type='date'
          value={formData.startDate}
          onChange={handleChange}
          required
        />

        {/* End Date (only for PLAGE type) */}
        {formData.eventType === 'PLAGE' && (
          <FormInput
            label='Date de fin'
            name='endDate'
            type='date'
            value={formData.endDate}
            onChange={handleChange}
          />
        )}

        {/* Start Time (for PLAGE and PONCTUEL) */}
        {formData.eventType !== 'JOUR' && (
          <FormInput
            label='Heure de début'
            name='startTime'
            type='time'
            value={formData.startTime}
            onChange={handleChange}
          />
        )}

        {/* End Time (only for PLAGE type) */}
        {formData.eventType === 'PLAGE' && (
          <FormInput
            label='Heure de fin'
            name='endTime'
            type='time'
            value={formData.endTime}
            onChange={handleChange}
          />
        )}

        {/* Title */}
        <FormInput
          label='Titre'
          name='title'
          value={formData.title}
          onChange={handleChange}
          placeholder="Titre de l'évènement"
          required
        />

        {/* Description */}
        <FormTextarea
          label='Infos'
          name='description'
          value={formData.description}
          onChange={handleChange}
          placeholder="Description de l'évènement"
          rows={3}
        />

        {/* Color */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Couleur
          </label>
          <div className='flex gap-2 items-center'>
            <input
              type='color'
              name='color'
              value={formData.color}
              onChange={handleChange}
              className='w-16 h-10 border border-gray-300 rounded-md'
            />
            <input
              type='text'
              name='color'
              value={formData.color}
              onChange={handleChange}
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
            />
          </div>
        </div>

        {/* Options */}
        <div className='space-y-3'>
          <label className='block text-sm font-medium text-gray-700'>
            Options
          </label>
          <div className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='blockAppointments'
                name='blockAppointments'
                checked={formData.blockAppointments}
                onChange={handleChange}
                className='h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded'
              />
              <label
                htmlFor='blockAppointments'
                className='text-sm text-gray-700'
              >
                Bloquer la prise de RDV
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='isRecurring'
                name='isRecurring'
                checked={formData.isRecurring}
                onChange={handleChange}
                className='h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded'
              />
              <label htmlFor='isRecurring' className='text-sm text-gray-700'>
                Évènement récurrent
              </label>
            </div>
          </div>
        </div>
      </form>

      <SheetFooter>
        <Button
          type='button'
          variant='outline'
          onClick={onClose}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className='bg-purple-600 hover:bg-purple-700'
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
};

const EventCard = ({ event, onEdit, onDelete }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <div
                className='w-3 h-3 rounded-full'
                style={{ backgroundColor: event.color || '#8B5CF6' }}
              />
              <Badge variant='outline' className='text-xs'>
                <EventTypeIcon type={event.eventType} />
                <span className='ml-1'>
                  <EventTypeLabel type={event.eventType} />
                </span>
              </Badge>
            </div>

            <h3 className='font-semibold text-gray-900 mb-1'>{event.title}</h3>

            <div className='text-sm text-gray-600 mb-2'>
              <div className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                <span>{formatDate(event.startDate)}</span>
                {event.endDate && event.eventType === 'PLAGE' && (
                  <span> - {formatDate(event.endDate)}</span>
                )}
              </div>

              {(event.startTime || event.endTime) && (
                <div className='flex items-center gap-1 mt-1'>
                  <Clock className='h-3 w-3' />
                  <span>
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <p className='text-sm text-gray-600 mb-2'>{event.description}</p>
            )}

            <div className='flex gap-2'>
              {event.blockAppointments && (
                <Badge variant='destructive' className='text-xs'>
                  Bloque RDV
                </Badge>
              )}
              {event.isRecurring && (
                <Badge variant='secondary' className='text-xs'>
                  Récurrent
                </Badge>
              )}
            </div>
          </div>

          <div className='flex gap-1 ml-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onEdit(event)}
              className='h-8 w-8'
            >
              <Edit className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onDelete(event.id)}
              className='h-8 w-8 text-red-600 hover:text-red-700'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EventManagement = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      showError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowFormSheet(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowFormSheet(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (selectedEvent) {
        await api.patch(`/events/${selectedEvent.id}`, eventData);
        showSuccess('Event updated successfully');
      } else {
        await api.post('/events', eventData);
        showSuccess('Event created successfully');
      }
      await fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      showError('Failed to save event');
      throw error;
    }
  };

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/events/${eventToDelete.id}`);
      await fetchEvents();
      showSuccess('Event deleted successfully');
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2'></div>
            <p className='text-gray-600'>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Évènements</h2>
          <p className='text-gray-600'>
            Gérez vos évènements et votre calendrier
          </p>
        </div>
        <Button
          onClick={handleCreateEvent}
          className='bg-purple-600 hover:bg-purple-700'
        >
          <Plus className='h-4 w-4 mr-2' />
          Nouvel évènement
        </Button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className='p-12'>
            <div className='text-center'>
              <CalendarDays className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Aucun évènement
              </h3>
              <p className='text-gray-600 mb-4'>
                Commencez par créer votre premier évènement
              </p>
              <Button
                onClick={handleCreateEvent}
                className='bg-purple-600 hover:bg-purple-700'
              >
                <Plus className='h-4 w-4 mr-2' />
                Créer un évènement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      )}

      {/* Event Form Sheet */}
      {showFormSheet && (
        <EventFormSheet
          event={selectedEvent}
          isOpen={showFormSheet}
          onClose={() => setShowFormSheet(false)}
          onSave={handleSaveEvent}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDeleteEvent}
        title="Supprimer l'évènement"
        description={`Êtes-vous sûr de vouloir supprimer "${eventToDelete?.title}" ? Cette action ne peut pas être annulée.`}
        confirmText='Supprimer'
        cancelText='Annuler'
        variant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventManagement;
