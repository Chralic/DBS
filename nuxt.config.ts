export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxtjs/supabase'],
  devtools: { enabled: true },
  supabase: {
    url: 'https://faynilmmqwvgbkdgzdpz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheW5pbG1tcXd2Z2JrZGd6ZHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzMyNzQsImV4cCI6MjA5MTM0OTI3NH0.Yb_vFliZJ_xBZpOpDRWDHLi7jNW1cSpOWho78tvY-7w'
  }
})