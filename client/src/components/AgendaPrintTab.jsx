import React, { useState, useMemo, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { getPatientDisplayName } from '../lib/patient';

const STATUS_LABELS = {
  SCHEDULED: 'Programmé',
  CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  ABSENT: 'Absent',
};

const capitalizeFirstLetter = (value) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const calculateAge = (value) => {
  if (!value) return null;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
};

const normalizeAddress = (value) => {
  if (!value) return '';
  return value.replace(/\r?\n/g, ', ');
};

const buildPatientEntry = (patient) => {
  if (!patient) return null;
  const displayName = getPatientDisplayName(patient);
  const age = calculateAge(patient.dateOfBirth);
  const headerParts = [displayName];
  if (age !== null) {
    headerParts.push(`(${age} ans)`);
  }

  const lines = [headerParts.filter(Boolean).join(' ').trim()];
  if (patient.phoneNumber) {
    lines.push(patient.phoneNumber);
  }
  const normalizedAddress = normalizeAddress(patient.address);
  if (normalizedAddress) {
    lines.push(normalizedAddress);
  }

  return lines.filter(Boolean).join('\n');
};

const formatPatientBlock = (appointment) => {
  if (!appointment) {
    return '—';
  }

  if (
    Array.isArray(appointment.appointmentPatients) &&
    appointment.appointmentPatients.length > 0
  ) {
    const sortedPatients = [...appointment.appointmentPatients].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return 0;
    });

    const entries = sortedPatients
      .map((record) => buildPatientEntry(record.patient))
      .filter(Boolean);

    if (entries.length > 0) {
      return entries.join('\n\n');
    }
  }

  if (appointment.patient) {
    const entry = buildPatientEntry(appointment.patient);
    if (entry) {
      return entry;
    }
  }

  if (appointment.title) {
    return appointment.title;
  }

  return '—';
};

const formatPrecisions = (appointment) => {
  if (!appointment) return '—';
  const parts = [];

  if (appointment.consultationType?.name) {
    parts.push(appointment.consultationType.name);
  }
  if (appointment.description) {
    parts.push(appointment.description);
  }
  if (appointment.notes) {
    parts.push(`Note: ${appointment.notes}`);
  }
  if (appointment.status && STATUS_LABELS[appointment.status]) {
    parts.push(`Statut: ${STATUS_LABELS[appointment.status]}`);
  }

  if (parts.length === 0) {
    return '—';
  }

  return parts.join('\n');
};

const formatDisplayDate = (date) => {
  if (!date) return '';
  const formatted = format(date, 'EEEE d MMMM yyyy', { locale: fr });
  return capitalizeFirstLetter(formatted);
};

