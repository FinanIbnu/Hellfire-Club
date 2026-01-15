-- Give all existing users 5 initial credits for demo
INSERT INTO public.credits (user_id, amount, transaction_type, description)
SELECT id, 5, 'earned', 'Initial demo credits'
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM public.credits)
ON CONFLICT DO NOTHING;
