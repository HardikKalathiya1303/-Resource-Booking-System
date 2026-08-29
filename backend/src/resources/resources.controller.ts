import { Controller, Get, Param } from '@nestjs/common';
import { ResourcesService } from './resources.service';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  // GET /resources — list all resources
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // GET /resources/:id — get one resource by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
