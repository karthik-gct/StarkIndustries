import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? '3100', 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`StarkIndustries API running on http://localhost:${PORT}`);
});
