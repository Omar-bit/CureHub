import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '../lib/toast';
import { imprevuAPI, consultationTypesAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ConfirmDialog } from './ui/confirm-dialog';
import { Switch } from './ui/switch';
import { SheetContent, SheetFooter } from './ui/sheet';
import { Checkbox } from './ui/checkbox';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { getPatientDisplayName } from '../lib/patient';

const ImprevuFormSheet = ({ imprevu, isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notifyPatients: true,
    blockTimeSlots: true,
    reason: '',
    message: '',
    consultationTypeIds: [],
    appointmentIds: [],
  });
  const [affectedAppointments, setAffectedAppointments] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAppointments, setIsFetchingAppointments] = useState(false);

  useEffect(() => {
    if (imprevu) {
      setFormData({
        startDate: imprevu.startDate
          ? new Date(imprevu.startDate).toISOString().split('T')[0]
          : '',
        endDate: imprevu.endDate
          ? new Date(imprevu.endDate).toISOString().split('T')[0]
          : '',
        notifyPatients: imprevu.notifyPatients ?? true,
        blockTimeSlots: imprevu.blockTimeSlots ?? true,
        reason: imprevu.reason || '',
        message: imprevu.message || '',
        consultationTypeIds: [],
        appointmentIds: [],
      });
    } else {
      setFormData({
        startDate: '',
        endDate: '',
        notifyPatients: true,
        blockTimeSlots: true,
        reason: '',
        message: '',
        consultationTypeIds: [],
        appointmentIds: [],
      });
    }
    setCurrentStep(1);
    setAffectedAppointments([]);

    // Fetch consultation types
    if (isOpen) {
      fetchConsultationTypes();
    }
  }, [imprevu, isOpen]);

  const fetchConsultationTypes = async () => {
    try {
      const data = await consultationTypesAPI.getAll();
      console.log('Consultation types response:', data);
      setConsultationTypes(data.consultationTypes || data || []);
    } catch (error) {
      console.error('Error fetching consultation types:', error);
      showError('Failed to fetch consultation types');
    }
  };

  const fetchAffectedAppointments = async () => {
    if (!formData.startDate || !formData.endDate) {
      showError('Please select both start and end dates');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      showError('Start date must be before end date');
      return;
    }

    setIsFetchingAppointments(true);
    try {
      const appointments = await imprevuAPI.getAffectedAppointments(
        formData.startDate,
        formData.endDate
      );
      setAffectedAppointments(appointments);
      // Auto-select all appointments by default
      setFormData((prev) => ({
        ...prev,
        appointmentIds: appointments.map((apt) => apt.id),
      }));
      setCurrentStep(2);
    } catch (error) {
      console.error('Error fetching affected appointments:', error);
      showError('Failed to fetch affected appointments');
    } finally {
      setIsFetchingAppointments(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const selectedAppointments = affectedAppointments.filter((apt) =>
        formData.appointmentIds.includes(apt.id)
      );

      // Always send appointmentIds array (empty array = cancel none, filled = cancel selected)
      const dataToSend = {
        ...formData,
        appointmentIds: formData.appointmentIds, // Send the array as-is
      };

      console.log('Sending data:', dataToSend);

      let savedImprevu;
      if (imprevu) {
        savedImprevu = await imprevuAPI.update(imprevu.id, dataToSend);
        showSuccess('Imprevu updated successfully');
      } else {
        savedImprevu = await imprevuAPI.create(dataToSend);
        showSuccess(
          `Imprevu created successfully. ${
            formData.blockTimeSlots && selectedAppointments.length > 0
              ? `${selectedAppointments.length} appointment(s) will be cancelled.`
              : formData.blockTimeSlots && formData.appointmentIds.length === 0
              ? 'No appointments will be cancelled.'
              : ''
          }`
        );
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving imprevu:', error);
      showError(error.response?.data?.message || 'Failed to save imprevu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleConsultationType = (typeId) => {
    setFormData((prev) => {
      const newIds = prev.consultationTypeIds.includes(typeId)
        ? prev.consultationTypeIds.filter((id) => id !== typeId)
        : [...prev.consultationTypeIds, typeId];
      return { ...prev, consultationTypeIds: newIds };
    });
  };

  const toggleAppointment = (appointmentId) => {
    setFormData((prev) => {
      const newIds = prev.appointmentIds.includes(appointmentId)
        ? prev.appointmentIds.filter((id) => id !== appointmentId)
        : [...prev.appointmentIds, appointmentId];
      return { ...prev, appointmentIds: newIds };
    });
  };

  const toggleAllAppointments = (checked) => {
    if (checked) {
      const filteredAppointments = getFilteredAppointments();
      setFormData((prev) => ({
        ...prev,
        appointmentIds: filteredAppointments.map((apt) => apt.id),
      }));
    } else {
      setFormData((prev) => ({ ...prev, appointmentIds: [] }));
    }
  };

  const getFilteredAppointments = () => {
    if (formData.consultationTypeIds.length === 0) {
      return affectedAppointments;
    }
    return affectedAppointments.filter((apt) =>
      formData.consultationTypeIds.includes(apt.consultationType?.id)
    );
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      fetchAffectedAppointments();
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  if (!isOpen) return null;

  return (
    <SheetContent
      side='right'
      onClose={onClose}
      title={
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-purple-500' />
          {imprevu ? 'Edit Imprevu' : 'Create Imprevu'}
        </div>
      }
      className='w-full '
    >
      <div className='space-y-6'>
        <p className='text-sm text-gray-600'>
          Block time slots and manage affected appointments
        </p>

        {/* Step Indicator */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              1
            </div>
            <span className='text-sm font-medium'>Select Period</span>
          </div>
          <div className='flex-1 h-0.5 bg-gray-200 mx-2'>
            <div
              className={`h-full ${currentStep >= 2 ? 'bg-purple-500' : ''}`}
              style={{ width: currentStep >= 2 ? '100%' : '0%' }}
            />
          </div>
          <div className='flex items-center gap-2'>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            <span className='text-sm font-medium'>Review Appointments</span>
          </div>
          <div className='flex-1 h-0.5 bg-gray-200 mx-2'>
            <div
              className={`h-full ${currentStep >= 3 ? 'bg-purple-500' : ''}`}
              style={{ width: currentStep >= 3 ? '100%' : '0%' }}
            />
          </div>
          <div className='flex items-center gap-2'>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </div>
            <span className='text-sm font-medium'>Settings</span>
          </div>
        </div>

        {/* Step 1: Date Range Selection */}
        {currentStep === 1 && (
          <div className='space-y-4'>
            <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-purple-900 mb-2'>
                Select Time Period
              </h3>
              <p className='text-sm text-purple-700'>
                Choose the date range during which you want to block
                appointments
              </p>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Start Date <span className='text-red-500'>*</span>
                </label>
                <input
                  type='datetime-local'
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  End Date <span className='text-red-500'>*</span>
                </label>
                <input
                  type='datetime-local'
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review Affected Appointments */}
        {currentStep === 2 &&
          (() => {
            const filteredAppointments = getFilteredAppointments();
            const allSelected =
              filteredAppointments.length > 0 &&
              filteredAppointments.every((apt) =>
                formData.appointmentIds.includes(apt.id)
              );
            const someSelected = filteredAppointments.some((apt) =>
              formData.appointmentIds.includes(apt.id)
            );

            return (
              <div className='space-y-4'>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <h3 className='text-lg font-semibold text-yellow-900 mb-2 flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5' />
                    {filteredAppointments.length} Appointment(s) Found
                  </h3>
                  <p className='text-sm text-yellow-700'>
                    Filter by consultation type and select which appointments to
                    cancel
                  </p>
                </div>

                {/* Consultation Type Filters */}
                <div className='bg-white border border-gray-200 rounded-lg p-4'>
                  <h4 className='font-semibold text-gray-900 mb-3'>
                    Filter by Consultation Type
                  </h4>
                  {console.log('Consultation Types:', consultationTypes)}
                  {console.log('Affected Appointments:', affectedAppointments)}
                  <div className='flex flex-wrap gap-2'>
                    {consultationTypes.length === 0 && (
                      <p className='text-sm text-gray-500'>
                        No consultation types available
                      </p>
                    )}
                    {consultationTypes.map((type) => {
                      const isSelected = formData.consultationTypeIds.includes(
                        type.id
                      );
                      const appointmentCount = affectedAppointments.filter(
                        (apt) => apt.consultationType?.id === type.id
                      ).length;

                      console.log(
                        `Type: ${type.name}, Count: ${appointmentCount}`
                      );

                      if (appointmentCount === 0) return null;

                      return (
                        <button
                          key={type.id}
                          type='button'
                          onClick={() => toggleConsultationType(type.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'ring-2 ring-offset-2'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? type.color
                              : `${type.color}20`,
                            color: isSelected ? 'white' : type.color,
                            ringColor: type.color,
                          }}
                        >
                          {type.name} ({appointmentCount})
                        </button>
                      );
                    })}
                    {formData.consultationTypeIds.length > 0 && (
                      <button
                        type='button'
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            consultationTypeIds: [],
                          }))
                        }
                        className='px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300'
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {affectedAppointments.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    <Calendar className='h-12 w-12 mx-auto mb-2 text-gray-400' />
                    <p>No appointments found in this time period</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    <Calendar className='h-12 w-12 mx-auto mb-2 text-gray-400' />
                    <p>No appointments match the selected filters</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {/* Select All */}
                    <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
                      <Checkbox
                        id='select-all'
                        checked={allSelected}
                        onCheckedChange={toggleAllAppointments}
                        className={
                          someSelected && !allSelected
                            ? 'data-[state=checked]:bg-gray-400'
                            : ''
                        }
                      />
                      <label
                        htmlFor='select-all'
                        className='text-sm font-medium cursor-pointer'
                      >
                        {allSelected
                          ? `Deselect all (${filteredAppointments.length})`
                          : someSelected
                          ? `Select all (${formData.appointmentIds.length}/${filteredAppointments.length} selected)`
                          : `Select all (${filteredAppointments.length})`}
                      </label>
                    </div>

                    {/* Appointments List */}
                    <div className='max-h-96 overflow-y-auto space-y-2'>
                      {filteredAppointments.map((appointment) => {
                        const patients =
                          appointment.appointmentPatients?.length > 0
                            ? appointment.appointmentPatients.map(
                                (ap) => ap.patient
                              )
                            : appointment.patient
                            ? [appointment.patient]
                            : [];

                        const isSelected = formData.appointmentIds.includes(
                          appointment.id
                        );

                        return (
                          <Card
                            key={appointment.id}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'ring-2 ring-purple-500 bg-purple-50'
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => toggleAppointment(appointment.id)}
                          >
                            <CardContent className='p-4'>
                              <div className='flex items-start gap-3'>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleAppointment(appointment.id)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className='mt-1'
                                />
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2 mb-2'>
                                    <Clock className='h-4 w-4 text-gray-400' />
                                    <span className='font-medium'>
                                      {format(
                                        new Date(appointment.startTime),
                                        'dd/MM/yyyy HH:mm'
                                      )}{' '}
                                      -{' '}
                                      {format(
                                        new Date(appointment.endTime),
                                        'HH:mm'
                                      )}
                                    </span>
                                  </div>
                                  <div className='space-y-1'>
                                    {patients.map((patient, idx) => (
                                      <div
                                        key={patient.id}
                                        className='text-sm text-gray-600'
                                      >
                                        {getPatientDisplayName(patient)}
                                      </div>
                                    ))}
                                  </div>
                                  {appointment.consultationType && (
                                    <Badge
                                      variant='outline'
                                      className='mt-2'
                                      style={{
                                        color:
                                          appointment.consultationType.color,
                                        borderColor:
                                          appointment.consultationType.color,
                                      }}
                                    >
                                      {appointment.consultationType.name}
                                    </Badge>
                                  )}
                                </div>
                                {isSelected && (
                                  <Badge variant='destructive'>
                                    <Ban className='h-3 w-3 mr-1' />
                                    Will Cancel
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        {/* Step 3: Settings & Message */}
        {currentStep === 3 && (
          <div className='space-y-4'>
            <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-purple-900 mb-2'>
                Configure Settings
              </h3>
              <p className='text-sm text-purple-700'>
                Set up notifications and blocking preferences
              </p>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                <div className='flex-1'>
                  <label className='font-medium text-gray-900'>
                    Cancel Appointments
                  </label>
                  <p className='text-sm text-gray-500 mt-1'>
                    Automatically cancel all appointments in this period
                  </p>
                </div>
                <Switch
                  checked={formData.blockTimeSlots}
                  onCheckedChange={(checked) =>
                    handleChange('blockTimeSlots', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                <div className='flex-1'>
                  <label className='font-medium text-gray-900'>
                    Notify Patients
                  </label>
                  <p className='text-sm text-gray-500 mt-1'>
                    Send cancellation notifications to affected patients
                  </p>
                </div>
                <Switch
                  checked={formData.notifyPatients}
                  onCheckedChange={(checked) =>
                    handleChange('notifyPatients', checked)
                  }
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Reason (Optional)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                placeholder='e.g., Sickness, Travel, Emergency...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
                rows={2}
              />
            </div>

            {formData.notifyPatients && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Send className='inline h-4 w-4 mr-1' />
                  Message to Patients (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder='Custom message to send to your patients about the cancellation...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
                  rows={4}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  This message will be sent along with the cancellation
                  notification
                </p>
              </div>
            )}
          </div>
        )}

        <SheetFooter className='border-t pt-4 mt-6'>
          <div className='flex justify-between w-full'>
            <Button
              type='button'
              variant='outline'
              onClick={currentStep === 1 ? onClose : goBack}
              disabled={isLoading || isFetchingAppointments}
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {currentStep < 3 ? (
              <Button
                type='button'
                onClick={handleNext}
                disabled={
                  isLoading ||
                  isFetchingAppointments ||
                  !formData.startDate ||
                  !formData.endDate
                }
              >
                {isFetchingAppointments ? (
                  'Loading...'
                ) : (
                  <>
                    Next
                    <ChevronRight className='h-4 w-4 ml-1' />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type='button'
                onClick={handleSubmit}
                disabled={isLoading}
                className='bg-purple-500 hover:bg-purple-600'
              >
                {isLoading
                  ? 'Saving...'
                  : imprevu
                  ? 'Update'
                  : 'Create Imprevu'}
              </Button>
            )}
          </div>
        </SheetFooter>
      </div>
    </SheetContent>
  );
};

const ImprevusManagement = ({ onImprevuChanged }) => {
  const { t } = useTranslation();
  const [imprevus, setImprevus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImprevu, setSelectedImprevu] = useState(null);
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
  });

  useEffect(() => {
    fetchImprevus();
  }, []);

  const fetchImprevus = async () => {
    setIsLoading(true);
    try {
      const data = await imprevuAPI.getAll();
      setImprevus(data.imprevus || []);
    } catch (error) {
      console.error('Error fetching imprevus:', error);
      showError('Failed to fetch imprevus');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedImprevu(null);
    setShowFormSheet(true);
  };

  const handleEdit = (imprevu) => {
    setSelectedImprevu(imprevu);
    setShowFormSheet(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      await imprevuAPI.delete(deleteConfirm.id);
      showSuccess('Imprevu deleted successfully');
      fetchImprevus();
      // Notify parent to refresh appointments
      if (onImprevuChanged) {
        onImprevuChanged();
      }
    } catch (error) {
      console.error('Error deleting imprevu:', error);
      showError('Failed to delete imprevu');
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleFormClose = () => {
    setShowFormSheet(false);
    setSelectedImprevu(null);
  };

  const handleFormSave = () => {
    fetchImprevus();
    // Notify parent to refresh appointments
    if (onImprevuChanged) {
      onImprevuChanged();
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500'></div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <AlertTriangle className='h-6 w-6 text-purple-500' />
            Imprevus
          </h2>
          <p className='text-gray-600 mt-1'>
            Manage unforeseen events and block time periods
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className='bg-purple-500 hover:bg-purple-600'
        >
          <Plus className='h-4 w-4 mr-2' />
          Create Imprevu
        </Button>
      </div>

      {imprevus.length === 0 ? (
        <Card>
          <CardContent className='py-12'>
            <div className='text-center'>
              <AlertTriangle className='h-16 w-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Imprevus Yet
              </h3>
              <p className='text-gray-600 mb-4'>
                Create your first imprevu to block time periods for unforeseen
                events
              </p>
              <Button
                onClick={handleCreate}
                variant='outline'
                className='border-purple-500 text-purple-500 hover:bg-purple-50'
              >
                <Plus className='h-4 w-4 mr-2' />
                Create Imprevu
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {imprevus.map((imprevu) => {
            const isPast = new Date(imprevu.endDate) < new Date();
            const isActive =
              new Date(imprevu.startDate) <= new Date() &&
              new Date(imprevu.endDate) >= new Date();

            return (
              <Card
                key={imprevu.id}
                className='hover:shadow-md transition-shadow'
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-3'>
                        <Calendar className='h-5 w-5 text-purple-500' />
                        <span className='font-semibold text-lg'>
                          {format(
                            new Date(imprevu.startDate),
                            'dd/MM/yyyy HH:mm'
                          )}
                          {' → '}
                          {format(
                            new Date(imprevu.endDate),
                            'dd/MM/yyyy HH:mm'
                          )}
                        </span>
                        {isActive && (
                          <Badge className='bg-purple-500'>Active</Badge>
                        )}
                        {isPast && <Badge variant='secondary'>Past</Badge>}
                      </div>

                      {imprevu.reason && (
                        <p className='text-gray-700 mb-2'>
                          <strong>Reason:</strong> {imprevu.reason}
                        </p>
                      )}

                      <div className='flex items-center gap-4 text-sm text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <Ban className='h-4 w-4' />
                          <span>
                            {imprevu.cancelledAppointmentsCount} appointment(s)
                            cancelled
                          </span>
                        </div>
                        {imprevu.notifyPatients && (
                          <div className='flex items-center gap-1'>
                            <Send className='h-4 w-4 text-green-500' />
                            <span>Patients notified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEdit(imprevu)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setDeleteConfirm({ isOpen: true, id: imprevu.id })
                        }
                        className='text-red-500 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showFormSheet && (
        <ImprevuFormSheet
          imprevu={selectedImprevu}
          isOpen={showFormSheet}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title='Delete Imprevu'
        description='Are you sure you want to delete this imprevu? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
      />
    </div>
  );
};

export default ImprevusManagement;
