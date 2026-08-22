import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { DeliveryPoint } from '@/types/database';
import { DeliveryPointsManager } from '@/components/DeliveryPointsManager';

export default async function DeliveryPointsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: points } = await supabase
    .from('delivery_points')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto py-4">
      <DeliveryPointsManager initialPoints={(points || []) as unknown as DeliveryPoint[]} />
    </div>
  );
}