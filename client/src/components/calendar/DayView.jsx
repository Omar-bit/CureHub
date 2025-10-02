import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DayView = ({
  currentDate,
  appointments = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  workingHours = { start: 8, end: 20 },
}) => {
  const timeSlots = CalendarUtils.generateTimeSlots(
    workingHours.start,
    workingHours.end,
    60
  );
  const dayAppointments = CalendarUtils.getAppointmentsForDay(
    appointments,
    currentDate
  );

  const goToPreviousDay = () => {
    onDateChange(CalendarUtils.goToPreviousDay(currentDate));
  };

  const goToNextDay = () => {
    onDateChange(CalendarUtils.goToNextDay(currentDate));
  };

  const handleTimeSlotClick = (timeSlot) => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotDate = new Date(currentDate);
    slotDate.setHours(hour, minute, 0, 0);
    onTimeSlotClick?.(slotDate);
  };

  const getAppointmentStyle = (appointment) => {
    const startTime = CalendarUtils.formatTime(new Date(appointment.startTime));
    const duration = CalendarUtils.getAppointmentDuration(
      appointment.startTime,
      appointment.endTime
    );
    const position = CalendarUtils.getTimeSlotPosition(
      startTime,
      workingHours.start
    );
    const height = CalendarUtils.getTimeSlotHeight(duration);

    return {
      position: 'absolute',
      top: `${position}px`,
      height: `${height}px`,
      left: '60px',
      right: '10px',
      zIndex: 10,
    };
  };

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={goToPreviousDay}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <h2 className='text-lg font-semibold text-gray-900'>
              {CalendarUtils.formatDisplayDate(currentDate)}
            </h2>
            <button
              onClick={goToNextDay}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>
          {/* <button
            onClick={() => onTimeSlotClick?.(new Date())}
            className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='h-4 w-4' />
            <span>New Appointment</span>
          </button> */}
          {/* choose date */}
          <div>
            <input
              type='date'
              // value={CalendarUtils.formatDateInput(currentDate)}
              value={''}
              onChange={
                (e) => 'test'
                // onDateChange(new Date(e.target.value + 'T00:00:00'))
              }
              className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className='relative'
          style={{
            height: `${(workingHours.end - workingHours.start) * 60}px`,
          }}
        >
          {/* Time labels and slots */}
          {timeSlots.map((timeSlot, index) => (
            <div key={timeSlot} className='relative'>
              <div className='flex'>
                {/* Time label */}
                <div className='w-12 text-xs text-gray-500 text-right pr-2 py-2'>
                  {timeSlot}
                </div>
                {/* Time slot area */}
                <div
                  className='flex-1 border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors'
                  style={{ height: '60px' }}
                  onClick={() => handleTimeSlotClick(timeSlot)}
                >
                  <div className='h-full w-full'></div>
                </div>
              </div>
            </div>
          ))}

          {/* Appointments */}
          {dayAppointments.map((appointment) => (
            <div
              key={appointment.id}
              style={getAppointmentStyle(appointment)}
              className={`
                bg-blue-500 text-white rounded-lg p-2 cursor-pointer shadow-sm
                hover:bg-blue-600 transition-colors text-xs
                ${appointment.status === 'CANCELLED' ? 'bg-gray-400' : ''}
                ${appointment.status === 'COMPLETED' ? 'bg-green-500' : ''}
              `}
              onClick={() => onAppointmentClick?.(appointment)}
            >
              <div className='font-medium truncate'>
                {appointment.patient?.name}
              </div>
              <div className='text-xs opacity-90 truncate'>
                {CalendarUtils.formatTime(new Date(appointment.startTime))} -
                {CalendarUtils.formatTime(new Date(appointment.endTime))}
              </div>
              {appointment.consultationType && (
                <div className='text-xs opacity-80 truncate'>
                  {appointment.consultationType.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayView;
