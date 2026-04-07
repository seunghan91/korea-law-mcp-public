import { apiClient } from '../src/api/law-api';

async function testTargets() {
  const targets = ['law', 'lawMobile', 'lawCustom'];
  
  for (const target of targets) {
    console.log(`\nTesting target: ${target}`);
    try {
      const response = await apiClient.get('/lawSearch.do', {
        params: {
          OC: process.env.KOREA_LAW_API_KEY || 'sapphire_5',
          target: target,
          type: 'XML',
          query: '근로기준법',
          display: 1
        }
      });
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Data Length: ${response.data.length}`);
      console.log(`  Preview: ${response.data.substring(0, 200)}...`);
      
    } catch (e: any) {
      console.log(`  ❌ Error: ${e.message}`);
      if (e.response) {
        console.log(`  Response status: ${e.response.status}`);
        console.log(`  Response data: ${e.response.data}`);
      }
    }
  }
}

testTargets();
