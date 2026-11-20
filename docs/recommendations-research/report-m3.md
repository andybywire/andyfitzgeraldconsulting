# Related content: M3, embeddings vs the intended set

Corpus fetched 2026-10-21T21:05:27.472Z; embeddings queried 2026-10-21T21:06:51.069Z. Intended set = the site's ranker. Embeddings = `text::semanticSimilarity()` with each page's title + summary as the query.

## Insights (44 pages)

- Agreement on "Related" pages (same branch, how many of the taxonomy's cards embeddings also pick): 3/3: 1, 2/3: 11, 1/3: 19, 0/3: 12
- Embedding picks with NO taxonomy relation at all (inside the eligible branch): 24 of 129
- Without genre partitioning, embeddings' top 3 cross the branch on 29 pages (52 cards)
- Cards sharing the page's own genre: taxonomy 55 of 123, embeddings 80 of 129
- Embedding picks by taxonomy tier: {"shared":82,"nearer":9,"sibling":14,"none":24}
- Where embeddings rank the taxonomy's cards (same branch): median 5, range 1–37
- "Recent" fallback pages, where embeddings offer something the taxonomy can't: designing-content-authoring-experiences

## Presentations (29 pages)

- Agreement on "Related" pages (same branch, how many of the taxonomy's cards embeddings also pick): 3/3: 1, 2/3: 2, 1/3: 15, 0/3: 9
- Embedding picks with NO taxonomy relation at all (inside the eligible branch): 23 of 81
- Without genre partitioning, embeddings' top 3 cross the branch on 27 pages (54 cards)
- Cards sharing the page's own genre: taxonomy 22 of 78, embeddings 26 of 81
- Embedding picks by taxonomy tier: {"shared":47,"nearer":4,"sibling":7,"none":23}
- Where embeddings rank the taxonomy's cards (same branch): median 9, range 1–28
- "Recent" fallback pages, where embeddings offer something the taxonomy can't: knowledge-graphs-and-ia, information-design

## For review, least agreement first

Each block: the taxonomy's cards (with tier) beside the embeddings' top 3 in the same branch (with the taxonomy's view of each). "Unrestricted" lists embeddings' picks outside the branch. Your call goes on the last line.

### Designing Content Authoring Experiences *(Book Note)* — taxonomy shows "Recent"

Query: "Designing Content Authoring Experiences. Well designed authoring experiences make doing the right things easy and doing the wrong things hard."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | *(Recent)* Designing and Implementing Semantic Data Layers *(Book Note)* | Why Shortcuts Aren't the Road *(Web Clipping)* — taxonomy: no relation |
| 2 | *(Recent)* The Calm Before the Storm *(Web Clipping)* | The Calm Before the Storm *(Web Clipping)* — taxonomy: no relation |
| 3 | *(Recent)* Why Shortcuts Aren't the Road *(Web Clipping)* | SHACL for the Practitioner *(Book Note)* — taxonomy: no relation |

Unrestricted, outside the branch: Content First Prototyping *(Talk)*; Structured Content Design Workflow 2022 *(Method)*; Structured Content Design Workflow *(Method)*

**Your call:** 

### Knowledge Graphs and IA *(Interview)* — taxonomy shows "Recent"

Query: "Knowledge Graphs and IA"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | *(Recent)* Structured Content in Product Design *(Workshop)* | How to Get Started with Knowledge Graphs *(Interview)* — taxonomy: no relation |
| 2 | *(Recent)* AI Assisted Content Operations in Practice *(Panel)* | Boutique Knowledge Graphs: Building Smart Content At Any Scale *(Talk)* — taxonomy: no relation |
| 3 | *(Recent)* Ranked Lists of Related Content in Sanity Studio *(Talk)* | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — taxonomy: no relation |

Unrestricted, outside the branch: Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)*

**Your call:** 

### Information Design *(Talk)* — taxonomy shows "Recent"

Query: "Information Design. Approaches that will help you craft cohesive information systems and articulate those systems smoothly across touch points."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | *(Recent)* Structured Content in Product Design *(Workshop)* | Desiring Ecologies *(Keynote)* — taxonomy: no relation |
| 2 | *(Recent)* AI Assisted Content Operations in Practice *(Panel)* | Responsive Information Architectures *(Talk)* — taxonomy: no relation |
| 3 | *(Recent)* Ranked Lists of Related Content in Sanity Studio *(Talk)* | Taxonomy for Experience Designers *(Workshop)* — taxonomy: no relation |

Unrestricted, outside the branch: The Trouble with Systems *(Perspective)*

**Your call:** 

### Site Updates: Structure, Semantics & Standards *(Perspective)* — agree 0/3

Query: "Site Updates: Structure, Semantics & Standards. Four lessons learned from redeveloping my consulting website with LLM code collaboration."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Content Modeling in the Age of Flying Cars *(Perspective)* — shared; embeddings rank 10 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 2 | Elemeno Health Structured Content Design & Development *(Case Study)* — shared; embeddings rank 4 | Four Web Writing Style Guides from which to Borrow *(Method)* — taxonomy: sibling |
| 3 | WHO Knowledge Action Portal *(Case Study)* — shared; embeddings rank 28 | Structured Content and the Headless CMS *(Perspective)* — taxonomy: shared |

Unrestricted, outside the branch: AI Assisted Content Operations in Practice *(Panel)*

**Your call:** 

### AI Assisted Content Operations in Practice *(Panel)* — agree 0/3

Query: "AI Assisted Content Operations in Practice. A chat with Sanity builders on the systems, AI workflows, and experiments they've built with Sanity. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Conversations With Robots: Voice, AI & Structured Content *(Talk)* — shared; embeddings rank 8 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: sibling |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 9 | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — taxonomy: shared |
| 3 | Boutique Knowledge Graphs: Building Smart Content At Any Scale *(Talk)* — shared; embeddings rank 15 | Orchestrating the Mundane: Deskilling Language Models  *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)*; Self-Hosting Sanity Studio with GitHub Actions *(Method)*

**Your call:** 

### Content Review & Approval Workflow Integration *(Case Study)* — agree 0/3

Query: "Content Review & Approval Workflow Integration. A cross-platform workflow integration that streamlined content review processes and improved transparency for healthcare point-of-care resources."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Delivering Information Architecture *(Perspective)* — shared; embeddings rank 20 | UW Medicine *(Case Study)* — taxonomy: nearer |
| 2 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — shared; embeddings rank 8 | Elemeno Health Structured Content Design & Development *(Case Study)* — taxonomy: nearer |
| 3 | Self-Hosting Sanity Studio with GitHub Actions *(Method)* — shared; embeddings rank 14 | WHO Knowledge Action Portal *(Case Study)* — taxonomy: sibling |


**Your call:** 

### Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — agree 0/3

Query: "Sanity Everything*[NYC] Conference Themes & Takeaways. Conference and courtyard themes from Sanity’s first “Everything*[NYC]” developer conference."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Deskilling Large Language Models *(Method)* — shared; embeddings rank 19 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 2 | Self-Hosting Sanity Studio with GitHub Actions *(Method)* — shared; embeddings rank 4 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: no relation |
| 3 | Sanity Studio Taxonomy Migration *(Method)* — shared; embeddings rank 9 | GraphCon 2026 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy Management and use in Sanity Studio *(Talk)*

**Your call:** 

### Taxonomy Management and use in Sanity Studio *(Talk)* — agree 0/3

Query: "Taxonomy Management and use in Sanity Studio. A hands-on demo of how to get started using standards based vocabulary control with Taxonomy Manager in Sanity Studio"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Taxonomy and the Headless CMS *(Talk)* — shared; embeddings rank 6 | Ranked Lists of Related Content in Sanity Studio *(Talk)* — taxonomy: shared |
| 2 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 25 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: sibling |
| 3 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 19 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: shared |

Unrestricted, outside the branch: Sanity Studio Taxonomy Migration *(Method)*; Purpose-Driven Taxonomy Design *(Method)*

**Your call:** 

### AI Supported Auto-Categorization *(Method)* — agree 0/3

Query: "AI Supported Auto-Categorization. A comparison of manual, NLP, and LLM-based tagging methods and key takeaways for effective tagging approaches."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Self-Hosting Sanity Studio with GitHub Actions *(Method)* — shared; embeddings rank 20 | AI Supported Taxonomy Term Generation *(Method)* — taxonomy: shared |
| 2 | Designing with Code *(Perspective)* — shared; embeddings rank 35 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 3 | Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 9 | Purpose-Driven Taxonomy Design *(Method)* — taxonomy: no relation |

Unrestricted, outside the branch: Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)*; Orchestrating the Mundane: Deskilling Language Models  *(Talk)*

