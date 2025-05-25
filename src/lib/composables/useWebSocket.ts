import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useWebSocket({ topic, endPoint, onData }) {
  const ws = ref(null);

  const connectWebSocket = () => {
    if (ws.value) ws.value.close();
    ws.value = new WebSocket(`wss://ws.btse.com/ws/${endPoint}`);

    ws.value.onopen = () => {
      ws.value.send(JSON.stringify({ op: 'subscribe', args: [topic] }));
    };

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (onData) onData(data.data);
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.value.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    };
  };

  const resubscribe = () => {
    if (ws.value) {
      ws.value.send(JSON.stringify({ op: 'unsubscribe', args: [topic] }));
      ws.value.send(JSON.stringify({ op: 'subscribe', args: [topic] }));
    }
  };

  //   onMounted(connectWebSocket);
  //   onBeforeUnmount(() => ws.value && ws.value.close());

  return { ws, connectWebSocket, resubscribe };
}
