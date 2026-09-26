import type { Who } from "../i18n";
import type { TaxRules } from "../rules";
import type { OpenDetails } from "../ui/dom";

/** What every section needs to draw itself. */
export interface View {
  rules: TaxRules;
  /** "You", "Your partner" or the typed name of person `p`. */
  who: (p: number) => Who;
  /** Which "Show me why" toggles are open, so a redraw keeps them open. */
  details: OpenDetails;
}
