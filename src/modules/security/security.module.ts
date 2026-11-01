import { Module } from '@nitrostack/core';
import { SecurityService } from './security.service.js';
import { SecurityTools } from './security.tools.js';
import { SentinelInterceptor } from './interceptors/sentinel.interceptor.js';
import { RedactionPipe } from './pipes/redaction.pipe.js';
import { QuarantineModule } from '../quarantine/quarantine.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  name: 'security',
  description: 'Zero-Trust Inspection, DLP Scrubbing & Manifest Auditing',
  imports: [
    QuarantineModule,
    AuditModule,
  ],
  providers: [
    SecurityService,
    SecurityTools,
    SentinelInterceptor,
    RedactionPipe,
  ],
  exports: [
    SecurityService,
    SentinelInterceptor,
    RedactionPipe,
  ],
})
export class SecurityModule {}
