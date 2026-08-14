// Mock blog post data. Swap for a real API / CMS later.
//
// Same split as recipes.js: the list-summary fields (title, category,
// date, readTime, excerpt — everything PostCard/FeaturedPost render) stay
// separate from `body`, the full post a detail page renders. The card list
// never pays for the full post text it doesn't show.
const posts = [
  {
    id: "post-01",
    slug: "twelve-weeks-of-consistency",
    title: "What twelve weeks of consistency actually looks like",
    category: "Personal growth",
    date: "2026-08-08",
    readTime: "6 min read",
    excerpt:
      "Not a single perfect week. Just a lot of decent ones stacked on top of each other, and one rule I stopped negotiating with myself about.",
    body: [
      "Twelve weeks ago I wrote down a training plan and told myself I'd follow it exactly. I did not follow it exactly. I missed a long run for a work trip, cut a tempo short because my legs were dead from a bad night's sleep, and swapped an easy day for a rest day more than once because \"easy\" and \"actually possible today\" weren't the same thing.",
      "What I did do — the only thing, looking back, that actually mattered — was stop negotiating about whether I'd show up at all. The plan could bend. The distance, the pace, the day of the week, all of that flexed constantly. Whether I ran, in some form, on the days I said I would: that stopped being a discussion I had with myself.",
      "That's a small distinction that took most of the twelve weeks to actually believe. Before, a missed \"perfect\" version of a workout felt like a failure that gave me permission to skip the next one too — one bad day quietly becoming two, then a week. Once showing up was no longer up for debate, a bad day just became a bad day. It didn't get to vote on tomorrow.",
      "So no, there wasn't a single perfect week in here. There was a lot of decent ones, some rough ones, and one rule that didn't move. That turned out to be the entire program.",
    ],
  },
  {
    id: "post-02",
    slug: "the-4am-alarm-isnt-the-hard-part",
    title: "The 4am alarm isn't the hard part",
    category: "Habits",
    date: "2026-08-01",
    readTime: "4 min read",
    excerpt:
      "Everyone asks how I get up early to run. The real answer has nothing to do with willpower and everything to do with the night before.",
    body: [
      "The question I get most is some version of \"how do you actually get up at 4am to run.\" People are usually looking for a willpower trick, a mindset thing, something to say to yourself in the dark. I don't have one. By the time the alarm goes off, the decision was already made — the night before, not that morning.",
      "What I actually do: kit laid out by the door, shoes right next to it, watch charging where I'll see it, coffee prepped to just add water. None of that is about the run. It's about removing every single decision from 4am me, who is, without exception, a worse decision-maker than 9pm me.",
      "The alarm still goes off and it's still dark and it still feels bad for about ninety seconds. But there's no moment where I'm standing in a dark kitchen trying to find my other shoe or figure out if I have a clean shirt, which is the actual moment most early runs die — not lack of willpower, just enough friction to make the couch win.",
      "So the honest answer is boring: the run gets decided at 9pm, laid out on the floor, and 4am me just has to walk downstairs and put on what's already there.",
    ],
  },
  {
    id: "post-03",
    slug: "cooking-the-night-before-long-runs",
    title: "Why I started cooking the night before long runs",
    category: "Fitness",
    date: "2026-07-24",
    readTime: "5 min read",
    excerpt:
      "A small ritual that turned race-week anxiety into something closer to anticipation.",
    body: [
      "For a while, the night before a long run looked like standing in front of the fridge at 8pm, not hungry enough to commit to a real meal, not calm enough to skip one, eating something forgettable standing at the counter. It did the job carb-wise. It did nothing for the part of my brain that was already anxious about the next morning.",
      "What changed it was almost an accident — I started actually cooking the night-before meal instead of assembling it. Nothing complicated, usually a simple pasta or rice bowl, but cooked properly: a cutting board out, something simmering, twenty minutes where my hands were busy and the run was tomorrow's problem instead of tonight's.",
      "It turns out the anxious pre-long-run energy needed somewhere to go, and chopping an onion turned out to be a perfectly good place for it. The meal itself barely matters. What matters is that for twenty minutes the night before something hard, I'm doing something small and doable with my hands.",
      "Race morning still has nerves. But the night before stopped being something to get through and started being a ritual I look forward to — which, it turns out, was the actual thing standing between anxiety and anticipation the whole time.",
    ],
  },
];

export default posts;
