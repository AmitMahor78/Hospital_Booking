import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';

const router = Router();

// GET all hospitals, optional state and district filter
router.get('/', (req: Request, res: Response) => {
  const { state, district } = req.query as { state?: string; district?: string };
  const hospitals = dbStore.getHospitals(state, district);
  res.json(hospitals);
});

// GET single hospital
router.get('/:id', (req: Request, res: Response) => {
  const hospital = dbStore.getHospitalById(req.params.id);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  res.json(hospital);
});

// GET departments for hospital
router.get('/:id/departments', (req: Request, res: Response) => {
  const departments = dbStore.getDepartments(req.params.id);
  res.json(departments);
});

// GET hospital locations / navigation directory
router.get('/:id/locations', (req: Request, res: Response) => {
  const locations = dbStore.getLocations(req.params.id);
  res.json(locations);
});

// GET hospital pharmacy location and step route
router.get('/:id/pharmacy', (req: Request, res: Response) => {
  const pharmacy = dbStore.getPharmacyLocation(req.params.id);
  if (!pharmacy) {
    return res.status(404).json({ error: 'Pharmacy counter information not found for this hospital' });
  }
  res.json({
    hospitalId: req.params.id,
    pharmacy,
    disclaimer: 'This is ONLY navigation assistance. SwasthyaQueue does not provide medicine recommendations or prescriptions.',
  });
});

export default router;
