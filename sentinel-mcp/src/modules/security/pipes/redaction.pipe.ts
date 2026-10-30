import { Pipe, PipeInterface, ArgumentMetadata } from '@nitrostack/core';
import { DlpEngine } from '../engines/dlp.engine.js';

@Pipe()
export class RedactionPipe implements PipeInterface<Record<string, unknown>, Record<string, unknown>> {
  transform(value: Record<string, unknown>, metadata: ArgumentMetadata): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return value;
    }
    const result = DlpEngine.scrub(value);
    return result.sanitized;
  }
}
