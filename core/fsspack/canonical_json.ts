import crypto from 'crypto';

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS) Implementation.
 * 
 * Provides deterministic serialization of JSON data structures:
 * 1. Object keys sorted by UTF-16 code units.
 * 2. Numbers formatted per ECMAScript specification (standard IEEE-754, -0 normalized to 0).
 * 3. Minimal escaping for strings (only quote, backslash, and ASCII control characters 0x00-0x1F).
 * 4. Zero insignificant whitespace.
 */

function escapeStringJCS(str: string): string {
  let result = '"';
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    const code = str.charCodeAt(i);

    if (c === '"') {
      result += '\\"';
    } else if (c === '\\') {
      result += '\\\\';
    } else if (c === '\b') {
      result += '\\b';
    } else if (c === '\f') {
      result += '\\f';
    } else if (c === '\n') {
      result += '\\n';
    } else if (c === '\r') {
      result += '\\r';
    } else if (c === '\t') {
      result += '\\t';
    } else if (code < 0x20) {
      result += '\\u00' + code.toString(16).padStart(2, '0');
    } else {
      result += c;
    }
  }
  result += '"';
  return result;
}

function canonicalizeNumber(num: number): string {
  if (!Number.isFinite(num)) {
    throw new TypeError(`Cannot canonicalize non-finite number: ${num}`);
  }
  // RFC 8785: -0 must be serialized as 0
  if (Object.is(num, -0) || num === 0) {
    return '0';
  }
  return num.toString();
}

/**
 * Recursively canonicalizes a JavaScript value according to RFC 8785.
 */
export function canonicalizeJson(value: any): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return canonicalizeNumber(value);
  }
  if (typeof value === 'string') {
    return escapeStringJCS(value);
  }
  if (Array.isArray(value)) {
    const elements = value.map(elem => {
      if (elem === undefined || typeof elem === 'symbol' || typeof elem === 'function') {
        return 'null';
      }
      return canonicalizeJson(elem);
    });
    return '[' + elements.join(',') + ']';
  }
  if (typeof value === 'object') {
    // If object has a toJSON method, call it first
    if (typeof value.toJSON === 'function') {
      return canonicalizeJson(value.toJSON());
    }

    const keys = Object.keys(value).filter(k => {
      const v = value[k];
      return v !== undefined && typeof v !== 'symbol' && typeof v !== 'function';
    });

    // RFC 8785 requires keys to be sorted lexicographically by UTF-16 code units
    keys.sort((a, b) => {
      const minLen = Math.min(a.length, b.length);
      for (let i = 0; i < minLen; i++) {
        const ca = a.charCodeAt(i);
        const cb = b.charCodeAt(i);
        if (ca !== cb) {
          return ca - cb;
        }
      }
      return a.length - b.length;
    });

    const entries = keys.map(k => {
      const keyEscaped = escapeStringJCS(k);
      const valCanonical = canonicalizeJson(value[k]);
      return `${keyEscaped}:${valCanonical}`;
    });

    return '{' + entries.join(',') + '}';
  }

  throw new TypeError(`Unsupported type for canonical JSON: ${typeof value}`);
}

/**
 * Computes the SHA-256 hex digest of a canonical string using Node.js crypto.
 */
export function computeSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Convenience function: canonicalizes an object per RFC 8785 and computes its SHA-256.
 */
export function canonicalHash(value: any): { canonicalJson: string; sha256: string } {
  const canonicalJson = canonicalizeJson(value);
  const sha256 = computeSha256(canonicalJson);
  return { canonicalJson, sha256 };
}
