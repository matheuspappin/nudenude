-- =========================================================================
-- OTIMIZAÇÃO TRANSACIONAL: RPC para evitar Race Conditions (Fase 2)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.process_subscription_event(
    p_subscriber_id UUID,
    p_creator_id UUID,
    p_tier_id UUID,
    p_expires_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões do banco para ignorar o RLS nessa operação interna
SET search_path = public
AS $$
DECLARE
    v_subscription_id UUID;
BEGIN
    -- A cláusula FOR UPDATE bloqueia a linha, impedindo que outro webhook concorrente
    -- tente ler/atualizar a assinatura do mesmo usuário ao mesmo tempo (Race Condition)
    SELECT id INTO v_subscription_id
    FROM public.subscriptions
    WHERE subscriber_id = p_subscriber_id AND creator_id = p_creator_id
    FOR UPDATE;

    IF FOUND THEN
        -- Atualiza se a assinatura já existe (Ex: Evento de Rebill/Renovação)
        UPDATE public.subscriptions
        SET status = 'active',
            tier_id = p_tier_id,
            expires_at = p_expires_at
        WHERE id = v_subscription_id;
    ELSE
        -- Insere nova assinatura (Ex: Evento de New Sub)
        INSERT INTO public.subscriptions (subscriber_id, creator_id, tier_id, status, expires_at)
        VALUES (p_subscriber_id, p_creator_id, p_tier_id, 'active', p_expires_at);
    END IF;
END;
$$;
