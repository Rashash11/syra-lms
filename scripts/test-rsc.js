
const fetch = require('node-fetch');

async function testRSC() {
    console.log('Fetching RSC payload for /admin/learning-paths');
    try {
        const res = await fetch('http://localhost:3000/admin/learning-paths', {
            headers: {
                'RSC': '1',
                'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22admin%22%2C%7B%22children%22%3A%5B%22learning-paths%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D',
                'Next-Url': '/admin/learning-paths'
            }
        });
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            console.log('RSC Payload OK');
            // console.log(await res.text());
        } else {
            console.log('RSC Failed:', res.status);
            console.log(await res.text());
        }
    } catch (e) {
        console.error('RSC Fetch Error:', e.message);
    }
}

testRSC();
