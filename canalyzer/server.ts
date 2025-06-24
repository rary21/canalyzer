import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupWebSocketServer } from './src/server/websocket-server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const defaultPort = 3000;

// ポート番号を環境変数から取得（数値として妥当かチェック）
const parsedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
const port = (parsedPort > 0 && parsedPort < 65536) ? parsedPort : defaultPort;

if (process.env.PORT && port === defaultPort && parsedPort !== defaultPort) {
  console.warn(`警告: 指定されたポート番号 "${process.env.PORT}" は無効です。デフォルトポート ${defaultPort} を使用します。`);
}

// Next.jsアプリケーションを初期化
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocketサーバーをセットアップ
  setupWebSocketServer(server);

  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> WebSocket server is running');
  });
});
