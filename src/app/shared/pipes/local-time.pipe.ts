import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localTime',
  standalone: true,
})
export class LocalTimePipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
    if (value === null || value === undefined) return '';

    try {
      const d = this.parseToDate(value);
      if (isNaN(d.getTime())) return '';

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const formatter = new Intl.DateTimeFormat(undefined, { ...options, timeZone: tz });
      return formatter.format(d);
    } catch {
      return '';
    }
  }

  private parseToDate(value: Date | string | number): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    const s = (value as string).trim();
    if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      return new Date(s);
    }
    if (/^\d{4}-\d{2}-\d{2}T.*/.test(s)) {
      return new Date(s + 'Z');
    }
    return new Date(s);
  }
}