const AgendaPrintTab = ({
  selectedDate,
  appointments = [],
  doctorUser,
  doctorProfile,
  isLoading = false,
  onRefresh,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const displayDate = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate]
  );

  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [appointments]);

  const appointmentEntries = useMemo(() => {
    return sortedAppointments.map((appointment) => {
      const start = new Date(appointment.startTime);
      const startValid = !Number.isNaN(start.getTime());
      const end = appointment.endTime ? new Date(appointment.endTime) : start;
      const endValid = !Number.isNaN(end.getTime());
      const startLabel = startValid ? format(start, 'HH:mm') : '—';
      const durationMinutes =
        startValid && endValid
          ? Math.max(0, differenceInMinutes(end, start))
          : 0;

      return {
        id: appointment.id,
        timeLabel: startLabel,
        durationLabel: durationMinutes ? `${durationMinutes} min` : '—',
        patientsText: formatPatientBlock(appointment),
        precisionText: formatPrecisions(appointment),
      };
    });
  }, [sortedAppointments]);

  const doctorDisplayName = useMemo(() => {
    if (!doctorUser) return '';
    const parts = [doctorUser.firstName, doctorUser.lastName].filter(Boolean);
    if (parts.length === 0) return '';
    return `Dr ${parts.join(' ')}`.trim();
  }, [doctorUser]);

  const clinicLines = useMemo(() => {
    const lines = [];
    const clinic = doctorProfile?.clinic;

    if (clinic?.name) {
      lines.push(clinic.name);
    } else if (doctorDisplayName) {
      lines.push(`Cabinet médical de ${doctorDisplayName}`);
    }

    const addressParts = [clinic?.address, clinic?.address2].filter(Boolean);
    if (addressParts.length > 0) {
      lines.push(addressParts.join(', '));
    }

    const cityLine = [clinic?.postalCode, clinic?.city]
      .filter(Boolean)
      .join(' ');
    if (cityLine) {
      lines.push(cityLine);
    }

    if (clinic?.phone) {
      lines.push(clinic.phone);
    }

    return lines;
  }, [doctorProfile, doctorDisplayName]);

  const buildPdfDocument = useCallback(() => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;

    doc.setFont('Helvetica', 'normal');

    if (doctorDisplayName) {
      doc.setFontSize(12);
      doc.text(doctorDisplayName, rightMargin, 20, { align: 'right' });
    }

    clinicLines.forEach((line, index) => {
      doc.setFontSize(11);
      doc.text(line, rightMargin, 26 + index * 6, { align: 'right' });
    });

    if (displayDate) {
      doc.setFontSize(18);
      doc.text(displayDate, leftMargin, 32);
    }

    doc.setDrawColor(200);
    doc.line(leftMargin, 36, rightMargin, 36);

    const tableStartY = 44;
    const bodyRows = appointmentEntries.length
      ? appointmentEntries.map((entry) => [
          entry.timeLabel,
          entry.durationLabel,
          entry.patientsText,
          entry.precisionText,
        ])
      : [['—', '—', 'Aucun rendez-vous pour cette journée', '—']];

    autoTable(doc, {
      startY: tableStartY,
      head: [['Horaires', 'Durée', 'Patients', 'Précisions']],
      body: bodyRows,
      styles: {
        fontSize: 10,
        cellPadding: 2.5,
        lineColor: [224, 224, 224],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [45, 45, 45],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 22 },
        2: { cellWidth: 78 },
        3: { cellWidth: 44 },
      },
      margin: { left: leftMargin, right: leftMargin },
    });

    const tableBottomY = doc.lastAutoTable?.finalY || tableStartY;
    const signatureY = Math.min(
      tableBottomY + 24,
      doc.internal.pageSize.getHeight() - 30
    );

    if (doctorProfile?.signature) {
      if (doctorProfile.signature.startsWith('data:image')) {
        doc.addImage(
          doctorProfile.signature,
          'PNG',
          rightMargin - 50,
          signatureY - 20,
          45,
          18,
          undefined,
          'FAST'
        );
      } else {
        doc.setFontSize(11);
        doc.text(doctorProfile.signature, rightMargin, signatureY - 6, {
          align: 'right',
        });
      }
    }

    if (doctorDisplayName) {
      doc.setFontSize(12);
      doc.text(doctorDisplayName, rightMargin, signatureY, { align: 'right' });
    }

    doc.setFontSize(9);
    doc.text('Signature', rightMargin, signatureY + 6, { align: 'right' });

    return doc;
  }, [
    appointmentEntries,
    clinicLines,
    displayDate,
    doctorDisplayName,
    doctorProfile,
  ]);

  useEffect(() => {
    if (!selectedDate) {
      setPreviewUrl(null);
      return;
    }

    setIsGenerating(true);
    const doc = buildPdfDocument();
    const dataUri = doc.output('datauristring');
    setPreviewUrl(dataUri);
    setIsGenerating(false);
  }, [selectedDate, buildPdfDocument]);

  const handleDownload = () => {
    if (!selectedDate) return;
    const doc = buildPdfDocument();
    const filename = `Agenda_${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  const showLoader = isLoading || isGenerating;

  return (
    <div className='flex h-full flex-col bg-white'>
      <div className='flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Impression de l'agenda
          </h2>
          <p className='text-sm text-gray-600'>
            {displayDate
              ? `Rendez-vous du ${displayDate}`
              : 'Sélectionnez un jour dans le calendrier pour générer le PDF.'}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {onRefresh && (
            <button
              type='button'
              onClick={onRefresh}
              className='inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
            >
              <RefreshCw className='h-4 w-4' />
              Actualiser
            </button>
          )}
          <button
            type='button'
            onClick={handleDownload}
            disabled={!selectedDate || showLoader}
            className='inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300'
          >
            <Download className='h-4 w-4' />
            Télécharger le PDF
          </button>
        </div>
      </div>

      <div className='flex flex-1 flex-col overflow-hidden lg:flex-row'>
        <div className='flex-1 overflow-y-auto px-5 py-4 lg:w-1/2'>
          <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <h3 className='text-sm font-semibold text-gray-900'>Coordonnées</h3>
            <div className='mt-2 space-y-1 text-sm text-gray-600'>
              {doctorDisplayName && <div>{doctorDisplayName}</div>}
              {clinicLines.length > 0 ? (
                clinicLines.map((line, index) => <div key={index}>{line}</div>)
              ) : (
                <div className='text-gray-500'>
                  Aucune information de cabinet enregistrée.
                </div>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            {appointmentEntries.length === 0 ? (
              <div className='rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500'>
                Aucun rendez-vous pour cette journée.
              </div>
            ) : (
              appointmentEntries.map((entry, index) => (
                <div
                  key={entry.id ?? `appointment-${index}`}
                  className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
                >
                  <div className='flex items-center justify-between text-sm font-semibold text-gray-900'>
                    <span>{entry.timeLabel}</span>
                    <span className='text-xs text-gray-500'>
                      {entry.durationLabel}
                    </span>
                  </div>
                  <div className='mt-3 whitespace-pre-line text-sm text-gray-700'>
                    {entry.patientsText}
                  </div>
                  {entry.precisionText && entry.precisionText !== '—' && (
                    <div className='mt-3 whitespace-pre-line text-xs text-gray-600'>
                      {entry.precisionText}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className='border-t border-gray-200 px-5 py-4 lg:w-1/2 lg:border-l lg:border-t-0'>
          <h3 className='mb-3 text-sm font-semibold text-gray-900'>
            Aperçu du PDF
          </h3>
          <div className='h-full rounded-lg border border-gray-200 bg-gray-50'>
            {showLoader ? (
              <div className='flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-600'>
                <Loader2 className='h-5 w-5 animate-spin' />
                Génération du PDF…
              </div>
            ) : previewUrl ? (
              <iframe
                title='agenda-pdf-preview'
                src={previewUrl}
                className='h-full w-full rounded-lg'
              />
            ) : (
              <div className='flex h-full items-center justify-center px-6 text-center text-sm text-gray-500'>
                L'aperçu s'affichera automatiquement après la sélection d'une
                date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaPrintTab;
