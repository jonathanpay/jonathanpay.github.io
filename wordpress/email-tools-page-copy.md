# hypothesis

## About the A/B test hypothesis builder

An A/B test usually starts as an idea: try a new subject line, or add a discount. An idea tells you what to change. A hypothesis also says what you expect to happen, by how much, and why, and that is what lets you say afterwards whether you were right.

In Holistic Testing, a test has two jobs. One is to find the version that does better in this send. The other is to learn something about your audience that you can use again, in the next email and beyond it.

Only a hypothesis gives you the second.

The builder asks five questions: where the email sits in your programme, what problem you want to fix, what you'll change, which metric you expect to move (and by how much), and why you believe it will. If the "why" is the hard part, it offers psychology levers such as loss aversion or social proof as a place to start. You get a hypothesis to copy, a row for your test planner, and a few quick checks on what you've written, and it hands your baseline and smallest meaningful change to the [A/B Test Duration Calculator](/email-tools/ab-duration/).

## Frequently asked questions

### What is Holistic Testing?

Holistic Testing is the hypothesis-led approach to email testing that Kath Pay developed with clients and has spoken about since 2016. Ordinary A/B testing asks which version won. Holistic Testing asks that too, and why, so every test leaves you knowing more about what motivates your customers. Your email list is your target market, which makes email a quick and inexpensive way to ask it.

### Where should a test idea come from?

From a problem your programme or business is struggling with, such as customers who buy once and never come back. That problem becomes the objective of the test, and the hypothesis is your best answer to it. This is what makes Holistic Testing hypothesis-led rather than factor-led: you write the hypothesis first, then choose the factor or factors (subject line, copy, offer, frequency, and so on) that put it to the test.

### What makes a good A/B test hypothesis?

It follows the pattern "I think that by making this change, it will cause this effect, because…". So it names the change, the outcome you expect on your success metric, and the reason. Here's an example from Kath's testing cheat sheet: loss aversion copy is a stronger motivator towards conversions than benefit-led copy, because people hate losing out more than they enjoy benefiting. The builder also asks for the smallest change that would matter. That tells you in advance what counts as a meaningful result, and lets the Duration Calculator work out how big a sample you need.

### Why does the "because" matter so much?

Without it, a test tells you which version won and nothing more. With it, the result answers a question about your audience. If the variant wins, you have evidence that the reason holds. If it loses, you've learned that it doesn't, or not for this audience, which is as useful when you plan the next test.

### Can I change more than one thing in a test?

Yes, if every change serves the same hypothesis. If you think loss aversion will motivate your audience more than benefits, the subject line, the body copy, and the call to action can all switch to loss-aversion wording. You won't know which element made the difference, and you don't need to, because the test is of the idea. Mixing changes that test different ideas, such as a new offer and a new layout, is what to avoid: test one hypothesis at a time. The builder flags a change that looks like several, as a prompt to check they all serve one idea.

### Which metric should decide the test?

The one that answers your objective. If the problem is customers who never buy again, the success metric is repeat purchases or conversions, even though clicks are easier to see. The builder suggests metrics that fit the objective you chose. You can pick open rate, but it will warn you that Apple Mail Privacy Protection can record an open when nobody read the email.

### How do I run the test fairly?

Send both versions at the same time, and choose a sample size large enough for the result to reach statistical confidence. When the aim is to validate a hypothesis and learn from it, use a 50/50 split. A 10/10/80 split, where two small groups pick a winner for the rest of the list, suits a campaign that only needs the best send today; its samples are often too small to give you a reliable read on your audience. The [A/B Test Duration Calculator](/email-tools/ab-duration/) works out how many emails each version needs and how long that takes. When the test ends, check the result is statistically significant in the [Statistical Significance Calculator](/email-tools/sscc/) before you call a winner.

### My test proved the hypothesis. Is that enough?

Not yet. One result can be a fluke of that particular send. Repeat the test with different sends or segments, and treat the finding as reliable once it keeps holding up.

### What should I record about each test?

Three things, in your test plan: the conclusion (was the hypothesis true or false?), your findings (why you think it turned out that way), and a recommendation for what to do next. Kept together, they let each test build on the last, and the learning stays with the business when the person who ran the test moves on.

### What do I do with what I've learned?

Use it beyond the email you tested. Kath's cheat sheet gives the example of first-time buyers who respond to free shipping with no minimum spend, and loyal customers who prefer VIP access and exclusive offers. Findings like that belong in your website copy, search keywords, PPC and landing pages, and remarketing ads, and they shape the next round of hypotheses.

### What does "relative" mean for the smallest change?

It's a percentage of the current rate, not percentage points. A relative 10% lift on a 3% click rate takes it to 3.3%, not 13%.

