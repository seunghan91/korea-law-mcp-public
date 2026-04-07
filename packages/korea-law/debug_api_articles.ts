import { searchLaws, getLawDetail } from './src/api/law-api';

async function main() {
  console.log("Searching for 형법...");
  const laws = await searchLaws("형법");
  const criminalAct = laws.find(l => l.법령명한글 === "형법");
  
  if (!criminalAct) {
    console.error("형법 not found");
    return;
  }
  
  console.log(`Found 형법 ID: ${criminalAct.법령ID}`);
  const detail = await getLawDetail(criminalAct.법령ID);
  
  if (!detail) {
    console.error("Detail not found");
    return;
  }
  
  console.log("Checking articles around 347...");
  const articles = detail.조문.filter(a => a.조문번호.includes("347"));
  
  articles.forEach(a => {
    console.log(`No: ${a.조문번호}, ContentStart: ${a.조문내용.substring(0, 30)}...`);
  });
}

main().catch(console.error);
