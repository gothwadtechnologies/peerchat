import { supabase } from '../../lib/supabase';
import { storage } from '../StorageService';

export interface PendingTransaction {
  id: string;
  type: 'story_insert' | 'message_insert';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = 'grix_pending_transactions';

class TransactionQueueService {
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Device returned online. Triggering transactional queue process...');
        this.processQueue();
      });

      // Run initial check on launch
      setTimeout(() => this.processQueue(), 5000);

      // Periodic check interval (every 35 seconds)
      setInterval(() => {
        if (navigator.onLine) {
          this.processQueue();
        }
      }, 35000);
    }
  }

  // Retrieve pending queue array
  getQueue(): PendingTransaction[] {
    try {
      const raw = storage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  // Add transactional task to the FIFO queue
  async addTransaction(type: 'story_insert' | 'message_insert', payload: any): Promise<void> {
    const queue = this.getQueue();
    const newTask: PendingTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0
    };

    queue.push(newTask);
    storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

    console.log(`Saved pending transaction to queue: type=${type}, id=${newTask.id}`);
    
    // Attempt processing immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  // Sequential FIFO queue executor
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      if (queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing transactional queue: ${queue.length} items pending.`);
      const remaining: PendingTransaction[] = [];

      for (const tx of queue) {
        if (!navigator.onLine) {
          console.warn('Network offline during transaction execution. Yielding process.');
          remaining.push(tx);
          continue;
        }

        let success = false;

        try {
          if (tx.type === 'story_insert') {
            success = await this.executeStoryInsert(tx.payload);
          } else if (tx.type === 'message_insert') {
            success = await this.executeMessageInsert(tx.payload);
          }
        } catch (err) {
          console.error(`Execution error for transaction ID ${tx.id}:`, err);
        }

        if (success) {
          console.log(`Transaction ${tx.id} executed successfully.`);
        } else {
          tx.retries += 1;
          // Drop if maximum retries exceeded to prevent blocking (e.g. invalid file url payload)
          if (tx.retries > 8) {
            console.error(`Transaction ${tx.id} exceeded maximum retry attempts (8). Dropping transaction.`);
          } else {
            console.log(`Transaction ${tx.id} marked for retry. Retries: ${tx.retries}`);
            remaining.push(tx);
          }
        }
      }

      storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    } catch (globalErr) {
      console.error('Fatal retry queue handler error:', globalErr);
    } finally {
      this.isProcessing = false;
    }
  }

  // Story worker
  private async executeStoryInsert(payload: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('stories').insert({
        user_id: payload.userId,
        media_url: payload.mediaUrl,
        type: payload.type || 'image'
      } as any);

      if (error) {
        console.warn('Failed stories insertion attempt:', error.message);
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // Message worker
  private async executeMessageInsert(payload: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: payload.roomId,
        sender_id: payload.senderId,
        content: payload.content || '',
        media_url: payload.mediaUrl || null,
        media_type: payload.mediaType || null,
        reply_to_id: payload.replyToId || null,
        read_by: payload.readBy || []
      } as any);

      if (error) {
        console.warn('Failed messages insertion attempt:', error.message);
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }
}

export const transactionQueue = new TransactionQueueService();
export default transactionQueue;
