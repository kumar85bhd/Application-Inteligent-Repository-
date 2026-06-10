import { Router, Request, Response } from 'express';
import { ApplicationService } from './service';

export const applicationRouter = Router();

// GET /api/applications - Get all applications (optional ?search=...)
applicationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const apps = await ApplicationService.listApplications(search);
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/applications/:id - Get detailed information about one application
applicationRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const app = await ApplicationService.getApplication(id);
    res.json(app);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Application not found' });
  }
});

// POST /api/applications - Create a new application
applicationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const newApp = await ApplicationService.createApplication(req.body);
    res.status(201).json(newApp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid request body' });
  }
});

// PUT /api/applications/:id - Update an application
applicationRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedApp = await ApplicationService.updateApplication(id, req.body);
    res.json(updatedApp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid update operations' });
  }
});

// DELETE /api/applications/:id - Delete an application (soft delete)
applicationRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ApplicationService.deleteApplication(id);
    res.status(200).json({ message: 'Application successfully deleted' });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Application not found' });
  }
});
