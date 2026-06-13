// Multi-client serverless database mock for GrixChat
// Simulates Supabase on-device persistent database layers using standard local storage indexers.

// Exception-proof universal storage manager for sandboxed iframe environments
const inMemoryCache: Record<string, string> = {};

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return inMemoryCache[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      inMemoryCache[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete inMemoryCache[key];
    }
  }
};

class QueryBuilder {
  private tableName: string;
  private selects: string = '*';
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingleResult: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getItems(): any[] {
    try {
      const dataStr = safeLocalStorage.getItem(`db_${this.tableName}`);
      let items = dataStr ? JSON.parse(dataStr) : [];
      // Seeding demo data for serverless feel if empty
      if (items.length === 0 && this.tableName === 'users') {
        items = [
          {
            id: 'grix-ai-bot',
            username: 'grix_ai',
            full_name: 'Grix AI',
            bio: 'Official serverless P2P AI companion',
            email: 'ai@grix.local',
            photo_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712104.png',
            is_online: true,
            last_seen: new Date().toISOString()
          },
          {
            id: 'peer-global-lobby',
            username: 'global_peer',
            full_name: 'Lobby Peer',
            bio: 'Default peer to start testing room signaling',
            email: 'peer@grix.local',
            photo_url: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            is_online: true,
            last_seen: new Date().toISOString()
          }
        ];
        safeLocalStorage.setItem(`db_users`, JSON.stringify(items));
      }
      return items;
    } catch {
      return [];
    }
  }

  private saveItems(items: any[]): void {
    try {
      safeLocalStorage.setItem(`db_${this.tableName}`, JSON.stringify(items));
    } catch (e) {
      console.warn(`LocalDB write failed for ${this.tableName}:`, e);
    }
  }

  select(fields: string = '*') {
    this.selects = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push(item => {
      if (item[field] === undefined) return false;
      return String(item[field]).toLowerCase() === String(value).toLowerCase();
    });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push(item => {
      if (item[field] === undefined) return true;
      return String(item[field]).toLowerCase() !== String(value).toLowerCase();
    });
    return this;
  }

  lt(field: string, value: any) {
    this.filters.push(item => item[field] < value);
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push(item => item[field] > value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push(item => {
      const list = Array.isArray(values) ? values : [];
      return list.map(v => String(v).toLowerCase()).includes(String(item[field]).toLowerCase());
    });
    return this;
  }

  or(filterStr: string) {
    this.filters.push(item => {
      const orParts = filterStr.split(',');
      return orParts.some(part => {
        const match = part.trim().match(/^([^.]+)\.([^.]+)\.(.+)$/);
        if (match) {
          const [, field, op, val] = match;
          const cleanVal = val.replace(/^["']|["']$/g, '');
          if (op === 'eq') return String(item[field]).toLowerCase() === String(cleanVal).toLowerCase();
        }
        return false;
      });
    });
    return this;
  }

  order(field: string, config?: { ascending: boolean }) {
    this.orderField = field;
    this.orderAscending = config ? config.ascending : true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingleResult = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async insert(data: any) {
    const items = this.getItems();
    const rows = Array.isArray(data) ? data : [data];
    const insertedRows = rows.map(r => ({
      id: r.id || Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...r
    }));
    const newItems = [...items, ...insertedRows];
    this.saveItems(newItems);
    this.triggerRealtimeChange('INSERT', insertedRows);
    
    return { data: Array.isArray(data) ? insertedRows : insertedRows[0], error: null };
  }

  async upsert(data: any) {
    const items = this.getItems();
    const rows = Array.isArray(data) ? data : [data];
    const updatedRows: any[] = [];
    
    let newItems = [...items];
    rows.forEach(r => {
      const lookupField = r.id ? 'id' : 'follower_id'; // adaptive key mapping for upserts
      const lookupVal = r.id || r.follower_id;

      const idx = newItems.findIndex(item => item[lookupField] === lookupVal);
      const updatedRow = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...r
      };
      if (idx !== -1) {
        newItems[idx] = { ...newItems[idx], ...updatedRow };
      } else {
        newItems.push(updatedRow);
      }
      updatedRows.push(updatedRow);
    });

    this.saveItems(newItems);
    this.triggerRealtimeChange('UPSERT', updatedRows);
    return { data: Array.isArray(data) ? updatedRows : updatedRows[0], error: null };
  }

  async update(updateData: any) {
    const items = this.getItems();
    let updatedRows: any[] = [];
    
    const newItems = items.map(item => {
      const matches = this.filters.every(filter => filter(item));
      if (matches) {
        const updated = { ...item, ...updateData, updated_at: new Date().toISOString() };
        updatedRows.push(updated);
        return updated;
      }
      return item;
    });

    this.saveItems(newItems);
    this.triggerRealtimeChange('UPDATE', updatedRows);
    return { data: this.isSingleResult || this.isMaybeSingle ? (updatedRows[0] || null) : updatedRows, error: null };
  }

  async delete() {
    const items = this.getItems();
    const beforeCount = items.length;
    let deletedRows: any[] = [];
    const remaining = items.filter(item => {
      const matches = this.filters.every(filter => filter(item));
      if (matches) {
        deletedRows.push(item);
      }
      return !matches;
    });
    this.saveItems(remaining);
    this.triggerRealtimeChange('DELETE', deletedRows);
    return { data: { count: beforeCount - remaining.length }, error: null };
  }

  private triggerRealtimeChange(eventType: string, records: any[]) {
    setTimeout(() => {
      const event = new CustomEvent('p2p_db_change', {
        detail: { table: this.tableName, eventType, records }
      });
      window.dispatchEvent(event);
    }, 50);
  }

  // Promise resolution support
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    let results = this.getItems();
    
    if (this.filters.length > 0) {
      results = results.filter(item => this.filters.every(filter => filter(item)));
    }
    
    if (this.orderField) {
      const field = this.orderField;
      results.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }

    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }

    let payload: any = results;
    if (this.isSingleResult) {
      payload = results.length > 0 ? results[0] : null;
    } else if (this.isMaybeSingle) {
      payload = results.length > 0 ? results[0] : null;
    }

    return Promise.resolve({ data: payload, error: null }).then(onfulfilled, onrejected);
  }
}

class RealtimeChannelMock {
  private channelName: string;
  private listeners: Array<{ event: string; filter: any; cb: (p: any) => void }> = [];
  private onPresenceCb: (() => void) | null = null;

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  on(event: string, filterConfig: any, callback: (payload: any) => void) {
    this.listeners.push({ event, filter: filterConfig, cb: callback });
    
    // Bind window database triggers
    const handleDbChange = (e: any) => {
      const { table, eventType, records } = e.detail;
      if (filterConfig.table === table) {
        records.forEach((record: any) => {
          callback({
            eventType,
            new: record,
            old: {}
          });
        });
      }
    };
    window.addEventListener('p2p_db_change', handleDbChange);
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    setTimeout(() => {
      if (callback) callback('SUBSCRIBED');
      if (this.onPresenceCb) this.onPresenceCb();
    }, 10);
    return this;
  }

