-- =====================================================================
-- 001 · Registro de usuarios (sobre schema_ecommerce_v1_1.sql)
-- Cambios mínimos: coordenadas en users_addresses, roles base y la función
-- que crea cuenta + perfil + dirección + rol en UNA transacción.
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
-- =====================================================================

-- 1) Coordenadas de la dirección (para envíos y delivery)
ALTER TABLE users_addresses
    ADD COLUMN IF NOT EXISTS latitude  NUMERIC(9,6) CHECK (latitude  BETWEEN -90  AND 90),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180);

-- 2) Roles base (el registro asigna 'customer')
INSERT INTO auth_roles (code, description) VALUES
    ('customer', 'Cliente de la tienda'),
    ('operator', 'Operador'),
    ('admin',    'Administrador')
ON CONFLICT (code) DO NOTHING;

-- 3) Registro atómico. Devuelve {ok:true,user_id} o {ok:false,code}.
--    Los duplicados no lanzan error: se informan con un código.
CREATE OR REPLACE FUNCTION auth_register_user(
    p_email           TEXT,
    p_phone           TEXT,
    p_password_hash   TEXT,
    p_first_name      TEXT,
    p_last_name       TEXT,
    p_document_type   TEXT,
    p_document_number TEXT,
    p_birth_date      DATE,
    p_address_line1   TEXT,
    p_reference       TEXT,
    p_latitude        NUMERIC,
    p_longitude       NUMERIC,
    p_status          TEXT DEFAULT 'active'
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_user       UUID;
    v_constraint TEXT;
BEGIN
    INSERT INTO users_accounts (email, phone, password_hash, status)
    VALUES (p_email, p_phone, p_password_hash, p_status)
    RETURNING id INTO v_user;

    INSERT INTO users_profiles (user_id, first_name, last_name, document_type, document_number, birth_date)
    VALUES (v_user, p_first_name, p_last_name, p_document_type, p_document_number, p_birth_date);

    INSERT INTO users_addresses (user_id, label, recipient_name, recipient_phone,
                                 address_line1, reference, latitude, longitude, is_default)
    VALUES (v_user, 'Principal', p_first_name || ' ' || p_last_name, p_phone,
            p_address_line1, NULLIF(p_reference, ''), p_latitude, p_longitude, true);

    INSERT INTO auth_user_roles (user_id, role_id)
    SELECT v_user, id FROM auth_roles WHERE code = 'customer';

    RETURN jsonb_build_object('ok', true, 'user_id', v_user);

EXCEPTION WHEN unique_violation THEN
    -- el bloque EXCEPTION deshace todo lo insertado arriba
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    RETURN jsonb_build_object('ok', false, 'code',
        CASE WHEN v_constraint LIKE '%email%'    THEN 'email-existe'
             WHEN v_constraint LIKE '%document%' THEN 'cedula-existe'
             ELSE 'duplicado' END);
END $$;

-- Solo el backend (service_role) puede llamarla; Supabase da EXECUTE a anon/authenticated por defecto.
REVOKE ALL ON FUNCTION auth_register_user(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,DATE,TEXT,TEXT,NUMERIC,NUMERIC,TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION auth_register_user(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,DATE,TEXT,TEXT,NUMERIC,NUMERIC,TEXT)
    TO service_role;
