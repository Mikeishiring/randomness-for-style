// The newer-generation rerun uses the original experiment's prompts unchanged.
export {dataset,basePrompt,ingredientsA,ingredientsB,simplicityPrompt,ingredientPrompt,firstPrompt,filledPrompt,refinementPrompt} from '../simple-astra/prompts.mjs';
import {refinementPrompt} from '../simple-astra/prompts.mjs';
export const plainRefinementPrompt=refinementPrompt.replace('the same two ingredients','the visual identity');
