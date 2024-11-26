import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// Initialize Supabase client
const supabaseUrl = 'https://hpvpicisptszhixxvxcs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdnBpY2lzcHRzemhpeHh2eGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTg0MjAsImV4cCI6MjA0ODE5NDQyMH0.K_2hG4yv8_3zdMYEcr65y0pF3p_-zeUJfqrcpbnIJKE'
const supabase = createClient(supabaseUrl, supabaseKey)

export default function VisitorCounter() {
    const [liveVisitorCount, setLiveVisitorCount] = useState(0)
    const [totalVisitorCount, setTotalVisitorCount] = useState(0)
    const [todayVisitorCount, setTodayVisitorCount] = useState(0)

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

        // Function to get visitor counts
        const getVisitorCounts = async () => {
            // Get live visitors (last 15 minutes)
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
            const { data: liveData, error: liveError } = await supabase
                .from('visitors')
                .select('session_id')
                .gte('created_at', fifteenMinsAgo)

            if (liveError) {
                console.error('Error fetching live visitors:', liveError)
                return
            }

            // Count unique live sessions
            const uniqueLiveSessions = new Set(liveData.map(v => v.session_id))
            setLiveVisitorCount(uniqueLiveSessions.size)

            // Get today's visitors
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const { data: todayData, error: todayError } = await supabase
                .from('visitors')
                .select('session_id')
                .gte('created_at', todayStart.toISOString())

            if (todayError) {
                console.error('Error fetching today\'s visitors:', todayError)
                return
            }

            // Count unique sessions for today
            const uniqueTodaySessions = new Set(todayData.map(v => v.session_id))
            setTodayVisitorCount(uniqueTodaySessions.size)

            // Get total all-time visitors
            const { data: totalData, error: totalError } = await supabase
                .from('visitors')
                .select('session_id')

            if (totalError) {
                console.error('Error fetching total visitors:', totalError)
                return
            }

            // Count unique total sessions
            const uniqueTotalSessions = new Set(totalData.map(v => v.session_id))
            setTotalVisitorCount(uniqueTotalSessions.size)
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
                    getVisitorCounts()
                }
            )
            .subscribe()

        // Get initial counts
        getVisitorCounts()

        // Set up interval to refresh live count
        const refreshInterval = setInterval(getVisitorCounts, 60000) // Refresh every minute

        // Cleanup subscription and interval
        return () => {
            subscription.unsubscribe()
            clearInterval(refreshInterval)
        }
    }, [])

    return (
        <>
              <h2 className="mb-3 text-3xl font-bold leading-[1.208] text-dark dark:text-white sm:text-4xl md:text-[40px] text-center">
                Visitors
              </h2>
            <div className="w-full p-4 bg-transparent rounded-lg shadow-lg">
                <div className="flex items-center justify-between gap-4">
                    {/* Live Visitors */}
                    <div className="flex-1 p-3 text-center bg-gray-900 rounded-lg">
                        <p className="text-lg font-semibold text-blue-600">LIVE</p>
                        <p className="text-2xl font-bold text-blue-700">{liveVisitorCount}</p>
                        <p className="text-blue-500 text-md">last 15m</p>
                    </div>

                    {/* Today's Visitors */}
                    <div className="flex-1 p-3 text-center bg-gray-900 rounded-lg">
                        <p className="text-lg font-semibold text-green-600">TODAY</p>
                        <p className="text-2xl font-bold text-green-700">{todayVisitorCount}</p>
                        <p className="text-green-500 text-md">since midnight</p>
                    </div>

                    {/* Total Visitors */}
                    <div className="flex-1 p-3 text-center bg-gray-900 rounded-lg">
                        <p className="text-lg font-semibold text-purple-600">TOTAL</p>
                        <p className="text-2xl font-bold text-purple-700">{totalVisitorCount}</p>
                        <p className="text-md purple-500 text-">all time</p>
                    </div>
                </div>
            </div>
        </>
    )
}

// Install required packages:
// npm install @supabase/supabase-js

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