**Your call:** 

### Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — agree 0/3

Query: "Taxonomy Boot Camp 2024 Themes & Takeaways. Summary of the top themes and insights from the 2024 Taxonomy Boot Camp conference in Washington DC."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | AI Supported Taxonomy Term Generation *(Method)* — shared; embeddings rank 5 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 2 | Site Updates: Structure, Semantics & Standards *(Perspective)* — shared; embeddings rank 13 | Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 3 | The Trouble with Systems *(Perspective)* — shared; embeddings rank 26 | Sanity Studio Taxonomy Migration *(Method)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy Management and use in Sanity Studio *(Talk)*

**Your call:** 

### Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — agree 0/3

Query: "Taxonomy Boot Camp 2022 Themes & Takeaways. Summary of the top themes and insights from the 2022 Taxonomy Boot Camp conference in Washington DC"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | GraphCon 2026 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 5 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 2 | Domain Modeling for Structured Content *(Method)* — shared; embeddings rank 21 | Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — taxonomy: no relation |
| 3 | Structured Content Design Workflow 2022 *(Method)* — shared; embeddings rank 8 | Sanity Studio Taxonomy Migration *(Method)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy Management and use in Sanity Studio *(Talk)*

**Your call:** 

###  Improv Consulting: Yes, And ... Experts Improvise Solutions to Real Problems *(Panel)* — agree 0/3

Query: " Improv Consulting: Yes, And ... Experts Improvise Solutions to Real Problems. Five consultants answer tough audience-submitted questions on the spot, moderated by Sukh Sidhu, Head of Agency Partnerships at Sanity. And t…"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Ranked Lists of Related Content in Sanity Studio *(Talk)* — shared; embeddings rank 8 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: shared |
| 2 | Desiring Ecologies *(Keynote)* — shared; embeddings rank 23 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: shared |
| 3 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 17 | Browsability with Dan Brown *(Interview)* — taxonomy: sibling |

Unrestricted, outside the branch: Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)*; Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)*

**Your call:** 

### WHO Department of Neglected Tropical Diseases *(Case Study)* — agree 0/3

Query: "WHO Department of Neglected Tropical Diseases. I helped the World Health Organization Department of Control of Neglected Tropical Diseases assess and revise their sub-site information architecture. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | What's It Like to Work with an Information Architect? *(Perspective)* — shared; embeddings rank 32 | WHO Knowledge Action Portal *(Case Study)* — taxonomy: no relation |
| 2 | How to Hire an Information Architect *(Perspective)* — nearer; embeddings rank 21 | UW Medicine *(Case Study)* — taxonomy: sibling |
| 3 | Delivering Information Architecture *(Perspective)* — nearer; embeddings rank 5 | Purpose-Driven Taxonomy Design *(Method)* — taxonomy: sibling |

Unrestricted, outside the branch: IA, the Current and the Future *(Panel)*

**Your call:** 

### IA, the Current and the Future *(Panel)* — agree 0/3

Query: "IA, the Current and the Future. A World IA Day panel addressing the question, “What has changed or is changing in IA in response to COVID-19?”"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Browsability with Dan Brown *(Interview)* — nearer; embeddings rank 5 | Design for the Human Scale  *(Keynote)* — taxonomy: no relation |
| 2 | Responsive Information Architectures *(Talk)* — nearer; embeddings rank 8 | Design for Difference *(Panel)* — taxonomy: no relation |
| 3 | Desiring Ecologies *(Keynote)* — nearer; embeddings rank 9 | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — taxonomy: no relation |

Unrestricted, outside the branch: Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)*

**Your call:** 

### How to Choose Topics for Card Sorting *(Method)* — agree 0/3

Query: "How to Choose Topics for Card Sorting. Improve the quality of your card sorting results with client collaboration."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | A Cognitive Sciences Reading List for Designers *(Perspective)* — shared; embeddings rank 14 | Purpose-Driven Taxonomy Design *(Method)* — taxonomy: no relation |
| 2 | Keyword Extraction with NLP: A Beginner's Guide *(Method)* — shared; embeddings rank 26 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — taxonomy: no relation |
| 3 | UW Medicine *(Case Study)* — shared; embeddings rank 23 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: no relation |

Unrestricted, outside the branch: Ranked Lists of Related Content in Sanity Studio *(Talk)*; AI Assisted Content Operations in Practice *(Panel)*

**Your call:** 

### WHO Knowledge Action Portal *(Case Study)* — agree 0/3

Query: "WHO Knowledge Action Portal. A comprehensive research-backed approach to usability, accessibility, and performance improvement."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Site Updates: Structure, Semantics & Standards *(Perspective)* — shared; embeddings rank 7 | WHO Department of Neglected Tropical Diseases *(Case Study)* — taxonomy: no relation |
| 2 | Purpose-Driven Taxonomy Design *(Method)* — sibling; embeddings rank 15 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — taxonomy: no relation |
| 3 | Conversations with Robots: Voice, Smart Agents & the Case for Structured Content *(Perspective)* — sibling; embeddings rank 10 | Seattle Children's Hospital *(Case Study)* — taxonomy: sibling |


