import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configuration VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@anjara.mg',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  societe_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  donnees?: {
    telephone?: string;
    smsBody?: string;
    commande_id?: string;
    [key: string]: unknown;
  };
  target_roles?: string[]; // ex: ['GERANT', 'ADMIN']
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verifier l'authorization (soit token utilisateur, soit service role)
    if (!authHeader || !apiSecret) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Client admin (pour bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      apiSecret
    );

    const body: PushPayload = await request.json();
    const { societe_id, title, body: message, url, tag, donnees, target_roles } = body;

    if (!societe_id || !title || !message) {
      return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 });
    }

    // Roles cibles (par defaut: GERANT + ADMIN)
    const roles = target_roles && target_roles.length > 0 ? target_roles : ['GERANT', 'ADMIN'];

    // Recuperer tous les utilisateurs cibles de la societe
    const { data: utilisateurs, error: usersError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('societe_id', societe_id)
      .in('role', roles)
      .eq('actif', true)
      .eq('is_archived', false);

    if (usersError) {
      console.error('Erreur recuperation utilisateurs:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!utilisateurs || utilisateurs.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Aucun destinataire' });
    }

    const userIds = utilisateurs.map(u => u.id);

    // Recuperer toutes les subscriptions de ces utilisateurs
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subsError) {
      console.error('Erreur recuperation subscriptions:', subsError);
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      // Enregistrer quand meme la notification en DB (pour la cloche in-app)
      await supabaseAdmin.from('notifications').insert({
        societe_id,
        type: tag || 'GENERAL',
        titre: title,
        message,
        donnees: donnees || {},
      });
      return NextResponse.json({ success: true, sent: 0, message: 'Aucun appareil abonne' });
    }

    // Payload envoye au Service Worker
    const pushPayload = JSON.stringify({
      title,
      body: message,
      url: url || '/',
      tag: tag || 'anjara-notification',
      donnees: donnees || {},
    });

    // Envoyer a tous les appareils en parallele
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        )
      )
    );

    // Nettoyer les subscriptions invalides (410 Gone = appareil desabonne)
    const invalidEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        if (error && (error.statusCode === 404 || error.statusCode === 410)) {
          invalidEndpoints.push(subscriptions[index].endpoint);
        } else {
          console.error('Erreur push:', error);
        }
      }
    });

    if (invalidEndpoints.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', invalidEndpoints);
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    // Enregistrer la notification dans la table (pour la cloche in-app)
    await supabaseAdmin.from('notifications').insert({
      societe_id,
      type: tag || 'GENERAL',
      titre: title,
      message,
      donnees: donnees || {},
    });

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: results.length - successCount,
      cleaned: invalidEndpoints.length,
    });
  } catch (error) {
    console.error('Erreur API push/send:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
