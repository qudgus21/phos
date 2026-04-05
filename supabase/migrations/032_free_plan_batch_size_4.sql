-- Free 플랜 배치 사이즈 1→4 (크레딧으로 이미 제한되므로 배치 제한 불필요)
UPDATE public.subscription_plans SET max_batch_size = 4 WHERE id = 'free';
