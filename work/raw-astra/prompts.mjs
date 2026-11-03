import {data} from '../fixed-report/data.mjs';
export const dataset={period:data.period,synthetic:true,daily:data.daily,sources:data.sources};
export const basePrompt='Create a one-page website that helps its owner understand this week’s website performance using the supplied synthetic data. Use only the supplied figures. Return a complete, self-contained HTML page.';
export const ingredientPrompt='Combine Cthulhu and fast food into a distinct visual identity.';
export const refinementPrompt='Harshly critique the result, then refine it. Make the design more original, raise the quality, and lean further into the Cthulhu × fast food identity. Keep the same purpose and supplied data. Return the complete revised HTML page.';
export const filledBase=basePrompt+'\n\nSynthetic data:\n'+JSON.stringify(dataset,null,2);
export const filledIngredient=basePrompt+'\n\n'+ingredientPrompt+'\n\nSynthetic data:\n'+JSON.stringify(dataset,null,2);
