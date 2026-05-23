// ============================================
// Configuracion de Supabase
// ============================================
// Reemplazar con los valores de tu proyecto:
// Supabase Dashboard > Project Settings > API
//
// IMPORTANTE: usar SOLO la "anon public" key, nunca la service_role.
// La anon key es segura para frontend porque el acceso esta restringido
// por las policies RLS definidas en supabase/01_schema.sql
// ============================================

window.SUPABASE_CONFIG = {
  url: 'https://dofqhhtrsmolmniujukr.supabase.co',
  anonKey: 'sb_publishable_eBHCx2Y65Qy7QfrnZuG4aw_4trUVh4k'
};

// ============================================
// Configuracion del salon
// ============================================
window.SNACKY_CONFIG = {
  venueName: 'Snack Bowling',
  venueAddress: 'Avenida del Libertador 13054, Martinez',
  // Duracion default del evento en horas (para el calendar)
  defaultEventDurationHours: 2,
  // ============================================
  // FEATURE FLAGS (cambiar entre true/false y listo)
  // ============================================
  // Permitir que los padres suban una foto propia al crear la invitacion.
  // false = el campo no aparece en el form. Las invitaciones ya existentes
  // con foto custom siguen mostrandola normalmente.
  features: {
    allowCustomPhoto: false
  }
};
