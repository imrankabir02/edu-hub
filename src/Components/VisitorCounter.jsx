// Install required packages:
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// Initialize Supabase client
const supabaseUrl = 'https://hpvpicisptszhixxvxcs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdnBpY2lzcHRzemhpeHh2eGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTg0MjAsImV4cCI6MjA0ODE5NDQyMH0.K_2hG4yv8_3zdMYEcr65y0pF3p_-zeUJfqrcpbnIJKE'
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a visitors table in Supabase:
/*
  create table visitors (
    id uuid default uuid_generate_v4() primary key,
    session_id text not null,
    page_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  // Create policy to allow inserts
  create policy "Allow anonymous inserts"
  on visitors for insert
  to anon
  with check (true);

  // Create policy to allow reads
  create policy "Allow anonymous reads"
  on visitors for select
  to anon
  using (true);
*/

export default function VisitorCounter() {
    const [visitorCount, setVisitorCount] = useState(0)

    useEffect(() => {
        // Generate a unique session ID if not exists
        let sessionId = localStorage.getItem('visitor_session_id')
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2)
            localStorage.setItem('visitor_session_id', sessionId)
        }

        // Function to record new visitor
        const recordVisitor = async () => {
            const { error } = await supabase
                .from('visitors')
                .insert([
                    {
                        session_id: sessionId,
                        page_url: window.location.pathname
                    }
                ])

            if (error) console.error('Error recording visitor:', error)
        }

        // Function to get current visitor count
        const getVisitorCount = async () => {
            // Get count of unique sessions in the last 15 minutes
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

            const { data, error } = await supabase
                .from('visitors')
                .select('session_id')
                .gte('created_at', fifteenMinsAgo)

            if (error) {
                console.error('Error fetching visitors:', error)
                return
            }

            // Count unique session_ids
            const uniqueSessions = new Set(data.map(v => v.session_id))
            setVisitorCount(uniqueSessions.size)
        }

        // Record this visitor
        recordVisitor()

        // Set up real-time subscription
        const subscription = supabase
            .channel('visitors_channel')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'visitors'
                },
                () => {
                    getVisitorCount()
                }
            )
            .subscribe()

        // Get initial count
        getVisitorCount()

        // Cleanup subscription
        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-2 text-xl font-bold">Live Visitors</h2>
            <p className="text-3xl font-bold text-blue-600">{visitorCount}</p>
            <p className="text-sm text-gray-500">in the last 15 minutes</p>
        </div>
    )
}