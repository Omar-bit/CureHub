import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentAPI } from '../../services/api';

const TimeSlotSelector = ({
  selectedDate,
  consultationTypeId,
  consultationTypes = [],
  value,
  onChange,
  error,
  totalDuration, // Total duration including all patients
  onDateChange, // Callback to update the parent's selected date
}) => {
  const [daySlots, setDaySlots] = useState([]); // Array of { date, slots, loading }
  const [visibleDays, setVisibleDays] = useState(5); // Number of days to show
  const [startDayOffset, setStartDayOffset] = useState(0); // Offset for navigation
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // Currently selected day

  // Get consultation type details
  const consultationType = consultationTypes.find(
    (ct) => ct.id === parseInt(consultationTypeId)
  );

  const duration = totalDuration || consultationType?.duration || 30;

  // Initialize days to load
  useEffect(() => {
    if (selectedDate && consultationTypeId) {
      initializeDays();
    }
  }, [selectedDate, consultationTypeId, startDayOffset]);

  const initializeDays = () => {
    const baseDate = startOfDay(new Date(selectedDate));
    const days = [];

    // Create array of days to load
    for (let i = 0; i < visibleDays; i++) {
      const dayDate = addDays(baseDate, startDayOffset + i);
      days.push({
        date: dayDate,
        slots: [],
        loading: true,
      });
    }

    setDaySlots(days);

    // Load slots for each day
    days.forEach((day, index) => {
      loadSlotsForDay(day.date, index);
    });

    // Update selected day index based on current selectedDate
    const selectedIndex = days.findIndex((day) =>
      isSameDay(day.date, new Date(selectedDate))
    );
    if (selectedIndex !== -1) {
      setSelectedDayIndex(selectedIndex);
    }
  };

  const loadSlotsForDay = async (date, dayIndex) => {
    try {
      const response = await appointmentAPI.getAvailableSlots(
        format(date, 'yyyy-MM-dd'),
        consultationTypeId
      );

      // Transform the backend response
      const formattedSlots = response.slots
        .filter((slot) => slot.available)
        .map((slot) => {
          const slotDate = new Date(slot.time);
          const timeStr = format(slotDate, 'HH:mm');
          return {
            time: timeStr,
            displayTime: timeStr,
            available: slot.available,
          };
        });

      // Update the specific day's slots
      setDaySlots((prev) => {
        const newDays = [...prev];
        if (newDays[dayIndex]) {
          newDays[dayIndex] = {
            ...newDays[dayIndex],
            slots: formattedSlots,
            loading: false,
          };
        }
        return newDays;
      });
    } catch (error) {
      console.error('Error loading available time slots:', error);
      setDaySlots((prev) => {
        const newDays = [...prev];
        if (newDays[dayIndex]) {
          newDays[dayIndex] = {
            ...newDays[dayIndex],
            slots: [],
            loading: false,
          };
        }
        return newDays;
      });
    }
  };

  const handlePrevious = () => {
    setStartDayOffset((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartDayOffset((prev) => prev + 1);
  };

  const handleDaySelect = (dayIndex, date) => {
    setSelectedDayIndex(dayIndex);
    if (onDateChange) {
      onDateChange(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleTimeSelect = (time, date) => {
    onChange(time);
    if (onDateChange) {
      onDateChange(format(date, 'yyyy-MM-dd'));
    }
  };

  const getSelectedDateTime = () => {
    if (!value) return null;
    const currentDay = daySlots[selectedDayIndex];
    if (!currentDay) return null;
    return `${format(currentDay.date, 'yyyy-MM-dd')}T${value}`;
  };

  if (!consultationTypeId || !selectedDate) {
    return (
      <div className='text-center p-8 text-gray-500'>
        <Clock className='h-8 w-8 mx-auto mb-2' />
        <p>Please select a consultation type first</p>
      </div>
    );
  }

  const isLoading = daySlots.some((day) => day.loading);

  return (
    <div className='space-y-4'>
      {/* Days Navigation */}
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handlePrevious}
          disabled={startDayOffset === 0}
          className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <ChevronLeft className='h-5 w-5' />
        </button>

        <div className='flex-1 overflow-x-auto'>
          <div className='flex gap-3 min-w-max'>
            {daySlots.map((day, index) => {
              const isSelected = index === selectedDayIndex;
              const hasSlots = day.slots.length > 0;
              const dayName = format(day.date, 'EEEE', { locale: fr });
              const dateNum = format(day.date, 'd', { locale: fr });
              const monthName = format(day.date, 'MMM', { locale: fr });

              return (
                <div key={index} className='flex-shrink-0 w-32'>
                  {/* Day Header */}
                  <div
                    className={`text-center p-3 rounded-t-lg border ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                      }`}
                  >
                    <div className='text-xs font-medium uppercase text-gray-500'>
                      {dayName}
                    </div>
                    <div className='text-lg font-semibold mt-1'>
                      {dateNum} {monthName.toLowerCase()}.
                    </div>
                  </div>

                  {/* Time Slots Column */}
                  <div className='border border-t-0 border-gray-300 rounded-b-lg bg-white max-h-96 overflow-y-auto'>
                    {day.loading ? (
                      <div className='flex items-center justify-center p-8'>
                        <Clock className='h-5 w-5 animate-spin text-gray-400' />
                      </div>
                    ) : !hasSlots ? (
                      <div className='text-center p-4 text-sm text-gray-400'>
                        Aucune dispo pour cet acte.
                      </div>
                    ) : (
                      <div className='p-2 space-y-1'>
                        {day.slots.map((slot) => {
                          const isSlotSelected =
                            value === slot.time &&
                            isSameDay(day.date, new Date(selectedDate));

                          return (
                            <button
                              key={slot.time}
                              type='button'
                              onClick={() => {
                                handleDaySelect(index, day.date);
                                handleTimeSelect(slot.time, day.date);
                              }}
                              className={`w-full px-3 py-2 text-sm rounded-md transition-colors text-center flex items-center justify-center gap-2 ${isSlotSelected
                                ? 'bg-amber-400 text-white font-medium'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                              <span>{slot.displayTime}</span>
                              {isSlotSelected && (
                                <span className='w-4 h-4 bg-white rounded-full flex items-center justify-center'>
                                  <span className='w-2 h-2 bg-amber-400 rounded-full'></span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type='button'
          onClick={handleNext}
          className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50'
        >
          <ChevronRight className='h-5 w-5' />
        </button>
      </div>

      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
};

export default TimeSlotSelector;
