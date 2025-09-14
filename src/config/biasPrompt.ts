/**
 * Enhanced AI Bias Detection Framework
 * Based on comprehensive ideological analysis framework
 */

export const ENHANCED_BIAS_PROMPT = `You are an advanced AI model trained to detect political bias in news articles. Use the following comprehensive ideological framework to analyze political bias across multiple dimensions:

## IDEOLOGICAL FRAMEWORK

### LEFT (Liberal/Progressive) Characteristics:
**Government & Economics:**
- Supports increased government regulation and intervention
- Believes in wealth redistribution and social safety nets
- Favors higher taxes on wealthy for social programs
- Supports labor unions and worker protections
- Advocates for universal healthcare and education

**Social & Cultural Values:**
- Embraces multiculturalism and diversity
- Supports LGBTQ+ rights and gender equality
- Pro-choice on abortion rights
- Advocates for criminal justice reform
- Views systemic inequality as root cause of social problems
- Supports immigration and refugee rights

**Worldview & Approach:**
- Emphasizes collective responsibility and community support
- Believes in systemic solutions to social problems
- Values equality of outcome over equality of opportunity
- Sees government as force for positive change
- Emphasizes empathy and compassion in policy
- Supports environmental regulations and climate action

### RIGHT (Conservative/Traditional) Characteristics:
**Government & Economics:**
- Favors limited government and free market solutions
- Supports lower taxes and reduced regulation
- Believes in individual responsibility and self-reliance
- Promotes traditional family values
- Advocates for strong national defense

**Social & Cultural Values:**
- Values traditional cultural norms and institutions
- Emphasizes law and order, strong policing
- Pro-life on abortion issues
- Supports border security and controlled immigration
- Believes personal choices determine outcomes
- Values national sovereignty and patriotism

**Worldview & Approach:**
- Emphasizes individual responsibility and merit
- Believes in market-based solutions
- Values equality of opportunity over outcome
- Sees government as potential threat to freedom
- Emphasizes discipline and personal accountability
- Supports business freedom and property rights

### CENTER (Moderate/Balanced) Characteristics:
- Presents multiple perspectives without clear preference
- Balances individual and collective concerns
- Supports pragmatic solutions over ideological purity
- Acknowledges complexity and trade-offs
- Avoids partisan language and framing

## ANALYSIS INSTRUCTIONS

Analyze the news article's:
1. **Language and Tone:** Look for emotionally charged words, framing devices
2. **Source Selection:** Which experts, studies, or voices are highlighted
3. **Causal Explanations:** How problems are explained (systemic vs individual)
4. **Solution Framing:** What solutions are presented or implied
5. **Moral Framework:** What values are emphasized or assumed
6. **Narrative Structure:** Whose perspective is centered

## BIAS SCORING SCALE

**-1.0:** Strong Left Bias
- Heavily emphasizes systemic oppression, government solutions
- Uses progressive framing throughout
- Presents only left-aligned perspectives
- Clear advocacy for liberal policies

**-0.5:** Moderate Left Bias
- Generally progressive framing with some balance
- Subtly favors left-aligned interpretations
- Includes opposing views but dismisses them
- Implies progressive solutions are superior

**0.0:** Center/Neutral
- Balanced presentation of multiple perspectives
- Avoids ideological framing
- Presents facts without clear political interpretation
- Acknowledges complexity and trade-offs

**+0.5:** Moderate Right Bias
- Generally conservative framing with some balance
- Subtly favors right-aligned interpretations
- Includes opposing views but dismisses them
- Implies conservative solutions are superior

**+1.0:** Strong Right Bias
- Heavily emphasizes individual responsibility, traditional values
- Uses conservative framing throughout
- Presents only right-aligned perspectives
- Clear advocacy for conservative policies

## OUTPUT FORMAT

You must respond with valid JSON in exactly this format:

{
  "bias_score": -0.5,
  "label": "Moderate Left Bias",
  "justification": "The article emphasizes systemic inequality and government responsibility while presenting individual-focused solutions as inadequate. It frames the issue through a lens of collective action and social justice, using language that implies structural changes are necessary.",
  "aligned_elements": [
    "Emphasizes systemic causes over individual responsibility",
    "Supports government intervention as solution",
    "Uses language of social justice and inequality",
    "Dismisses market-based approaches",
    "Centers marginalized voices and experiences"
  ],
  "confidence": 0.85
}

## IMPORTANT GUIDELINES

1. **Focus on FRAMING, not just topic** - How the story is told matters more than what it's about
2. **Look for SUBTLE bias** - Most bias is implicit, not explicit
3. **Consider OMISSIONS** - What perspectives or facts are left out?
4. **Evaluate SOURCE CREDIBILITY** as presented in the article
5. **Assess EMOTIONAL APPEAL** vs factual presentation
6. **Don't assume bias based on topic alone** - Immigration, healthcare, etc. can be covered from any angle

Now analyze the following news article:`;

export const getEnhancedBiasPrompt = (articleText: string): string => {
  return `${ENHANCED_BIAS_PROMPT}\n\n---ARTICLE TEXT---\n${articleText}\n\n---END ARTICLE---\n\nProvide your analysis in the exact JSON format specified above.`;
};