import { Application, CreateApplicationDTO, UpdateApplicationDTO } from './types';
import { ApplicationRepository } from './repository';

function generateId(): string {
  return 'app-' + Math.random().toString(36).substr(2, 9);
}

export class ApplicationService {
  static async listApplications(search?: string): Promise<Application[]> {
    let apps = await ApplicationRepository.getAll();
    if (search) {
      const query = search.toLowerCase().trim();
      apps = apps.filter(
        app =>
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query) ||
          (app.url && app.url.toLowerCase().includes(query)) ||
          app.status.toLowerCase().includes(query)
      );
    }
    return apps;
  }

  static async getApplication(id: string): Promise<Application> {
    const app = await ApplicationRepository.getById(id);
    if (!app) {
      throw new Error(`Application with ID "${id}" not found.`);
    }
    return app;
  }

  static async createApplication(dto: CreateApplicationDTO): Promise<Application> {
    const name = dto.name?.trim();
    const description = dto.description?.trim();

    if (!name) {
      throw new Error('Application Name is required.');
    }
    if (!description) {
      throw new Error('Description is required.');
    }

    const newApp: Application = {
      id: generateId(),
      name,
      description,
      url: dto.url?.trim(),
      status: dto.status || 'Draft',
      notes: dto.notes?.trim() || '',
      packages: dto.packages || [],
      metric_blueprints: dto.metric_blueprints || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    };

    return await ApplicationRepository.create(newApp);
  }

  static async updateApplication(id: string, dto: UpdateApplicationDTO): Promise<Application> {
    const existing = await ApplicationRepository.getById(id);
    if (!existing) {
      throw new Error(`Application with ID "${id}" not found.`);
    }

    const updates: Partial<Application> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new Error('Application Name cannot be empty.');
      updates.name = name;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (!description) throw new Error('Description cannot be empty.');
      updates.description = description;
    }

    if (dto.url !== undefined) {
      updates.url = dto.url?.trim();
    }

    if (dto.status !== undefined) {
      const validStatuses = ['Draft', 'Active', 'Archived'];
      if (!validStatuses.includes(dto.status)) {
        throw new Error(`Invalid status "${dto.status}". Must be Draft, Active, or Archived.`);
      }
      updates.status = dto.status;
    }

    if (dto.notes !== undefined) {
      updates.notes = dto.notes;
    }

    if (dto.packages !== undefined) {
      updates.packages = dto.packages;
    }

    if (dto.metric_blueprints !== undefined) {
      updates.metric_blueprints = dto.metric_blueprints;
    }

    const updated = await ApplicationRepository.update(id, updates);
    if (!updated) {
      throw new Error('Failed to update application.');
    }
    return updated;
  }

  static async deleteApplication(id: string): Promise<void> {
    const success = await ApplicationRepository.delete(id);
    if (!success) {
      throw new Error(`Application with ID "${id}" not found or already deleted.`);
    }
  }
}
