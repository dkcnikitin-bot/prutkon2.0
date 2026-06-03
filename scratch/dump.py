import json
import urllib.request
import urllib.error

url = 'https://ezazhutkkntbfqpsweyu.supabase.co/rest/v1/employees?select=*'
req = urllib.request.Request(
    url,
    headers={
        'apikey': 'sb_publishable_Y-wTcUG5CF_oi93BcQsisQ_aOJipc3M',
        'Authorization': 'Bearer sb_publishable_Y-wTcUG5CF_oi93BcQsisQ_aOJipc3M'
    }
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        parsed = json.loads(html)
        with open('scratch/employees_dump.json', 'w', encoding='utf-8') as f:
            json.dump(parsed, f, ensure_ascii=False, indent=2)
        print('Successfully wrote employees to scratch/employees_dump.json')
except urllib.error.URLError as e:
    print('URLError:', e.reason)
except Exception as e:
    print('Error:', str(e))
