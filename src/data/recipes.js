// Mock recipe data. Swap for a real API / CMS later.
//
// Each entry carries two layers of content: the list-summary fields
// (title, category, time, excerpt — everything RecipeCard renders) and a
// `body` — the full write-up a detail page renders, which the card never
// touches. Keeping them separate means the card list stays cheap to render
// (no full recipe text sitting unused in the DOM) and the excerpt can stay
// a short, deliberately-written teaser instead of a truncated slice of body.
const recipes = [
  {
    id: "recipe-01",
    slug: "brown-butter-miso-pasta",
    title: "Brown butter miso pasta",
    category: "Weeknight",
    time: "25 min",
    excerpt:
      "Nutty brown butter, a spoon of white miso, and a fistful of parmesan turn pantry staples into something worth cooking twice.",
    body: [
      "This started as a use-up-what's-in-the-fridge dinner on a night I didn't have the energy to think, and it's been in weekly rotation ever since. It comes together in the time it takes pasta water to boil and reduce, which on a training week is most of the appeal.",
      "Melt a generous knob of butter in a pan over medium heat and just let it sit — don't stir it constantly, let the milk solids toast until the butter smells nutty and turns the color of light caramel. Pull it off the heat a shade before you think it's ready; it keeps cooking in the residual heat and burns fast once it turns.",
      "Whisk in a spoon of white miso off the heat until it dissolves into the butter, then loosen the whole thing with a ladle of starchy pasta water until it turns glossy. Toss with the pasta, a fistful of grated parmesan, and a crack of black pepper.",
      "It's rich enough that half the usual portion feels like plenty, which is exactly what I want the night before an easy run rather than a long one.",
    ],
  },
  {
    id: "recipe-02",
    slug: "sheet-pan-harissa-chicken-squash",
    title: "Sheet-pan harissa chicken & squash",
    category: "Meal prep",
    time: "45 min",
    excerpt:
      "One pan, minimal cleanup, and it reheats better on day three than day one — my go-to for a big training week.",
    body: [
      "Meal prep that actually survives four days in the fridge without turning sad is harder to find than it should be. This is the one recipe I trust to still taste like something on day three, which matters more than day-one flavor when you're cooking for a week of double sessions, not a dinner party.",
      "Toss chicken thighs and cubed squash with olive oil, a couple tablespoons of harissa paste, and a pinch of salt, then spread them across one sheet pan — crowding the pan is the one thing that ruins this, so use two pans if you have to. Roast hot, 425°F, until the chicken skin crisps and the squash caramelizes at the edges, about 35 minutes.",
      "The harissa mellows and deepens over a few days in the fridge instead of fading, which is the actual trick here — most sheet-pan dinners taste like a rerun by Wednesday, this one tastes like it's still improving.",
      "I portion it straight into containers while it's still on the pan, still hot, before I can talk myself into eating the whole thing standing at the counter.",
    ],
  },
  {
    id: "recipe-03",
    slug: "charred-corn-black-bean-salad",
    title: "Charred corn & black bean salad",
    category: "Discovery",
    time: "20 min",
    excerpt:
      "Found this at a taqueria in Oaxaca and have been chasing the smoky-lime flavor at home ever since.",
    body: [
      "I had a version of this standing at a taqueria counter in Oaxaca, eaten out of a paper cup with a plastic spoon, and spent the next two months trying to get the char-and-lime balance right at home. This is the closest I've landed, though I don't think a home stove ever quite matches a comal that's been seasoned for twenty years.",
      "The move is charring the corn properly — a hot dry skillet or a grill pan, kernels cut straight off the cob, left alone long enough to actually blacken in spots instead of just warming through. That char is most of the flavor; don't rush it.",
      "Toss the charred corn with black beans, diced red onion, cotija if you can find it (feta works), a good squeeze of lime, and a spoon of the pickled jalapeño brine if you have a jar going. It wants to sit for ten minutes before you eat it, which is exactly long enough to char a second batch of corn because the first one never makes it to the bowl.",
      "Good cold out of the fridge the next day, which is rare for anything with lime in it and part of why it's become a permanent fixture.",
    ],
  },
];

export default recipes;
