-- seed.sql
-- Fuente: db/pedidos-2025-11-26_v2.json
-- Requiere ejecutar antes: db/db.sql

BEGIN;

TRUNCATE TABLE
  rotacion_asignaciones,
  rotaciones,
  pedidos,
  productos,
  personas
RESTART IDENTITY;

INSERT INTO personas (id, nombre, estado) VALUES
('11upbuvzh0lmig3ec1m', 'Janet', 1),
('13zs9oyp37zcmig3ef2p', 'Li', 1),
('b0tgpafso1mig3ek02', 'Humberto', 1),
('rkamkrbec29mig3eps2', 'Castillo', 1),
('m9rlzbu07ufmig3eunm', 'José', 1);

INSERT INTO productos (id, nombre, descripcion, precio, estado) VALUES
('tnx97hkudimig44m4z', 'Keke de maní', '', 2.00, 1),
('poub4vf7k7cmig45b0y', 'Keke de chocolate', '', 2.00, 1),
('1i66o5sx2flmig45qhe', 'Pan con huevo', '', 2.00, 1),
('3oos310v872mig46lei', 'Pan con lomo', '', 2.00, 1),
('fw99k75ktznmig4732q', 'pan con torreja', '', 2.00, 1),
('fy8s0brqbq7mig47mle', 'Quinua', '', 1.50, 1),
('43y6vvcrlolmig47vu2', 'Agua de gelatina', '', 1.50, 1),
('edy8b7ix5dfmig487ay', 'Agua loa de manzana', '', 1.50, 1),
('bz7hcf1mkz5mig48k4a', 'Agua loa de piña', '', 1.50, 1),
('rnxrs8w2o5mig48u2i', 'Agua loa de limón', '', 1.50, 1),
('8l8wtgzd1dbmig4dm2y', 'Jugo de papaya', '', 2.00, 1);

INSERT INTO pedidos (id, persona_id, descripcion, cantidad, precio, estado) VALUES
('a3i9wy26vz5mig617wr', 'b0tgpafso1mig3ek02', 'Keke de maní', 1, 2.00, 1),
('t0kjpu6r7emig62d0j', 'rkamkrbec29mig3eps2', 'Pan con lomo', 1, 2.00, 1),
('pvierfv171emig62jx1', 'rkamkrbec29mig3eps2', 'Jugo de papaya', 1, 2.00, 1),
('xv4b4kjzuismig62yfv', '11upbuvzh0lmig3ec1m', 'Pan con huevo', 1, 2.00, 1),
('hntruj3m0eamig635kj', '11upbuvzh0lmig3ec1m', 'Quinua', 1, 1.50, 1),
('bcb7m3hchlmig63k3n', '13zs9oyp37zcmig3ef2p', 'Pan con huevo', 1, 2.00, 1),
('ymrtm4ph4rhmig63vyz', '13zs9oyp37zcmig3ef2p', 'Agua loa de piña', 1, 1.50, 1),
('psarxo85rfmig648sb', '13zs9oyp37zcmig3ef2p', 'Keke de maní', 1, 2.00, 1),
('zwa4igr6qumig64dhn', 'm9rlzbu07ufmig3eunm', 'Agua loa de manzana', 1, 1.50, 1);

INSERT INTO rotaciones (id, fecha_iso, excluidos, estado) VALUES
('hed43m5c29lmig3fjea', '2025-11-26T14:21:54.802Z', '[]'::jsonb, 1);

INSERT INTO rotacion_asignaciones (rotacion_id, dia, persona_id, estado) VALUES
('hed43m5c29lmig3fjea', 'Lunes', '11upbuvzh0lmig3ec1m', 1),
('hed43m5c29lmig3fjea', 'Martes', '13zs9oyp37zcmig3ef2p', 1),
('hed43m5c29lmig3fjea', 'Miércoles', 'm9rlzbu07ufmig3eunm', 1),
('hed43m5c29lmig3fjea', 'Jueves', 'rkamkrbec29mig3eps2', 1),
('hed43m5c29lmig3fjea', 'Viernes', 'b0tgpafso1mig3ek02', 1);

COMMIT;
