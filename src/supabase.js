import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://izeojipoeagwsqpqmamj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZW9qaXBvZWFnd3NxcHFtYW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzY5MTQsImV4cCI6MjA5MTM1MjkxNH0.RvjVIsWOyRdR8yvwmHSFZgSCkQ_Tg3JZBFmNia78qG8'

export const supabase = createClient(supabaseUrl, supabaseKey)