import { Module } from '@nitrostack/core';
import { QuarantineService } from './quarantine.service.js';
import { QuarantineTools } from './quarantine.tools.js';

@Module({
  name: 'quarantine',
  description: 'Tool Blacklisting & Active Quarantine Management',
  providers: [
    QuarantineService,
    QuarantineTools,
  ],
  exports: [
    QuarantineService,
  ],
})
export class QuarantineModule {}
