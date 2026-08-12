-- Migration : ajout lecture_nationale pour PR (Presidence)
-- Constat : la migration 009 n a donne lecture_nationale qu a PM. Plusieurs tests
-- (003, 004, 005, 006, 008) attendent explicitement que PR ait aussi une vision
-- nationale (institution "suprême", coherent institutionnellement). Aucun test
-- ne depend de PR.lecture_nationale = false.
UPDATE role SET lecture_nationale = true WHERE code = 'PR';
