-- =====================================================
-- Limpiar fondos duplicados (deja 1 por nombre+categoria)
-- + agregar un indice unico para que no vuelvan a duplicarse
-- =====================================================

-- 1) Borrar duplicados, dejando el de menor created_at
delete from public.backgrounds a
using public.backgrounds b
where a.id > b.id
  and a.name     = b.name
  and a.category is not distinct from b.category;

-- 2) Indice unico para prevenir duplicados futuros
create unique index if not exists backgrounds_name_category_unique
  on public.backgrounds(name, coalesce(category, ''));

-- 3) Verificar (deberia devolver 39)
select count(*) as total from public.backgrounds;
