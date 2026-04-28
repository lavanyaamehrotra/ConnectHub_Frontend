import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transformMediaUrl',
  standalone: true
})
export class TransformMediaUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    if (!url) return '';

    let fixedUrl = url;
    
    // Aggressively replace docker/internal hostnames with localhost
    // Using /gi for case-insensitive global replacement
    fixedUrl = fixedUrl.replace(/azurite:10000/gi, 'localhost:10000');
    fixedUrl = fixedUrl.replace(/127\.0\.0\.1:10000/gi, 'localhost:10000');
    fixedUrl = fixedUrl.replace(/host\.docker\.internal:10000/gi, 'localhost:10000');
    
    // Ensure the default Azurite account name is present if it's a local blob URL
    if (fixedUrl.includes('localhost:10000') && !fixedUrl.includes('devstoreaccount1')) {
      fixedUrl = fixedUrl.replace('localhost:10000/', 'localhost:10000/devstoreaccount1/');
    }
    
    return fixedUrl;
  }
}
