'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InviteModal({ tripId, onClose }: { tripId: string, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async () => {
    setLoading(true);
    setMessage('');
    
    // In a real app, this would send an email. 
    // For now, we will simulated adding them if they exist in Supabase auth, 
    // or just creating a 'placeholder' member row.
    
    // Check if user exists (Optional: requires admin secret usually)
    // Simplified: Just add to members table as 'invited'
    
    const { error } = await supabase.from('trip_members').insert({
       trip_id: tripId,
       email: email,
       role: 'MEMBER' // Default role
    });

    if (error) setMessage('Error inviting user.');
    else setMessage('User invited! (Mock email sent)');
    
    setLoading(false);
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
        <h3 className="text-xl font-bold mb-2">Invite Friends</h3>
        <p className="text-gray-500 text-xs mb-4">Add people to collaborate on this trip.</p>
        
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="w-full p-3 border border-gray-200 rounded-xl mb-3 outline-none focus:border-blue-500"
        />
        
        {message && <p className="text-xs text-green-600 mb-2 font-bold">{message}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
          <button onClick={handleInvite} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}