### Is it free?

Yes. There's no sign-up, and the builder doesn't store what you type.

# ab-duration

## About the A/B test duration calculator

A common way to ruin an A/B test is to stop it early because the numbers look good. This calculator works out, before you start, how many emails each variant needs and how many days that will take at your sending volume.

Enter your current rate for the metric you're testing, the smallest relative improvement worth detecting, and how many emails each variant gets per day. The calculator returns the emails needed per variant and the number of days to run, plus a table of the improvement you could detect if you ran the test for a shorter or longer time.

It uses a two-sided, two-proportion z-test at 95% confidence and 80% power, with an even split between the two variants. Other calculators make different assumptions, so their numbers won't always match.

## Frequently asked questions

### Why do I need to decide the duration before the test starts?

Results often swing about in the first days of a test. If you check every morning and stop the first time one variant is ahead, you'll often be acting on noise.

### What is a minimum meaningful improvement?

The smallest lift that would make the change worth rolling out, as a percentage of your current rate. The smaller it is, the more emails you need to detect it, which is why small lists often can't detect small improvements.

### Why a 50/50 split?

An even split gives the test the most statistical power for the emails you send. Structures like 10/10/80, where a small test sends first and the winner goes to the rest, favour speed over reliability.

### What if the calculator says my test needs more than a year?

Then the test as planned isn't practical for your volume. Test a bolder change with a bigger expected effect, or choose a metric with a higher baseline rate. Pooling sends across several campaigns can help too.

### What do I do when the test has finished?

Put the results into the [Statistical Significance Calculator](/email-tools/sscc/). A significant result is a signal to check, ideally by repeating the test with a different segment or send, before you roll the change out everywhere.

# sscc

## About the statistical significance calculator

When an A/B test finishes, one variant nearly always comes out ahead. The question is whether that lead could easily be chance. This calculator answers that for email tests where both variants went to the same number of people.

Enter the sample size per variant and the rate each variant achieved on the metric you chose before the test began. The calculator tells you whether the difference is significant at the 99% level, at the 95% level, or not yet significant. Significant means a gap this large would be unlikely if the two variants really performed the same.

It uses a two-sided, two-proportion z-test with a pooled rate, the standard approach for comparing two rates such as click rate or conversion rate.

## Frequently asked questions

### What does 95% confidence mean?

That a difference this large would be unlikely to appear by chance if the two variants really performed the same. It doesn't tell you how big the true difference is, and about one test in twenty will look significant at 95% when nothing has changed.

### My result isn't significant. Was the test a failure?

Not necessarily. First check that the test reached the sample size you planned. A test stopped short of it is underpowered, so a real difference can go undetected. If it did run its course, the real difference may be smaller than the test was designed to detect. The [A/B Test Duration Calculator](/email-tools/ab-duration/) shows what a longer run would let you detect.

### Can I change the metric after I've seen the results?

No. Switching to whichever metric happens to look best invalidates the test. Use the metric you set out to move in your hypothesis.

### Should I roll out a significant winner straight away?

Confirm it first, ideally by repeating the test with a different segment or send occasion.

# wewe

## About the We-We Calculator

It's easy for business email to drift towards talking about the business: what we've launched, and what our team has been up to. The calculator counts the brand-focused pronouns in your copy (we, us, our, I, me, my, and their variants) against the customer-focused ones (you, your, and yours) and shows the split as two percentages. If the balance tips heavily towards the brand, it suggests where to bring the reader back to the centre.

## Frequently asked questions

### What is a good we-we score?

There's no fixed target, and a welcome email from a founder will naturally use more "I" than a product update. The calculator offers a tip once more than 60% of the pronouns are about the brand; past three-quarters, the copy is usually worth another look.

### Why does "I" count as brand-focused?

Because the "I" in marketing email is usually the sender. It does mean conversational copy can score more brand-focused than it reads, so treat the result as a direction to look in rather than a precise measure.

### Does this replace reading the email myself?

No. The pronouns are a quick signal. An email can be full of "you" and still be about the brand, so read it as the customer would once you've checked the balance.

### Is my copy stored anywhere?

No. The calculator runs in your browser and doesn't save what you paste.

# ers

## About the email readability score

Paste your copy and the tool scores it with three established readability formulas. Flesch Reading Ease gives a score out of 100, where higher is easier. Gunning Fog and the SMOG Index each estimate the US school grade needed to read the text; add five to get a UK reading age. You also get suggestions when the tool spots sentences longer than 20 words, a lot of long words, or repeated passive voice.

The tool treats headings, bullet points, and buttons as separate lines rather than merging them into one long sentence, which otherwise makes email copy look harder to read than it is.

