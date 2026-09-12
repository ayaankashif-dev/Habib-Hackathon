import type { DemoScenario } from "./types";

export const demoScenarios: DemoScenario[] = [
  {
    id: "emergency",
    labelKey: "scenarioEmergency",
    inputType: "text",
    text:
      "Beta, main Usman bol raha hoon. Phone kharab hai, yeh naya number hai. " +
      "Jaldi Rs. 50,000 Easypaisa par bhej do, bohat zaroori kaam hai. " +
      "Kisi ko batana mat, baad mein khud baat karunga.",
  },
  {
    id: "job",
    labelKey: "scenarioJob",
    inputType: "text",
    text:
      "Congratulations! Aap ko Head Office se online job offer mila hai, salary Rs. 80,000/month. " +
      "Registration fee Rs. 2,500 abhi jama karayen is account number par taake seat confirm ho. " +
      "Offer sirf aaj tak valid hai, jaldi karein.",
  },
  {
    id: "bank",
    labelKey: "scenarioBank",
    inputType: "text",
    text:
      "Dear customer, your bank account will be suspended today. " +
      "Verify your account immediately by sharing the OTP code sent to your phone, " +
      "or click this link: http://bank-verify-secure.com/login",
  },
];
