import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'censurarEmail',
  standalone: true
})
export class CensurarEmailPipe implements PipeTransform {
  transform(value: string, visibleChars: number = 4): string {
    if (!value || !value.includes('@')) return value;
    const [name, domain] = value.split('@');
    const hiddenChars = '*'.repeat(Math.max(0, name.length - visibleChars));
    return `${name.slice(0, visibleChars)}${hiddenChars}@${domain}`;
  }
}
