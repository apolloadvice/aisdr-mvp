'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getGmailStatus, connectGmail, disconnectGmail } from '@/lib/api';

export function ConnectionsTab() {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    getGmailStatus().then((status) => {
      setGmailConnected(status.connected);
      setGmailEmail(status.email);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <p className="text-muted-foreground mb-4 text-sm">
        Connect your email to send outreach directly from Remes.
      </p>

      <div className="border-border flex items-center justify-between rounded-md border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
            <Mail className="text-muted-foreground size-5" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Gmail</p>
            {loading ? (
              <p className="text-muted-foreground text-xs">Checking...</p>
            ) : gmailConnected ? (
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <CheckCircle className="text-primary size-3" />
                {gmailEmail}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">Not connected</p>
            )}
          </div>
        </div>

        {!loading &&
          (gmailConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setDisconnecting(true);
                try {
                  await disconnectGmail();
                  setGmailConnected(false);
                  setGmailEmail(null);
                  toast.success('Gmail disconnected');
                } catch {
                  toast.error('Failed to disconnect Gmail');
                } finally {
                  setDisconnecting(false);
                }
              }}
              disabled={disconnecting}
            >
              {disconnecting && <Loader2 className="size-3.5 animate-spin" />}
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={() => connectGmail()}>
              Connect Gmail
            </Button>
          ))}
      </div>
    </div>
  );
}