**Your call:** 

### Four Web Writing Style Guides from which to Borrow *(Method)* — agree 0/3

Query: "Four Web Writing Style Guides from which to Borrow. Get started with web writing with this intro, template, and set of examples."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Language + Meaning + User Experience Architecture *(Perspective)* — shared; embeddings rank 26 | Site Updates: Structure, Semantics & Standards *(Perspective)* — taxonomy: sibling |
| 2 | What's It Like to Work with an Information Architect? *(Perspective)* — shared; embeddings rank 36 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: sibling |
| 3 | How to Hire an Information Architect *(Perspective)* — nearer; embeddings rank 37 | Structured Content Design Workflow *(Method)* — taxonomy: sibling |

Unrestricted, outside the branch: Browsability with Dan Brown *(Interview)*

**Your call:** 

### Unexpected Paths: How Different Backgrounds Led Us to UX *(Panel)* — agree 0/3

Query: "Unexpected Paths: How Different Backgrounds Led Us to UX. A panel discussion with UX design and research leaders that come from non-traditional backgrounds"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Responsive Information Architectures *(Talk)* — nearer; embeddings rank 10 | Design for Difference *(Panel)* — taxonomy: no relation |
| 2 | — |  Improv Consulting: Yes, And ... Experts Improvise Solutions to Real Problems *(Panel)* — taxonomy: no relation |
| 3 | — | Browsability with Dan Brown *(Interview)* — taxonomy: no relation |


**Your call:** 

### Practical Large Scale Content Analysis *(Workshop)* — agree 0/3

Query: "Practical Large Scale Content Analysis. Move beyond using spreadsheets merely as glorified tables and learn to use them as the powerful and ubiquitous data manipulation engines they are."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Domain Modeling for Digital Information Designers *(Workshop)* — shared; embeddings rank 28 | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — taxonomy: no relation |
| 2 | Ranked Lists of Related Content in Sanity Studio *(Talk)* — nearer; embeddings rank 4 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: no relation |
| 3 | Design for the Human Scale  *(Keynote)* — sibling; embeddings rank 20 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: no relation |

Unrestricted, outside the branch: Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)*; Structured Content Design Workflow *(Method)*; Keyword Extraction with NLP: A Beginner's Guide *(Method)*

**Your call:** 

### Language Arts for the Lizard Brain *(Talk)* — agree 0/3

Query: "Language Arts for the Lizard Brain. Learn how cognitive science research on perception and decision making can help us understand how the words we design sometimes work against us"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 17 | Browsability with Dan Brown *(Interview)* — taxonomy: no relation |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 9 | Design for the Human Scale  *(Keynote)* — taxonomy: shared |
| 3 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 12 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: sibling |

Unrestricted, outside the branch: A Cognitive Sciences Reading List for Designers *(Perspective)*; Language + Meaning + User Experience Architecture *(Perspective)*

**Your call:** 

### A Cognitive Sciences Reading List for Designers *(Perspective)* — agree 0/3

Query: "A Cognitive Sciences Reading List for Designers. Gain a better understanding of why users behave the (sometimes bizarre) ways they do with these foundational cognitive science texts."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | How to Choose Topics for Card Sorting *(Method)* — shared; embeddings rank 10 | The Trouble with Systems *(Perspective)* — taxonomy: no relation |
| 2 | Domain Modeling for Structured Content *(Method)* — shared; embeddings rank 7 | Seattle Children's Hospital *(Case Study)* — taxonomy: no relation |
| 3 | — | Language + Meaning + User Experience Architecture *(Perspective)* — taxonomy: no relation |

Unrestricted, outside the branch: Language Arts for the Lizard Brain *(Talk)*; Browsability with Dan Brown *(Interview)*; Designing Content Authoring Experiences *(Book Note)*

**Your call:** 

### Desiring Ecologies *(Keynote)* — agree 0/3

Query: "Desiring Ecologies"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Design for the Human Scale  *(Keynote)* — shared; embeddings rank 8 | Design for Difference *(Panel)* — taxonomy: nearer |
| 2 |  Improv Consulting: Yes, And ... Experts Improvise Solutions to Real Problems *(Panel)* — shared; embeddings rank 26 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: shared |
| 3 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 19 | Ranked Lists of Related Content in Sanity Studio *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: The Trouble with Systems *(Perspective)*

**Your call:** 

### Responsive Information Architectures *(Talk)* — agree 0/3

Query: "Responsive Information Architectures. A practical strategy for designing information systems across digital touch points."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Browsability with Dan Brown *(Interview)* — shared; embeddings rank 6 | Desiring Ecologies *(Keynote)* — taxonomy: shared |
| 2 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 21 | Information Design *(Talk)* — taxonomy: no relation |
| 3 | Taxonomy for App Makers *(Talk)* — shared; embeddings rank 12 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: shared |

Unrestricted, outside the branch: The Trouble with Systems *(Perspective)*; Delivering Information Architecture *(Perspective)*

**Your call:** 

### Language + Meaning + User Experience Architecture *(Perspective)* — agree 0/3

Query: "Language + Meaning + User Experience Architecture. To communicate effectively across digital contexts, we need to understand the way we make meaning as thinking animals."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 28 | A Cognitive Sciences Reading List for Designers *(Perspective)* — taxonomy: no relation |
| 2 | Four Web Writing Style Guides from which to Borrow *(Method)* — shared; embeddings rank 30 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 3 | Structured Content Design Workflow *(Method)* — shared; embeddings rank 11 | Domain Modeling for Structured Content *(Method)* — taxonomy: shared |

Unrestricted, outside the branch: Language Arts for the Lizard Brain *(Talk)*; Information Architecture for Digital Content *(Interview)*; Design for the Human Scale  *(Keynote)*

**Your call:** 

### The Calm Before the Storm *(Web Clipping)* — agree 1/3

Query: "The Calm Before the Storm. Geoff Teehan on the particular moment we’re in with AI assisted software creation: developer scarcity is fading, but we still don't understand what abundance looks like. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Why Shortcuts Aren't the Road *(Web Clipping)* — shared; embeddings rank 1 | Why Shortcuts Aren't the Road *(Web Clipping)* — taxonomy: shared |
| 2 | Designing and Implementing Semantic Data Layers *(Book Note)* — sibling; embeddings rank 4 | Designing Content Authoring Experiences *(Book Note)* — taxonomy: no relation |
| 3 | — | Proust and the Squid *(Book Note)* — taxonomy: no relation |

Unrestricted, outside the branch: AI Assisted Content Operations in Practice *(Panel)*; Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)*; Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)*

**Your call:** 

### Why Shortcuts Aren't the Road *(Web Clipping)* — agree 1/3

