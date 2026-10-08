// Wording for the A/B Test Hypothesis Builder.
//
// DRAFT: the lever wording and example problems below are for Kath to review,
// and the Apple Mail Privacy Protection note needs a fact-check before it is
// treated as final. Nothing here is calculated, so it can be edited freely.

export const PROGRAMMES = [
  {
    id: "welcome",
    label: "Welcome series",
    problems: [
      "New subscribers open the first email but don't click through",
      "Few new subscribers make a first purchase in their first 30 days",
      "Emails after the first in the welcome series get little engagement",
    ],
  },
  {
    id: "promotional",
    label: "Promotional emails",
    problems: [
      "Promotional emails get opened but the click rate is low",
      "Discounts are costing margin without lifting conversion",
      "Engagement drops after the first promotion in a week",
    ],
  },
  {
    id: "abandoned",
    label: "Abandoned basket",
    problems: [
      "Abandoned basket emails get clicked but few people complete the purchase",
      "The first reminder arrives too late to catch people",
      "Most recovered baskets come from the last email in the series",
    ],
  },
  {
    id: "post-purchase",
    label: "Post-purchase",
    problems: [
      "Few customers come back for a second purchase",
      "Review requests get opened but few reviews are left",
      "Delivery emails don't answer the questions people then send to support",
    ],
  },
  {
    id: "winback",
    label: "Win-back or re-engagement",
    problems: [
      "Lapsed subscribers rarely react to win-back emails",
      "Win-back offers discount people who would have bought anyway",
      "Unsubscribes spike when we email the inactive segment",
    ],
  },
  {
    id: "newsletter",
    label: "Newsletter or content",
    problems: [
      "The click rate on the newsletter is falling",
      "Readers click the first link and nothing below it",
      "Subscribers open the newsletter but rarely click anything",
    ],
  },
  {
    id: "transactional",
    label: "Transactional",
    problems: [
      "Order confirmations are opened but don't drive any further clicks",
      "Customers still contact support for information the email already holds",
    ],
  },
  { id: "other", label: "Something else", problems: [] },
];

export const OBJECTIVES = [
  { id: "engagement", label: "Get more people to click", metrics: ["click-rate", "click-to-open"] },
  { id: "conversion", label: "Get more people to buy or sign up", metrics: ["conversion-rate"] },
  { id: "revenue", label: "Earn more per email sent", metrics: ["revenue-per-email", "conversion-rate"] },
  { id: "list-health", label: "Protect the health of the list", metrics: ["unsubscribe-rate", "complaint-rate"] },
];

export const FACTORS = [
  { id: "subject-line", label: "Subject line" },
  { id: "preheader", label: "Preheader" },
  { id: "body-copy", label: "Body copy" },
  { id: "offer", label: "Offer" },
  { id: "imagery", label: "Imagery" },
  { id: "cta", label: "Call to action" },
  { id: "send-time", label: "Send time" },
  { id: "frequency", label: "Frequency" },
  { id: "layout", label: "Layout" },
  { id: "personalisation", label: "Personalisation" },
];

// `rate: true` means the metric is a percentage the Duration Calculator can take as a baseline.
export const METRICS = [
  { id: "click-rate", label: "Click rate", noun: "click rate", rate: true, defaultDirection: "increase" },
  { id: "click-to-open", label: "Click-to-open rate", noun: "click-to-open rate", rate: true, defaultDirection: "increase" },
  { id: "conversion-rate", label: "Conversion rate", noun: "conversion rate", rate: true, defaultDirection: "increase" },
  { id: "revenue-per-email", label: "Revenue per email", noun: "revenue per email", rate: false, defaultDirection: "increase" },
  { id: "unsubscribe-rate", label: "Unsubscribe rate", noun: "unsubscribe rate", rate: true, defaultDirection: "decrease" },
  { id: "complaint-rate", label: "Spam complaint rate", noun: "spam complaint rate", rate: true, defaultDirection: "decrease" },
  {
    id: "open-rate",
    label: "Open rate",
    noun: "open rate",
    rate: true,
    defaultDirection: "increase",
    warning:
      "Open rate is an unreliable success metric. Apple Mail Privacy Protection can register an open when the person never read the email. Clicks, conversions, or revenue usually map better to your objective.",
  },
];

// Psychology levers offered as starting points for the "because".
// `starter` is the end of the sentence "…because ___".
export const LEVERS = [
  {
    id: "loss-aversion",
    label: "Loss aversion",
    hint: "People feel a possible loss more strongly than an equivalent gain.",
    starter: "people feel a possible loss more strongly than an equivalent gain, so naming what they would miss out on will prompt action",
  },
  {
    id: "social-proof",
    label: "Social proof",
    hint: "When people are unsure, they look at what others like them have done.",
    starter: "people look at what others like them have chosen when they are unsure, so showing that will reduce doubt",
  },
  {
    id: "scarcity",
    label: "Scarcity",
    hint: "Limited things feel more valuable. Only use a limit that is real.",
    starter: "people place more value on things that are limited, so a real limit on time or stock will make acting now feel worthwhile",
  },
  {
    id: "reciprocity",
    label: "Reciprocity",
    hint: "People feel they should return a favour.",
    starter: "people feel they should return a favour, so giving something useful first will make them more willing to act afterwards",
  },
  {
    id: "cognitive-load",
    label: "Cognitive load",
    hint: "Every extra choice or line of text costs the reader effort.",
    starter: "every extra choice or line of text costs the reader effort, so cutting what they have to process will make the next step easier",
  },
  {
    id: "buyer-modality",
    label: "Buyer modality",
    hint: "Readers decide in different ways: Competitive, Spontaneous, Humanistic, or Methodical.",
    starter: "readers decide in different ways, so speaking to the way our main reader decides will land better",
  },
];

export const NO_BECAUSE_WARNING = "Without a because, you'll learn what won, but not why.";