## Frequently asked questions

### What readability score should my emails aim for?

For a broad consumer audience, aim for a Flesch Reading Ease score of 60 or more and a Gunning Fog or SMOG grade of 8 or below. That's a reading age of about 13.

### Is harder-to-read copy always a problem?

No. Some professional and technical readers are comfortable with more complex language, and some subjects can't be made simple without losing accuracy. Use the scores as a starting point and judge them against the people you're writing for.

### Why do the three formulas give different answers?

They measure slightly different things. Flesch weighs sentence length and syllables per word, Gunning Fog counts words of three or more syllables alongside sentence length, and SMOG concentrates on those long words.

### Is my copy stored anywhere?

No. The scoring runs in your browser and nothing you paste is saved.

# f2b

## About the feature-to-benefit converter

A feature is what something does. A benefit is what that means for the person reading. "Automated reporting" is a feature; not spending Friday afternoons building spreadsheets is the benefit.

Type a product or service feature and, if you like, choose your industry. The converter works out what kind of feature it is and writes a customer benefit statement from a library of 384 templates across eight industries. Ask for another variation if the first doesn't fit.

## Frequently asked questions

### Can I use the benefit statement as it is?

Treat it as a first draft. The templates give you the angle; your product and audience should shape the final wording.

### Which industries does it cover?

E-commerce and retail, SaaS and technology, professional services and B2B, financial services, healthcare and wellbeing, education and training, and non-profit and charity, plus a general set for anything else.

### What if it doesn't recognise my feature?

It tells you, and gives you an ease-of-use angle instead. Adding a word about what the feature does, such as "saves time" or "keeps data safe", gives a closer match.

### Is it free?

Yes. There's no sign-up, and it runs in your browser without saving what you type.

# tone

## About the email tone analyser

Every email has a tone, whether you chose it or not. The analyser shows which tones your copy is giving off, so you can check it matches what you meant.

Paste your copy and it measures five tones: friendly, persuasive, professional, urgent, and empathetic. You'll see the dominant tone, a breakdown across all five, and phrases for strengthening each one. Choose the email type (welcome, nurture, promotional, re-engagement, or transactional) and the guidance is tailored to it.

## Frequently asked questions

### How does it detect tone?

It looks for words and phrases associated with each tone. It matches whole words, so "know" isn't counted as "now". A tone has to appear often enough, relative to the length of the copy, before it's called dominant.

### Why does it say no single tone stands out?

Either the copy mixes tones, or there isn't enough signal to call it. Short samples and long pieces of over 900 words don't give a reliable reading, so the tool says so instead of guessing.

### What tone should my email have?

It depends on the email. A transactional email should be clear and professional, while a re-engagement email may need more empathy.

### Is my copy stored anywhere?

No. The analysis runs in your browser and nothing you paste is saved.

# persona

## About the buyer persona matcher

Some buyers want results and want them fast, some act on excitement, some need to feel a connection with the people behind the product, and some want every detail before they commit. Paste your copy to check which of them it speaks to.

The matcher scores it against four buyer types: Competitive, Spontaneous, Humanistic, and Methodical. You'll see the strongest match, a breakdown across all four, and phrase suggestions for each type, so you can add what's missing.

## Frequently asked questions

### What are the four buyer types?

Competitive buyers are direct and results-focused, and respond to specific outcomes and speed. Spontaneous buyers decide on feeling, and respond to excitement and novelty. Humanistic buyers are led by relationships, and respond to warmth and personal stories. Methodical buyers want data, a clear process, proof, and less risk.

### Should every email speak to all four?

Not necessarily. A short promotional email can lean towards spontaneous buyers. But if a whole programme only speaks to one type, the other three types are left out.

### How much copy do I need to paste?

At least a full paragraph. Short samples can skew the scores, and the tool will tell you when there isn't enough signal for a clear match.

### Is my copy stored anywhere?

No. The matcher runs in your browser and doesn't save what you paste.

# emotional-appeal

## About the emotional appeal analyser

This tool shows which emotional triggers your copy uses, so you can check they're the ones you intended.

Paste your copy and it looks for six appeals: fear, hope, curiosity, pride, trust, and belonging. You'll see the dominant appeal, a breakdown across all six, and guidance on when each appeal works and when to be careful with it.

## Frequently asked questions

### Is it wrong to use fear in marketing email?

Not in itself. Pointing out a real risk the reader faces can be useful and honest. It turns into a problem when the fear is exaggerated or invented to force a decision.

### Which emotional appeal works best?

It depends on the reader and the moment. Trust and belonging tend to suit long-term relationships, and curiosity tends to suit subject lines and teasers.

### Why doesn't it pick a dominant appeal?