Query: "Why Shortcuts Aren't the Road. As with most shortcuts, there’s a reason that the road isn’t laid down that way."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | The Calm Before the Storm *(Web Clipping)* — shared; embeddings rank 1 | The Calm Before the Storm *(Web Clipping)* — taxonomy: shared |
| 2 | Proust and the Squid *(Book Note)* — nearer; embeddings rank 4 | SHACL for the Practitioner *(Book Note)* — taxonomy: no relation |
| 3 | Designing and Implementing Semantic Data Layers *(Book Note)* — sibling; embeddings rank 5 | Designing Content Authoring Experiences *(Book Note)* — taxonomy: no relation |

Unrestricted, outside the branch: Delivering Information Architecture *(Perspective)*; Browsability with Dan Brown *(Interview)*

**Your call:** 

### GraphCon 2026 Themes & Takeaways *(Conference Themes)* — agree 1/3

Query: "GraphCon 2026 Themes & Takeaways. Summary of the top themes and insights from the 2026 GraphCon conference in Seattle."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Sanity Studio Taxonomy Migration *(Method)* — shared; embeddings rank 15 | Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 2 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 3 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 3 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — shared; embeddings rank 4 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |


**Your call:** 

### Structured Content in Product Design *(Workshop)* — agree 1/3

Query: "Structured Content in Product Design. Learn concepts and frameworks for understanding structured content design as a systems practice"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 2 | Content First Prototyping *(Talk)* — taxonomy: sibling |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 5 | Beyond the Page with Structured Content *(Interview)* — taxonomy: shared |
| 3 | Language Arts for the Lizard Brain *(Talk)* — shared; embeddings rank 16 | Taxonomy and the Headless CMS *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: Structured Content Design Workflow 2022 *(Method)*; Structured Content Design Workflow *(Method)*; Structured Content and the Headless CMS *(Perspective)*

**Your call:** 

### SHACL for the Practitioner *(Book Note)* — agree 1/3

Query: "SHACL for the Practitioner. A non-academic introduction to SHACL with rich examples and real-world real world case studies. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Designing and Implementing Semantic Data Layers *(Book Note)* — nearer; embeddings rank 2 | Why Shortcuts Aren't the Road *(Web Clipping)* — taxonomy: no relation |
| 2 | — | Designing and Implementing Semantic Data Layers *(Book Note)* — taxonomy: nearer |
| 3 | — | Designing Content Authoring Experiences *(Book Note)* — taxonomy: no relation |

Unrestricted, outside the branch: AI Assisted Content Operations in Practice *(Panel)*; Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)*; Taxonomy Management and use in Sanity Studio *(Talk)*

**Your call:** 

### Ranked Lists of Related Content in Sanity Studio *(Talk)* — agree 1/3

Query: "Ranked Lists of Related Content in Sanity Studio. A hands-on demo of approaches for generating ranked lists of related content using taxonomy tags in Sanity Studio"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 |  Improv Consulting: Yes, And ... Experts Improvise Solutions to Real Problems *(Panel)* — shared; embeddings rank 10 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: shared |
| 2 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 1 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: shared |
| 3 | Taxonomy for App Makers *(Talk)* — shared; embeddings rank 9 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: shared |

Unrestricted, outside the branch: Purpose-Driven Taxonomy Design *(Method)*; Sanity Studio Taxonomy Migration *(Method)*

**Your call:** 

### Content Modeling in the Age of Flying Cars *(Perspective)* — agree 1/3

Query: "Content Modeling in the Age of Flying Cars. Structuring and connecting content for the next generation of AI-integrated CMS."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 1 | Structured Content and the Headless CMS *(Perspective)* — taxonomy: shared |
| 2 | Site Updates: Structure, Semantics & Standards *(Perspective)* — shared; embeddings rank 5 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 3 | Conversations with Robots: Voice, Smart Agents & the Case for Structured Content *(Perspective)* — shared; embeddings rank 7 | Site Maps & Connected Content *(Perspective)* — taxonomy: shared |


**Your call:** 

### Orchestrating the Mundane: Deskilling Language Models  *(Talk)* — agree 1/3

Query: "Orchestrating the Mundane: Deskilling Language Models . Learn how to orchestrate language models for consistent, predictable help with workaday IA tasks"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Prototyping Information Architecture *(Talk)* — shared; embeddings rank 13 | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — taxonomy: shared |
| 2 | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — shared; embeddings rank 1 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: shared |
| 3 | Content First Prototyping *(Talk)* — shared; embeddings rank 14 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: no relation |

Unrestricted, outside the branch: Deskilling Large Language Models *(Method)*

**Your call:** 

### Purpose-Driven Taxonomy Design *(Method)* — agree 1/3

Query: "Purpose-Driven Taxonomy Design. A purpose-driven process for selecting terms, creating structure, and vetting design approaches on small and large scale taxonomy projects."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Sanity Studio Taxonomy Migration *(Method)* — shared; embeddings rank 2 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 2 | GraphCon 2026 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 33 | Sanity Studio Taxonomy Migration *(Method)* — taxonomy: shared |
| 3 | AI Supported Taxonomy Term Generation *(Method)* — shared; embeddings rank 5 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |


**Your call:** 

### AI Supported Taxonomy Term Generation *(Method)* — agree 1/3

Query: "AI Supported Taxonomy Term Generation. An example workflow for coordinating LLMs and text analytics to generate topic tags for an article collection."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 3 | AI Supported Auto-Categorization *(Method)* — taxonomy: shared |
| 2 | Deskilling Large Language Models *(Method)* — shared; embeddings rank 9 | Purpose-Driven Taxonomy Design *(Method)* — taxonomy: shared |
| 3 | Site Updates: Structure, Semantics & Standards *(Perspective)* — shared; embeddings rank 5 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |

Unrestricted, outside the branch: Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)*

**Your call:** 

### Deskilling Large Language Models *(Method)* — agree 1/3

Query: "Deskilling Large Language Models. “Deskilling” is a method for framing language models in predictable structures in order to achieve consistent outcomes for well-defined tasks. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 10 | Site Updates: Structure, Semantics & Standards *(Perspective)* — taxonomy: shared |
| 2 | AI Supported Taxonomy Term Generation *(Method)* — shared; embeddings rank 2 | AI Supported Taxonomy Term Generation *(Method)* — taxonomy: shared |
| 3 | Designing with Code *(Perspective)* — shared; embeddings rank 27 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |

Unrestricted, outside the branch: Orchestrating the Mundane: Deskilling Language Models  *(Talk)*; Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)*

**Your call:** 

### Elemeno Health Structured Content Design & Development *(Case Study)* — agree 1/3

