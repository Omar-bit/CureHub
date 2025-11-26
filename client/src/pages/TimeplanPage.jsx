import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  Video,
  Home,
  Building2,
} from 'lucide-react';
import { showSuccess, showError } from '../lib/toast';
import { timeplanAPI, consultationTypesAPI } from '../services/api';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  startOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';

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
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
};

const DAY_LABELS_SHORT = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

const LOCATION_ICONS = {
  ONLINE: Video,
  ATHOME: Home,
  ONSITE: Building2,
};

const LOCATION_LABELS = {
  ONLINE: 'Visio',
  ATHOME: 'Domicile',
  ONSITE: 'Consultations sur RDV',
};

const TimeplanPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [timeplans, setTimeplans] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // New states for the redesigned page
  const [activeTab, setActiveTab] = useState('calendrier'); // 'calendrier' or 'semaine-type'
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  useEffect(() => {
    fetchTimeplans();
    fetchConsultationTypes();

    // Check if we should open consultation type dialog
    const openConsultationType = searchParams.get('openConsultationType');
    const createNew = searchParams.get('createNew');

    if (openConsultationType || createNew === 'true') {
      // This would open the consultation type dialog
      // For now, we'll just navigate to settings
      setTimeout(() => {
        navigate('/settings/consultation-types');
      }, 100);
    }
  }, [searchParams, navigate]);

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

  const getTimeplanForDay = (dayOfWeek, specificDate = null) => {
    // If a specific date is provided and we're in calendrier mode, look for date-specific timeplan first
    if (specificDate && activeTab === 'calendrier') {
      const dateStr = format(specificDate, 'yyyy-MM-dd');
      const specificTimeplan = timeplans.find(
        (tp) =>
          tp.dayOfWeek === dayOfWeek &&
          tp.specificDate &&
          format(new Date(tp.specificDate), 'yyyy-MM-dd') === dateStr
      );
      if (specificTimeplan) return specificTimeplan;
    }

    // Otherwise, return the general weekly timeplan (where specificDate is null)
    return timeplans.find(
      (tp) => tp.dayOfWeek === dayOfWeek && !tp.specificDate
    );
  };

  const handleDayToggle = async (dayOfWeek, isActive) => {
    try {
      const existingTimeplan = getTimeplanForDay(dayOfWeek);

      const payload = {
        dayOfWeek,
        isActive,
        timeSlots: existingTimeplan?.timeSlots || [],
      };

      // Add specificDate only in Calendrier mode
      if (activeTab === 'calendrier') {
        const weekDays = getWeekDays();
        const dayData = weekDays.find((d) => d.dayOfWeek === dayOfWeek);
        if (dayData?.date) {
          payload.specificDate = format(dayData.date, 'yyyy-MM-dd');
        }
      }

      if (existingTimeplan) {
        await timeplanAPI.update(dayOfWeek, payload);
      } else {
        await timeplanAPI.createOrUpdate(payload);
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

  const getSelectedDayDate = () => {
    if (activeTab === 'calendrier' && selectedDay) {
      const weekDays = getWeekDays();
      const dayData = weekDays.find((d) => d.dayOfWeek === selectedDay);
      return dayData?.date;
    }
    return null;
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

  // Single arrow navigation - advance by 1 week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Double arrow navigation - jump to first day of next/previous month
  const goToPreviousMonth = () => {
    const previousMonth = subMonths(currentWeekStart, 1);
    const firstDayOfMonth = startOfMonth(previousMonth);
    setCurrentWeekStart(startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentWeekStart, 1);
    const firstDayOfMonth = startOfMonth(nextMonth);
    setCurrentWeekStart(startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getWeekDays = () => {
    return DAYS_OF_WEEK.map((day, index) => ({
      dayOfWeek: day,
      date: addDays(currentWeekStart, index),
    }));
  };

  const handleConsultationTypeClick = (typeId) => {
    // Navigate to settings with query param to open specific type
    navigate(`/settings/consultation-types?openType=${typeId}`);
  };

  const handleCreateConsultationType = () => {
    // Navigate to settings with query param to create new type
    navigate('/settings/consultation-types?createNew=true');
  };

  const renderWeekCalendar = () => {
    const weekDays =
      activeTab === 'semaine-type'
        ? DAYS_OF_WEEK.map((day) => ({ dayOfWeek: day, date: null }))
        : getWeekDays();

    return (
      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        {/* Week header */}
        <div className='flex border-b border-gray-200 sticky top-0 bg-white z-10'>
          <div className='w-16 flex-shrink-0'></div>
          {weekDays.map((day, index) => {
            const timeplan = getTimeplanForDay(day.dayOfWeek, day.date);
            const hasSlots = timeplan?.timeSlots?.length > 0;

            return (
              <div
                key={index}
                className='flex-1 text-center py-3 border-r border-gray-200 last:border-r-0'
              >
                <div className='text-sm font-medium text-gray-700'>
                  {DAY_LABELS_SHORT[day.dayOfWeek]}
                </div>
                {activeTab === 'calendrier' && day.date && (
                  <div className='text-xs text-gray-500 mt-1'>
                    {format(day.date, 'dd/MM')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid with scrolling */}
        <div className='relative overflow-y-auto' style={{ height: '600px' }}>
          <div className='relative' style={{ height: '1440px' }}>
            {/* Hour labels */}
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
              <div
                key={hour}
                className='absolute left-0 w-16 text-right pr-2 text-xs text-gray-500 bg-white'
                style={{
                  top: `${hour * 60}px`,
                  height: '60px',
                  lineHeight: '12px',
                  paddingTop: '2px',
                }}
              >
                {hour.toString().padStart(2, '0')}h
              </div>
            ))}

            {/* Day columns with time slots */}
            <div
              className='absolute left-16 right-0 top-0 flex'
              style={{ height: '1440px' }}
            >
              {weekDays.map((day, dayIndex) => {
                const timeplan = getTimeplanForDay(day.dayOfWeek, day.date);
                const timeSlots = timeplan?.timeSlots || [];
                const isActive = timeplan?.isActive ?? false;

                return (
                  <div
                    key={dayIndex}
                    className='flex-1 border-r border-gray-100 last:border-r-0 relative'
                    style={{
                      height: '1440px',
                      opacity: isActive ? 1 : 0.3,
                    }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <div
                        key={hour}
                        className='absolute left-0 right-0 border-t border-gray-100'
                        style={{ top: `${hour * 60}px` }}
                      ></div>
                    ))}

                    {/* Render time slots as colored blocks */}
                    {timeSlots.map((slot) => {
                      const [startHour, startMinute] = slot.startTime
                        .split(':')
                        .map(Number);
                      const [endHour, endMinute] = slot.endTime
                        .split(':')
                        .map(Number);
                      const topPosition = startHour * 60 + startMinute;
                      const height = endHour * 60 + endMinute - topPosition;

                      // Get all unique consultation type colors for this slot
                      const consultationTypeColors = [
                        ...new Set(
                          slot.consultationTypes.map((ct) =>
                            getConsultationTypeColor(ct.consultationTypeId)
                          )
                        ),
                      ];

                      const numColors = consultationTypeColors.length;
                      const colorWidth = numColors > 0 ? 100 / numColors : 100;

                      return (
                        <div
                          key={slot.id}
                          className='absolute left-0 right-0 overflow-hidden flex'
                          style={{
                            top: `${topPosition}px`,
                            height: `${height}px`,
                          }}
                        >
                          {consultationTypeColors.map((color, idx) => (
                            <div
                              key={idx}
                              style={{
                                backgroundColor: color,
                                width: `${colorWidth}%`,
                                height: '100%',
                              }}
                            ></div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 py-6 px-8 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-sm'>
        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md'>
                <Clock className='h-6 w-6 text-white' />
              </div>
              <h1 className='text-3xl font-bold text-gray-900'>Horaires</h1>
            </div>
            <p className='text-gray-700 mt-2'>
              Dr Nicole David | Cabinet médical du Dr DAVID
            </p>
            <p className='text-sm text-gray-600 mt-4 bg-purple-100 px-4 py-2 rounded-lg inline-block'>
              ⚠️ Visualisez et modifiez le planning pour une date donnée.
            </p>
            <p className='text-sm text-gray-600 mt-2'>
              ⓘ Les plages horaires modifiées, ajoutées ou supprimées n'auront
              d'effet que pour la date indiquée.
            </p>
          </div>

          {/* Tab buttons */}
          <div className='flex gap-2 bg-white rounded-lg p-1 shadow-sm'>
            <button
              onClick={() => setActiveTab('calendrier')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'calendrier'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calendrier
            </button>
            <button
              onClick={() => setActiveTab('semaine-type')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'semaine-type'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Semaine type
            </button>
          </div>
        </div>
      </div>

      {/* Week navigation (only for calendrier tab) */}
      {activeTab === 'calendrier' && (
        <div className='flex items-center justify-between bg-orange-50 px-6 py-4 rounded-xl'>
          {/* Left side - Today button and navigation arrows */}
          <div className='flex items-center gap-2'>
            <button
              onClick={goToToday}
              className='flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-orange-50 transition-colors shadow-sm border border-orange-200'
            >
              <CalendarIcon className='h-4 w-4 text-orange-500' />
              <span className='font-medium text-gray-900'>Aujourd'hui</span>
            </button>

            {/* Double arrow left - Previous month */}
            <button
              onClick={goToPreviousMonth}
              className='p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
              title='Mois précédent'
            >
              <ChevronsLeft className='h-5 w-5 text-gray-600' />
            </button>

            {/* Single arrow left - Previous week */}
            <button
              onClick={goToPreviousWeek}
              className='p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
              title='Semaine précédente'
            >
              <ChevronLeft className='h-5 w-5 text-gray-600' />
            </button>
          </div>

          {/* Center - Date range display */}
          <div className='flex items-center gap-3 bg-white px-6 py-2 rounded-lg shadow-sm'>
            <CalendarIcon className='h-5 w-5 text-orange-500' />
            <span className='text-lg font-semibold text-gray-900'>
              Du {format(currentWeekStart, 'EEEE dd/MM', { locale: fr })} au{' '}
              {format(addDays(currentWeekStart, 6), 'EEEE dd/MM', {
                locale: fr,
              })}
            </span>
          </div>

          {/* Right side - Navigation arrows */}
          <div className='flex items-center gap-2'>
            {/* Single arrow right - Next week */}
            <button
              onClick={goToNextWeek}
              className='p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
              title='Semaine suivante'
            >
              <ChevronRight className='h-5 w-5 text-gray-600' />
            </button>

            {/* Double arrow right - Next month */}
            <button
              onClick={goToNextMonth}
              className='p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
              title='Mois suivant'
            >
              <ChevronsRight className='h-5 w-5 text-gray-600' />
            </button>
          </div>
        </div>
      )}

      {/* Visual Calendar */}
      <div className='space-y-6'>{renderWeekCalendar()}</div>

      {/* Consultation Types Section */}
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>🏷️</span>
          </div>
          <h2 className='text-xl font-bold text-gray-900'>
            Vos types de consultations
          </h2>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          {consultationTypes.map((type) => {
            const Icon = LOCATION_ICONS[type.location] || Building2;
            return (
              <button
                key={type.id}
                onClick={() => handleConsultationTypeClick(type.id)}
                className='flex flex-col items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all bg-white border-2 border-gray-200 hover:border-gray-300'
              >
                <div
                  className='w-14 h-14 rounded-full flex items-center justify-center shadow-sm'
                  style={{ backgroundColor: type.color }}
                >
                  <Icon className='h-7 w-7 text-white' />
                </div>
                <span className='text-sm font-medium text-gray-900 text-center'>
                  {type.name}
                </span>
              </button>
            );
          })}

          {/* Add new consultation type button */}
          <button
            onClick={handleCreateConsultationType}
            className='flex flex-col items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400'
          >
            <div className='w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center'>
              <Plus className='h-7 w-7 text-gray-600' />
            </div>
            <span className='text-sm font-medium text-gray-600 text-center'>
              Ajouter...
            </span>
          </button>

          {/* Exceptions button */}
          <button className='flex flex-col items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all bg-yellow-50 border-2 border-yellow-200 hover:border-yellow-300'>
            <div className='w-14 h-14 rounded-full bg-yellow-200 flex items-center justify-center'>
              <span className='text-2xl'>📋</span>
            </div>
            <span className='text-sm font-medium text-gray-900 text-center'>
              Exceptions
            </span>
          </button>
        </div>
      </div>

      {/* Time Slots Detail Section */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
        {activeTab === 'semaine-type' ? (
          // Semaine type view - show general week days
          <div className='p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-6'>
              Planning habituel
            </h3>
            {DAYS_OF_WEEK.map((day) => {
              const timeplan = getTimeplanForDay(day);
              const isActive = timeplan?.isActive ?? false;
              const timeSlots = timeplan?.timeSlots ?? [];

              return (
                <div key={day} className='mb-6 last:mb-0'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-md font-semibold text-gray-800'>
                      {DAY_LABELS[day]}
                    </h4>
                    <div className='flex items-center gap-3'>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) =>
                          handleDayToggle(day, checked)
                        }
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditDay(day)}
                      >
                        <Edit2 className='h-4 w-4 mr-1' />
                        Modifier
                      </Button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200'
                      >
                        <div className='flex items-center gap-3'>
                          <span className='text-sm font-medium text-gray-900'>
                            de {formatTime(slot.startTime)} à{' '}
                            {formatTime(slot.endTime)}
                          </span>
                          <div className='flex gap-1'>
                            {slot.consultationTypes.map((ct) => {
                              const color = getConsultationTypeColor(
                                ct.consultationTypeId
                              );
                              return (
                                <div
                                  key={ct.id}
                                  className='w-6 h-6 rounded-full border-2 border-white shadow-sm'
                                  style={{ backgroundColor: color }}
                                  title={getConsultationTypeName(
                                    ct.consultationTypeId
                                  )}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                        {!slot.isActive && (
                          <Badge variant='secondary' className='text-xs'>
                            Inactif
                          </Badge>
                        )}
                      </div>
                    ))}
                    {timeSlots.length === 0 && (
                      <div className='col-span-2 text-center py-4 text-gray-500 text-sm'>
                        Aucune plage horaire configurée
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Calendrier view - show specific dates
          <div className='p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-6'>
              Planning de la semaine
            </h3>
            {getWeekDays().map(({ dayOfWeek, date }) => {
              const timeplan = getTimeplanForDay(dayOfWeek, date);
              const isActive = timeplan?.isActive ?? false;
              const timeSlots = timeplan?.timeSlots ?? [];

              return (
                <div key={dayOfWeek} className='mb-6 last:mb-0'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-2'>
                        {format(date, 'dd/MM') ===
                          format(new Date(), 'dd/MM') && (
                          <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        )}
                        <h4 className='text-md font-semibold text-gray-800'>
                          {DAY_LABELS[dayOfWeek]}
                        </h4>
                      </div>
                      <span className='text-sm text-gray-500'>
                        {format(date, 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) =>
                          handleDayToggle(dayOfWeek, checked)
                        }
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditDay(dayOfWeek)}
                      >
                        <Edit2 className='h-4 w-4 mr-1' />
                        Modifier
                      </Button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200'
                      >
                        <div className='flex items-center gap-3'>
                          <span className='text-sm font-medium text-gray-900'>
                            de {formatTime(slot.startTime)} à{' '}
                            {formatTime(slot.endTime)}
                          </span>
                          <div className='flex gap-1'>
                            {slot.consultationTypes.map((ct) => {
                              const color = getConsultationTypeColor(
                                ct.consultationTypeId
                              );
                              return (
                                <div
                                  key={ct.id}
                                  className='w-6 h-6 rounded-full border-2 border-white shadow-sm'
                                  style={{ backgroundColor: color }}
                                  title={getConsultationTypeName(
                                    ct.consultationTypeId
                                  )}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                        {!slot.isActive && (
                          <Badge variant='secondary' className='text-xs'>
                            Inactif
                          </Badge>
                        )}
                      </div>
                    ))}
                    {timeSlots.length === 0 && (
                      <div className='col-span-2 text-center py-4 text-gray-500 text-sm'>
                        Aucune plage horaire configurée
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isEditing && (
        <TimeplanEditModal
          dayOfWeek={selectedDay}
          specificDate={getSelectedDayDate()}
          timeplan={getTimeplanForDay(selectedDay, getSelectedDayDate())}
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
  specificDate,
  timeplan,
  consultationTypes,
  onClose,
  onSave,
}) => {
  // Transform timeSlots to ensure consultationTypeIds is an array of IDs
  const transformedTimeSlots = (timeplan?.timeSlots || []).map((slot) => ({
    ...slot,
    consultationTypeIds: slot.consultationTypes
      ? slot.consultationTypes.map((ct) => ct.consultationTypeId)
      : slot.consultationTypeIds || [],
  }));

  const [timeSlots, setTimeSlots] = useState(transformedTimeSlots);
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

      // Add specificDate if it's provided (Calendrier mode)
      if (specificDate) {
        payload.specificDate = format(specificDate, 'yyyy-MM-dd');
      }

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
          <div>
            <h2 className='text-2xl font-bold'>
              Edit {DAY_LABELS[dayOfWeek]} Schedule
            </h2>
            {specificDate && (
              <p className='text-sm text-blue-600 mt-1'>
                📅 Editing schedule for specific date:{' '}
                {format(specificDate, 'EEEE dd/MM/yyyy', { locale: fr })}
              </p>
            )}
            {!specificDate && (
              <p className='text-sm text-gray-600 mt-1'>
                📋 Editing general weekly schedule
              </p>
            )}
          </div>
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
                    <label className='text-sm font-medium mb-3 block'>
                      Consultation Types
                    </label>
                    {!consultationTypes || consultationTypes.length === 0 ? (
                      <div className='text-gray-500 text-sm p-4 border border-gray-200 rounded-md'>
                        No consultation types available. Please create
                        consultation types first in Settings → Consultation
                        Types.
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                        {consultationTypes.map((type) => {
                          const isSelected = (
                            slot.consultationTypeIds || []
                          ).includes(type.id);
                          const Icon =
                            LOCATION_ICONS[type.location] || Building2;

                          return (
                            <button
                              key={type.id}
                              type='button'
                              onClick={() => {
                                const currentIds =
                                  slot.consultationTypeIds || [];
                                const newIds = isSelected
                                  ? currentIds.filter((id) => id !== type.id)
                                  : [...currentIds, type.id];
                                updateTimeSlot(
                                  index,
                                  'consultationTypeIds',
                                  newIds
                                );
                              }}
                              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 shadow-md scale-105'
                                  : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm'
                              }`}
                              style={{
                                backgroundColor: isSelected
                                  ? type.color
                                  : '#ffffff',
                                color: isSelected ? '#ffffff' : '#374151',
                                ringColor: isSelected ? type.color : undefined,
                              }}
                            >
                              <Icon
                                className={`h-4 w-4 flex-shrink-0 ${
                                  isSelected ? 'text-white' : 'text-gray-600'
                                }`}
                              />
                              <span className='text-sm font-medium truncate'>
                                {type.name}
                              </span>
                              {isSelected && (
                                <div className='absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm'>
                                  <svg
                                    className='w-3 h-3'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                    style={{ color: type.color }}
                                  >
                                    <path
                                      fillRule='evenodd'
                                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                      clipRule='evenodd'
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
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
