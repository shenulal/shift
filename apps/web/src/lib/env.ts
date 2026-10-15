/** The hosted review build runs in a sandboxed frame that blocks printing and file downloads. */
export const canPrint = !__HOSTED__;
export const HOSTED_NOTE = 'Printing and PDF downloads work in the installed app; this hosted preview can’t open print or save files.';