Query: "Elemeno Health Structured Content Design & Development. I helped Elemeno Health design, develop, and release a structured content authoring solution that helps their content work harder and last longer."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | UW Medicine *(Case Study)* — shared; embeddings rank 11 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 2 | Site Updates: Structure, Semantics & Standards *(Perspective)* — shared; embeddings rank 4 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 3 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 3 | Structured Content and the Headless CMS *(Perspective)* — taxonomy: shared |


**Your call:** 

### Beyond the Page with Structured Content *(Interview)* — agree 1/3

Query: "Beyond the Page with Structured Content. A conversation with Jorge Arango about moving beyond the page as a metaphor for how information is delivered toward more flexible content structures"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Taxonomy and the Headless CMS *(Talk)* — shared; embeddings rank 7 | Information Architecture for Digital Content *(Interview)* — taxonomy: shared |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 1 | Conversations With Robots: Voice, AI & Structured Content *(Talk)* — taxonomy: shared |
| 3 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 13 | Structured Content in Product Design *(Workshop)* — taxonomy: shared |

Unrestricted, outside the branch: Structured Content and the Headless CMS *(Perspective)*; Structured Content Design Workflow *(Method)*; Designing with Code *(Perspective)*

**Your call:** 

### Domain Modeling for Digital Information Designers *(Workshop)* — agree 1/3

Query: "Domain Modeling for Digital Information Designers. Domain modeling can help you unearth the assumptions and tacit rules that plague so many content ecosystems. Learn how to get started in this full day hands-on workshop."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Language Arts for the Lizard Brain *(Talk)* — shared; embeddings rank 21 | Structured Content in Product Design *(Workshop)* — taxonomy: shared |
| 2 | Design for the Human Scale  *(Keynote)* — shared; embeddings rank 3 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: no relation |
| 3 |  Improv Consulting: Yes, And ... Experts Improvise Solutions to Real Problems *(Panel)* — shared; embeddings rank 26 | Design for the Human Scale  *(Keynote)* — taxonomy: shared |

Unrestricted, outside the branch: Domain Modeling for Structured Content *(Method)*; Content Modeling in the Age of Flying Cars *(Perspective)*; Structured Content Design Workflow 2022 *(Method)*

**Your call:** 

### Structured Content and the Headless CMS *(Perspective)* — agree 1/3

Query: "Structured Content and the Headless CMS. Structured content treats information as a set of ideas, concepts, and facts to communicate. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Content Modeling in the Age of Flying Cars *(Perspective)* — shared; embeddings rank 8 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 2 | Structured Content Design Workflow *(Method)* — shared; embeddings rank 2 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 3 | Site Maps & Connected Content *(Perspective)* — shared; embeddings rank 7 | Conversations with Robots: Voice, Smart Agents & the Case for Structured Content *(Perspective)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy and the Headless CMS *(Talk)*; Structured Content in Product Design *(Workshop)*

**Your call:** 

### How to Get Started with Knowledge Graphs *(Interview)* — agree 1/3

Query: "How to Get Started with Knowledge Graphs. What knowledge graphs are and how organizations can get started with this powerful approach for improving user experiences."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Boutique Knowledge Graphs: Building Smart Content At Any Scale *(Talk)* — shared; embeddings rank 1 | Boutique Knowledge Graphs: Building Smart Content At Any Scale *(Talk)* — taxonomy: shared |
| 2 | Conversations With Robots: Voice, AI & Structured Content *(Talk)* — sibling; embeddings rank 14 | Knowledge Graphs and IA *(Interview)* — taxonomy: no relation |
| 3 | — | Browsability with Dan Brown *(Interview)* — taxonomy: no relation |

Unrestricted, outside the branch: Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)*

**Your call:** 

### Boutique Knowledge Graphs: Building Smart Content At Any Scale *(Talk)* — agree 1/3

Query: "Boutique Knowledge Graphs: Building Smart Content At Any Scale. A strategy for bringing the value of graph and semantic web technologies to smaller scale, content-focused projects. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | How to Get Started with Knowledge Graphs *(Interview)* — shared; embeddings rank 2 | Knowledge Graphs and IA *(Interview)* — taxonomy: no relation |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 5 | How to Get Started with Knowledge Graphs *(Interview)* — taxonomy: shared |
| 3 | Taxonomy and the Headless CMS *(Talk)* — shared; embeddings rank 11 | Browsability with Dan Brown *(Interview)* — taxonomy: no relation |

Unrestricted, outside the branch: Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)*; Structured Content Design Workflow 2022 *(Method)*

**Your call:** 

### Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — agree 1/3

Query: "Boutique Knowledge Graphs: Creating Smart Content at Any Scale. An approachable, scalable technique for solving well-defined communication and discovery problems."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Self-Hosting Sanity Studio with GitHub Actions *(Method)* — shared; embeddings rank 20 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 2 | GraphCon 2026 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 3 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 3 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 5 | GraphCon 2026 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |

Unrestricted, outside the branch: Boutique Knowledge Graphs: Building Smart Content At Any Scale *(Talk)*; How to Get Started with Knowledge Graphs *(Interview)*; Knowledge Graphs and IA *(Interview)*

**Your call:** 

### Structured Content Design Workflow 2022 *(Method)* — agree 1/3

Query: "Structured Content Design Workflow 2022. Focus on communicating effectively to users, however they choose to access content."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Structured Content Design Workflow *(Method)* — shared; embeddings rank 1 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 2 | Site Maps & Connected Content *(Perspective)* — shared; embeddings rank 10 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 3 | Domain Modeling for Structured Content *(Method)* — shared; embeddings rank 4 | Conversations with Robots: Voice, Smart Agents & the Case for Structured Content *(Perspective)* — taxonomy: shared |

Unrestricted, outside the branch: Structured Content in Product Design *(Workshop)*

**Your call:** 

### Self-Hosting Sanity Studio with GitHub Actions *(Method)* — agree 1/3

Query: "Self-Hosting Sanity Studio with GitHub Actions. A comprehensive guide to self-hosting Sanity Studio on DreamHost with GitHub Actions for continuous integration."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — shared; embeddings rank 4 | Sanity Everything*[NYC] Conference Themes & Takeaways *(Conference Themes)* — taxonomy: shared |
| 2 | Sanity Studio Taxonomy Migration *(Method)* — shared; embeddings rank 2 | Sanity Studio Taxonomy Migration *(Method)* — taxonomy: shared |
| 3 | AI Supported Auto-Categorization *(Method)* — shared; embeddings rank 19 | Site Updates: Structure, Semantics & Standards *(Perspective)* — taxonomy: no relation |

Unrestricted, outside the branch: AI Assisted Content Operations in Practice *(Panel)*; Taxonomy Management and use in Sanity Studio *(Talk)*

**Your call:** 

### Taxonomy and the Headless CMS *(Talk)* — agree 1/3

