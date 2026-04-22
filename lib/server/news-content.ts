import 'server-only';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_NEWS_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'h4',
  'a',
] as const;

export function sanitizeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeNewsHtml(value: string | null | undefined): string {
  return sanitizeHtml(value ?? '', {
    allowedTags: [...ALLOWED_NEWS_TAGS],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tagName, attribs) => {
        const href = sanitizeExternalUrl(attribs.href);
        const safeAttribs: Record<string, string> = href
          ? {
              href,
              target: '_blank',
              rel: 'noopener noreferrer nofollow',
            }
          : {};

        return {
          tagName: 'a',
          attribs: safeAttribs,
        };
      },
    },
  }).trim();
}
