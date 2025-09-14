# Standardized LLM Test Prompts for Ebook Generation Platform

## Testing Objectives
- Evaluate consistency across 5,000-7,000 word chapters
- Test instruction-following capabilities
- Assess quality and engagement levels
- Compare token usage efficiency between Claude and GPT-4
- Measure adherence to genre conventions

---

## MYSTERY GENRE TEST PROMPTS

### Test Prompt 1: Murder Mystery - Chapter 1 Opening
```
Write Chapter 1 of a murder mystery novel (5,000-7,000 words). Follow these specific requirements:

**Plot Setup:**
- Setting: Small coastal town in Maine, winter season
- Protagonist: Female detective Sarah Chen, 35, recently transferred from Boston
- Crime: Local bookstore owner found dead in locked shop
- Tone: Atmospheric, psychological tension

**Chapter Structure Requirements:**
1. Open with discovery of the crime scene (1,000-1,500 words)
2. Introduce protagonist's background and motivation (1,000 words)
3. Initial investigation and first clues (1,500-2,000 words)
4. Introduce 3 potential suspects with clear motives (1,000 words)
5. End with a compelling hook/twist (500-1,000 words)

**Writing Style Guidelines:**
- Third person limited POV (Sarah's perspective only)
- Show don't tell approach for character development
- Include sensory details for atmosphere
- Balance dialogue and narrative description (60/40 ratio)
- Include one red herring clue
- Create tension without revealing the solution

**Technical Requirements:**
- Maintain consistent pacing throughout
- Use proper mystery novel conventions
- Include at least 5 characters with distinct voices
- Word count: 5,000-7,000 words exactly
```

### Test Prompt 2: Cozy Mystery - Chapter 3 Investigation
```
Write Chapter 3 of a cozy mystery series (5,000-7,000 words). Follow these specific requirements:

**Context:**
- Series: "Lavender Hill Mysteries" 
- Protagonist: Emma Hartwell, 42, bakery owner and amateur sleuth
- Setting: English village of Little Wickham
- Crime: Theft of valuable antique from local manor
- Previous chapters established the crime and initial suspects

**Chapter 3 Focus:**
1. Emma conducts interviews with 4 key suspects (2,000 words)
2. Discovery of crucial physical evidence (1,000 words)  
3. Red herring revelation that misdirects investigation (1,500 words)
4. Personal subplot: Emma's relationship with Detective Inspector Mills (1,000 words)
5. Chapter ends with unexpected second crime (500-1,000 words)

**Cozy Mystery Requirements:**
- No graphic violence or explicit content
- Emphasis on puzzle-solving and deduction
- Strong sense of community and local characters
- Include local customs/traditions
- Light romantic tension
- Amateur sleuth uses intuition and observation

**Technical Specifications:**
- First person narrative (Emma's POV)
- British English spelling and idioms
- Include dialogue tags that reveal character personality
- Clues should be fair to the reader
- Word count: 5,000-7,000 words exactly
```

---

## SELF-HELP GENRE TEST PROMPTS

### Test Prompt 3: Productivity Self-Help - Chapter 2
```
Write Chapter 2 of a productivity self-help book (5,000-7,000 words). Follow these specific requirements:

**Book Context:**
- Title: "The Focus Formula: Mastering Deep Work in a Distracted World"
- Target Audience: Knowledge workers, entrepreneurs, students
- Author Persona: Productivity expert with 15 years corporate experience

**Chapter 2 Title:** "The Neuroscience of Attention: Why Your Brain Fights Focus"

**Chapter Structure Requirements:**
1. Hook opening with relatable scenario (300-500 words)
2. Scientific explanation of attention and distraction (1,500-2,000 words)
3. Three core principles with supporting research (2,000-2,500 words)
4. Practical implementation strategies (1,000-1,500 words)
5. Actionable exercises and chapter summary (500-700 words)

**Content Specifications:**
- Include 3-5 scientific studies with citations
- Use storytelling to explain complex concepts
- Provide specific, measurable action steps
- Include real-world case studies (2-3 examples)
- Address common objections/obstacles
- End with clear next steps for readers

**Writing Style Requirements:**
- Conversational yet authoritative tone
- Second person address ("you") throughout
- Use analogies and metaphors for complex ideas
- Include bullet points and numbered lists
- Bold key concepts for emphasis
- Word count: 5,000-7,000 words exactly
```

### Test Prompt 4: Personal Development - Chapter 5
```
Write Chapter 5 of a personal development book (5,000-7,000 words). Follow these specific requirements:

**Book Context:**
- Title: "Resilient Mindset: Transform Life Challenges into Growth Opportunities"
- Target Audience: Adults facing major life transitions
- Tone: Empathetic, empowering, research-backed

**Chapter 5 Title:** "The Phoenix Method: Rising Stronger from Setbacks"

**Chapter Structure Requirements:**
1. Personal story opening about overcoming failure (800-1,000 words)
2. The psychology of resilience and post-traumatic growth (1,500-2,000 words)
3. The 5-step Phoenix Method framework (2,500-3,000 words)
4. Implementation guide with worksheets (1,000-1,500 words)
5. Inspiring success stories and chapter wrap-up (700-1,000 words)

**Content Requirements:**
- Include psychological research and expert quotes
- Provide step-by-step methodology
- Address emotional and practical aspects
- Include self-assessment tools
- Offer alternative approaches for different personality types
- Connect to previous and future chapters

**Technical Specifications:**
- Inspirational but grounded in science
- Include sidebar boxes with key insights
- Use personal pronouns to create connection
- Provide concrete examples and case studies
- Include reflection questions throughout
- Word count: 5,000-7,000 words exactly
```

---

## EVALUATION CRITERIA FOR ALL PROMPTS

### Quality Assessment (1-10 Scale)
1. **Adherence to Instructions** - Follows all specified requirements
2. **Genre Conventions** - Proper use of mystery/self-help elements
3. **Writing Quality** - Grammar, style, readability
4. **Engagement Factor** - Compelling content that holds attention
5. **Structural Coherence** - Logical flow and organization
6. **Character/Content Development** - Depth and authenticity
7. **Word Count Accuracy** - Meets 5,000-7,000 word requirement
8. **Consistency** - Maintains tone and style throughout

### Technical Metrics to Track
- Total tokens used (input + output)
- Generation time
- Cost per chapter
- Number of revisions needed
- Coherence across chapter length

### Instruction-Following Test Points
- Specific word count requirements
- POV consistency
- Required structural elements
- Genre-specific conventions
- Technical formatting requirements

---

## TESTING PROTOCOL

1. **Run each prompt on both Claude and GPT-4**
2. **Generate 3 variations per prompt per model** (12 total samples)
3. **Evaluate using standardized scoring rubric**
4. **Calculate cost per word and total generation expense**
5. **Document quality consistency across samples**
6. **Test revision capabilities with specific feedback**

Total estimated testing cost: $150-300 based on current token pricing
Estimated completion time: 4-6 hours for full evaluation