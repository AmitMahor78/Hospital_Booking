import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { dbStore } from '../db/store.ts';

const router = Router();

// Patient Mobile OTP request
router.post('/send-otp', (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    const result = AuthService.requestPatientOtp(mobile);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to send OTP' });
  }
});

// Patient Mobile OTP verify & login
router.post('/verify-otp', (req: Request, res: Response) => {
  try {
    const { mobile, otp, name } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and OTP are required' });
    }
    const result = AuthService.verifyPatientOtp(mobile, otp, name);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'OTP verification failed' });
  }
});

// Staff / Doctor / Benefit Desk login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = AuthService.loginStaffOrDoctor(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

// Get current session user
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = dbStore.getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let doctorProfile;
  if (user.role === 'DOCTOR') {
    doctorProfile = dbStore.getDoctorByUserId(user.id);
  }

  res.json({
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    },
    doctorProfile,
  });
});

export default router;
