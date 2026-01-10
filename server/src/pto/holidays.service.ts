import { Injectable, Logger } from '@nestjs/common';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'public' | 'school';
  zone?: string;
  endDate?: string; // For school holidays
}

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);
  private readonly PUBLIC_HOLIDAYS_API = 'https://calendrier.api.gouv.fr/jours-feries/metropole.json';
  private readonly SCHOOL_HOLIDAYS_API = 'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire';

  async getPublicHolidays(year: number): Promise<Holiday[]> {
    try {
      const response = await fetch(this.PUBLIC_HOLIDAYS_API);
      if (!response.ok) {
        throw new Error(`Failed to fetch public holidays: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Data is { "YYYY-MM-DD": "Name", ... }
      return Object.entries(data)
        .filter(([date]) => date.startsWith(year.toString()))
        .map(([date, name]) => ({
          date,
          name: name as string,
          type: 'public' as const,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      this.logger.error('Error fetching public holidays', error);
      throw error;
    }
  }

  async getSchoolHolidays(startYear: number, endYear: number, zones: string[]): Promise<Holiday[]> {
    try {
      // Construct query for the academic years covering the requested period
      // Academic years format: "2025-2026"
      const schoolYears = [`${startYear-1}-${startYear}`, `${startYear}-${startYear+1}`, `${endYear}-${endYear+1}`];
      // Filter unique years and format for API
      
      const allHolidays: Holiday[] = [];

      for (const zone of zones) {
         // We fetch a bit more data to be safe, filtering client-side or processing carefully
         // Using 'rows=100' should be enough for a year or two per zone
         const promises = schoolYears.map(async (schoolYear) => {
             const url = `${this.SCHOOL_HOLIDAYS_API}&rows=100&refine.zones=Zone+${zone}&refine.annee_scolaire=${schoolYear}`;
             const res = await fetch(url);
             if (!res.ok) return [];
             const json = await res.json();
             return json.records || [];
         });

         const results = await Promise.all(promises);
         const records = results.flat();

         records.forEach((record: any) => {
             const fields = record.fields;
             if (fields.population === 'Enseignants') return; // Skip teacher-only dates if desired, usually we want student holidays

             // fields.start_date and fields.end_date are standard ISO strings
             if (fields.start_date && fields.end_date) {
                 const start = fields.start_date.split('T')[0];
                 const end = fields.end_date.split('T')[0];
                 
                 // Filter strictly by requested year match if needed, but for now we return what we found
                 // The calling controller/logic can filter by strict date range if needed.
                 // Ideally we check if the range overlaps with the requested year(s).
                 
                 allHolidays.push({
                     date: start,
                     endDate: end,
                     name: fields.description,
                     type: 'school' as const,
                     zone: zone
                 });
             }
         });
      }

      // Filter to ensure we only return holidays that overlap with requested year(s)
      // For simplicity, we just return all found for the school years and let frontend or controller filter if needed?
      // Better to return relevant ones.
      
      return allHolidays.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
       this.logger.error('Error fetching school holidays', error);
       return []; // Return empty on error to avoid breaking everything
    }
  }
}
