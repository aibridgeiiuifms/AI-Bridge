const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const hasCRLF = c.includes('\r\n');
if (hasCRLF) c = c.replace(/\r\n/g, '\n');

c = c.replace("  Compass\n} from 'lucide-react';", "  Compass,\n  TrendingUp\n} from 'lucide-react';");

if (hasCRLF) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync('src/app/dashboard/page.tsx', c, 'utf8');
console.log('TrendingUp added. New size:', c.length);
