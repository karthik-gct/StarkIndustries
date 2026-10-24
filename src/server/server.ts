import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? '3100', 10);
createApp().listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