Either the copy mixes several appeals evenly, or there isn't enough signal. Short samples and long pieces of over 900 words don't give a reliable reading, so the tool says so instead of guessing.

### Is my copy stored anywhere?

No. It runs in your browser and nothing you paste is saved.

# personalisation

## About the personalisation and dynamic content checker

"Hi {{ first_name }}" works well right up until it reaches a contact with no first name, and then it says "Hi ," to them. Fallback values are the fix, and they're easy to forget, especially in a long email with tokens in several places.

Choose your email platform and paste your email code or copy. The checker finds every personalisation token and tells you whether each use has a fallback for missing data. On platforms that use conditional blocks, it also checks that they open and close in matching numbers. It knows the token syntax of 16 platforms, from Klaviyo, Mailchimp, and Kit to HubSpot, Marketo, and Salesforce Marketing Cloud.

## Frequently asked questions

### What is a fallback value?

The text that appears when a contact's field is empty. With a fallback of "there", "Hi {{ first_name }}" becomes "Hi there" for anyone without a first name, instead of "Hi ,".

### Why does it check every use of a token?

Because a fallback on the first use doesn't cover the others. A greeting with a fallback can hide a bare token further down the email, and that's the one that breaks.

### My platform doesn't support inline fallbacks. What then?

Some platforms set default values in the platform itself rather than in the code of the email. The checker tells you when that's the case, so you know to check the default there.

### Does it check scripting languages such as AMPscript or Liquid logic?

Only partly. It checks tokens and whether conditional blocks balance. Where a platform sets fallbacks in scripting, as Salesforce Marketing Cloud does, the checker says so, and you'll need to review that logic by hand.

### Is my email stored anywhere?

No. The checker runs in your browser and doesn't save what you paste.

# accessibility

## About the email accessibility checker

Some of your subscribers read with a screen reader or zoom in to read small text. Larger text and clear contrast also help anyone reading on a phone in bright light.

Paste your email's HTML and the checker reviews it for common problems: images without alt text, links with vague text such as "click here", text smaller than 12px, colour contrast below WCAG AA, and headings that skip levels. For a full HTML document it also checks for a language attribute. Each finding is graded, so you can fix the serious ones first.

## Frequently asked questions

### What contrast does an email need?

WCAG AA asks for a contrast ratio of at least 4.5:1 for body text and 3:1 for large text, which is 24px, or about 18.7px if it's bold. The checker measures each styled block of text against its nearest background colour.

### Do decorative images need alt text?

They need an empty alt attribute, `alt=""`, so screen readers skip them. Leaving alt out entirely often makes a screen reader read out the image's file name instead.

### Why doesn't it pick up my stylesheet?

Most email HTML sets styles inline, and that's what the checker reads. Styles in a style block or an external stylesheet aren't applied, so check text sizes and colours set there separately.

### Does passing mean my email is fully accessible?

No. Automated checks catch common problems, but they can't judge whether alt text is helpful or whether the email makes sense read aloud. Test with a screen reader too, if you can.

### Is my HTML stored anywhere?

No. The checker runs in your browser and nothing you paste is saved.

# curve

## About the CURVE subject line builder

The subject line is the first thing a subscriber sees, and often the only thing before they decide whether to open. CURVE is the Academy's framework for writing them: Curiosity, Urgency, Relevance, Value, and Emotion. Type a subject line and the builder checks it for all five, shows how many it covers, and gives a concrete suggestion for adding the weakest.

## Frequently asked questions

### What does each CURVE element mean?

Curiosity opens a question the reader wants answered. Urgency gives a reason to act now. Relevance speaks to the reader directly, with "you" or a personalisation token. Value promises a concrete payoff, such as a number or a benefit. Emotion uses a word that makes the reader feel something rather than just informing them.

### Does a subject line need all five?

No, and forcing all five into a few words can read awkwardly. Use the breakdown to see which element is missing and decide whether adding it would help this email.

### How does it score a subject line?

It looks for words and patterns linked to each element: a question mark or an open loop for curiosity, deadlines and time limits for urgency, "you" or a personalisation token for relevance, numbers and prices for value, and feeling-words for emotion.

### Where can I learn more about CURVE?

CURVE is taught in The Buyer's Mind, one of the [Holistic Email Academy courses](/courses/).

# dmarc-checker

## About the DMARC checker

The checker reads your domain's live SPF, DKIM, and DMARC records, shows what each one allows, and flags anything missing or misconfigured with the fix. It's free, needs no sign-up, and never asks for access to your mailbox or email platform.

The lookups go through Google Public DNS. Only your domain, and any DKIM selector you enter, are looked up; nothing else you type leaves your browser.
