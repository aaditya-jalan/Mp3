import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keyvalue',
  standalone: true
})
export class KeyValuePipe implements PipeTransform {
  transform(value: any): { key: string, value: any }[] {
    if (!value || typeof value !== 'object') return [];
    return Object.keys(value).map(key => ({ key, value: value[key] }));
  }
}
