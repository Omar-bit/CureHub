import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Clock, Plus, Trash2, Edit2 } from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';
import { timeplanAPI, consultationTypesAPI } from '../services/api';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const TimeplanPage = () => {
  const [timeplans, setTimeplans] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTimeplans();
    fetchConsultationTypes();
  }, []);

  const fetchTimeplans = async () => {
    try {
      const data = await timeplanAPI.getAll();
      setTimeplans(data);
    } catch (error) {
      console.error('Failed to fetch timeplans:', error);
      showError('Failed to load timeplan data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultationTypes = async () => {
    try {
      const data = await consultationTypesAPI.getAll();
      console.log('Fetched consultation types:', data);
      setConsultationTypes(data);
    } catch (error) {
      console.error('Failed to fetch consultation types:', error);
    }
  };

  const getTimeplanForDay = (dayOfWeek) => {
    return timeplans.find((tp) => tp.dayOfWeek === dayOfWeek);
  };

  const handleDayToggle = async (dayOfWeek, isActive) => {
    try {
      const existingTimeplan = getTimeplanForDay(dayOfWeek);

      if (existingTimeplan) {
        await timeplanAPI.update(dayOfWeek, { isActive });
      } else {
        await timeplanAPI.createOrUpdate({
          dayOfWeek,
          isActive,
          timeSlots: [],
        });
      }

      await fetchTimeplans();
      showSuccess(
        `${DAY_LABELS[dayOfWeek]} schedule ${isActive ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Failed to update day status:', error);
      showError('Failed to update day status');
    }
  };

  const handleEditDay = (dayOfWeek) => {
    setSelectedDay(dayOfWeek);
    setIsEditing(true);
  };

  const formatTime = (timeString) => {
    return timeString; // Already in HH:mm format
  };

  const getConsultationTypeName = (id) => {
    const type = consultationTypes.find((ct) => ct.id === id);
    return type ? type.name : 'Unknown';
  };

  const getConsultationTypeColor = (id) => {
    const type = consultationTypes.find((ct) => ct.id === id);
    return type ? type.color : '#gray';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 py-2 px-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Timeplan Configuration
          </h1>
          <p className='mt-2 text-gray-600'>
            Configure your availability and schedule for each day of the week
          </p>
        </div>
      </div>

      <div className='grid gap-4'>
        {DAYS_OF_WEEK.map((day) => {
          const timeplan = getTimeplanForDay(day);
          const isActive = timeplan?.isActive ?? false;
          const timeSlots = timeplan?.timeSlots ?? [];

          return (
            <Card key={day} className='relative'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                <CardTitle className='text-lg font-semibold'>
                  {DAY_LABELS[day]}
                </CardTitle>
                <div className='flex items-center space-x-3'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-gray-600'>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        handleDayToggle(day, checked)
                      }
                    />
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEditDay(day)}
                    className='flex items-center space-x-1'
                  >
                    <Edit2 className='h-4 w-4' />
                    <span>Edit</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {timeSlots.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    <Clock className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                    <p>No time slots configured</p>
                    <p className='text-sm'>Click 'Edit' to add time slots</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='flex items-center space-x-2 text-sm font-medium'>
                            <Clock className='h-4 w-4 text-gray-500' />
                            <span>
                              {formatTime(slot.startTime)} -{' '}
                              {formatTime(slot.endTime)}
                            </span>
                          </div>
                          <div className='flex flex-wrap gap-1'>
                            {slot.consultationTypes.map((ct) => (
                              <Badge
                                key={ct.id}
                                style={{
                                  backgroundColor: getConsultationTypeColor(
                                    ct.consultationTypeId
                                  ),
                                  color: 'white',
                                }}
                                className='text-xs'
                              >
                                {getConsultationTypeName(ct.consultationTypeId)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className='flex items-center space-x-1'>
                          {!slot.isActive && (
                            <Badge variant='secondary' className='text-xs'>
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isEditing && (
        <TimeplanEditModal
          dayOfWeek={selectedDay}
          timeplan={getTimeplanForDay(selectedDay)}
          consultationTypes={consultationTypes}
          onClose={() => {
            setIsEditing(false);
            setSelectedDay(null);
          }}
          onSave={() => {
            fetchTimeplans();
            setIsEditing(false);
            setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
};

// Separate component for the edit modal
const TimeplanEditModal = ({
  dayOfWeek,
  timeplan,
  consultationTypes,
  onClose,
  onSave,
}) => {
  const [timeSlots, setTimeSlots] = useState(timeplan?.timeSlots || []);
  const [isActive, setIsActive] = useState(timeplan?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      {
        startTime: '09:00',
        endTime: '10:00',
        consultationTypeIds: [],
        isActive: true,
      },
    ]);
  };

  const removeTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        dayOfWeek,
        isActive,
        timeSlots: timeSlots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationTypeIds: slot.consultationTypeIds || [],
          isActive: slot.isActive ?? true,
        })),
      };

      await timeplanAPI.createOrUpdate(payload);
      showSuccess(`${DAY_LABELS[dayOfWeek]} schedule updated successfully`);
      onSave();
    } catch (error) {
      console.error('Failed to save timeplan:', error);
      showError('Failed to save timeplan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold'>
            Edit {DAY_LABELS[dayOfWeek]} Schedule
          </h2>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className='space-y-6'>
          <div className='flex items-center space-x-3'>
            <label className='text-sm font-medium'>Day Active:</label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Time Slots</h3>
              <Button
                onClick={addTimeSlot}
                className='flex items-center space-x-2'
              >
                <Plus className='h-4 w-4' />
                <span>Add Time Slot</span>
              </Button>
            </div>

            <div className='space-y-4'>
              {timeSlots.map((slot, index) => (
                <Card key={index} className='p-4'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Start Time</label>
                      <input
                        type='time'
                        value={slot.startTime}
                        onChange={(e) =>
                          updateTimeSlot(index, 'startTime', e.target.value)
                        }
                        className='w-full p-2 border rounded-md'
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>End Time</label>
                      <input
                        type='time'
                        value={slot.endTime}
                        onChange={(e) =>
                          updateTimeSlot(index, 'endTime', e.target.value)
                        }
                        className='w-full p-2 border rounded-md'
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Active</label>
                      <div className='flex items-center space-x-2'>
                        <Switch
                          checked={slot.isActive ?? true}
                          onCheckedChange={(checked) =>
                            updateTimeSlot(index, 'isActive', checked)
                          }
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => removeTimeSlot(index)}
                          className='text-red-600 hover:text-red-800'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className='mt-4'>
                    <label className='text-sm font-medium mb-2 block'>
                      Consultation Types
                    </label>
                    {!consultationTypes || consultationTypes.length === 0 ? (
                      <div className='text-gray-500 text-sm p-4 border border-gray-200 rounded-md'>
                        No consultation types available. Please create
                        consultation types first in Settings → Consultation
                        Types.
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
                        {consultationTypes.map((type) => (
                          <label
                            key={type.id}
                            className='flex items-center space-x-2'
                          >
                            <input
                              type='checkbox'
                              checked={(
                                slot.consultationTypeIds || []
                              ).includes(type.id)}
                              onChange={(e) => {
                                const currentIds =
                                  slot.consultationTypeIds || [];
                                const newIds = e.target.checked
                                  ? [...currentIds, type.id]
                                  : currentIds.filter((id) => id !== type.id);
                                updateTimeSlot(
                                  index,
                                  'consultationTypeIds',
                                  newIds
                                );
                              }}
                              className='rounded'
                            />
                            <span
                              className='text-sm px-2 py-1 rounded text-white'
                              style={{ backgroundColor: type.color }}
                            >
                              {type.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className='flex justify-end space-x-3 mt-6'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeplanPage;
