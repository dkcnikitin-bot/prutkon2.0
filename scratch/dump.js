const fs = require('fs');
const https = require('https');

const url = 'https://ezazhutkkntbfqpsweyu.supabase.co/rest/v1/employees?select=*';
const options = {
    headers: {
        'apikey': 'sb_publishable_Y-wTcUG5CF_oi93BcQsisQ_aOJipc3M',
        'Authorization': 'Bearer sb_publishable_Y-wTcUG5CF_oi93BcQsisQ_aOJipc3M'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            fs.writeFileSync('scratch/employees_dump.json', JSON.stringify(parsed, null, 2), 'utf8');
            console.log('Successfully wrote employees to scratch/employees_dump.json');
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
            console.error('Raw data was:', data);
        }
    });
}).on('error', (err) => {
    console.error('HTTPS request error:', err.message);
});
