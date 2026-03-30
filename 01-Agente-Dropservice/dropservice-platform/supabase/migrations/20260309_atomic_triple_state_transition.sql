-- ============================================================
-- Migration: Atomic Triple-State Transition RPC
--
-- Purpose: Ensures that quotation status changes are atomic:
-- all 3 status fields (status, internal_status, public_status)
-- are updated in a single transaction with FSM validation.
--
-- This prevents partial updates and race conditions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.transition_quotation_status(
    p_quotation_id UUID,
    p_new_status TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_additional_fields JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_status TEXT;
    v_public_status TEXT;
    v_internal_status TEXT;
    v_result JSONB;
BEGIN
    -- 1. Lock the row to prevent concurrent transitions
    SELECT status INTO v_current_status
    FROM public.quotations
    WHERE id = p_quotation_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Quotation not found: %', p_quotation_id;
    END IF;

    -- 2. Validate the transition is allowed (FSM guard)
    IF NOT public.is_valid_quotation_transition(v_current_status, p_new_status) THEN
        RAISE EXCEPTION 'Invalid transition: % → %', v_current_status, p_new_status;
    END IF;

    -- 3. Map to public and internal statuses
    v_public_status := public.map_to_public_status(p_new_status);
    v_internal_status := public.map_to_internal_status(p_new_status);

    -- 4. Atomic update of all 3 fields + any additional fields
    UPDATE public.quotations
    SET
        status = p_new_status,
        public_status = v_public_status,
        internal_status = v_internal_status,
        updated_at = now()
    WHERE id = p_quotation_id;

    -- 5. Apply additional fields if provided
    IF p_additional_fields != '{}'::JSONB THEN
        -- Dynamic update for extra fields (assigned_provider_id, internal_notes, etc.)
        IF p_additional_fields ? 'assigned_provider_id' THEN
            UPDATE public.quotations
            SET assigned_provider_id = (p_additional_fields->>'assigned_provider_id')::UUID
            WHERE id = p_quotation_id;
        END IF;

        IF p_additional_fields ? 'internal_notes' THEN
            UPDATE public.quotations
            SET internal_notes = p_additional_fields->>'internal_notes'
            WHERE id = p_quotation_id;
        END IF;
    END IF;

    -- 6. Record transition in history (audit trail)
    INSERT INTO public.quotation_status_history (
        quotation_id,
        previous_status,
        new_status,
        actor_id,
        actor_type,
        created_at
    ) VALUES (
        p_quotation_id,
        v_current_status,
        p_new_status,
        p_actor_id,
        CASE
            WHEN p_actor_id IS NULL THEN 'SYSTEM'
            ELSE 'ADMIN'
        END,
        now()
    );

    -- 7. Return confirmation
    v_result := jsonb_build_object(
        'success', true,
        'quotation_id', p_quotation_id,
        'previous_status', v_current_status,
        'new_status', p_new_status,
        'public_status', v_public_status,
        'internal_status', v_internal_status
    );

    RETURN v_result;
END;
$$;

-- ─── Helper: FSM Transition Validator ─────────────────────────

CREATE OR REPLACE FUNCTION public.is_valid_quotation_transition(
    p_current TEXT,
    p_new TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE p_current
        WHEN 'DRAFT' THEN p_new IN ('PENDING_ASSIGNMENT')
        WHEN 'PENDING_ASSIGNMENT' THEN p_new IN ('PENDING_PROVIDER_BID', 'REJECTED', 'CANCELLED')
        WHEN 'PENDING_PROVIDER_BID' THEN p_new IN ('PENDING_ADMIN_APPROVAL', 'PENDING_ASSIGNMENT', 'CANCELLED')
        WHEN 'PENDING_ADMIN_APPROVAL' THEN p_new IN ('AWAITING_CLIENT_PAYMENT', 'PENDING_PROVIDER_BID', 'CANCELLED')
        WHEN 'AWAITING_CLIENT_PAYMENT' THEN p_new IN ('APPROVED', 'REJECTED', 'CANCELLED')
        WHEN 'APPROVED' THEN p_new IN ('PAID', 'CANCELLED')
        WHEN 'PAID' THEN p_new IN ('FULFILLED', 'CANCELLED')
        WHEN 'FULFILLED' THEN FALSE  -- Terminal
        WHEN 'REJECTED' THEN FALSE   -- Terminal
        WHEN 'CANCELLED' THEN FALSE  -- Terminal
        ELSE FALSE
    END;
END;
$$;

-- ─── Helper: Status → Public Status Mapper ────────────────────

CREATE OR REPLACE FUNCTION public.map_to_public_status(p_status TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE p_status
        WHEN 'DRAFT' THEN 'RECIBIDA'
        WHEN 'PENDING_ASSIGNMENT' THEN 'RECIBIDA'
        WHEN 'PENDING_PROVIDER_BID' THEN 'EN_PROCESO'
        WHEN 'PENDING_ADMIN_APPROVAL' THEN 'EN_PROCESO'
        WHEN 'AWAITING_CLIENT_PAYMENT' THEN 'COTIZADA'
        WHEN 'APPROVED' THEN 'APROBADA'
        WHEN 'PAID' THEN 'APROBADA'
        WHEN 'FULFILLED' THEN 'APROBADA'
        WHEN 'CANCELLED' THEN 'RECHAZADA'
        WHEN 'REJECTED' THEN 'RECHAZADA'
        ELSE 'RECIBIDA'
    END;
END;
$$;

-- ─── Helper: Status → Internal Status Mapper ──────────────────

CREATE OR REPLACE FUNCTION public.map_to_internal_status(p_status TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE p_status
        WHEN 'DRAFT' THEN 'PENDIENTE_ASIGNACION'
        WHEN 'PENDING_ASSIGNMENT' THEN 'PENDIENTE_ASIGNACION'
        WHEN 'PENDING_PROVIDER_BID' THEN 'PROVEEDOR_COTIZANDO'
        WHEN 'PENDING_ADMIN_APPROVAL' THEN 'PROVEEDOR_COTIZANDO'
        WHEN 'AWAITING_CLIENT_PAYMENT' THEN 'ESPERANDO_CLIENTE'
        WHEN 'APPROVED' THEN 'ESPERANDO_CLIENTE'
        WHEN 'PAID' THEN 'ESPERANDO_CLIENTE'
        WHEN 'FULFILLED' THEN 'ESPERANDO_CLIENTE'
        WHEN 'CANCELLED' THEN 'PENDIENTE_ASIGNACION'
        WHEN 'REJECTED' THEN 'PENDIENTE_ASIGNACION'
        ELSE 'PENDIENTE_ASIGNACION'
    END;
END;
$$;

-- ─── Permissions ──────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.transition_quotation_status TO service_role;
GRANT EXECUTE ON FUNCTION public.is_valid_quotation_transition TO service_role;
GRANT EXECUTE ON FUNCTION public.map_to_public_status TO service_role;
GRANT EXECUTE ON FUNCTION public.map_to_internal_status TO service_role;

COMMENT ON FUNCTION public.transition_quotation_status IS
  'Atomically transitions a quotation through the Triple-State system (status + public_status + internal_status). Validates FSM rules and records history. SECURITY DEFINER — only callable from backend via service_role.';