Query: "Taxonomy and the Headless CMS. Keep decoupled content from becoming disconnected content with the judicious application of taxonomy and purpose-driven semantics"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 12 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: shared |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 10 | Ranked Lists of Related Content in Sanity Studio *(Talk)* — taxonomy: shared |
| 3 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 1 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: shared |

Unrestricted, outside the branch: Structured Content and the Headless CMS *(Perspective)*; Purpose-Driven Taxonomy Design *(Method)*; Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)*

**Your call:** 

### Browsability with Dan Brown *(Interview)* — agree 1/3

Query: "Browsability with Dan Brown. Conversations about Information Architecture: Dan Brown talks with Andy Fitzgerald about the Lens of Browsability"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Responsive Information Architectures *(Talk)* — shared; embeddings rank 2 | Information Architecture for Digital Content *(Interview)* — taxonomy: no relation |
| 2 | Desiring Ecologies *(Keynote)* — shared; embeddings rank 7 | Responsive Information Architectures *(Talk)* — taxonomy: shared |
| 3 | IA, the Current and the Future *(Panel)* — nearer; embeddings rank 10 | Beyond the Page with Structured Content *(Interview)* — taxonomy: sibling |


**Your call:** 

### UW Medicine *(Case Study)* — agree 1/3

Query: "UW Medicine. A content strategy and information architecture approach for integrating health and wellness content."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Elemeno Health Structured Content Design & Development *(Case Study)* — shared; embeddings rank 3 | WHO Department of Neglected Tropical Diseases *(Case Study)* — taxonomy: sibling |
| 2 | Site Updates: Structure, Semantics & Standards *(Perspective)* — shared; embeddings rank 14 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 3 | Sanity Studio Taxonomy Migration *(Method)* — shared; embeddings rank 30 | Elemeno Health Structured Content Design & Development *(Case Study)* — taxonomy: shared |


**Your call:** 

### Information Architecture for Digital Content *(Interview)* — agree 1/3

Query: "Information Architecture for Digital Content. How information architects use data, stories, and meaning to organize content and bring it to life for the human beings who need it."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Taxonomy and the Headless CMS *(Talk)* — shared; embeddings rank 12 | Beyond the Page with Structured Content *(Interview)* — taxonomy: shared |
| 2 | Beyond the Page with Structured Content *(Interview)* — shared; embeddings rank 1 | Responsive Information Architectures *(Talk)* — taxonomy: no relation |
| 3 | Conversations With Robots: Voice, AI & Structured Content *(Talk)* — shared; embeddings rank 10 | Prototyping Information Architecture *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: What Is Information Architecture? *(Perspective)*; When Do You Need an Information Architect? *(Perspective)*; Delivering Information Architecture *(Perspective)*

**Your call:** 

### What's It Like to Work with an Information Architect? *(Perspective)* — agree 1/3

Query: "What's It Like to Work with an Information Architect?. Information architects work collaboratively to build information environments that support defined user and business goals."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Language + Meaning + User Experience Architecture *(Perspective)* — shared; embeddings rank 5 | What Is Information Architecture? *(Perspective)* — taxonomy: shared |
| 2 | Four Web Writing Style Guides from which to Borrow *(Method)* — shared; embeddings rank 34 | When Do You Need an Information Architect? *(Perspective)* — taxonomy: sibling |
| 3 | What Is Information Architecture? *(Perspective)* — shared; embeddings rank 1 | How to Hire an Information Architect *(Perspective)* — taxonomy: sibling |

Unrestricted, outside the branch: Desiring Ecologies *(Keynote)*

**Your call:** 

### Conversations With Robots: Voice, AI & Structured Content *(Talk)* — agree 1/3

Query: "Conversations With Robots: Voice, AI & Structured Content. Structured content is the precondition for success with voice UI, smart agents, and AI powered search. Here are some real-world examples to help learn how to get…"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 9 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: shared |
| 2 | Taxonomy and the Headless CMS *(Talk)* — shared; embeddings rank 17 | Structured Content in Product Design *(Workshop)* — taxonomy: shared |
| 3 | AI Assisted Content Operations in Practice *(Panel)* — shared; embeddings rank 1 | Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — taxonomy: shared |

Unrestricted, outside the branch: Conversations with Robots: Voice, Smart Agents & the Case for Structured Content *(Perspective)*; Structured Content Design Workflow 2022 *(Method)*; Structured Content and the Headless CMS *(Perspective)*

**Your call:** 

### Design for Difference *(Panel)* — agree 1/3

Query: "Design for Difference. A discussion with IA and UX professionals on how design for difference is practiced, considered, and built upon in the IA community in Seattle."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Language Arts for the Lizard Brain *(Talk)* — nearer; embeddings rank 4 | Design for the Human Scale  *(Keynote)* — taxonomy: nearer |
| 2 | Design for the Human Scale  *(Keynote)* — nearer; embeddings rank 1 | IA, the Current and the Future *(Panel)* — taxonomy: no relation |
| 3 | Domain Modeling for Digital Information Designers *(Workshop)* — nearer; embeddings rank 11 | Desiring Ecologies *(Keynote)* — taxonomy: nearer |

Unrestricted, outside the branch: What Is Information Architecture? *(Perspective)*; Seattle Children's Hospital *(Case Study)*

**Your call:** 

### Prototyping Information Architecture *(Talk)* — agree 1/3

Query: "Prototyping Information Architecture. We prototype and test interaction and visual design — now do the same with your information architecture"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Content First Prototyping *(Talk)* — shared; embeddings rank 1 | Content First Prototyping *(Talk)* — taxonomy: shared |
| 2 | Orchestrating the Mundane: Deskilling Language Models  *(Talk)* — shared; embeddings rank 27 | Responsive Information Architectures *(Talk)* — taxonomy: no relation |
| 3 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 6 | Information Design *(Talk)* — taxonomy: no relation |

Unrestricted, outside the branch: Designing with Code *(Perspective)*; What Is Information Architecture? *(Perspective)*

**Your call:** 

### Seattle Children's Hospital *(Case Study)* — agree 1/3

Query: "Seattle Children's Hospital. Global navigation and home page redesign for a pediatric research hospital. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Shoreline Community College *(Case Study)* — shared; embeddings rank 3 | WHO Department of Neglected Tropical Diseases *(Case Study)* — taxonomy: nearer |
| 2 | Designing with Code *(Perspective)* — shared; embeddings rank 18 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 3 | Purpose-Driven Taxonomy Design *(Method)* — shared; embeddings rank 20 | Shoreline Community College *(Case Study)* — taxonomy: shared |


**Your call:** 

### Content First Prototyping *(Talk)* — agree 1/3

