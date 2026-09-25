/**
 * A small answer pill at the bottom of the screen, shown only while the answer card is out of view.
 * Returns a function to update its content; pass null when there is no answer yet.
 */
export function floatingAnswer(answerCard: HTMLElement, pill: HTMLButtonElement): (html: string | null) => void {
  let answerInView = true;
  let hasAnswer = false;
  const sync = () => {
    pill.hidden = answerInView || !hasAnswer;
  };
  new IntersectionObserver(([entry]) => {
    answerInView = entry?.isIntersecting ?? true;
    sync();
  }).observe(answerCard);
  pill.addEventListener("click", () => answerCard.scrollIntoView({ behavior: "smooth", block: "start" }));
  return (html) => {
    hasAnswer = html !== null;
    if (html !== null) pill.innerHTML = html;
    sync();
  };
}
