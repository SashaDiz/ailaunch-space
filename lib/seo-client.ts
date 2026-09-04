/**
 * SEO helpers that are safe to import from client components.
 *
 * `lib/seo.ts` reaches into server-only modules (`lib/blog.ts` pulls in
 * `node:fs` for the markdown posts), so importing it from a `"use client"`
 * file drags those into the browser bundle and webpack fails the build with
 * `UnhandledSchemeError: Reading from "node:fs" is not handled by plugins`.
 * Anything a client component needs lives here instead, with no dependencies.
 */

/**
 * Serialize an object for `<script type="application/ld+json">`.
 *
 * `JSON.stringify` alone is not safe inside a <script> element: a `</script>`
 * sequence anywhere in the data (a project name, a description a user wrote)
 * closes the tag early and everything after it is parsed as HTML. Escaping the
 * three characters that can start a tag — and the two Unicode line separators
 * that are legal in JSON but not in JavaScript string literals — keeps the
 * payload inert while staying valid JSON-LD.
 *
 * Always use this instead of JSON.stringify() for dangerouslySetInnerHTML.
 */
export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
