import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Calendar as CalendarIcon, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ptoAPI } from '../../services/api';
import { showError, showSuccess } from '../../lib/toast';

export function HolidayImportDialog({ open, onOpenChange, onHolidayInjected, existingPTOs = [] }) {
    const [activeTab, setActiveTab] = useState('public');
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedZone, setSelectedZone] = useState('A');
    const [holidays, setHolidays] = useState([]);
    const [selectedHolidays, setSelectedHolidays] = useState({});
    const [loading, setLoading] = useState(false);
    const [injecting, setInjecting] = useState(false);

    // Check if holiday is already imported
    const isAlreadyImported = (holiday) => {
        return existingPTOs.some(pto => {
            const ptoStart = format(new Date(pto.startDate), 'yyyy-MM-dd');
            const ptoEnd = format(new Date(pto.endDate), 'yyyy-MM-dd');
            const holidayStart = holiday.date; // YYYY-MM-DD
            const holidayEnd = holiday.endDate || holiday.date; // YYYY-MM-DD

            // Check for exact match or full containment
            return ptoStart === holidayStart && ptoEnd === holidayEnd;
        });
    };

    // Check if holiday is already imported


    // Load holidays when filters or existing PTOs change
    useEffect(() => {
        if (open) {
            fetchHolidays();
        }
    }, [open, activeTab, year, selectedZone, existingPTOs]);

    const fetchHolidays = async () => {
        setLoading(true);
        // Don't clear holidays here to prevent flashing, but maybe we should?
        // setHolidays([]); 
        // Better to keep showing old ones while loading or just show loading spinner

        try {
            const data = await ptoAPI.getHolidays({
                year,
                type: activeTab,
                zones: activeTab === 'school' ? selectedZone : undefined,
            });
            setHolidays(data);

            // Re-calculate selection based on new data and current import status
            const initialSelection = {};
            data.forEach((h) => {
                if (!isAlreadyImported(h)) {
                    initialSelection[getHolidayId(h)] = true;
                }
            });
            setSelectedHolidays(initialSelection);
        } catch (error) {
            // ... existing error handling
            console.error(error);
            showError('Erreur lors du chargement des jours fériés');
        } finally {
            setLoading(false);
        }
    };



    const getHolidayId = (holiday) => `${holiday.date}-${holiday.name}`;

    const toggleHoliday = (holiday) => {
        const id = getHolidayId(holiday);
        setSelectedHolidays((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleInject = async () => {
        const holidaysToInject = holidays.filter(
            (h) => selectedHolidays[getHolidayId(h)]
        );

        if (holidaysToInject.length === 0) {
            showError('Veuillez sélectionner au moins un jour');
            return;
        }

        setInjecting(true);
        let successCount = 0;
        let errors = 0;

        for (const holiday of holidaysToInject) {
            try {
                await ptoAPI.create({
                    label: holiday.name,
                    startDate: holiday.date,
                    endDate: holiday.endDate || holiday.date,
                    announcements: 2, // Default value
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to inject ${holiday.name}`, error);
                errors++;
            }
        }

        setInjecting(false);

        if (successCount > 0) {
            showSuccess(`${successCount} jours ajoutés avec succès`);
            if (onHolidayInjected) onHolidayInjected();
            onOpenChange(false);
        }
        if (errors > 0) {
            showError(`${errors} erreurs lors de l'ajout`);
        }
    };

    const years = [
        new Date().getFullYear(),
        new Date().getFullYear() + 1,
        new Date().getFullYear() + 2,
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-[600px] max-h-[80vh] flex flex-col'>
                <DialogHeader>
                    <DialogTitle>Ajout de jours fériés publics</DialogTitle>
                    <DialogDescription>
                        Sélectionnez les jours à ajouter à votre calendrier de congés via api.gouv.fr
                    </DialogDescription>
                </DialogHeader>

                <div className='flex-1 overflow-y-auto py-4'>
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className='w-full'
                    >
                        <TabsList className='grid w-full grid-cols-2 mb-4'>
                            <TabsTrigger value='public'>Jours fériés</TabsTrigger>
                            <TabsTrigger value='school'>Vacances scolaires</TabsTrigger>
                        </TabsList>

                        <div className='flex gap-4 mb-4 items-end'>
                            <div className='w-32'>
                                <Label>Année</Label>
                                <Select
                                    value={year.toString()}
                                    onValueChange={(v) => setYear(parseInt(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
                                                {y} ({activeTab === 'school' ? `${y}-${y + 1}` : ''})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {activeTab === 'school' && (
                                <div className='w-40'>
                                    <Label>Zone</Label>
                                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='A'>Zone A</SelectItem>
                                            <SelectItem value='B'>Zone B</SelectItem>
                                            <SelectItem value='C'>Zone C</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className='space-y-2 border rounded-md p-2 min-h-[200px]'>
                            {loading ? (
                                <div className='flex justify-center items-center h-40 text-gray-500'>
                                    <Loader2 className='h-6 w-6 animate-spin mr-2' />
                                    Chargement...
                                </div>
                            ) : holidays.length === 0 ? (
                                <div className='flex justify-center items-center h-40 text-gray-500'>
                                    Aucun jour trouvé.
                                </div>
                            ) : (
                                holidays.map((holiday) => (
                                    <div
                                        key={getHolidayId(holiday)}
                                        className='flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md'
                                    >
                                        <Checkbox
                                            checked={!!selectedHolidays[getHolidayId(holiday)]}
                                            onCheckedChange={() => toggleHoliday(holiday)}
                                            id={getHolidayId(holiday)}
                                            disabled={isAlreadyImported(holiday)}
                                        />
                                        <label
                                            htmlFor={getHolidayId(holiday)}
                                            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1'
                                        >
                                            <span className='font-semibold text-gray-700'>
                                                {holiday.name}
                                            </span>
                                            <span className='ml-2 text-gray-500'>
                                                {format(new Date(holiday.date), 'EEEE d MMMM yyyy', {
                                                    locale: fr,
                                                })}
                                                {holiday.endDate &&
                                                    ` - ${format(
                                                        new Date(holiday.endDate),
                                                        'EEEE d MMMM yyyy',
                                                        { locale: fr }
                                                    )}`}
                                            </span>
                                            {isAlreadyImported(holiday) && (
                                                <span className='ml-2 text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full'>
                                                    Déjà ajouté
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={injecting}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleInject}
                        disabled={
                            loading ||
                            injecting ||
                            Object.values(selectedHolidays).filter(Boolean).length === 0
                        }
                        className='bg-blue-600 hover:bg-blue-700'
                    >
                        {injecting && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
                        Injecter{' '}
                        {Object.values(selectedHolidays).filter(Boolean).length} jours
                        fériés
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
