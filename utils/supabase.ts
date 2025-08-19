import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These environment variables must be configured in your deployment environment.
// In Next.js, they should be prefixed with NEXT_PUBLIC_ to be accessible in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single, shared Supabase client for the entire application.
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Logs an error to the 'app_errors' table in Supabase.
 * This provides a simple, serverless way to monitor client-side application health.
 * 
 * IMPORTANT: For this to be secure, you MUST enable Row Level Security (RLS) on your 'app_errors' table in Supabase.
 * The policy should be:
 *   - PERMISSIVE for INSERT
 *   - For "public" role
 *   - Using expression: true
 * This allows anyone to add error logs, but no one can read, update, or delete them without a service key.
 * 
 * @param error The error object.
 * @param context Additional context to be logged with the error (e.g., component name, function name).
 */
export const logError = async (error: Error, context: Record<string, any> = {}) => {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping error logging.');
    console.error('Original Error:', error); // Log locally as a fallback
    return;
  }

  try {
    const { data, error: insertError } = await supabase
      .from('app_errors')
      .insert([
        {
          error_message: error.message,
          stack_trace: error.stack,
          context: {
            ...context,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
          },
        },
      ]);

    if (insertError) {
      console.error('Failed to log error to Supabase:', insertError);
      console.error('Original Error:', error); // Log original error if Supabase fails
    }
  } catch (e) {
    console.error('A critical error occurred while trying to log to Supabase:', e);
    console.error('Original Error:', error);
  }
};