Query: "Content First Prototyping. Explore how to prototype with content and content-driven structure early in the design process – and how to use content-driven design to push your organization or client to think about the actu…"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Prototyping Information Architecture *(Talk)* — shared; embeddings rank 1 | Prototyping Information Architecture *(Talk)* — taxonomy: shared |
| 2 | Information Architecture for Digital Content *(Interview)* — shared; embeddings rank 4 | Structured Content in Product Design *(Workshop)* — taxonomy: sibling |
| 3 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 15 | Taxonomy and the Headless CMS *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: Structured Content Design Workflow 2022 *(Method)*; Designing with Code *(Perspective)*

**Your call:** 

### Design for the Human Scale  *(Keynote)* — agree 1/3

Query: "Design for the Human Scale . Keynote presentation for World IA Day 2017 in Zurich, Switzerland on the topic of embodiment, cognition, belief, and reason."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Desiring Ecologies *(Keynote)* — shared; embeddings rank 10 | IA, the Current and the Future *(Panel)* — taxonomy: no relation |
| 2 | Language Arts for the Lizard Brain *(Talk)* — shared; embeddings rank 3 | Design for Difference *(Panel)* — taxonomy: nearer |
| 3 | Domain Modeling for Digital Information Designers *(Workshop)* — shared; embeddings rank 12 | Language Arts for the Lizard Brain *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)*

**Your call:** 

### Shoreline Community College *(Case Study)* — agree 1/3

Query: "Shoreline Community College. A taxonomy and navigation redesign that helped Shoreline realign their Program pages with site user expectations."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Seattle Children's Hospital *(Case Study)* — shared; embeddings rank 1 | Seattle Children's Hospital *(Case Study)* — taxonomy: shared |
| 2 | Designing with Code *(Perspective)* — shared; embeddings rank 28 | WHO Department of Neglected Tropical Diseases *(Case Study)* — taxonomy: no relation |
| 3 | Purpose-Driven Taxonomy Design *(Method)* — shared; embeddings rank 4 | Site Updates: Structure, Semantics & Standards *(Perspective)* — taxonomy: sibling |


**Your call:** 

### Proust and the Squid *(Book Note)* — agree 1/3

Query: "Proust and the Squid. Learning to read creates physical changes in the brain that directly affect how we think."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Why Shortcuts Aren't the Road *(Web Clipping)* — nearer; embeddings rank 2 | The Calm Before the Storm *(Web Clipping)* — taxonomy: no relation |
| 2 | — | Why Shortcuts Aren't the Road *(Web Clipping)* — taxonomy: nearer |
| 3 | — | SHACL for the Practitioner *(Book Note)* — taxonomy: no relation |

Unrestricted, outside the branch: A Cognitive Sciences Reading List for Designers *(Perspective)*; Browsability with Dan Brown *(Interview)*; Language Arts for the Lizard Brain *(Talk)*

**Your call:** 

### The Trouble with Systems *(Perspective)* — agree 1/3

Query: "The Trouble with Systems. Designing systems is hard, but information architecture gives us the tools to do so consistently and predictably. "

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Designing with Code *(Perspective)* — shared; embeddings rank 8 | Delivering Information Architecture *(Perspective)* — taxonomy: shared |
| 2 | Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 19 | What Is Information Architecture? *(Perspective)* — taxonomy: nearer |
| 3 | Delivering Information Architecture *(Perspective)* — shared; embeddings rank 1 | When Do You Need an Information Architect? *(Perspective)* — taxonomy: nearer |

Unrestricted, outside the branch: Responsive Information Architectures *(Talk)*

**Your call:** 

### Designing and Implementing Semantic Data Layers *(Book Note)* — agree 2/3

Query: "Designing and Implementing Semantic Data Layers. A practical, actionable, architectural approach to making meaning explicit, consistent and durable."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | SHACL for the Practitioner *(Book Note)* — nearer; embeddings rank 1 | SHACL for the Practitioner *(Book Note)* — taxonomy: nearer |
| 2 | The Calm Before the Storm *(Web Clipping)* — sibling; embeddings rank 4 | Designing Content Authoring Experiences *(Book Note)* — taxonomy: no relation |
| 3 | Why Shortcuts Aren't the Road *(Web Clipping)* — sibling; embeddings rank 3 | Why Shortcuts Aren't the Road *(Web Clipping)* — taxonomy: sibling |

Unrestricted, outside the branch: Site Updates: Structure, Semantics & Standards *(Perspective)*; Domain Modeling for Structured Content *(Method)*; Language + Meaning + User Experience Architecture *(Perspective)*

**Your call:** 

### Sanity Studio Taxonomy Migration *(Method)* — agree 2/3

Query: "Sanity Studio Taxonomy Migration. Instructions, templates, and scripts for migrating a taxonomy from a spreadsheet into the Taxonomy Manager tool on Sanity CMS."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | GraphCon 2026 Themes & Takeaways *(Conference Themes)* — shared; embeddings rank 29 | Purpose-Driven Taxonomy Design *(Method)* — taxonomy: shared |
| 2 | Self-Hosting Sanity Studio with GitHub Actions *(Method)* — shared; embeddings rank 2 | Self-Hosting Sanity Studio with GitHub Actions *(Method)* — taxonomy: shared |
| 3 | Purpose-Driven Taxonomy Design *(Method)* — shared; embeddings rank 1 | Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy Management and use in Sanity Studio *(Talk)*; AI Assisted Content Operations in Practice *(Panel)*

**Your call:** 

### Yes, And: Information Architecture in the Age of Artificial Intelligence *(Keynote)* — agree 2/3

Query: "Yes, And: Information Architecture in the Age of Artificial Intelligence. Learn how to harness the capabilities of LLMs to help with workaday IA tasks like classification, text analysis, or audits using deskilling and or…"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Orchestrating the Mundane: Deskilling Language Models  *(Talk)* — shared; embeddings rank 1 | Orchestrating the Mundane: Deskilling Language Models  *(Talk)* — taxonomy: shared |
| 2 | Taxonomy for App Makers *(Talk)* — shared; embeddings rank 26 | AI Assisted Content Operations in Practice *(Panel)* — taxonomy: shared |
| 3 | AI Assisted Content Operations in Practice *(Panel)* — shared; embeddings rank 2 | Conversations With Robots: Voice, AI & Structured Content *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: AI Supported Taxonomy Term Generation *(Method)*; Deskilling Large Language Models *(Method)*

**Your call:** 

### Domain Modeling for Structured Content *(Method)* — agree 2/3

Query: "Domain Modeling for Structured Content. Learn to define the information structures and meaning that help structured content reach further and last longer."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Structured Content Design Workflow 2022 *(Method)* — shared; embeddings rank 2 | Content Modeling in the Age of Flying Cars *(Perspective)* — taxonomy: shared |
| 2 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 4 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 3 | Structured Content Design Workflow *(Method)* — shared; embeddings rank 3 | Structured Content Design Workflow *(Method)* — taxonomy: shared |

Unrestricted, outside the branch: Domain Modeling for Digital Information Designers *(Workshop)*

**Your call:** 

