const terms = [
  ['baseline', 'The end line of the court behind each basket.'],
  ['half court', 'The line across the middle of the court.'],
  ['free-throw line', 'The shooting line in front of the basket.'],
  ['lane', 'The painted rectangle in front of the basket.'],
  ['paint', 'The painted rectangle in front of the basket.'],
  ['wing', 'An area to the left or right of the basket, between the corner and the top.'],
  ['corner', 'The area near the side and end lines beside the basket.'],
  ['layup', 'A close shot taken while stepping toward the basket.'],
  ['crossover', 'A dribble that moves the ball from one hand to the other in front of your body.'],
  ['closeout', 'Moving toward a shooter, then slowing into a balanced defensive stance.'],
  ['box out', 'Turning to place your body between an opponent and the basket for a rebound.'],
  ['follow-through', 'Keeping your shooting arm extended and wrist relaxed after releasing the ball.'],
  ['athletic stance', 'Feet apart, knees bent, chest up, and weight balanced so you can move.'],
  ['drop step', 'Opening one foot and hip backward to turn and run without losing balance.'],
  ['hesitation', 'Briefly slowing your dribble to make a defender pause before you speed up.'],
  ['in-and-out', 'Moving the ball across and back with the same hand to fake a crossover.'],
];

export function DrillInstructions({ instructions, dark = false }) {
  const lines = (instructions || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const steps = lines.filter((line) => /^\d+\.\s/.test(line));
  const tip = lines.find((line) => /^Tip:\s*/i.test(line));
  const explanations = lines.filter((line) => !/^\d+\.\s/.test(line) && line !== tip);
  const explainedTerms = terms.filter(([term]) => new RegExp(`\\b${term}\\b`, 'i').test(instructions || ''));

  if (!steps.length) return <p className="drill-instructions-fallback">{instructions}</p>;

  return (
    <div className={`drill-instructions ${dark ? 'drill-instructions--dark' : ''}`}>
      <h3>Follow these steps</h3>
      <ol>
        {steps.map((step) => <li key={step}>{step.replace(/^\d+\.\s*/, '')}</li>)}
      </ol>
      {explanations.map((line, index) => <p key={`${index}-${line}`} className="drill-workload">{line}</p>)}
      {tip && <p className="drill-instructions-tip"><strong>Form cue:</strong> {tip.replace(/^Tip:\s*/i, '')}</p>}
      {explainedTerms.length > 0 && (
        <details className="drill-terms">
          <summary>What do these terms mean?</summary>
          <dl>
            {explainedTerms.map(([term, meaning]) => (
              <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}
