import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY      = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// chef-onboarding
// POST body: { chef_id, name, phone, bank_code?, account_number }
// Must be called with service-role key or admin JWT.
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[chef-onboarding] Missing Authorization header');
      return jsonError('Unauthorized: Missing token', 401);
    }

    // Initialize client with service role for administrative tasks
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user JWT directly - handle both 'Bearer ' and 'bearer '
    const token = authHeader.split(' ').pop();
    if (!token) {
      return jsonError('Unauthorized: Invalid Authorization header format', 401);
    }

    console.log(`[chef-onboarding] Verifying token (prefix: ${token.substring(0, 10)}...)`);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      console.error('[chef-onboarding] Auth verification failed:', authErr);
      return jsonError(`Unauthorized: ${authErr?.message || 'Invalid token'}`, 401);
    }

    console.log('[chef-onboarding] User verified:', user.email);

    const body = await req.json();
    const { chef_id, name, phone, account_number, bank_code } = body;

    if (!chef_id || !name || !phone) {
      return jsonError('Missing required fields: chef_id, name, phone', 400);
    }

    // Normalise phone: ensure 10-digit format starting 07 or 01
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+254/, '0');

    let subaccountCode: string | null = null;
    let recipientCode: string | null = null;
    let onboardingError: string | null = null;

    if (!PAYSTACK_SECRET_KEY) {
       console.error('[chef-onboarding] PAYSTACK_SECRET_KEY is not set');
       onboardingError = 'Payment configuration error: PAYSTACK_SECRET_KEY missing';
    }

    if (PAYSTACK_SECRET_KEY) {
      // ── Step 1: Create Paystack Sub-account ──────────────────────────────
      try {
        const subRes = await fetch('https://api.paystack.co/subaccount', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_name:    name,
            settlement_bank:  bank_code ?? 'MPESA',
            account_number:   account_number ?? normalizedPhone,
            percentage_charge: 85, // Chef gets 85%, Foodie keeps 15%
            description:      `Foodie Chef — ${name}`,
          }),
        });

        const subData = await subRes.json();
        if (subData.status && subData.data?.subaccount_code) {
          subaccountCode = subData.data.subaccount_code;
          console.log(`[chef-onboarding] Subaccount created: ${subaccountCode}`);
        } else {
          throw new Error(`Paystack subaccount failed: ${subData.message}`);
        }
      } catch (err: any) {
        console.error('[chef-onboarding] Subaccount error:', err);
        onboardingError = String(err.message || err);
      }

      // ── Step 2: Create Paystack Transfer Recipient ────────────────────────
      if (!onboardingError) {
        try {
          const recRes = await fetch('https://api.paystack.co/transferrecipient', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type:           'mobile_money',
              name,
              account_number: normalizedPhone,
              bank_code:      'MPESA',
              currency:       'KES',
            }),
          });

          const recData = await recRes.json();
          if (recData.status && recData.data?.recipient_code) {
            recipientCode = recData.data.recipient_code;
            console.log(`[chef-onboarding] Recipient created: ${recipientCode}`);
          } else {
            throw new Error(`Paystack recipient failed: ${recData.message}`);
          }
        } catch (err: any) {
          console.error('[chef-onboarding] Recipient error:', err);
          onboardingError = String(err.message || err);
        }
      }
    }

    // ── Update chef profile ──────────────────────────────────────────────────
    const updatePayload: Record<string, unknown> = {
      phone,
      is_active:   !onboardingError,
      is_verified: !onboardingError,
      onboarding_status: onboardingError ? 'pending_verification' : 'approved',
    };

    if (subaccountCode) updatePayload.paystack_subaccount_code = subaccountCode;
    if (recipientCode)  updatePayload.paystack_recipient_code  = recipientCode;

    const { error: updateErr } = await supabase
      .from('chefs')
      .update(updatePayload)
      .eq('id', chef_id);

    if (updateErr) {
      console.error('[chef-onboarding] Chef update error:', updateErr);
      return jsonError(`Failed to update chef profile: ${updateErr.message}`, 500);
    }

    if (onboardingError) {
      return json({
        success: false,
        chef_id,
        error:   onboardingError,
        message: 'Paystack onboarding failed. Chef profile updated but marked for review.',
      }, 422);
    }

    return json({
      success:            true,
      chef_id,
      subaccount_code:    subaccountCode,
      recipient_code:     recipientCode,
      message:            'Chef onboarded successfully. Paystack accounts created.',
    });

  } catch (err: any) {
    console.error('[chef-onboarding] GLOBAL ERROR:', err);
    return jsonError(`Internal server error: ${err.message}`, 500);
  }
});

// ── Response helpers ───────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status);
}
