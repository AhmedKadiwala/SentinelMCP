import { Module } from '@nitrostack/core';
import { AuditService } from './audit.service.js';
import { AuditResources } from './audit.resources.js';
import { QuarantineModule } from '../quarantine/quarantine.module.js';

@Module({
  name: 'audit',
  description: 'Observability & Live Audit Resource Streaming',
  imports: [
    QuarantineModule,
  ],
  providers: [
    AuditService,
    AuditResources,
  ],
  exports: [
    AuditService,
  ],
})
export class AuditModule {}
