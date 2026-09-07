type MessageCallback = (data: any) => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: MessageCallback[] = [];
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private useDirectFallback: boolean = false;
  private isConnecting: boolean = false;

  private getWsUrl(): string {
    const envApi = (((import.meta as any).env?.VITE_API_BASE_URL as string) || '').trim();
    if (envApi) {
      try {
        const parsed = new URL(envApi);
        const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProto}//${parsed.host}/api/leaderboard/ws`;
      } catch {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // In local Vite development (port 5173), direct connect to backend on 8000 as fallback
    if (this.useDirectFallback && window.location.port === '5173') {
      const host = window.location.hostname || '127.0.0.1';
      return `${protocol}//${host}:8000/api/leaderboard/ws`;
    }

    return `${protocol}//${window.location.host}/api/leaderboard/ws`;
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    const wsUrl = this.getWsUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        console.log(`[CyberVault] WebSocket connected to server (${wsUrl})`);
        this.startPing();
      };

      this.socket.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(data));
        } catch {
          // Non-JSON message
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.stopPing();
        // Toggle fallback between proxy path and direct port 8000
        if (window.location.port === '5173') {
          this.useDirectFallback = !this.useDirectFallback;
        }
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnecting = false;
        try {
          this.socket?.close();
        } catch {}
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send('ping');
        } catch {}
      }
    }, 15000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public subscribe(callback: MessageCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public disconnect() {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

export const wsClient = new WebSocketClient();
