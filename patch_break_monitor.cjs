const fs = require('fs');
const path = 'src/pages/BreakMonitor.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldHandleEndBreak = `  const handleEndBreak = async () => {
    if (!activeBreak) return;
    const durationSec = Math.floor((Date.now() - activeBreak.startTime) / 1000);
    const duration = formatTime(durationSec);
    endBreak();
    setElapsed(0); // Immediately reset elapsed to fix glitch
    
    const activeLog = breakLogs.find(l => l.userId === currentUser?.id && !l.endTime);
    if (activeLog) {
      try {
        await client.api.fetch(\`/api/public/break-logs/\${activeLog.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endTime: new Date().toISOString(),
            duration
          })
        });
        fetchBreakLogs();
      } catch (err) {
        console.error(err);
      }
    }
  };`;

const newHandleEndBreak = `  const handleEndBreak = async () => {
    if (!activeBreak) return;
    const durationSec = Math.floor((Date.now() - activeBreak.startTime) / 1000);
    const duration = formatTime(durationSec);
    endBreak();
    setElapsed(0); // Immediately reset elapsed to fix glitch
    
    try {
      // Fetch latest logs to ensure we have the active log
      const res = await client.api.fetch('/api/public/break-logs');
      const { data } = await res.json();
      const latestLogs = data || [];
      const activeLog = latestLogs.find((l: any) => l.userId === currentUser?.id && !l.endTime);
      
      if (activeLog) {
        await client.api.fetch(\`/api/public/break-logs/\${activeLog.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endTime: new Date().toISOString(),
            duration
          })
        });
        fetchBreakLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };`;

content = content.replace(oldHandleEndBreak, newHandleEndBreak);
fs.writeFileSync(path, content);
console.log('Patched handleEndBreak');