  track(presenceState: any) {
    return Promise.resolve();
  }

  unsubscribe() {
    return Promise.resolve();
  }
}

// Emulate client Auth interface
class AuthSimulator {
  private listeners: Set<(event: string, session: any) => void> = new Set();

  constructor() {
    // Sync triggers
    window.addEventListener('p2p_auth_update', () => {
      const session = this.getSyncSession();
      this.listeners.forEach(cb => cb('SIGNED_IN', session));
    });
  }

  private getSyncSession() {
    let peerId = safeLocalStorage.getItem('grix_peer_id');
    let peerName = safeLocalStorage.getItem('grix_peer_name');
    if (!peerId) {
      peerId = 'peer-' + Math.random().toString(36).substring(2, 9);
      peerName = 'GrixPeer_' + Math.floor(1000 + Math.random() * 9000);
      safeLocalStorage.setItem('grix_peer_id', peerId);
      safeLocalStorage.setItem('grix_peer_name', peerName!);
    }
    const user = {
      id: peerId,
      email: `${peerName?.toLowerCase().replace(/\s+/g, '')}@grix.local`,
      user_metadata: {
        full_name: peerName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${peerId}`
      },
      aud: 'authenticated',
      role: 'authenticated'
    };
    return { user };
  }

  async getSession() {
    return { data: { session: this.getSyncSession() }, error: null };
  }

  async getUser() {
    return { data: { user: this.getSyncSession().user }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.add(callback);
    // Instant initial trigger
    setTimeout(() => {
      callback('INITIAL_SESSION', this.getSyncSession());
    }, 10);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          }
        }
      }
    };
  }

  async signOut() {
    safeLocalStorage.removeItem('grix_peer_id');
    safeLocalStorage.removeItem('grix_peer_name');
    this.listeners.forEach(cb => cb('SIGNED_OUT', null));
    return { error: null };
  }

  async signInWithPassword(credentials: any) {
    return { data: this.getSyncSession(), error: null };
  }

  async signUp(credentials: any) {
    return { data: this.getSyncSession(), error: null };
  }

  async updateUser(data: any) {
    if (data?.data?.full_name) {
      safeLocalStorage.setItem('grix_peer_name', data.data.full_name);
    }
    window.dispatchEvent(new Event('p2p_auth_update'));
    return { data: this.getSyncSession().user, error: null };
  }
}

class SupabaseEmulator {
  auth = new AuthSimulator();

  from(tableName: string) {
    return new QueryBuilder(tableName);
  }

  channel(channelName: string, config?: any) {
    return new RealtimeChannelMock(channelName);
  }

  removeChannel(channel: any) {
    if (channel) channel.unsubscribe();
    return Promise.resolve();
  }

  // Basic storage interface mock
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options?: any) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: 'https://catbox.moe' } }),
      remove: async (paths: string[]) => ({ data: null, error: null })
    })
  };

  rpc(procName: string, args: any) {
    // Mock direct conversation id lookup
    if (procName === 'get_direct_conversation_id') {
      const u1 = args.u1;
      const u2 = args.u2;
      // Fetch local conversations and see if participants match u1 and u2
      try {
        const convs = JSON.parse(safeLocalStorage.getItem('db_conversations') || '[]');
        const parts = JSON.parse(safeLocalStorage.getItem('db_conversation_participants') || '[]');
        
        for (const c of convs) {
          if (c.type === 'direct') {
            const matches = parts.filter((p: any) => p.conversation_id === c.id);
            const userIds = matches.map((p: any) => p.user_id);
            if (userIds.includes(u1) && userIds.includes(u2)) {
              return Promise.resolve({ data: c.id, error: null });
            }
          }
        }
      } catch {}
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }
}

export const getSupabase = () => new SupabaseEmulator();
export const supabase = getSupabase() as any;
