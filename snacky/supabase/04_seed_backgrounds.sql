-- =====================================================
-- TuCumple - Snacky - Seed inicial de fondos existentes
-- OPCIONAL: poblar la tabla con los fondos actuales del proyecto
-- para no perder lo que ya esta hardcodeado en formulario.html
--
-- IMPORTANTE: Las imagenes siguen en /assets/img/fondos/.
-- Una vez que las subas al bucket "background-images" desde el admin,
-- actualiza image_url para que apunte al Storage.
-- =====================================================

insert into public.backgrounds (name, category, image_url, storage_path, order_index) values
  ('Avengers',             'Marvel',     '/assets/img/fondos/fondo2.jpg',  'legacy/fondo2.jpg',  1),
  ('Spiderman',            'Marvel',     '/assets/img/fondos/fondo11.jpg', 'legacy/fondo11.jpg', 2),
  ('Iron Man',             'Marvel',     '/assets/img/fondos/fondo12.jpg', 'legacy/fondo12.jpg', 3),
  ('Avengers Ultron',      'Marvel',     '/assets/img/fondos/fondo13.jpg', 'legacy/fondo13.jpg', 4),

  ('Mundo DC',             'DC',         '/assets/img/fondos/fondo17.jpg', 'legacy/fondo17.jpg', 1),
  ('Batman',               'DC',         '/assets/img/fondos/fondo14.jpg', 'legacy/fondo14.jpg', 2),
  ('Flash',                'DC',         '/assets/img/fondos/fondo15.jpg', 'legacy/fondo15.jpg', 3),
  ('Liga de la Justicia',  'DC',         '/assets/img/fondos/fondo16.jpg', 'legacy/fondo16.jpg', 4),
  ('X-Men',                'DC',         '/assets/img/fondos/fondo31.jpg', 'legacy/fondo31.jpg', 5),

  ('Wish',                 'Disney',     '/assets/img/fondos/fondo8.jpg',  'legacy/fondo8.jpg',  1),
  ('Frozen',               'Disney',     '/assets/img/fondos/fondo7.jpg',  'legacy/fondo7.jpg',  2),
  ('Minnie Mouse',         'Disney',     '/assets/img/fondos/fondo19.jpg', 'legacy/fondo19.jpg', 3),
  ('Princesas',            'Disney',     '/assets/img/fondos/fondo20.jpg', 'legacy/fondo20.jpg', 4),
  ('Cars',                 'Disney',     '/assets/img/fondos/fondo30.jpg', 'legacy/fondo30.jpg', 5),
  ('Stitch',               'Disney',     '/assets/img/fondos/fondo32.jpg', 'legacy/fondo32.jpg', 6),

  ('Colapinto',            'Formula 1',  '/assets/img/fondos/fondo34.jpg', 'legacy/fondo34.jpg', 1),
  ('Verstappen',           'Formula 1',  '/assets/img/fondos/fondo35.jpg', 'legacy/fondo35.jpg', 2),
  ('Ferrari',              'Formula 1',  '/assets/img/fondos/fondo36.jpg', 'legacy/fondo36.jpg', 3),
  ('Hamilton',             'Formula 1',  '/assets/img/fondos/fondo76.jpg', 'legacy/fondo76.jpg', 4),

  ('Seleccion Argentina',  'Futbol',     '/assets/img/fondos/fondo1.jpg',  'legacy/fondo1.jpg',  1),
  ('River Plate',          'Futbol',     '/assets/img/fondos/fondo22.jpg', 'legacy/fondo22.jpg', 2),
  ('Boca Juniors',         'Futbol',     '/assets/img/fondos/fondo23.jpg', 'legacy/fondo23.jpg', 3),
  ('Racing Club',          'Futbol',     '/assets/img/fondos/fondo24.jpg', 'legacy/fondo24.jpg', 4),
  ('Velez',                'Futbol',     '/assets/img/fondos/fondo25.jpg', 'legacy/fondo25.jpg', 5),
  ('San Lorenzo',          'Futbol',     '/assets/img/fondos/fondo26.jpg', 'legacy/fondo26.jpg', 6),
  ('Independiente',        'Futbol',     '/assets/img/fondos/fondo27.jpg', 'legacy/fondo27.jpg', 7),

  ('Bowling',              'Otros',      '/assets/img/fondos/fondo3.jpg',  'legacy/fondo3.jpg',  1),
  ('Snack Kids',           'Otros',      '/assets/img/fondos/fondo37.jpg', 'legacy/fondo37.jpg', 2),
  ('Bowling II',           'Otros',      '/assets/img/fondos/fondo38.jpg', 'legacy/fondo38.jpg', 3),
  ('Stumble Guys',         'Otros',      '/assets/img/fondos/fondo69.jpg', 'legacy/fondo69.jpg', 4),
  ('LEGO',                 'Otros',      '/assets/img/fondos/fondo29.jpg', 'legacy/fondo29.jpg', 5),
  ('La vaca Lola',         'Otros',      '/assets/img/fondos/fondo88.jpg', 'legacy/fondo88.jpg', 6),
  ('Pikachu',              'Otros',      '/assets/img/fondos/fondo21.jpg', 'legacy/fondo21.jpg', 7),
  ('Harry Potter',         'Otros',      '/assets/img/fondos/fondo4.jpg',  'legacy/fondo4.jpg',  8),
  ('Dinosaurios',          'Otros',      '/assets/img/fondos/fondo5.jpg',  'legacy/fondo5.jpg',  9),
  ('Star Wars',            'Otros',      '/assets/img/fondos/fondo6.jpg',  'legacy/fondo6.jpg',  10),
  ('Fortnite',             'Otros',      '/assets/img/fondos/fondo18.jpg', 'legacy/fondo18.jpg', 11),
  ('Hello Kitty',          'Otros',      '/assets/img/fondos/fondo9.jpg',  'legacy/fondo9.jpg',  12),
  ('Minions',              'Otros',      '/assets/img/fondos/fondo28.jpg', 'legacy/fondo28.jpg', 13),
  ('Minecraft',            'Otros',      '/assets/img/fondos/fondo10.jpg', 'legacy/fondo10.jpg', 14)
on conflict do nothing;
