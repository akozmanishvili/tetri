/// <reference types="node" />
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const STARTER_TOASTS = [
  {
    conceptKey: "welcome",
    emoji: "🍷",
    titleEn: "Welcome to the supra!",
    titleKa: "მობრძანდი, ახლა ცხელდება სუფრა! ჯერ ცხელები არ შემოუტანიათ",
    bodyEn:
      "Every supra has a tamada, and this one has me. I'll raise a toast whenever you meet something new. Here are 10,000 pretend lari: lose them here, so you never lose the real ones. So whenever you go out and invest real money, you will be more than ready. Listen to this huge wisdom from Tamada - Chief of the Supra!",
    bodyKa:
      "ყველა სუფრას ხო ჰყავს თამადა და ამ სუფრას მე გავუძღვები. ყველა თემაზე სადღეგრძელოს შევსვამ. აჰა, 10 000 ვირტუალური ლარი: ხარჯე, შენი რა მიდის ნამდვილი მაინც არაა. სამაგიეროდ როცა ნამდვილ მარკეტზე გახვალ და ინვესტიციებს გაუძღვები, როგორც მე ამ სუფრას, უკვე გამოცდილი იქნები. უსმინე თამადას, უსმინე!",
  },
  {
    conceptKey: "nav",
    emoji: "🏺",
    titleEn: "What is NAV?",
    titleKa: "რა არის NAV?",
    bodyEn:
      "Net Asset Value: everything the fund owns, minus what it owes, divided by its units. Picture a dock of wine shared among the guests. NAV is how much wine is in your glass. It's counted once a day, so fund orders wait for the evening.",
    bodyKa:
      "აქტივების ნამდვილი ღირებულება: ფონდის მთელი ქონება - მინუს ვალები / გაყოფილი ერთეულებზე. წარმოიდგინე ღვინო დოქში, რომელიც სტუმრებს შორისაა გაყოფილი — NAV გამოხატავს თუ რამდენი ღვინოა შენს ჭიქაში. დღეში ერთხელ ითვლება, ამიტომ ფონდის შეკვეთა საღამომდე არ განხორციელდება.",
  },
  {
    conceptKey: "fx",
    emoji: "💱",
    titleEn: "Two prices in one",
    titleKa: "ორი ერთში",
    bodyEn:
      "This one is priced in a foreign currency, so your result in lari depends on the price AND the exchange rate. The stock can rise while the lari gets stronger, and you end up right where you started. A good guest watches both glasses.",
    bodyKa:
      "ეს უცხოურ ვალუტაშია, ამიტომ შენი შედეგი ლარში ფასზეც დამოკიდებულია და კურსზეც. აქცია შეიძლება გაიზარდოს, ლარი გამყარდეს და მაინც იქ დარჩე, საიდანაც დაიწყე. კარგი სტუმარი ორივე ჭიქას უყურებს.",
  },
  {
    conceptKey: "fees",
    emoji: "🧾",
    titleEn: "Mind the waiter",
    titleKa: "ფრთხილად, მიმტანი!",
    bodyEn:
      "Every year the fund keeps a small cup of your wine as its fee. Half a percent sounds like nothing, but over 20 years it fills a whole qvevri. Before you sit down, check the fee.",
    bodyKa:
      "ყოველწლიურად ფონდი შენი ღვინიდან პატარა ჭიქას საკომისიოდ იტოვებს. ნახევარი პროცენტი არაფრად ჩანს, მაგრამ 20 წელიწადში მთელ ქვევრად იქცევა. დაჯდომამდე საკომისიოს დახედე.",
  },
  {
    conceptKey: "first_order",
    emoji: "🥂",
    titleEn: "Your first trade!",
    titleKa: "პირველი გარიგება!",
    bodyEn:
      "Gaumarjos! The first toast is always the hardest. Now the real lesson begins: don't check the price every five minutes. Wine needs time, and so does money.",
    bodyKa:
      "გაგიმარჯოს! პირველი სადღეგრძელო ყველაზე რთულია. ახლა ნამდვილი გაკვეთილი იწყება: ფასს ყოველ ხუთ წუთში ნუ ამოწმებ. ღვინოს დრო სჭირდება, ფულსაც.",
  },
  {
    conceptKey: "pending_order",
    emoji: "⏳",
    titleEn: "Patience, my friend",
    titleKa: "მოთმინება, ჩემო კარგო",
    bodyEn:
      "Fund orders don't fill instantly. Everyone who orders today gets the same price: tonight's NAV. No rushing, no tricks, every guest at the table is equal.",
    bodyKa:
      "ფონდის შეკვეთა მყისიერად არ სრულდება. ყველა, ვინც დღეს შეუკვეთა, ერთსა და იმავე ფასს მიიღებს — დღევანდელ საღამოს NAV-ს. არავინ ჩქარობს, სუფრასთან ყველა სტუმარი თანასწორია.",
  },
  {
    conceptKey: "diversification",
    emoji: "🍖",
    titleEn: "A table full of dishes",
    titleKa: "სავსე სუფრა",
    bodyEn:
      "A good supra never has just one dish. If the khachapuri burns, there's still mtsvadi. Owning different things means one bad day can't ruin the whole feast.",
    bodyKa:
      "კარგ სუფრაზე ერთი კერძი არასდროს დგას — ხაჭაპური თუ დაიწვა, მწვადი მაინც გვაქვს. სხვადასხვა აქტივი იმას ნიშნავს, რომ ერთი ცუდი დღე მთელ ქეიფს ვერ ჩაშლის.",
  },
  {
    conceptKey: "first_loss",
    emoji: "🔴",
    titleEn: "Something turned red",
    titleKa: "რაღაც გაწითლდა",
    bodyEn:
      "Don't panic. Red numbers are part of every investor's story. Selling in fear turns a temporary dip into a permanent loss. The best investors sit calmly through the bad toasts too.",
    bodyKa:
      "ნუ ღელავ — წითელი რიცხვები ყველა ინვესტორის ისტორიის ნაწილია. შიშით გაყიდვა დროებით ვარდნას მუდმივ ზარალად აქცევს. საუკეთესო ინვესტორები ცუდ სადღეგრძელოებსაც მშვიდად ისმენენ.",
  },
];

// Create-only: if a toast already exists (maybe you edited it in the admin page),
// leave it alone. Safe to run any number of times.
for (const toast of STARTER_TOASTS) {
  await prisma.toast.upsert({
    where: { conceptKey: toast.conceptKey },
    update: {},
    create: toast,
  });
}

console.log(`🍷 ${STARTER_TOASTS.length} starter toasts in place. Gaumarjos!`);
await prisma.$disconnect();
