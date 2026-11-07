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
      "This one is priced in a foreign currency, so your result in lari depends on the price AND the exchange rate. The stock can rise while the lari gets stronger, and you end up right where you started. A good investor watches both price and exchange rate, just like good Tamada watches if you completely emptied your glass or not.",
    bodyKa:
      "უცხოურ ვალუტაშია, ამიტომ შენი შედეგი ფასზეც არის დამოკიდებული და კურსზეც. აქცია შეიძლება გაიზარდოს, ამავე დროს ლარი გამყარდეს და შედეგად შენ მაინც იქ დარჩები საიდანაც დაიწყე. კარგი ინვესტორი ორივეს უყურებს ფასსაც და კურსსაც, ისე გულდასმით როგორც, თამადა შენს ჭიქას, ბოლომდე დაცალე თუ არა.",
  },
  {
    conceptKey: "fees",
    emoji: "🧾",
    titleEn: "Mind the waiter tip",
    titleKa: "ფრთხილად, მიმტანსაც რჩება ჩაი!",
    bodyEn:
      "Every year the fund keeps a small cup of your wine as its fee. Half a percent sounds like nothing, but over 20 years it fills a whole dock. Before you sit down, check the fee.",
    bodyKa:
      "ყოველწლიურად ფონდი შენი ჭიქიდან პატარა ნაწილს საკომისიოდ ისხავს თავის ოციანში. ახლა ფიქრობ, რომ ნახევარი პროცენტი დიდი არაფერიაო, მაგრამ 20 წელიწადში პატარ-პატარა საკომისიოები მთელ ქვევრსაც გაავსებს. სუფრასთან დაჯდომამდე საკომისიოს კარგად გადახედე.",
  },
  {
    conceptKey: "first_order",
    emoji: "🥂",
    titleEn: "Your first trade!",
    titleKa: "პირველი გარიგება!",
    bodyEn:
      "Gaumarjos! The first toast is always the hardest. Now the real lesson begins: don't check the price every five minutes. Wine needs time, and so does money.",
    bodyKa:
      "გაგიმარჯოს ღმერთმა! პირველი რთველი ყველაზე რთულია. ნამდვილი გაკვეთილი ჯერ ახლა იწყება: ფასი ყოველ ხუთ წუთში არ შეამოწო. ღვინოს დასაყენებლად დრო სჭირდება, ფულიც ეგრეა.",
  },
  {
    conceptKey: "pending_order",
    emoji: "⏳",
    titleEn: "Patience, my friend",
    titleKa: "მოთმინება, ჯიგარო",
    bodyEn:
      "Fund orders don't fill instantly. Everyone who orders today gets the same price: tonight's NAV. No rushing, no tricks, every guest at the table is equal.",
    bodyKa:
      "ფონდის შეკვეთა მყისიერად არ სრულდება. ყველა, ვინც დღეს შეუკვეთა, ერთსა და იმავე ფასს მიიღებს — დღევანდელი საღამოს NAV-ს. სიჩქარე და აჟიოტაჟი არაა საჭირო, სუფრასთან ყველა თანასწორია.",
  },
  {
    conceptKey: "diversification",
    emoji: "🍖",
    titleEn: "A table full of dishes",
    titleKa: "სავსე სუფრა",
    bodyEn:
      "A good supra never has just one dish. If the lobiani runs out, there's still mtsvadi. Owning different things means one bad day can't ruin the whole feast.",
    bodyKa:
      "კარგ სუფრა სავსე უნდა იყოს — ხაჭაპური თუ გამოგველია, მწვადი მაინც გვექნება. სხვადასხვა აქტივი და ინვესტიციების მრავალფეროვნება იმას ნიშნავს, რომ ერთი ცუდი დღე მთელ ქეიფს ვერ ჩაშლის.",
  },
  {
    conceptKey: "first_loss",
    emoji: "🔴",
    titleEn: "Something turned red",
    titleKa: "გაწითლდა",
    bodyEn:
      "Don't panic. Red numbers are part of every investor's story. Selling in fear turns a temporary dip into a permanent loss. The best investors sit calmly through the bad toasts too.",
    bodyKa:
      "ნუ ღელავ — გაწითელი რიცხვები და მინუსიანი პროცენტები ყველა ინვესტორის ისტორიის ნაწილია. პანიკის გამო გაყიდვა დროებით ვარდნას მუდმივ ზარალად აქცევს. საუკეთესო ინვესტორები ცუდ სადღეგრძელოებსაც ითმენენ.",
  },
  {
    conceptKey: "compounding",
    emoji: "📈",
    titleEn: "The magic of compounding",
    titleKa: "რთული პროცენტის მაგია",
    bodyEn:
      "Einstein supposedly called compound interest the eighth wonder of the world. Your money earns money, then that money earns money too. Like a good supra: the toasts get longer as the night goes on. The secret ingredient is time, so start early.",
    bodyKa:
      "ამბობენ, რომ აინშტაინმა რთულ პროცენტს მსოფლიოს მერვე საოცრება უწოდა. შენი ფული ფულს გამოიმუშავებს, მერე ის ფულიც — ფულს. როგორც კარგი სუფრა: რაც უფრო დიდ ხანს გრძელდება, მით უფრო გრძელი და კარგია სადღეგრძელოებიც. მთავარი ინგრედიენტი დროა, ამიტომ ადრე დაიწყე ქეიფიც და ინვესტიციაც.",
  },
  {
    conceptKey: "inflation",
    emoji: "🛏️",
    titleEn: "Keeping money undet mattress always loses money",
    titleKa: "ფულის ლეიბის ქვეშ დება ყოველთვის წაგაგებინებს ფულს",
    bodyEn:
      "Grandma's savings under the mattress? The mattress won. Inflation quietly eats cash every year: at 3% a year, money loses about half its value in 23 years.",
    bodyKa:
      "როგორც 90-იანების ქართველი პიანინოში ინახავ ქეშს? ჩათვალე პიანინო ფულს გიჭამს. ინფლაცია ყოველწლიურად ჩუმად ჭამს ნაღდ ფულს: წელიწადში 3% ინგლაციით შენი ფული დაახლოებით 23 წელიწადში ღირებულების ნახევარს კარგავს. ანუ თუ 1000 ლარს ინახავ პიანინოს ქვეშ 23 წლის განმავლობაში ინვესტირების გარეშე, 23 წლის შემდეგ 3% წლიური ინფლაციით შენს 1000 ლარს მხოლოდ ნახევარი ძალაღა ექნება!",
  },
];

for (const toast of STARTER_TOASTS) {
  await prisma.toast.upsert({
    where: { conceptKey: toast.conceptKey },
    update: {},
    create: toast,
  });
}

console.log(`🍷 ${STARTER_TOASTS.length} starter toasts in place. Gaumarjos!`);
await prisma.$disconnect();
