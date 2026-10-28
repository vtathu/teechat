// Điền Project URL và anon key của Supabase vào đây.
// Hướng dẫn tạo project ở README.md.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export function cloudConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && /^https?:\/\//.test(SUPABASE_URL));
}
