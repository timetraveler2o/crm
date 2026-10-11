const fs = require('fs');
const path = 'backend/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

const resetEndpoint = `
  app.post('/api/public/reset-password', async (c) => {
    const { email, newPassword } = await c.req.json();
    if (!email || !newPassword) return c.json({ success: false, message: 'Email and new password required' }, 400);
    
    const user = await edgespark.db.select().from(tables.users).where(eq(tables.users.email, email.trim().toLowerCase())).get();
    if (!user) {
      return c.json({ success: false, message: 'Email not found' }, 404);
    }
    
    await edgespark.db.update(tables.users).set({ password: newPassword }).where(eq(tables.users.id, user.id));
    return c.json({ success: true, message: 'Password updated successfully' });
  });

  app.post('/api/public/check-email', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ success: false, message: 'Email required' }, 400);
    
    const user = await edgespark.db.select().from(tables.users).where(eq(tables.users.email, email.trim().toLowerCase())).get();
    if (!user) {
      return c.json({ success: false, message: 'Email not found' }, 404);
    }
    
    return c.json({ success: true, message: 'Email found' });
  });
`;

content = content.replace(
  /app\.post\('\/api\/public\/login', async \(c\) => \{/,
  resetEndpoint + '\n  app.post(\'/api/public/login\', async (c) => {'
);

fs.writeFileSync(path, content);