### Delivering Information Architecture *(Perspective)* — agree 2/3

Query: "Delivering Information Architecture. A deep dive into delivering effective IA and staying focused on the right problems."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | When Do You Need an Information Architect? *(Perspective)* — shared; embeddings rank 1 | When Do You Need an Information Architect? *(Perspective)* — taxonomy: shared |
| 2 | What Is Information Architecture? *(Perspective)* — shared; embeddings rank 2 | What Is Information Architecture? *(Perspective)* — taxonomy: shared |
| 3 | Content Review & Approval Workflow Integration *(Case Study)* — shared; embeddings rank 36 | How to Hire an Information Architect *(Perspective)* — taxonomy: shared |


**Your call:** 

### Keyword Extraction with NLP: A Beginner's Guide *(Method)* — agree 2/3

Query: "Keyword Extraction with NLP: A Beginner's Guide. Learn how to extract keywords from unstructured user feedback with Natural Language Processing (NLP)."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | How to Choose Topics for Card Sorting *(Method)* — shared; embeddings rank 1 | How to Choose Topics for Card Sorting *(Method)* — taxonomy: shared |
| 2 | AI Supported Taxonomy Term Generation *(Method)* — shared; embeddings rank 3 | AI Supported Auto-Categorization *(Method)* — taxonomy: nearer |
| 3 | UW Medicine *(Case Study)* — shared; embeddings rank 34 | AI Supported Taxonomy Term Generation *(Method)* — taxonomy: shared |


**Your call:** 

### How to Hire an Information Architect *(Perspective)* — agree 2/3

Query: "How to Hire an Information Architect. Find the right IA for your role with this quick roundup of the different ways IAs staff projects."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | When Do You Need an Information Architect? *(Perspective)* — shared; embeddings rank 1 | When Do You Need an Information Architect? *(Perspective)* — taxonomy: shared |
| 2 | What Is Information Architecture? *(Perspective)* — shared; embeddings rank 2 | What Is Information Architecture? *(Perspective)* — taxonomy: shared |
| 3 | Delivering Information Architecture *(Perspective)* — shared; embeddings rank 4 | What's It Like to Work with an Information Architect? *(Perspective)* — taxonomy: sibling |


**Your call:** 

### What Is Information Architecture? *(Perspective)* — agree 2/3

Query: "What Is Information Architecture?. Information Architecture is the process and the product of designing shared information environments to achieve specific goals."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Delivering Information Architecture *(Perspective)* — shared; embeddings rank 3 | What's It Like to Work with an Information Architect? *(Perspective)* — taxonomy: shared |
| 2 | When Do You Need an Information Architect? *(Perspective)* — shared; embeddings rank 2 | When Do You Need an Information Architect? *(Perspective)* — taxonomy: shared |
| 3 | How to Hire an Information Architect *(Perspective)* — shared; embeddings rank 6 | Delivering Information Architecture *(Perspective)* — taxonomy: shared |


**Your call:** 

### Conversations with Robots: Voice, Smart Agents & the Case for Structured Content *(Perspective)* — agree 2/3

Query: "Conversations with Robots: Voice, Smart Agents & the Case for Structured Content. Learn how to keep your content whole across contexts with linked data."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 2 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 2 | Content Modeling in the Age of Flying Cars *(Perspective)* — shared; embeddings rank 11 | Structured Content and the Headless CMS *(Perspective)* — taxonomy: shared |
| 3 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — shared; embeddings rank 3 | Boutique Knowledge Graphs: Creating Smart Content at Any Scale *(Method)* — taxonomy: shared |

Unrestricted, outside the branch: Conversations With Robots: Voice, AI & Structured Content *(Talk)*

**Your call:** 

### Structured Content Design Workflow *(Method)* — agree 2/3

Query: "Structured Content Design Workflow. Learn to ensure the integrity of content across channels with structured content and linked data."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Site Maps & Connected Content *(Perspective)* — shared; embeddings rank 9 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 2 | Structured Content Design Workflow 2022 *(Method)* — shared; embeddings rank 1 | Domain Modeling for Structured Content *(Method)* — taxonomy: shared |
| 3 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 3 | Structured Content and the Headless CMS *(Perspective)* — taxonomy: shared |

Unrestricted, outside the branch: Structured Content in Product Design *(Workshop)*

**Your call:** 

### Site Maps & Connected Content *(Perspective)* — agree 2/3

Query: "Site Maps & Connected Content. Learn about the complimentary roles site maps and content models play in Content Strategy and IA projects."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Structured Content Design Workflow *(Method)* — shared; embeddings rank 2 | Content Modeling in the Age of Flying Cars *(Perspective)* — taxonomy: shared |
| 2 | Structured Content Design Workflow 2022 *(Method)* — shared; embeddings rank 3 | Structured Content Design Workflow *(Method)* — taxonomy: shared |
| 3 | Structured Content and the Headless CMS *(Perspective)* — shared; embeddings rank 9 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |


**Your call:** 

### Designing with Code *(Perspective)* — agree 2/3

Query: "Designing with Code. The rise of adaptive, flexible content means designers now have more reasons than ever to better understand code."

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | The Trouble with Systems *(Perspective)* — shared; embeddings rank 1 | The Trouble with Systems *(Perspective)* — taxonomy: shared |
| 2 | AI Supported Auto-Categorization *(Method)* — shared; embeddings rank 27 | Structured Content Design Workflow 2022 *(Method)* — taxonomy: shared |
| 3 | Structured Content Design Workflow *(Method)* — shared; embeddings rank 3 | Structured Content Design Workflow *(Method)* — taxonomy: shared |

Unrestricted, outside the branch: Responsive Information Architectures *(Talk)*

**Your call:** 

### Taxonomy for App Makers *(Talk)* — agree 2/3

Query: "Taxonomy for App Makers. An exploration of the changing role of taxonomy work in the world of mobile application design and development"

| | Taxonomy | Embeddings, same branch |
|---|---|---|
| 1 | Taxonomy for Experience Designers *(Workshop)* — shared; embeddings rank 1 | Taxonomy for Experience Designers *(Workshop)* — taxonomy: shared |
| 2 | Taxonomy Management and use in Sanity Studio *(Talk)* — shared; embeddings rank 2 | Taxonomy Management and use in Sanity Studio *(Talk)* — taxonomy: shared |
| 3 | Responsive Information Architectures *(Talk)* — shared; embeddings rank 4 | Taxonomy and the Headless CMS *(Talk)* — taxonomy: shared |

Unrestricted, outside the branch: Taxonomy Boot Camp 2024 Themes & Takeaways *(Conference Themes)*; Taxonomy Boot Camp 2022 Themes & Takeaways *(Conference Themes)*

**Your call:** 

## Full agreement (2 pages, not listed above)

when-to-use-an-ia, taxonomy-for-experience-designers
