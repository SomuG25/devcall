import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { 
    bookingId,
    developerEmail,
    customerName,
    projectDetails,
    bookingTime,
    duration,
    amount 
  } = await req.json()

  try {
    // Send email using your email service
    // This is a placeholder - replace with your actual email service
    console.log('Booking notification:', {
      to: developerEmail,
      subject: 'New Booking Request',
      body: `
        New booking from ${customerName}
        
        Project Details:
        Title: ${projectDetails.title}
        Description: ${projectDetails.description}
        Requirements: ${projectDetails.requirements}
        Goals: ${projectDetails.goals}
        
        Date: ${new Date(bookingTime).toLocaleString()}
        Duration: ${duration}
        Amount: $${amount}
      `
    })

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})