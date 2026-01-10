import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { CalendarView } from './calendar';
import { CalendarUtils } from './calendar/CalendarUtils';
import {
  appointmentAPI,
  agendaPreferencesAPI,
  imprevuAPI,
  ptoAPI,
  timeplanAPI,
} from '../services/api';
import { showError } from '../lib/toast';
import { Loader2 } from 'lucide-react';
import { ConfirmDialog } from './ui/confirm-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarSection = forwardRef(
  (
    {
      onAppointmentClick,
      onTimeSlotClick,
      isTabOpen = false,
      onDateChange,
      onAppointmentsChange,
    },
    ref
  ) => {
    const [appointments, setAppointments] = useState([]);
    const [imprevus, setImprevus] = useState([]);
    const [ptos, setPtos] = useState([]);
    const [timeplans, setTimeplans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [preferences, setPreferences] = useState({
      mainColor: '#FFA500',
      startHour: 8,
      endHour: 20,
      verticalZoom: 1,
      schoolVacationZone: 'C',
    });
    const calendarRef = useRef();
    const [forceDialogOpen, setForceDialogOpen] = useState(false);
    const [pendingSlotDate, setPendingSlotDate] = useState(null);
    const [pendingImprevu, setPendingImprevu] = useState(null);

    const loadAppointments = async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        const data = await appointmentAPI.getAll();
        const loadedAppointments = data.appointments || data || [];
        setAppointments(loadedAppointments);
        onAppointmentsChange?.(loadedAppointments);
        return loadedAppointments;
      } catch (error) {
        console.error('Error loading appointments:', error);
        showError('Failed to load appointments.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };

    const loadPreferences = async () => {
      try {
        const data = await agendaPreferencesAPI.get();
        if (data) {
          setPreferences({
            mainColor: data.mainColor || '#FFA500',
            startHour: data.startHour || 8,
            endHour: data.endHour || 20,
            verticalZoom: data.verticalZoom || 1,
            schoolVacationZone: data.schoolVacationZone || 'C',
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    const loadImprevus = async (date) => {
      try {
        const targetDate =
          date instanceof Date ? date : new Date(date || Date.now());
        const weekStart = CalendarUtils.getWeekStart(targetDate);
        const weekEnd = CalendarUtils.getWeekEnd(targetDate);
        const data = await imprevuAPI.getAll({
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          limit: '200',
        });
        const loadedImprevus = data.imprevus || data || [];
        setImprevus(loadedImprevus);
        return loadedImprevus;
      } catch (error) {
        console.error('Error loading imprevus:', error);
      }
    };

    const loadPtos = async () => {
      try {
        const data = await ptoAPI.getAll();
        setPtos(data || []);
        return data || [];
      } catch (error) {
        console.error('Error loading PTOs:', error);
      }
    };

    const loadTimeplans = async () => {
      try {
        const data = await timeplanAPI.getAll();
        setTimeplans(data || []);
        return data || [];
      } catch (error) {
        console.error('Error loading timeplans:', error);
      }
    };

    useImperativeHandle(ref, () => ({
      navigateToDate: (date) => {
        if (calendarRef.current) {
          calendarRef.current.navigateToDate(date);
        }
      },
      refreshAppointments: () => loadAppointments({ showLoader: false }),
      refreshImprevus: () => loadImprevus(currentDate),
      refreshAll: async () => {
        await Promise.all([
          loadAppointments({ showLoader: false }),
          loadImprevus(currentDate),
          loadPtos(),
          loadTimeplans(),
        ]);
      },
      getCurrentDate: () =>
        calendarRef.current?.getCurrentDate
          ? calendarRef.current.getCurrentDate()
          : null,
      getAppointmentsForDate: (date) => {
        const targetDate = date instanceof Date ? date : new Date(date);
        return CalendarUtils.getAppointmentsForDay(appointments, targetDate);
      },
      getAllAppointments: () => appointments,
    }));

    useEffect(() => {
      loadAppointments();
      loadPreferences();
      loadImprevus(currentDate);
      loadPtos();
      loadTimeplans();
    }, []);

    // Listen for preference updates
    useEffect(() => {
      const handlePreferencesUpdate = (event) => {
        setPreferences(event.detail);
      };

      window.addEventListener(
        'agendaPreferencesUpdated',
        handlePreferencesUpdate
      );
      return () => {
        window.removeEventListener(
          'agendaPreferencesUpdated',
          handlePreferencesUpdate
        );
      };
    }, []);

    useEffect(() => {
      loadImprevus(currentDate);
    }, [currentDate]);

    const handleDateChange = (date) => {
      const targetDate = date instanceof Date ? date : new Date(date);
      setCurrentDate(targetDate);
      onDateChange?.(targetDate);
    };

    const findBlockingImprevuForDateTime = (dateTime) => {
      if (!imprevus || imprevus.length === 0) {
        return null;
      }
      const target = dateTime instanceof Date ? dateTime : new Date(dateTime);
      return (
        imprevus.find((imprevu) => {
          if (imprevu.blockTimeSlots === false) {
            return false;
          }
          const start = new Date(imprevu.startDate);
          const end = new Date(imprevu.endDate);
          return target >= start && target < end;
        }) || null
      );
    };

    const findBlockingPtoForDateTime = (dateTime) => {
      if (!ptos || ptos.length === 0) {
        return null;
      }
      const target = dateTime instanceof Date ? dateTime : new Date(dateTime);
      const targetDateStr = format(target, 'yyyy-MM-dd');

      return (
        ptos.find((pto) => {
          const start = new Date(pto.startDate);
          const end = new Date(pto.endDate);
          const startDateStr = format(start, 'yyyy-MM-dd');
          const endDateStr = format(end, 'yyyy-MM-dd');

          return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
        }) || null
      );
    };

    const checkIsDayClosed = (dateTime) => {
      const imprevu = findBlockingImprevuForDateTime(dateTime);
      if (imprevu) return { type: 'imprevu', data: imprevu };

      const pto = findBlockingPtoForDateTime(dateTime);
      if (pto) return { type: 'pto', data: pto };

      return null;
    };

    const handleTimeSlotClickWithImprevuCheck = (dateTime) => {
      const slotDate = dateTime instanceof Date ? dateTime : new Date(dateTime);
      const blockingInfo = checkIsDayClosed(slotDate);

      if (blockingInfo) {
        const { type, data } = blockingInfo;
        setPendingSlotDate(slotDate);
        if (type === 'imprevu') {
          setPendingImprevu(data);
        } else {
          // For PTOs we can treat them similarly? The user said "follow the imprevus one its similar"
          // But existing state structure seems to rely on pendingImprevu
          // I'll reuse pendingImprevu or create a new state? reusing might be confusing if the dialog expects imprevu fields
          // Let's see what the dialog uses: getImprevuLabel
          // I should probably set pendingImprevu to a "fake" imprevu object or update the dialog logic.
          // Imprevu object has: startDate, endDate, reason.
          // PTO object has: startDate, endDate, label.
          // I will map PTO to a compatible object for now to minimize changes, or update dialog.
          // Let's store it in pendingImprevu but add a flag or just map properties.
          setPendingImprevu({
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.label, // Map label to reason for display
            type: 'PTO' // marker
          });
        }
        setForceDialogOpen(true);
        return;
      }
      onTimeSlotClick?.(slotDate);
    };

    const handleForceDialogClose = () => {
      setForceDialogOpen(false);
      setPendingSlotDate(null);
      setPendingImprevu(null);
    };

    const handleForceDialogConfirm = () => {
      if (pendingSlotDate) {
        onTimeSlotClick?.(pendingSlotDate);
      }
      handleForceDialogClose();
    };

    const getImprevuLabel = (imprevu) => {
      if (!imprevu) {
        return '';
      }
      if (imprevu.reason && imprevu.reason.trim().length > 0) {
        return imprevu.reason.trim();
      }
      const start = new Date(imprevu.startDate);
      const end = new Date(imprevu.endDate);
      const sameDay =
        start.toDateString() === end.toDateString() ||
        format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
      if (sameDay) {
        return format(start, 'd MMMM yyyy', { locale: fr });
      }
      return `${format(start, 'd MMMM yyyy', { locale: fr })} – ${format(
        end,
        'd MMMM yyyy',
        { locale: fr }
      )}`;
    };

    if (loading) {
      return (
        <div className='h-full bg-white lg:border-r border-gray-200 flex items-center justify-center'>
          <div className='flex items-center space-x-2 text-gray-600'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span>Loading calendar...</span>
          </div>
        </div>
      );
    }

    return (
      <div className='h-full bg-white lg:border-r border-gray-200 flex flex-col'>
        {/* Calendar View */}
        <div className='flex-1 overflow-hidden'>
          <CalendarView
            ref={calendarRef}
            appointments={appointments}
            imprevus={imprevus}
            ptos={ptos}
            timeplans={timeplans}
            onAppointmentClick={onAppointmentClick}
            onTimeSlotClick={handleTimeSlotClickWithImprevuCheck}
            workingHours={{
              start: preferences.startHour,
              end: preferences.endHour,
            }}
            verticalZoom={preferences.verticalZoom}
            mainColor={preferences.mainColor}
            defaultView={currentView}
            isTabOpen={isTabOpen}
            onDateChange={handleDateChange}
          />
        </div>
        <ConfirmDialog
          isOpen={forceDialogOpen}
          onClose={handleForceDialogClose}
          onConfirm={handleForceDialogConfirm}
          title='Forcer un rendez-vous sur un jour fermé ?'
          description={
            pendingImprevu
              ? `Ce jour est déclaré comme non travaillé en raison de ${pendingImprevu.type === 'PTO' ? 'congés' : "l'imprévu"} « ${getImprevuLabel(
                pendingImprevu
              )} ». Voulez-vous vraiment forcer la création de ce rendez-vous à cette date ?`
              : 'Ce jour est déclaré comme non travaillé en raison d’un imprévu. Voulez-vous vraiment forcer la création de ce rendez-vous à cette date ?'
          }
          confirmText='Forcer le rendez-vous'
          cancelText='Annuler'
          variant='destructive'
        />
      </div>
    );
  }
);

CalendarSection.displayName = 'CalendarSection';

export default CalendarSection;
