import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

export function useChatScroll(
  messages: any[], 
  loading: boolean, 
  userId: string | undefined, 
  loadingMore: boolean, 
  loadMore: () => void
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const firstMessageIdRef = useRef<string | null>(null);
  const scrollHeightRef = useRef<number>(0);
  const scrollTopRef = useRef<number>(0);
  const lastMessageCount = useRef<number>(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    scrollHeightRef.current = target.scrollHeight;
    scrollTopRef.current = target.scrollTop;

    if (target.scrollTop === 0 && !loadingMore && !loading && messages.length >= 20) {
      loadMore();
    }
  }, [loading, loadingMore, messages.length, loadMore]);

  useLayoutEffect(() => {
    if (loading || messages.length === 0) {
      lastMessageIdRef.current = null;
      firstMessageIdRef.current = null;
      lastMessageCount.current = 0;
      return;
    }

    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];
    const container = scrollContainerRef.current;

    if (!lastMessageIdRef.current) {
      scrollToBottom('auto');
      lastMessageCount.current = messages.length;
      lastMessageIdRef.current = lastMsg?.id || null;
      firstMessageIdRef.current = firstMsg?.id || null;
      if (container) {
        scrollHeightRef.current = container.scrollHeight;
        scrollTopRef.current = container.scrollTop;
      }
      return;
    }

    if (firstMsg?.id !== firstMessageIdRef.current && lastMsg?.id === lastMessageIdRef.current) {
      if (container && scrollHeightRef.current > 0) {
        const heightDiff = container.scrollHeight - scrollHeightRef.current;
        if (heightDiff > 0) {
          container.scrollTop = scrollTopRef.current + heightDiff;
        }
      }
    } else if (lastMsg?.id !== lastMessageIdRef.current) {
      const isFromMe = lastMsg?.sender_id === userId;
      scrollToBottom(isFromMe ? 'smooth' : 'auto');
    }

    lastMessageCount.current = messages.length;
    lastMessageIdRef.current = lastMsg?.id || null;
    firstMessageIdRef.current = firstMsg?.id || null;

    if (container) {
      scrollHeightRef.current = container.scrollHeight;
      scrollTopRef.current = container.scrollTop;
    }
  }, [messages, loading, userId, scrollToBottom, loadingMore]);

  return {
    scrollContainerRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom
  };
}
