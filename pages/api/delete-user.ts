import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (stored in environment variables)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user ID from the request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Delete the user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: error.message });
    }

    // Return success response
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ message: error.message || 'An unexpected error occurred' });
  }
}