(function(root){const data={
  "version": "V2-questionnaire-review-04",
  "prototypeVersion": "github-pilot-01",
  "dimensions": [
    "Strategy & Governance",
    "Deliverability & Infrastructure",
    "Customer Experience & Psychology",
    "Testing & Learning",
    "Personalisation & Lifecycle"
  ],
  "levels": [
    "Ad Hoc",
    "Foundational",
    "Strategic",
    "Optimised",
    "Innovative"
  ],
  "context": [
    {
      "id": "C1",
      "stem": "What is your main responsibility for this email programme?",
      "helper": "Choose the closest description of your work on the programme, rather than your job title.",
      "options": [
        "Programme strategy, planning, or overall performance.",
        "Content, copy, design, or customer experience.",
        "Campaign delivery, segmentation, or automation.",
        "Deliverability, data, integrations, or technical setup.",
        "Several of these — I work across the programme.",
        "Advising or supporting the programme as an agency or consultant.",
        "Another responsibility.",
        "I’m not directly involved in running the programme."
      ]
    },
    {
      "id": "C2",
      "stem": "Which best describes your ability to make changes to this programme?",
      "helper": "Think about changes beyond an individual campaign, such as priorities, processes, or systems.",
      "options": [
        "I can approve priorities and resources and arrange for changes to happen.",
        "I can make changes within my area; wider changes need agreement or approval.",
        "I can lead proposals, but other people decide whether changes happen.",
        "I can suggest improvements, but have limited influence over decisions or delivery.",
        "I advise an external client, who decides what changes happen.",
        "I’m not sure / this varies too much to choose."
      ]
    },
    {
      "id": "C3",
      "stem": "What is the primary business model of the organisation this programme serves?",
      "helper": "If it serves several activities, choose the closest match for this programme.",
      "options": [
        "Ecommerce or retail.",
        "Business-to-business products or services.",
        "Software, subscription, or membership services.",
        "Consumer services, travel, or hospitality.",
        "Publishing, media, or content.",
        "Charity, education, public service, or another non-commercial organisation.",
        "A mixed model / another business model.",
        "I’m not sure."
      ]
    }
  ],
  "questions": [
    {
      "id": "Q1",
      "title": "Programme priorities",
      "stem": "What determines the priorities for your email programme?",
      "helper": "Think about what guides decisions about what email should achieve.",
      "options": [
        "We mainly follow the sending calendar or respond to requests, without a written programme strategy.",
        "We have a basic plan, but priorities mainly concern sending activity and email engagement measures.",
        "We use a written strategy linked to business objectives and customer needs to decide programme priorities.",
        "We regularly review the strategy against customer and business outcomes, adjust priorities, and assess new tools or approaches according to strategic need.",
        "Evidence and insight from the email programme influence wider business decisions, and the strategy adapts proactively to emerging customer and commercial needs.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 0
    },
    {
      "id": "Q2",
      "title": "Accountability",
      "stem": "How is responsibility for the email programme’s performance and improvement assigned?",
      "helper": "Include responsibility held by colleagues, agencies, or providers. If one person runs the programme, consider how they plan, review, obtain decisions, and arrange any support they need.",
      "options": [
        "People handle individual sends, but nobody has clear responsibility for programme performance or improvement.",
        "Someone coordinates delivery, but decision-making and responsibility for improvement across the programme remain unclear.",
        "Ownership, decision responsibilities, and contributor roles are clear, and progress is regularly reviewed against shared objectives.",
        "Reviews lead us to address gaps in skills, capacity, responsibilities, or handovers that are limiting programme performance.",
        "We anticipate how the programme’s capability needs will change and adapt responsibilities, skills, and resources before they become constraints.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 0
    },
    {
      "id": "Q3",
      "title": "Review to action",
      "stem": "What happens after a review or audit identifies something that needs improving?",
      "helper": "Think about programme reviews involving strategy, skills, processes, systems, or performance. Individual test learning is covered separately.",
      "options": [
        "We rarely review the programme systematically; problems are addressed mainly when something goes wrong.",
        "We carry out occasional checks and fix immediate problems, but wider findings are not consistently tracked through to completion.",
        "We use a structured review or audit, and findings become prioritised actions with owners and follow-up dates.",
        "We track whether completed actions improve the intended outcomes and revisit the underlying issue when they do not.",
        "We use reviews to anticipate emerging risks and opportunities and develop new programme approaches before existing practices become limiting.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 0
    },
    {
      "id": "Q4",
      "title": "Permission",
      "stem": "How is permission to receive your marketing emails established and recorded?",
      "helper": "Think about how every acquisition source is checked, what the person was told, and how their choices are recorded.",
      "options": [
        "We use purchased, rented, scraped, or shared addresses without checking permission for the intended marketing emails, or we lack a consistent permission process or record.",
        "We use a defined subscription process for our main signup routes, but records or checks vary across other acquisition sources.",
        "We check every acquisition route and retain records that explain what the person agreed to receive and why the address is eligible for the intended marketing emails.",
        "We regularly review acquisition sources, permission wording, and subscription records, addressing gaps before addresses enter ongoing sending.",
        "Permission and preference experiences are designed around informed customer choice, with traceable controls that remain reliable as sources, preferences, and systems change.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 1
    },
    {
      "id": "Q5",
      "title": "Sending eligibility and list hygiene",
      "stem": "How do you decide which addresses should continue receiving marketing emails?",
      "helper": "Include unsubscribes, invalid addresses, complaints, inactivity, and any other eligibility or risk signals relevant to the programme.",
      "options": [
        "We do not have a reliable process for identifying and excluding addresses that should no longer receive marketing emails.",
        "We suppress unsubscribes, complaints, and invalid addresses, but other eligibility and list-health checks are irregular.",
        "We follow a documented process for sending exclusions and regularly review relevant activity, address quality, and risk signals before deciding what to do.",
        "We combine several relevant signals to adjust frequency, pause sending, or exclude addresses, rather than treating every inactive or non-opening subscriber in the same way.",
        "We continuously evaluate and refine our eligibility rules using customer, deliverability, and performance evidence, so they adapt as behaviour, data sources, and sending patterns change.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 1
    },
    {
      "id": "Q6",
      "title": "Technical stewardship",
      "stem": "How is your technical email-sending setup checked and maintained?",
      "helper": "Include checks carried out by a technical team or provider. You do not need to configure the setup personally.",
      "options": [
        "We have not established a working authenticated sending setup, or known technical problems remain unresolved.",
        "Authentication and sending configuration have been checked, but they are not routinely rechecked after changes or on a planned schedule.",
        "We check authentication and sending configuration on a planned schedule and after changes, and resolve identified problems.",
        "Before changing domains, platforms, data flows, or sending volumes, we assess the risks, plan the rollout, and verify the setup afterwards.",
        "We test and plan for scale, continuity, and recovery, using evidence from changes or incidents to strengthen the infrastructure as the programme evolves.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 1
    },
    {
      "id": "Q7",
      "title": "Inbox visibility",
      "stem": "How do you monitor whether your emails are reaching inboxes?",
      "helper": "Think about inbox visibility rather than assuming that a successful delivery or recorded open proves inbox placement.",
      "options": [
        "We do not specifically monitor inbox placement; we mainly assume that sent or delivered emails reached the inbox.",
        "We check basic delivery reports or investigate when somebody reports a problem, without regular inbox-placement monitoring.",
        "We regularly review inbox-placement and sender-reputation signals and use them to investigate problems and inform sending decisions.",
        "We combine placement, reputation, and relevant engagement trends to identify likely problems early and adjust sending before they worsen.",
        "Inbox placement is a programme KPI, and we continually improve how we anticipate and prevent problems using provider-level evidence and the measured effects of previous interventions.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 1
    },
    {
      "id": "Q8",
      "title": "Customer understanding",
      "stem": "What do you use to understand customers’ needs, motivations, and hesitations?",
      "helper": "Think about the evidence behind your understanding, rather than how much customer data you hold.",
      "options": [
        "We mainly rely on what we believe customers want, without checking those assumptions against customer evidence.",
        "We pick up useful comments or behaviours, but do not bring them together into a clear picture of customer needs.",
        "We record needs and common questions at relevant journey stages, using feedback, behaviour, or research to understand how customers decide.",
        "We regularly refresh those insights and use differences in motivations, reassurance needs, and hesitations to guide the customer experience.",
        "We identify emerging or unmet needs and use the evidence to develop new email experiences, then evaluate whether they create meaningful customer value.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 2
    },
    {
      "id": "Q9",
      "title": "Copy",
      "stem": "How do you decide what to say in an email to help the reader take the next step?",
      "helper": "Think about the message, the reader’s situation, and the reasons or reassurance they may need — rather than the layout.",
      "options": [
        "We start with what we want to promote or announce and write the message around that.",
        "We include customer benefits, but the product, promotion, or announcement still determines most of the message.",
        "Before writing, we identify the reader’s need at that journey stage; the email explains the relevant value and gives them a clear next step.",
        "We consistently use customer insight to shape the appeal, supporting information, and reassurance for different ways readers process information and make decisions.",
        "We develop distinctive messaging approaches from customer evidence and continually refine how they build trust, support informed decisions, and create value over time.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 2
    },
    {
      "id": "Q10",
      "title": "Design",
      "stem": "What guides the layout and visual structure of an email?",
      "helper": "Think about what readers notice first, how they move through the information, and how easily they can find the next step.",
      "options": [
        "We mainly fit content into our usual template without deliberately planning the reader’s route through it.",
        "We check that the email looks on-brand and is readable, but the template usually determines the order and prominence of the information.",
        "We arrange the content around what the reader needs to understand first and make the intended next step clear.",
        "We consistently structure emails for different decision needs, allowing readers to grasp the value quickly or explore supporting detail before acting.",
        "We use customer evidence to develop and refine new design approaches that improve understanding, decision-making, and the value of the email experience.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 2
    },
    {
      "id": "Q11",
      "title": "Accessibility",
      "stem": "How is accessibility built into the creation and checking of your emails?",
      "helper": "Think about whether people with different access needs can understand, navigate, and use the email.",
      "options": [
        "We do not carry out specific accessibility checks or deliberately account for different access needs.",
        "We check some basic accessibility features, but the checks vary between emails or depend on who prepares them.",
        "We use defined accessibility standards or a checklist during production and before sending, and address the issues identified.",
        "Accessibility is built into our templates, briefs, and quality checks; we use assistive-technology checks where appropriate and correct recurring barriers at their source.",
        "We use feedback from people with different access needs to uncover barriers that routine checks miss and develop improved approaches that are used across the programme.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 2
    },
    {
      "id": "Q12",
      "title": "Test selection",
      "stem": "How do you decide which ideas to test?",
      "helper": "Include tests of copy, design, audiences, timing, or journeys. Using AI to generate variants is not, by itself, evidence of testing maturity.",
      "options": [
        "We do not run planned comparisons; choices are mainly based on preference, convention, or gut feel.",
        "We run basic comparisons, such as subject lines or send times, usually without a written reason for why one approach is expected to perform differently.",
        "We select tests using a written hypothesis linked to a customer question and a programme or business objective.",
        "We prioritise a connected testing plan, using earlier findings and important gaps in understanding to decide which hypotheses should be tested next.",
        "We identify emerging strategic questions and develop appropriate new ways to investigate them when established testing approaches are not sufficient.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 3
    },
    {
      "id": "Q13",
      "title": "Meaningful evaluation",
      "stem": "How do you decide whether a test has produced a worthwhile and usable result?",
      "helper": "Think about the intended outcome, the reliability of the comparison, and what the evidence can reasonably establish.",
      "options": [
        "We do not use a planned comparison to judge outcomes; we mainly choose what looks better or rely on general campaign results.",
        "We compare basic email measures and choose the higher result, without consistently checking whether the difference is meaningful or supports a conclusion.",
        "We define the intended outcome before testing and assess whether the comparison supports a conclusion, including when the result is inconclusive.",
        "We assess relevant customer or business outcomes, check the reliability of the result, and consider possible side effects before changing practice.",
        "We combine evidence across tests and relevant customer or business data to answer more complex questions, while being explicit about uncertainty and what the evidence cannot prove.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 3
    },
    {
      "id": "Q14",
      "title": "Compounding learning",
      "stem": "What happens to what you learn from a test?",
      "helper": "Include useful findings when there is no clear winner.",
      "options": [
        "We do not keep a record of test findings or use them systematically in later work.",
        "We sometimes record winners, but the findings are difficult to find or rarely influence later decisions.",
        "We record the hypothesis, result, limitations, and learning, and use those findings to guide subsequent campaigns or programme decisions.",
        "We connect findings across tests in an accessible evidence base, allowing accumulated learning to shape creative work, strategy, and wider marketing decisions.",
        "We actively revisit whether earlier learning still holds and use accumulated evidence to create, refine, or retire methods as customers and conditions change.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 3
    },
    {
      "id": "Q15",
      "title": "Audience relevance",
      "stem": "How do you decide which customers should receive which messages?",
      "helper": "Think about useful audience differences rather than how many segments, tools, or personalisation features you have.",
      "options": [
        "We usually send the same message to everyone; personalisation is mainly names or other basic merge fields.",
        "We use a few basic groups, such as engagement level, for some messages, but most audience decisions remain broad.",
        "We use behaviour, relationship stage, relevant preferences, and customer decision needs to match audiences with messages.",
        "We use those signals consistently across the lifecycle to select relevant audiences and adapt content at scale.",
        "We anticipate likely next needs using relevant evidence, continually evaluating and adapting audience and content decisions as customer behaviour changes.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 4
    },
    {
      "id": "Q16",
      "title": "Lifecycle support",
      "stem": "How do you support customers at important stages of their relationship with you?",
      "helper": "Use stages relevant to your organisation, such as joining, choosing, getting started, using, renewing, returning, or becoming inactive.",
      "options": [
        "We mainly send scheduled campaigns, with little communication tailored to the customer’s relationship stage.",
        "We have basic triggered messages at a few stages, such as joining, getting started, returning, purchasing, or renewing.",
        "We have purposeful, multi-step journeys for important relationship stages, using customer behaviour to guide appropriate next messages.",
        "Across the main relationship stages, journeys adapt their content, timing, and next steps to relevant customer signals rather than following identical fixed sequences.",
        "Journeys adapt as customers move forwards, pause, change direction, or re-enter, and we use evidence to anticipate new support needs and continually reshape the lifecycle experience.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 4
    },
    {
      "id": "Q17",
      "title": "Communication coordination",
      "stem": "How are the different communications a customer receives coordinated?",
      "helper": "Include marketing, service, sales, and lifecycle emails, plus other channels where they are relevant to the customer experience.",
      "options": [
        "Different communications are planned separately, with little visibility of what else the customer may receive.",
        "We share calendars or check manually to avoid obvious clashes, duplication, or inappropriate timing.",
        "We use shared plans and relevant customer information to coordinate marketing, service, sales, and lifecycle communications at important relationship stages.",
        "Connected data and systems coordinate the timing and content of relevant communications across email and other channels, adjusting them in response to customer behaviour.",
        "Communications are orchestrated across all relevant touchpoints and adapt to the customer’s current behaviour and context, with evidence used to improve the overall experience.",
        "I don’t know / I don’t have visibility of this."
      ],
      "dimension": 4
    }
  ],
  "actions": [
 ['Draft the programme objective and propose an owner for one identified gap.','Turn review findings into prioritised actions with follow-up dates.'],
 ['Ask the sending owner or provider to check the flagged permission, list-health, setup or inbox-visibility practice.','Establish repeatable checks and a process for correcting identified problems.'],
 ['Review one email against a real customer need, its message, reading order and accessibility checks.','Include those checks in the creative brief and production process.'],
 ['Write one hypothesis and intended outcome before the next comparison.','Keep an accessible record of results, limitations and what changed because of them.'],
 ['Map one important relationship stage and identify a missing or conflicting communication.','Coordinate the relevant messages using appropriate customer signals.']
],
  "obstacles": [
    "We need more knowledge or practical skills in this area.",
    "We do not have enough time or people to work on it.",
    "Our data, systems, or integrations make it difficult.",
    "We need budget to make the changes.",
    "We need approval or support from other people or teams.",
    "We are not clear about what to prioritise or how to begin.",
    "This is not a priority for us right now.",
    "Something else / several things are involved.",
    "I’m not sure yet."
  ]
};if(typeof module!=="undefined" && module.exports)module.exports=data;else root.HEA_DATA=data;})(typeof window!=="undefined"?window:globalThis);
