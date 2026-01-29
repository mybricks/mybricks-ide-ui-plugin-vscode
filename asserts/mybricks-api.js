(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MyBricksAPI = {}));
})(this, (function (exports) { 'use strict';

  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r);
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  class JSONRepairError extends Error {
    constructor(message, position) {
      super(`${message} at position ${position}`);
      this.position = position;
    }
  }

  const codeSpace = 0x20; // " "
  const codeNewline = 0xa; // "\n"
  const codeTab = 0x9; // "\t"
  const codeReturn = 0xd; // "\r"
  const codeNonBreakingSpace = 0xa0;
  const codeEnQuad = 0x2000;
  const codeHairSpace = 0x200a;
  const codeNarrowNoBreakSpace = 0x202f;
  const codeMediumMathematicalSpace = 0x205f;
  const codeIdeographicSpace = 0x3000;
  function isHex(char) {
    return /^[0-9A-Fa-f]$/.test(char);
  }
  function isDigit(char) {
    return char >= '0' && char <= '9';
  }
  function isValidStringCharacter(char) {
    // note that the valid range is between \u{0020} and \u{10ffff},
    // but in JavaScript it is not possible to create a code point larger than
    // \u{10ffff}, so there is no need to test for that here.
    return char >= '\u0020';
  }
  function isDelimiter(char) {
    return ',:[]/{}()\n+'.includes(char);
  }
  function isFunctionNameCharStart(char) {
    return char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z' || char === '_' || char === '$';
  }
  function isFunctionNameChar(char) {
    return char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z' || char === '_' || char === '$' || char >= '0' && char <= '9';
  }

  // matches "https://" and other schemas
  const regexUrlStart = /^(http|https|ftp|mailto|file|data|irc):\/\/$/;

  // matches all valid URL characters EXCEPT "[", "]", and ",", since that are important JSON delimiters
  const regexUrlChar = /^[A-Za-z0-9-._~:/?#@!$&'()*+;=]$/;
  function isUnquotedStringDelimiter(char) {
    return ',[]/{}\n+'.includes(char);
  }
  function isStartOfValue(char) {
    return isQuote(char) || regexStartOfValue.test(char);
  }

  // alpha, number, minus, or opening bracket or brace
  const regexStartOfValue = /^[[{\w-]$/;
  function isControlCharacter(char) {
    return char === '\n' || char === '\r' || char === '\t' || char === '\b' || char === '\f';
  }
  /**
   * Check if the given character is a whitespace character like space, tab, or
   * newline
   */
  function isWhitespace(text, index) {
    const code = text.charCodeAt(index);
    return code === codeSpace || code === codeNewline || code === codeTab || code === codeReturn;
  }

  /**
   * Check if the given character is a whitespace character like space or tab,
   * but NOT a newline
   */
  function isWhitespaceExceptNewline(text, index) {
    const code = text.charCodeAt(index);
    return code === codeSpace || code === codeTab || code === codeReturn;
  }

  /**
   * Check if the given character is a special whitespace character, some
   * unicode variant
   */
  function isSpecialWhitespace(text, index) {
    const code = text.charCodeAt(index);
    return code === codeNonBreakingSpace || code >= codeEnQuad && code <= codeHairSpace || code === codeNarrowNoBreakSpace || code === codeMediumMathematicalSpace || code === codeIdeographicSpace;
  }

  /**
   * Test whether the given character is a quote or double quote character.
   * Also tests for special variants of quotes.
   */
  function isQuote(char) {
    // the first check double quotes, since that occurs most often
    return isDoubleQuoteLike(char) || isSingleQuoteLike(char);
  }

  /**
   * Test whether the given character is a double quote character.
   * Also tests for special variants of double quotes.
   */
  function isDoubleQuoteLike(char) {
    return char === '"' || char === '\u201c' || char === '\u201d';
  }

  /**
   * Test whether the given character is a double quote character.
   * Does NOT test for special variants of double quotes.
   */
  function isDoubleQuote(char) {
    return char === '"';
  }

  /**
   * Test whether the given character is a single quote character.
   * Also tests for special variants of single quotes.
   */
  function isSingleQuoteLike(char) {
    return char === "'" || char === '\u2018' || char === '\u2019' || char === '\u0060' || char === '\u00b4';
  }

  /**
   * Test whether the given character is a single quote character.
   * Does NOT test for special variants of single quotes.
   */
  function isSingleQuote(char) {
    return char === "'";
  }

  /**
   * Strip last occurrence of textToStrip from text
   */
  function stripLastOccurrence(text, textToStrip) {
    let stripRemainingText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const index = text.lastIndexOf(textToStrip);
    return index !== -1 ? text.substring(0, index) + (stripRemainingText ? '' : text.substring(index + 1)) : text;
  }
  function insertBeforeLastWhitespace(text, textToInsert) {
    let index = text.length;
    if (!isWhitespace(text, index - 1)) {
      // no trailing whitespaces
      return text + textToInsert;
    }
    while (isWhitespace(text, index - 1)) {
      index--;
    }
    return text.substring(0, index) + textToInsert + text.substring(index);
  }
  function removeAtIndex(text, start, count) {
    return text.substring(0, start) + text.substring(start + count);
  }

  /**
   * Test whether a string ends with a newline or comma character and optional whitespace
   */
  function endsWithCommaOrNewline(text) {
    return /[,\n][ \t\r]*$/.test(text);
  }

  const controlCharacters = {
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t'
  };

  // map with all escape characters
  const escapeCharacters = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
    // note that \u is handled separately in parseString()
  };

  /**
   * Repair a string containing an invalid JSON document.
   * For example changes JavaScript notation into JSON notation.
   *
   * Example:
   *
   *     try {
   *       const json = "{name: 'John'}"
   *       const repaired = jsonrepair(json)
   *       console.log(repaired)
   *       // '{"name": "John"}'
   *     } catch (err) {
   *       console.error(err)
   *     }
   *
   */
  function jsonrepair(text) {
    let i = 0; // current index in text
    let output = ''; // generated output

    parseMarkdownCodeBlock(['```', '[```', '{```']);
    const processed = parseValue();
    if (!processed) {
      throwUnexpectedEnd();
    }
    parseMarkdownCodeBlock(['```', '```]', '```}']);
    const processedComma = parseCharacter(',');
    if (processedComma) {
      parseWhitespaceAndSkipComments();
    }
    if (isStartOfValue(text[i]) && endsWithCommaOrNewline(output)) {
      // start of a new value after end of the root level object: looks like
      // newline delimited JSON -> turn into a root level array
      if (!processedComma) {
        // repair missing comma
        output = insertBeforeLastWhitespace(output, ',');
      }
      parseNewlineDelimitedJSON();
    } else if (processedComma) {
      // repair: remove trailing comma
      output = stripLastOccurrence(output, ',');
    }

    // repair redundant end quotes
    while (text[i] === '}' || text[i] === ']') {
      i++;
      parseWhitespaceAndSkipComments();
    }
    if (i >= text.length) {
      // reached the end of the document properly
      return output;
    }
    throwUnexpectedCharacter();
    function parseValue() {
      parseWhitespaceAndSkipComments();
      const processed = parseObject() || parseArray() || parseString() || parseNumber() || parseKeywords() || parseUnquotedString(false) || parseRegex();
      parseWhitespaceAndSkipComments();
      return processed;
    }
    function parseWhitespaceAndSkipComments() {
      let skipNewline = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      const start = i;
      let changed = parseWhitespace(skipNewline);
      do {
        changed = parseComment();
        if (changed) {
          changed = parseWhitespace(skipNewline);
        }
      } while (changed);
      return i > start;
    }
    function parseWhitespace(skipNewline) {
      const _isWhiteSpace = skipNewline ? isWhitespace : isWhitespaceExceptNewline;
      let whitespace = '';
      while (true) {
        if (_isWhiteSpace(text, i)) {
          whitespace += text[i];
          i++;
        } else if (isSpecialWhitespace(text, i)) {
          // repair special whitespace
          whitespace += ' ';
          i++;
        } else {
          break;
        }
      }
      if (whitespace.length > 0) {
        output += whitespace;
        return true;
      }
      return false;
    }
    function parseComment() {
      // find a block comment '/* ... */'
      if (text[i] === '/' && text[i + 1] === '*') {
        // repair block comment by skipping it
        while (i < text.length && !atEndOfBlockComment(text, i)) {
          i++;
        }
        i += 2;
        return true;
      }

      // find a line comment '// ...'
      if (text[i] === '/' && text[i + 1] === '/') {
        // repair line comment by skipping it
        while (i < text.length && text[i] !== '\n') {
          i++;
        }
        return true;
      }
      return false;
    }
    function parseMarkdownCodeBlock(blocks) {
      // find and skip over a Markdown fenced code block:
      //     ``` ... ```
      // or
      //     ```json ... ```
      if (skipMarkdownCodeBlock(blocks)) {
        if (isFunctionNameCharStart(text[i])) {
          // strip the optional language specifier like "json"
          while (i < text.length && isFunctionNameChar(text[i])) {
            i++;
          }
        }
        parseWhitespaceAndSkipComments();
        return true;
      }
      return false;
    }
    function skipMarkdownCodeBlock(blocks) {
      parseWhitespace(true);
      for (const block of blocks) {
        const end = i + block.length;
        if (text.slice(i, end) === block) {
          i = end;
          return true;
        }
      }
      return false;
    }
    function parseCharacter(char) {
      if (text[i] === char) {
        output += text[i];
        i++;
        return true;
      }
      return false;
    }
    function skipCharacter(char) {
      if (text[i] === char) {
        i++;
        return true;
      }
      return false;
    }
    function skipEscapeCharacter() {
      return skipCharacter('\\');
    }

    /**
     * Skip ellipsis like "[1,2,3,...]" or "[1,2,3,...,9]" or "[...,7,8,9]"
     * or a similar construct in objects.
     */
    function skipEllipsis() {
      parseWhitespaceAndSkipComments();
      if (text[i] === '.' && text[i + 1] === '.' && text[i + 2] === '.') {
        // repair: remove the ellipsis (three dots) and optionally a comma
        i += 3;
        parseWhitespaceAndSkipComments();
        skipCharacter(',');
        return true;
      }
      return false;
    }

    /**
     * Parse an object like '{"key": "value"}'
     */
    function parseObject() {
      if (text[i] === '{') {
        output += '{';
        i++;
        parseWhitespaceAndSkipComments();

        // repair: skip leading comma like in {, message: "hi"}
        if (skipCharacter(',')) {
          parseWhitespaceAndSkipComments();
        }
        let initial = true;
        while (i < text.length && text[i] !== '}') {
          let processedComma;
          if (!initial) {
            processedComma = parseCharacter(',');
            if (!processedComma) {
              // repair missing comma
              output = insertBeforeLastWhitespace(output, ',');
            }
            parseWhitespaceAndSkipComments();
          } else {
            processedComma = true;
            initial = false;
          }
          skipEllipsis();
          const processedKey = parseString() || parseUnquotedString(true);
          if (!processedKey) {
            if (text[i] === '}' || text[i] === '{' || text[i] === ']' || text[i] === '[' || text[i] === undefined) {
              // repair trailing comma
              output = stripLastOccurrence(output, ',');
            } else {
              throwObjectKeyExpected();
            }
            break;
          }
          parseWhitespaceAndSkipComments();
          const processedColon = parseCharacter(':');
          const truncatedText = i >= text.length;
          if (!processedColon) {
            if (isStartOfValue(text[i]) || truncatedText) {
              // repair missing colon
              output = insertBeforeLastWhitespace(output, ':');
            } else {
              throwColonExpected();
            }
          }
          const processedValue = parseValue();
          if (!processedValue) {
            if (processedColon || truncatedText) {
              // repair missing object value
              output += 'null';
            } else {
              throwColonExpected();
            }
          }
        }
        if (text[i] === '}') {
          output += '}';
          i++;
        } else {
          // repair missing end bracket
          output = insertBeforeLastWhitespace(output, '}');
        }
        return true;
      }
      return false;
    }

    /**
     * Parse an array like '["item1", "item2", ...]'
     */
    function parseArray() {
      if (text[i] === '[') {
        output += '[';
        i++;
        parseWhitespaceAndSkipComments();

        // repair: skip leading comma like in [,1,2,3]
        if (skipCharacter(',')) {
          parseWhitespaceAndSkipComments();
        }
        let initial = true;
        while (i < text.length && text[i] !== ']') {
          if (!initial) {
            const processedComma = parseCharacter(',');
            if (!processedComma) {
              // repair missing comma
              output = insertBeforeLastWhitespace(output, ',');
            }
          } else {
            initial = false;
          }
          skipEllipsis();
          const processedValue = parseValue();
          if (!processedValue) {
            // repair trailing comma
            output = stripLastOccurrence(output, ',');
            break;
          }
        }
        if (text[i] === ']') {
          output += ']';
          i++;
        } else {
          // repair missing closing array bracket
          output = insertBeforeLastWhitespace(output, ']');
        }
        return true;
      }
      return false;
    }

    /**
     * Parse and repair Newline Delimited JSON (NDJSON):
     * multiple JSON objects separated by a newline character
     */
    function parseNewlineDelimitedJSON() {
      // repair NDJSON
      let initial = true;
      let processedValue = true;
      while (processedValue) {
        if (!initial) {
          // parse optional comma, insert when missing
          const processedComma = parseCharacter(',');
          if (!processedComma) {
            // repair: add missing comma
            output = insertBeforeLastWhitespace(output, ',');
          }
        } else {
          initial = false;
        }
        processedValue = parseValue();
      }
      if (!processedValue) {
        // repair: remove trailing comma
        output = stripLastOccurrence(output, ',');
      }

      // repair: wrap the output inside array brackets
      output = `[\n${output}\n]`;
    }

    /**
     * Parse a string enclosed by double quotes "...". Can contain escaped quotes
     * Repair strings enclosed in single quotes or special quotes
     * Repair an escaped string
     *
     * The function can run in two stages:
     * - First, it assumes the string has a valid end quote
     * - If it turns out that the string does not have a valid end quote followed
     *   by a delimiter (which should be the case), the function runs again in a
     *   more conservative way, stopping the string at the first next delimiter
     *   and fixing the string by inserting a quote there, or stopping at a
     *   stop index detected in the first iteration.
     */
    function parseString() {
      let stopAtDelimiter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      let stopAtIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
      let skipEscapeChars = text[i] === '\\';
      if (skipEscapeChars) {
        // repair: remove the first escape character
        i++;
        skipEscapeChars = true;
      }
      if (isQuote(text[i])) {
        // double quotes are correct JSON,
        // single quotes come from JavaScript for example, we assume it will have a correct single end quote too
        // otherwise, we will match any double-quote-like start with a double-quote-like end,
        // or any single-quote-like start with a single-quote-like end
        const isEndQuote = isDoubleQuote(text[i]) ? isDoubleQuote : isSingleQuote(text[i]) ? isSingleQuote : isSingleQuoteLike(text[i]) ? isSingleQuoteLike : isDoubleQuoteLike;
        const iBefore = i;
        const oBefore = output.length;
        let str = '"';
        i++;
        while (true) {
          if (i >= text.length) {
            // end of text, we are missing an end quote

            const iPrev = prevNonWhitespaceIndex(i - 1);
            if (!stopAtDelimiter && isDelimiter(text.charAt(iPrev))) {
              // if the text ends with a delimiter, like ["hello],
              // so the missing end quote should be inserted before this delimiter
              // retry parsing the string, stopping at the first next delimiter
              i = iBefore;
              output = output.substring(0, oBefore);
              return parseString(true);
            }

            // repair missing quote
            str = insertBeforeLastWhitespace(str, '"');
            output += str;
            return true;
          }
          if (i === stopAtIndex) {
            // use the stop index detected in the first iteration, and repair end quote
            str = insertBeforeLastWhitespace(str, '"');
            output += str;
            return true;
          }
          if (isEndQuote(text[i])) {
            // end quote
            // let us check what is before and after the quote to verify whether this is a legit end quote
            const iQuote = i;
            const oQuote = str.length;
            str += '"';
            i++;
            output += str;
            parseWhitespaceAndSkipComments(false);
            if (stopAtDelimiter || i >= text.length || isDelimiter(text[i]) || isQuote(text[i]) || isDigit(text[i])) {
              // The quote is followed by the end of the text, a delimiter,
              // or a next value. So the quote is indeed the end of the string.
              parseConcatenatedString();
              return true;
            }
            const iPrevChar = prevNonWhitespaceIndex(iQuote - 1);
            const prevChar = text.charAt(iPrevChar);
            if (prevChar === ',') {
              // A comma followed by a quote, like '{"a":"b,c,"d":"e"}'.
              // We assume that the quote is a start quote, and that the end quote
              // should have been located right before the comma but is missing.
              i = iBefore;
              output = output.substring(0, oBefore);
              return parseString(false, iPrevChar);
            }
            if (isDelimiter(prevChar)) {
              // This is not the right end quote: it is preceded by a delimiter,
              // and NOT followed by a delimiter. So, there is an end quote missing
              // parse the string again and then stop at the first next delimiter
              i = iBefore;
              output = output.substring(0, oBefore);
              return parseString(true);
            }

            // revert to right after the quote but before any whitespace, and continue parsing the string
            output = output.substring(0, oBefore);
            i = iQuote + 1;

            // repair unescaped quote
            str = `${str.substring(0, oQuote)}\\${str.substring(oQuote)}`;
          } else if (stopAtDelimiter && isUnquotedStringDelimiter(text[i])) {
            // we're in the mode to stop the string at the first delimiter
            // because there is an end quote missing

            // test start of an url like "https://..." (this would be parsed as a comment)
            if (text[i - 1] === ':' && regexUrlStart.test(text.substring(iBefore + 1, i + 2))) {
              while (i < text.length && regexUrlChar.test(text[i])) {
                str += text[i];
                i++;
              }
            }

            // repair missing quote
            str = insertBeforeLastWhitespace(str, '"');
            output += str;
            parseConcatenatedString();
            return true;
          } else if (text[i] === '\\') {
            // handle escaped content like \n or \u2605
            const char = text.charAt(i + 1);
            const escapeChar = escapeCharacters[char];
            if (escapeChar !== undefined) {
              str += text.slice(i, i + 2);
              i += 2;
            } else if (char === 'u') {
              let j = 2;
              while (j < 6 && isHex(text[i + j])) {
                j++;
              }
              if (j === 6) {
                str += text.slice(i, i + 6);
                i += 6;
              } else if (i + j >= text.length) {
                // repair invalid or truncated unicode char at the end of the text
                // by removing the unicode char and ending the string here
                i = text.length;
              } else {
                throwInvalidUnicodeCharacter();
              }
            } else {
              // repair invalid escape character: remove it
              str += char;
              i += 2;
            }
          } else {
            // handle regular characters
            const char = text.charAt(i);
            if (char === '"' && text[i - 1] !== '\\') {
              // repair unescaped double quote
              str += `\\${char}`;
              i++;
            } else if (isControlCharacter(char)) {
              // unescaped control character
              str += controlCharacters[char];
              i++;
            } else {
              if (!isValidStringCharacter(char)) {
                throwInvalidCharacter(char);
              }
              str += char;
              i++;
            }
          }
          if (skipEscapeChars) {
            // repair: skipped escape character (nothing to do)
            skipEscapeCharacter();
          }
        }
      }
      return false;
    }

    /**
     * Repair concatenated strings like "hello" + "world", change this into "helloworld"
     */
    function parseConcatenatedString() {
      let processed = false;
      parseWhitespaceAndSkipComments();
      while (text[i] === '+') {
        processed = true;
        i++;
        parseWhitespaceAndSkipComments();

        // repair: remove the end quote of the first string
        output = stripLastOccurrence(output, '"', true);
        const start = output.length;
        const parsedStr = parseString();
        if (parsedStr) {
          // repair: remove the start quote of the second string
          output = removeAtIndex(output, start, 1);
        } else {
          // repair: remove the + because it is not followed by a string
          output = insertBeforeLastWhitespace(output, '"');
        }
      }
      return processed;
    }

    /**
     * Parse a number like 2.4 or 2.4e6
     */
    function parseNumber() {
      const start = i;
      if (text[i] === '-') {
        i++;
        if (atEndOfNumber()) {
          repairNumberEndingWithNumericSymbol(start);
          return true;
        }
        if (!isDigit(text[i])) {
          i = start;
          return false;
        }
      }

      // Note that in JSON leading zeros like "00789" are not allowed.
      // We will allow all leading zeros here though and at the end of parseNumber
      // check against trailing zeros and repair that if needed.
      // Leading zeros can have meaning, so we should not clear them.
      while (isDigit(text[i])) {
        i++;
      }
      if (text[i] === '.') {
        i++;
        if (atEndOfNumber()) {
          repairNumberEndingWithNumericSymbol(start);
          return true;
        }
        if (!isDigit(text[i])) {
          i = start;
          return false;
        }
        while (isDigit(text[i])) {
          i++;
        }
      }
      if (text[i] === 'e' || text[i] === 'E') {
        i++;
        if (text[i] === '-' || text[i] === '+') {
          i++;
        }
        if (atEndOfNumber()) {
          repairNumberEndingWithNumericSymbol(start);
          return true;
        }
        if (!isDigit(text[i])) {
          i = start;
          return false;
        }
        while (isDigit(text[i])) {
          i++;
        }
      }

      // if we're not at the end of the number by this point, allow this to be parsed as another type
      if (!atEndOfNumber()) {
        i = start;
        return false;
      }
      if (i > start) {
        // repair a number with leading zeros like "00789"
        const num = text.slice(start, i);
        const hasInvalidLeadingZero = /^0\d/.test(num);
        output += hasInvalidLeadingZero ? `"${num}"` : num;
        return true;
      }
      return false;
    }

    /**
     * Parse keywords true, false, null
     * Repair Python keywords True, False, None
     */
    function parseKeywords() {
      return parseKeyword('true', 'true') || parseKeyword('false', 'false') || parseKeyword('null', 'null') ||
      // repair Python keywords True, False, None
      parseKeyword('True', 'true') || parseKeyword('False', 'false') || parseKeyword('None', 'null');
    }
    function parseKeyword(name, value) {
      if (text.slice(i, i + name.length) === name) {
        output += value;
        i += name.length;
        return true;
      }
      return false;
    }

    /**
     * Repair an unquoted string by adding quotes around it
     * Repair a MongoDB function call like NumberLong("2")
     * Repair a JSONP function call like callback({...});
     */
    function parseUnquotedString(isKey) {
      // note that the symbol can end with whitespaces: we stop at the next delimiter
      // also, note that we allow strings to contain a slash / in order to support repairing regular expressions
      const start = i;
      if (isFunctionNameCharStart(text[i])) {
        while (i < text.length && isFunctionNameChar(text[i])) {
          i++;
        }
        let j = i;
        while (isWhitespace(text, j)) {
          j++;
        }
        if (text[j] === '(') {
          // repair a MongoDB function call like NumberLong("2")
          // repair a JSONP function call like callback({...});
          i = j + 1;
          parseValue();
          if (text[i] === ')') {
            // repair: skip close bracket of function call
            i++;
            if (text[i] === ';') {
              // repair: skip semicolon after JSONP call
              i++;
            }
          }
          return true;
        }
      }
      while (i < text.length && !isUnquotedStringDelimiter(text[i]) && !isQuote(text[i]) && (!isKey || text[i] !== ':')) {
        i++;
      }

      // test start of an url like "https://..." (this would be parsed as a comment)
      if (text[i - 1] === ':' && regexUrlStart.test(text.substring(start, i + 2))) {
        while (i < text.length && regexUrlChar.test(text[i])) {
          i++;
        }
      }
      if (i > start) {
        // repair unquoted string
        // also, repair undefined into null

        // first, go back to prevent getting trailing whitespaces in the string
        while (isWhitespace(text, i - 1) && i > 0) {
          i--;
        }
        const symbol = text.slice(start, i);
        output += symbol === 'undefined' ? 'null' : JSON.stringify(symbol);
        if (text[i] === '"') {
          // we had a missing start quote, but now we encountered the end quote, so we can skip that one
          i++;
        }
        return true;
      }
    }
    function parseRegex() {
      if (text[i] === '/') {
        const start = i;
        i++;
        while (i < text.length && (text[i] !== '/' || text[i - 1] === '\\')) {
          i++;
        }
        i++;
        output += JSON.stringify(text.substring(start, i));
        return true;
      }
    }
    function prevNonWhitespaceIndex(start) {
      let prev = start;
      while (prev > 0 && isWhitespace(text, prev)) {
        prev--;
      }
      return prev;
    }
    function atEndOfNumber() {
      return i >= text.length || isDelimiter(text[i]) || isWhitespace(text, i);
    }
    function repairNumberEndingWithNumericSymbol(start) {
      // repair numbers cut off at the end
      // this will only be called when we end after a '.', '-', or 'e' and does not
      // change the number more than it needs to make it valid JSON
      output += `${text.slice(start, i)}0`;
    }
    function throwInvalidCharacter(char) {
      throw new JSONRepairError(`Invalid character ${JSON.stringify(char)}`, i);
    }
    function throwUnexpectedCharacter() {
      throw new JSONRepairError(`Unexpected character ${JSON.stringify(text[i])}`, i);
    }
    function throwUnexpectedEnd() {
      throw new JSONRepairError('Unexpected end of json string', text.length);
    }
    function throwObjectKeyExpected() {
      throw new JSONRepairError('Object key expected', i);
    }
    function throwColonExpected() {
      throw new JSONRepairError('Colon expected', i);
    }
    function throwInvalidUnicodeCharacter() {
      const chars = text.slice(i, i + 6);
      throw new JSONRepairError(`Invalid unicode character "${chars}"`, i);
    }
  }
  function atEndOfBlockComment(text, i) {
    return text[i] === '*' && text[i + 1] === '/';
  }

  var _ComponentsManager;
  class ComponentsManager {
    static getAiComponent(namespace) {
      this.init();
      return this.aiComponentMap.get(namespace);
    }
  }
  _ComponentsManager = ComponentsManager;
  _defineProperty(ComponentsManager, "isLoaded", false);
  _defineProperty(ComponentsManager, "aiComponentMap", new Map());
  _defineProperty(ComponentsManager, "namespaceAbbrevMap", new Map());
  // 缩写 -> 完整namespace
  _defineProperty(ComponentsManager, "abbreviationMap", new Map());
  // 完整namespace -> 缩写
  _defineProperty(ComponentsManager, "init", () => {
    if (_ComponentsManager.isLoaded) {
      return;
    }
    if (!window.__comlibs_edit_) {
      return;
    }
    const forEachComponent = (com, callback) => {
      if (com !== null && com !== void 0 && com.namespace) {
        callback === null || callback === void 0 || callback(com);
      }
      if (Array.isArray(com === null || com === void 0 ? void 0 : com.comAray)) {
        com === null || com === void 0 || com.comAray.forEach(child => {
          forEachComponent(child, callback);
        });
      }
    };
    window.__comlibs_edit_.forEach(comlib => {
      forEachComponent(comlib, com => {
        if (com !== null && com !== void 0 && com.ai) {
          _ComponentsManager.aiComponentMap.set(com.namespace, _objectSpread2(_objectSpread2({}, com.ai), {}, {
            all: com
          }));
          const abbreviation = com.namespace.replace('mybricks.normal-pc.antd5.', 'pc.').replace('mybricks.normal-pc.', 'pc.').replace('mybricks.harmony.', 'mb.').replace('mybricks.taro.', 'mb.');

          // 收集缩写映射关系
          if (abbreviation !== com.namespace) {
            _ComponentsManager.namespaceAbbrevMap.set(abbreviation, com.namespace);
            _ComponentsManager.abbreviationMap.set(com.namespace, abbreviation);
          }
        }
      });
    });
    _ComponentsManager.isLoaded = true;
  });
  _defineProperty(ComponentsManager, "getRequireComponents", ns => {
    _ComponentsManager.init();
    let res = [];
    if (_ComponentsManager.aiComponentMap.has(ns)) {
      const ai = _ComponentsManager.aiComponentMap.get(ns);
      if (Array.isArray(ai.requires)) {
        res = res.concat(ai.requires);
      }
    }
    return res;
  });
  /**
   * 判断是否为布局组件（asLayout）
   */
  _defineProperty(ComponentsManager, "isLayoutComponent", namespace => {
    _ComponentsManager.init();
    const ai = _ComponentsManager.aiComponentMap.get(_ComponentsManager.getFullNamespace(namespace));
    return !!(ai !== null && ai !== void 0 && ai.asLayout);
  });
  /**
   * 获取所有布局组件的 namespace 缩写数组
   */
  _defineProperty(ComponentsManager, "getLayoutComponentsAbbreviationNs", () => {
    _ComponentsManager.init();
    const res = [];
    _ComponentsManager.aiComponentMap.forEach((ai, namespace) => {
      if (ai !== null && ai !== void 0 && ai.asLayout) {
        res.push(_ComponentsManager.getAbbreviation(namespace));
      }
    });
    return res;
  });
  /**
   * 根据完整namespace获取缩写
   * @param namespace 完整的namespace
   * @returns 缩写namespace，如果没有缩写则返回原namespace
   */
  _defineProperty(ComponentsManager, "getAbbreviation", namespace => {
    _ComponentsManager.init();
    return _ComponentsManager.abbreviationMap.get(namespace) || namespace;
  });
  /**
   * 根据缩写获取完整namespace
   * @param abbreviation 缩写
   * @returns 完整namespace，如果没有对应的完整namespace则返回原缩写
   */
  _defineProperty(ComponentsManager, "getFullNamespace", abbreviation => {
    _ComponentsManager.init();
    return _ComponentsManager.namespaceAbbrevMap.get(abbreviation) || abbreviation;
  });
  /**
   * 重置加载状态（用于测试或重新初始化）
   */
  _defineProperty(ComponentsManager, "reset", () => {
    _ComponentsManager.isLoaded = false;
    _ComponentsManager.aiComponentMap.clear();
    _ComponentsManager.namespaceAbbrevMap.clear();
    _ComponentsManager.abbreviationMap.clear();
  });

  // 第二个参数用于透传当前解析器实例内的 comId -> params 映射，方便后续 O(1) 快查
  const formatAction = (_action, comIdToParamsMap, options) => {
    var _newAct$params4, _newAct$params5, _newAct$params6, _newAct$params1, _newAct$params11;
    const {
      enabledActionTags
    } = options !== null && options !== void 0 ? options : {};
    let action;
    try {
      // TODO，后面要提示词处理的，这样replace不合理
      const fixActionString = _action.replaceAll('{":parent/', '{"path":":parent/');
      action = JSON.parse(fixActionString);
    } catch (error) {
      try {
        const repairedAction = jsonrepair(_action);
        action = JSON.parse(repairedAction);
      } catch (error) {
        console.error("repair action error", error);
      }
    }
    if (!Array.isArray(action)) {
      return action;
    }
    const [comId, target, type, params] = action;
    const newAct = {
      comId,
      type,
      target,
      params
    };
    if (newAct.type === "delete") {
      if (!newAct.params) {
        return _objectSpread2(_objectSpread2({}, newAct), {}, {
          params: {}
        });
      }
    }
    if (newAct.type === 'move') {
      if (newAct.params) {
        return _objectSpread2(_objectSpread2({}, newAct), {}, {
          params: {
            to: newAct.params
          }
        });
      }
    }

    // ns => namespace
    if (newAct.type === "addChild") {
      var _newAct$params;
      if ((_newAct$params = newAct.params) !== null && _newAct$params !== void 0 && _newAct$params.ns) {
        newAct.params.namespace = ComponentsManager.getFullNamespace(newAct.params.ns);
        delete newAct.params.ns;
      }
    }

    // 标记使用
    if (newAct.type === 'addChild') {
      if (enabledActionTags) {
        var _newAct$params2;
        if ((_newAct$params2 = newAct.params) !== null && _newAct$params2 !== void 0 && _newAct$params2.ignore) {
          var _newAct$params3;
          // TODO：标记的兼容，对于配置了ignore，但是有padding的组件，直接替换成enhance，因为直接去掉，底层的100%组件宽高会失效。
          if (newAct !== null && newAct !== void 0 && (_newAct$params3 = newAct.params) !== null && _newAct$params3 !== void 0 && (_newAct$params3 = _newAct$params3.configs) !== null && _newAct$params3 !== void 0 && _newAct$params3.some(config => {
            var _config$style;
            return Object.keys((_config$style = config === null || config === void 0 ? void 0 : config.style) !== null && _config$style !== void 0 ? _config$style : {}).some(key => key.startsWith('padding'));
          })) {
            newAct.params.enhance = true;
            delete newAct.params.ignore;
          }

          // TODO：标记的兼容，如果配置了enhance或者ignore的不是布局组件，需要删除该标记
          if (!ComponentsManager.isLayoutComponent(newAct.params.namespace)) {
            delete newAct.params.enhance;
            delete newAct.params.ignore;
          }

          // TODO：标记的兼容，关注配置了ignore的父级元素是否为布局组件，如果不是，需要改成enhance而不是ignore，因为其他组件没有setLayout函数
          if (comIdToParamsMap) {
            const parentParams = comIdToParamsMap.get(newAct.comId);
            if (!parentParams) {
              // 没有父级组件，直接删除标记
              delete newAct.params.enhance;
              delete newAct.params.ignore;
            } else {
              // 有父级组件，判断父级组件是否为布局组件
              const parentNamespace = parentParams === null || parentParams === void 0 ? void 0 : parentParams.namespace;
              if (parentNamespace && !ComponentsManager.isLayoutComponent(parentNamespace)) {
                newAct.params.enhance = true;
                delete newAct.params.ignore;
              }
            }
          }
        }
      } else {
        if (newAct.params.enhance || newAct.params.ignore) {
          delete newAct.params.enhance;
          delete newAct.params.ignore;
        }
      }
    }

    // absolute 布局的转化
    if (((_newAct$params4 = newAct.params) === null || _newAct$params4 === void 0 || (_newAct$params4 = _newAct$params4.value) === null || _newAct$params4 === void 0 ? void 0 : _newAct$params4.display) === "absolute") {
      newAct.params.value.position = "smart";
      delete newAct.params.value.display;
    }

    // flexDirection 的兼容
    if ((_newAct$params5 = newAct.params) !== null && _newAct$params5 !== void 0 && _newAct$params5.value && newAct.params.value.display === "flex" && !newAct.params.value.flexDirection) {
      newAct.params.value.flexDirection = "row";
    }

    // addChild兼容
    if (newAct.type === "addChild" && Array.isArray((_newAct$params6 = newAct.params) === null || _newAct$params6 === void 0 ? void 0 : _newAct$params6.configs)) {
      newAct.params.configs.forEach(config => {
        var _config$value, _config$value2, _config$value3;
        // path value幻觉，直接用key value的情况
        if (!(config !== null && config !== void 0 && config.path) && Object.keys(config).length === 1) {
          const firstKey = Object.keys(config)[0];
          const value = config[firstKey];
          delete config[firstKey];
          config.path = firstKey;
          config.value = value;
        }
        if (config.parent) {
          config.path = ":parent/".concat(config.path);
          delete config.parent;
        }

        // absolute 布局的转化
        if ((config === null || config === void 0 || (_config$value = config.value) === null || _config$value === void 0 ? void 0 : _config$value.display) === "absolute") {
          config.value.position = "smart";
          delete config.value.display;
        }

        // flexDirection 的兼容
        if (config.value && ((_config$value2 = config.value) === null || _config$value2 === void 0 ? void 0 : _config$value2.display) === "flex" && !((_config$value3 = config.value) !== null && _config$value3 !== void 0 && _config$value3.flexDirection)) {
          config.value.flexDirection = "row";
        }
        if (config !== null && config !== void 0 && config.style) {
          // 兼容background
          transformToValidBackground(config === null || config === void 0 ? void 0 : config.style);
        }
      });
    }

    // flex布局幻觉的兼容
    if (newAct.type === "doConfig") {
      var _newAct$params7, _newAct$params8, _newAct$params9, _newAct$params0;
      if (((_newAct$params7 = newAct.params) === null || _newAct$params7 === void 0 ? void 0 : _newAct$params7.display) === 'flex' && !((_newAct$params8 = newAct.params) !== null && _newAct$params8 !== void 0 && _newAct$params8.flexDirection)) {
        newAct.params.flexDirection = 'column';
      }
      if ((_newAct$params9 = newAct.params) !== null && _newAct$params9 !== void 0 && _newAct$params9.flexDirection && !((_newAct$params0 = newAct.params) !== null && _newAct$params0 !== void 0 && _newAct$params0.display)) {
        newAct.params.display = 'flex';
      }
    }

    // 对样式幻觉的兼容
    if (newAct.type === "doConfig" && (_newAct$params1 = newAct.params) !== null && _newAct$params1 !== void 0 && _newAct$params1.style) {
      var _newAct$params10;
      // 兼容background
      transformToValidBackground((_newAct$params10 = newAct.params) === null || _newAct$params10 === void 0 ? void 0 : _newAct$params10.style);
    }
    if (newAct.type === "addChild" && (_newAct$params11 = newAct.params) !== null && _newAct$params11 !== void 0 && _newAct$params11.layout) {
      var _newAct$params12, _newAct$params13;
      // 兼容margin
      transformToValidMargins((_newAct$params12 = newAct.params) === null || _newAct$params12 === void 0 ? void 0 : _newAct$params12.layout);

      // 支持width=auto
      if (((_newAct$params13 = newAct.params) === null || _newAct$params13 === void 0 || (_newAct$params13 = _newAct$params13.layout) === null || _newAct$params13 === void 0 ? void 0 : _newAct$params13.width) === 'auto') {
        newAct.params.layout.width = '100%';
      }
    }

    // 在所有兼容性处理之后，再记录 addChild 的配置，保证 namespace / layout 等信息已经就绪
    if (comIdToParamsMap && newAct.type === "addChild") {
      comIdToParamsMap.set(newAct.params.comId, JSON.parse(JSON.stringify(newAct.params)));
    }
    return newAct;
  };

  /**
   * 将background转换为有效的backgroundColor和backgroundImage
   * @param styles 需要转换的样式对象
   */
  function transformToValidBackground(styles) {
    var _styles$backgroundCol;
    // 兼容下把渐变色配置到backgroundColor的情况
    if (styles !== null && styles !== void 0 && styles.backgroundColor && (styles === null || styles === void 0 || (_styles$backgroundCol = styles.backgroundColor) === null || _styles$backgroundCol === void 0 ? void 0 : _styles$backgroundCol.indexOf("gradient")) > -1) {
      const imageRegex = /(url\([^)]+\)|linear-gradient\([^)]+\)|radial-gradient\([^)]+\)|conic-gradient\([^)]+\))/;
      const imageMatch = styles.backgroundColor.match(imageRegex);
      if (imageMatch && !styles.backgroundImage) {
        styles.backgroundImage = imageMatch[0];
      }
      delete styles.backgroundColor;
    }

    // 兼容，配置backgroundColor的话记得去除渐变色
    if (styles.backgroundColor && !styles.backgroundImage) {
      styles.backgroundColor = styles.backgroundColor;
      styles.backgroundImage = 'none';
    }

    // 如果没有background属性,直接返回
    if (!styles.background) {
      return;
    }
    const background = styles.background.toString().trim();

    // 删除原有的background属性
    delete styles.background;

    // 处理特殊值
    if (background === 'transparent' || background === 'none') {
      styles.backgroundColor = 'transparent';
      styles.backgroundImage = 'none';
      return;
    }

    // 解析复合背景
    const parsedBackground = parseComplexBackground(background);
    if (parsedBackground.hasImages && !styles.backgroundImage) {
      styles.backgroundColor = 'transparent';
      styles.backgroundImage = parsedBackground.images.join(', ');

      // 设置背景位置和尺寸
      if (parsedBackground.position && !styles.backgroundPosition) {
        styles.backgroundPosition = parsedBackground.position;
      }
      if (parsedBackground.size && !styles.backgroundSize) {
        styles.backgroundSize = parsedBackground.size;
      }
      return;
    }

    // 如果只有颜色
    if (parsedBackground.color && !styles.backgroundColor) {
      styles.backgroundColor = parsedBackground.color;
      if (!styles.backgroundImage) {
        styles.backgroundImage = 'none';
      }
      return;
    }

    // 如果没有找到颜色，但有backgroundImage，设置透明背景色
    if (styles.backgroundImage && !styles.backgroundColor) {
      styles.backgroundColor = 'transparent';
    }
  }

  /**
   * 解析复杂的background值
   * @param background 原始background字符串
   * @returns 解析后的对象
   */
  function parseComplexBackground(background) {
    const result = {
      images: [],
      color: '',
      position: '',
      size: '',
      hasImages: false
    };

    // 使用更精确的方法来提取图片和渐变
    const images = extractBackgroundImages(background);
    if (images.length > 0) {
      result.hasImages = true;
      result.images = images;

      // 提取位置和尺寸信息
      const positionSizeInfo = extractPositionAndSize(background, images);
      result.position = positionSizeInfo.position;
      result.size = positionSizeInfo.size;
    }

    // 提取颜色值
    const color = extractBackgroundColor(background, images);
    if (color) {
      result.color = color;
    }
    return result;
  }

  /**
   * 提取背景图片和渐变
   */
  function extractBackgroundImages(background) {
    const images = [];
    let remaining = background;
    while (remaining.length > 0) {
      // 查找下一个函数的开始
      const urlMatch = remaining.match(/url\s*\(/);
      const gradientMatch = remaining.match(/(linear-gradient|radial-gradient|conic-gradient)\s*\(/);
      let nextMatch = null;
      if (urlMatch && gradientMatch) {
        // 选择更早出现的匹配
        if (urlMatch.index < gradientMatch.index) {
          nextMatch = urlMatch;
        } else {
          nextMatch = gradientMatch;
        }
      } else if (urlMatch) {
        nextMatch = urlMatch;
      } else if (gradientMatch) {
        nextMatch = gradientMatch;
      }
      if (!nextMatch) {
        break;
      }
      const startIndex = nextMatch.index;
      const functionStart = remaining.indexOf('(', startIndex) + 1;

      // 找到匹配的右括号
      let parenCount = 1;
      let endIndex = functionStart;
      while (endIndex < remaining.length && parenCount > 0) {
        if (remaining[endIndex] === '(') {
          parenCount++;
        } else if (remaining[endIndex] === ')') {
          parenCount--;
        }
        endIndex++;
      }
      if (parenCount === 0) {
        // 提取完整的函数
        const fullFunction = remaining.substring(startIndex, endIndex);
        images.push(fullFunction);

        // 移除已处理的部分
        remaining = remaining.substring(endIndex);
      } else {
        // 如果括号不匹配，跳过这个匹配
        remaining = remaining.substring(startIndex + 1);
      }
    }
    return images;
  }

  /**
   * 提取位置和尺寸信息
   */
  function extractPositionAndSize(background, images) {
    let cleanBackground = background;

    // 移除所有图片和渐变
    images.forEach(image => {
      cleanBackground = cleanBackground.replace(image, '');
    });

    // 清理多余的逗号和空格
    cleanBackground = cleanBackground.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();

    // 匹配位置/尺寸模式 (如: center/cover, top left/contain)
    const positionSizeMatch = cleanBackground.match(/([^\/,]*?)\/([^\/,]*)/);
    let position = '';
    let size = '';
    if (positionSizeMatch) {
      var _positionSizeMatch$, _positionSizeMatch$2;
      const positionPart = (_positionSizeMatch$ = positionSizeMatch[1]) === null || _positionSizeMatch$ === void 0 ? void 0 : _positionSizeMatch$.trim();
      const sizePart = (_positionSizeMatch$2 = positionSizeMatch[2]) === null || _positionSizeMatch$2 === void 0 ? void 0 : _positionSizeMatch$2.trim();
      if (positionPart && isValidBackgroundPosition(positionPart)) {
        position = positionPart;
      }
      if (sizePart && isValidBackgroundSize(sizePart)) {
        size = sizePart;
      }
    } else {
      // 如果没有找到 / 分隔符，尝试单独匹配位置或尺寸
      const parts = cleanBackground.split(/\s+/).filter(part => part.length > 0);
      for (const part of parts) {
        if (!position && isValidBackgroundPosition(part)) {
          position = part;
        } else if (!size && isValidBackgroundSize(part)) {
          size = part;
        }
      }
    }
    return {
      position,
      size
    };
  }

  /**
   * 提取背景颜色
   */
  function extractBackgroundColor(background, images) {
    let cleanBackground = background;

    // 移除所有图片和渐变
    images.forEach(image => {
      cleanBackground = cleanBackground.replace(image, '');
    });

    // 移除位置和尺寸信息
    cleanBackground = cleanBackground.replace(/\s*(center|top|bottom|left|right|\d+%|\d+px)\s*/g, ' ');
    cleanBackground = cleanBackground.replace(/\s*\/\s*(cover|contain|auto|\d+%|\d+px)\s*/g, ' ');
    cleanBackground = cleanBackground.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();

    // 匹配颜色格式
    const colorRegex = /(#[0-9A-Fa-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-zA-Z]+)/;
    const colorMatch = cleanBackground.match(colorRegex);
    return colorMatch ? colorMatch[0] : '';
  }

  /**
   * 检查是否是有效的背景位置值
   */
  function isValidBackgroundPosition(value) {
    const positionKeywords = ['center', 'top', 'bottom', 'left', 'right'];
    const parts = value.split(/\s+/);
    return parts.every(part => positionKeywords.includes(part) || /^\d+%$/.test(part) || /^\d+px$/.test(part) || /^-?\d+(\.\d+)?(px|em|rem|%)$/.test(part));
  }

  /**
   * 检查是否是有效的背景尺寸值
   */
  function isValidBackgroundSize(value) {
    const sizeKeywords = ['cover', 'contain', 'auto'];
    if (sizeKeywords.includes(value)) {
      return true;
    }
    const parts = value.split(/\s+/);
    return parts.every(part => part === 'auto' || /^\d+%$/.test(part) || /^\d+px$/.test(part) || /^-?\d+(\.\d+)?(px|em|rem|%)$/.test(part));
  }

  /**
   * 将margin简写转换为marginTop/Right/Bottom/Left
   * @param styles 需要转换的样式对象
   */
  function transformToValidMargins(styles) {
    // 如果没有margin属性,直接返回
    if (!styles.margin) {
      return;
    }
    const margin = styles.margin.toString().trim();
    const values = margin.split(/\s+/); // 按空格分割

    // 根据值的数量设置不同方向的margin
    switch (values.length) {
      case 1:
        // margin: 10px;
        styles.marginTop = values[0];
        styles.marginRight = values[0];
        styles.marginBottom = values[0];
        styles.marginLeft = values[0];
        break;
      case 2:
        // margin: 10px 20px;
        styles.marginTop = values[0];
        styles.marginRight = values[1];
        styles.marginBottom = values[0];
        styles.marginLeft = values[1];
        break;
      case 3:
        // margin: 10px 20px 30px;
        styles.marginTop = values[0];
        styles.marginRight = values[1];
        styles.marginBottom = values[2];
        styles.marginLeft = values[1];
        break;
      case 4:
        // margin: 10px 20px 30px 40px;
        styles.marginTop = values[0];
        styles.marginRight = values[1];
        styles.marginBottom = values[2];
        styles.marginLeft = values[3];
        break;
    }

    // 删除原有的margin属性
    delete styles.margin;
  }

  /**
   * 创建actions解析器
   * @returns {Function} 解析函数
   */
  function createActionsParser(_ref2) {
    let {
      enabledActionTags
    } = _ref2;
    const processedLines = new Set();
    // 针对单个解析器实例的 comId -> params 映射，避免跨会话长期存储
    const comIdToParamsMap = new Map();
    return function parseActions(text) {
      const newActions = [];
      const lines = text.split("\n").filter(line => line.trim() !== '');

      // 只处理除了最后一行之外的所有行（最后一行可能不完整）
      const linesToProcess = lines.slice(0, -1);
      const lastLine = lines[lines.length - 1];

      // 处理完整的行
      for (const line of linesToProcess) {
        const trimmedLine = line.trim();

        // 跳过空行和已处理的行
        if (!trimmedLine || processedLines.has(trimmedLine)) {
          continue;
        }
        try {
          const parsedAction = formatAction(trimmedLine, comIdToParamsMap, {
            enabledActionTags
          });
          if (parsedAction.comId) {
            newActions.push(parsedAction);
            // 处理下addChild操作，如果index存在，需要衔接一个一个 move action
            if (parsedAction.type === 'addChild' && parsedAction.params.index !== undefined) {
              newActions.push({
                comId: parsedAction.params.comId,
                target: ':root',
                type: 'move',
                params: {
                  to: {
                    comId: parsedAction.comId,
                    slotId: parsedAction.target,
                    index: parsedAction.params.index
                  }
                }
              });
            }
            processedLines.add(trimmedLine);
          }
        } catch (error) {
          // 这是真正的解析错误（完整的行但格式错误）
          processedLines.add(trimmedLine); // 标记为已处理，避免重复尝试
        }
      }

      // 处理最后一行
      if (lastLine && lastLine.trim()) {
        const trimmedLastLine = lastLine.trim();

        // 如果文本以换行符结尾，说明最后一行是完整的
        if (text.endsWith("\n") && !processedLines.has(trimmedLastLine)) {
          try {
            const parsedAction = formatAction(trimmedLastLine, comIdToParamsMap);
            if (parsedAction.comId) {
              newActions.push(parsedAction);
              // 处理下addChild操作，如果index存在，需要衔接一个一个 move action
              if (parsedAction.type === 'addChild' && parsedAction.params.index !== undefined) {
                newActions.push({
                  comId: parsedAction.params.comId,
                  target: ':root',
                  type: 'move',
                  params: {
                    to: {
                      comId: parsedAction.comId,
                      slotId: parsedAction.target,
                      index: parsedAction.params.index
                    }
                  }
                });
              }
              processedLines.add(trimmedLastLine);
            }
          } catch (error) {
            processedLines.add(trimmedLastLine);
          }
        }
      }
      return newActions;
    };
  }
  const UUID_SEED = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const uuid = function () {
    let len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
    const maxPos = UUID_SEED.length;
    let rtn = '';
    for (let i = 0; i < len; i++) {
      rtn += UUID_SEED.charAt(Math.floor(Math.random() * maxPos));
    }
    return 'u_' + rtn;
  };
  class ComIdTransform {
    constructor(comIds) {
      _defineProperty(this, "comIdMap", {});
      const {
        comIdMap
      } = this;
      comIds.forEach(comId => {
        comIdMap[comId] = [comId];
      });
    }
    getComId(comId) {
      if (!this.comIdMap[comId] || this.comIdMap[comId].length === 0) {
        const newComId = uuid();
        this.comIdMap[comId] = [newComId];
        return newComId;
      }

      // 返回最近添加的comId（数组的最后一个）
      return this.comIdMap[comId][this.comIdMap[comId].length - 1];
    }

    // 添加新的comId映射，用于addChild操作
    addComId(comId) {
      const newComId = uuid();
      if (!this.comIdMap[comId]) {
        this.comIdMap[comId] = [];
      }
      this.comIdMap[comId].push(newComId);
      return newComId;
    }
  }

  // 设计器给出的 OutlineNode

  const ROOT_NAMESPACE = 'root';
  const ROOT_ID = '_root_';
  const ROOT_SLOT_ID = '_rootSlot_';
  class OutlineInfoManager {
    constructor(_ref) {
      let {
        api
      } = _ref;
      _defineProperty(this, "getOriginOutlineRootCom", originOutline => {
        var _originOutline$compon, _originOutline$compon2;
        return originOutline !== null && originOutline !== void 0 && (_originOutline$compon = originOutline.components) !== null && _originOutline$compon !== void 0 && (_originOutline$compon = _originOutline$compon[0]) !== null && _originOutline$compon !== void 0 && _originOutline$compon.asRoot ? originOutline === null || originOutline === void 0 || (_originOutline$compon2 = originOutline.components) === null || _originOutline$compon2 === void 0 ? void 0 : _originOutline$compon2[0] : null;
      });
      this.api = api;
    }
    getOutlineInfo(id, type) {
      if (type === "logicCom") {
        var _this$api;
        return (_this$api = this.api) === null || _this$api === void 0 || (_this$api = _this$api.logicCom) === null || _this$api === void 0 || (_this$api = _this$api.api) === null || _this$api === void 0 ? void 0 : _this$api.getOutlineInfo(id);
      } else if (type === "uiCom") {
        var _this$api2;
        return (_this$api2 = this.api) === null || _this$api2 === void 0 || (_this$api2 = _this$api2.uiCom) === null || _this$api2 === void 0 || (_this$api2 = _this$api2.api) === null || _this$api2 === void 0 ? void 0 : _this$api2.getOutlineInfo(id);
      } else {
        var _this$api3;
        return (_this$api3 = this.api) === null || _this$api3 === void 0 || (_this$api3 = _this$api3.page) === null || _this$api3 === void 0 || (_this$api3 = _this$api3.api) === null || _this$api3 === void 0 ? void 0 : _this$api3.getOutlineInfo(id);
      }
    }
    getPageOutline(pageId) {
      return this.normalizePageOutline(this.getOutlineInfo(pageId, 'page'), pageId);
    }
    getUiComOutline(componentId) {
      return this.getOutlineInfo(componentId, 'uiCom');
    }
    getLogicComOutline(componentId) {
      return this.getOutlineInfo(componentId, 'logicCom');
    }
    getPageMetaInfo(pageId) {
      var _this$getOriginOutlin;
      const originOutlineJson = this.getOutlineInfo(pageId, 'page');
      const rootId = this.getOriginOutlineRootCom(originOutlineJson) ? (_this$getOriginOutlin = this.getOriginOutlineRootCom(originOutlineJson)) === null || _this$getOriginOutlin === void 0 ? void 0 : _this$getOriginOutlin.id : undefined;
      return {
        pageId,
        rootId
      };
    }
    normalizePageOutline(outline, pageId) {
      if ((outline === null || outline === void 0 ? void 0 : outline.id) === pageId) {
        var _outline$layout, _outline$layout2, _rootNode$style;
        let rootNode = outline;
        let rootSlots = [{
          id: ROOT_SLOT_ID,
          components: outline === null || outline === void 0 ? void 0 : outline.components,
          layout: outline === null || outline === void 0 ? void 0 : outline.layout
        }];
        const whInfo = {
          width: outline === null || outline === void 0 || (_outline$layout = outline.layout) === null || _outline$layout === void 0 ? void 0 : _outline$layout.width,
          height: outline === null || outline === void 0 || (_outline$layout2 = outline.layout) === null || _outline$layout2 === void 0 ? void 0 : _outline$layout2.height
        };

        // 说明有asRoot组件，把asRoot的信息往上提取一层
        const rootCom = this.getOriginOutlineRootCom(outline);
        if (!!rootCom) {
          rootNode = rootCom;
          rootSlots = rootNode.slots;
        }
        const normalized = _objectSpread2(_objectSpread2({}, rootNode), {}, {
          style: _objectSpread2(_objectSpread2({}, (_rootNode$style = rootNode.style) !== null && _rootNode$style !== void 0 ? _rootNode$style : {}), whInfo),
          slots: rootSlots,
          def: {
            version: '1.0.0',
            namespace: ROOT_NAMESPACE
          },
          asRoot: true
        });
        return {
          id: pageId,
          title: outline.title,
          // 注意用的是页面的title
          slots: [{
            id: ROOT_ID,
            components: [normalized]
          }]
        };
      }
      return {
        id: pageId,
        title: outline.title,
        slots: [{
          id: ROOT_ID,
          components: [outline]
        }]
      };
    }
    getComponentIdToTitleMap(pageId) {
      var _outline$title;
      const outline = this.getPageOutline(pageId);
      const componentMap = new Map();
      componentMap.set(ROOT_ID, (_outline$title = outline.title) !== null && _outline$title !== void 0 ? _outline$title : '页面根节点');
      function traverse(data) {
        if (!data) return;
        if (Array.isArray(data)) {
          data.forEach(item => traverse(item));
          return;
        }
        if (data.id && data.title) {
          componentMap.set(data.id, data.title);
        }
        if (data.slots && Array.isArray(data.slots)) {
          data.slots.forEach(slot => {
            if (slot.components && Array.isArray(slot.components)) {
              slot.components.forEach(component => traverse(component));
            }
          });
        }
      }
      traverse(outline);
      return componentMap;
    }
    generateJSXByPageId(pageId) {
      let targetComponentIds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      const outline = this.getPageOutline(pageId);
      return this.generateJSXByOutline(outline, targetComponentIds);
    }
    generateJSXByOutline(outlineInfo) {
      let targetComponentIds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      return OutlineJSXGenerator.generate(outlineInfo, targetComponentIds);
    }
    findParentNodeByComId(pageOutlineInfo, comId) {
      function helper(node) {
        if (!node || !node.slots) return null;
        for (const slot of node.slots || []) {
          if (slot.components && Array.isArray(slot.components)) {
            for (const component of slot.components) {
              if (component.id === comId) {
                return node;
              }
              // 向下递归
              const found = helper(component);
              if (found) return found;
            }
          }
        }
        return null;
      }
      return helper(pageOutlineInfo);
    }
  }
  class OutlineJSXGenerator {
    /**
     * 遮蔽base64和svg代码，避免DSL过大
     */
    static maskLargeContent(obj) {
      if (obj === null || obj === undefined) {
        return obj;
      }

      // 如果是字符串，检查是否为base64或svg
      if (typeof obj === 'string') {
        // 检测base64图片（data:image开头或长base64字符串）
        if (obj.startsWith('data:image/') || /^[A-Za-z0-9+/=]{100,}$/.test(obj)) {
          const prefix = obj.substring(0, 22);
          return "[BASE64_MASKED:".concat(prefix, "...length:").concat(obj.length, "]");
        }
        // 检测SVG代码
        if (obj.includes('<svg') || obj.includes('<?xml') && obj.includes('svg')) {
          const length = obj.length;
          if (length > 200) {
            return "[SVG_MASKED:length:".concat(length, "]");
          }
        }
        return obj;
      }

      // 如果是数组，递归处理每个元素
      if (Array.isArray(obj)) {
        return obj.map(item => this.maskLargeContent(item));
      }

      // 如果是对象，递归处理每个属性
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            result[key] = this.maskLargeContent(obj[key]);
          }
        }
        return result;
      }
      return obj;
    }
    static generate(outlineInfo) {
      var _ancestorNodes$;
      let targetComponentIds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      this.namespacesSet.clear();
      if (targetComponentIds.length === 0) {
        const jsx = this.processData(outlineInfo);
        return {
          id: outlineInfo.id,
          jsx,
          namespaces: Array.from(this.namespacesSet)
        };
      }
      if (targetComponentIds.length === 1) {
        const targetNode = this.findNodeById(outlineInfo, targetComponentIds[0]);
        if (targetNode) {
          const jsx = this.processData(targetNode);
          return {
            id: targetNode.id,
            jsx,
            namespaces: Array.from(this.namespacesSet)
          };
        }
      }
      const ancestorNodes = this.findMinimalCommonAncestors(outlineInfo, targetComponentIds);
      const jsx = ancestorNodes.map(node => this.processData(node)).join('\n');
      return {
        id: (_ancestorNodes$ = ancestorNodes[0]) === null || _ancestorNodes$ === void 0 ? void 0 : _ancestorNodes$.id,
        jsx,
        namespaces: Array.from(this.namespacesSet)
      };
    }
    static findMinimalCommonAncestors(root, targetIds) {
      if (targetIds.length === 0) return [root];
      if (targetIds.length === 1) {
        const targetNode = this.findNodeById(root, targetIds[0]);
        return targetNode ? [targetNode] : [];
      }
      const paths = [];
      for (const targetId of targetIds) {
        const path = this.findPathToNode(root, targetId);
        if (path) {
          paths.push(path);
        }
      }
      if (paths.length === 0) {
        return [];
      }
      if (paths.length === 1) {
        return [paths[0][paths[0].length - 1]];
      }
      let commonAncestor = null;
      const minLength = Math.min(...paths.map(path => path.length));
      for (let i = 0; i < minLength; i++) {
        const currentNodes = paths.map(path => path[i]);
        const firstNode = currentNodes[0];
        if (currentNodes.every(node => node.id === firstNode.id)) {
          commonAncestor = firstNode;
        } else {
          break;
        }
      }
      if (commonAncestor) {
        return [commonAncestor];
      }
      return [root];
    }
    static findPathToNode(root, targetId) {
      if (root.id === targetId) {
        return [root];
      }
      if (root.slots && Array.isArray(root.slots)) {
        for (const slot of root.slots) {
          if (slot.components && Array.isArray(slot.components)) {
            for (const component of slot.components) {
              const path = this.findPathToNode(component, targetId);
              if (path) {
                return [root, ...path];
              }
            }
          }
        }
      }
      return null;
    }
    static findNodeById(root, targetId) {
      if (root.id === targetId) {
        return root;
      }
      if (root.slots && Array.isArray(root.slots)) {
        for (const slot of root.slots) {
          if (slot.components && Array.isArray(slot.components)) {
            for (const component of slot.components) {
              const found = this.findNodeById(component, targetId);
              if (found) return found;
            }
          }
        }
      }
      return null;
    }
    static extractLayout(style) {
      if (!style) return {};
      const layout = {};
      ['width', 'height', 'margin', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom'].forEach(prop => {
        if (style[prop] !== undefined) {
          layout[prop] = style[prop];
        }
      });
      if (style.layout !== undefined) {
        if (style.layout === 'flex-column' || style.layout === 'flex') {
          layout.display = 'flex';
          layout.flexDirection = 'column';
        }
        if (style.layout === 'flex-row') {
          layout.display = 'flex';
          layout.flexDirection = 'row';
        }
        if (style.alignItems) layout.alignItems = style.alignItems;
        if (style.justifyContent) layout.justifyContent = style.justifyContent;
        if (style.layout === 'absolute') {
          layout.position = 'relative';
        }
      }
      if (style.position === 'absolute') {
        ['left', 'right', 'top', 'bottom', 'widthFact', 'heightFact', 'position'].forEach(prop => {
          if (style[prop] !== undefined) {
            layout[prop] = style[prop];
          }
        });
      }
      return layout;
    }
    static extractStyleArray(style) {
      if (!(style !== null && style !== void 0 && style.css) || !Array.isArray(style.css)) return [];
      return style.css.map(cssItem => {
        const selector = cssItem.selector || '';
        const cssProps = cssItem.css || {};
        const cssString = Object.entries(cssProps).map(_ref2 => {
          let [key, value] = _ref2;
          return "".concat(key, ": '").concat(value, "'");
        }).join(', ');
        return "".concat(selector, " : { ").concat(cssString, " }");
      });
    }
    static processData(node) {
      var _node$def;
      if (!node) return '';
      if (Array.isArray(node)) {
        return node.map(item => this.processData(item)).filter(Boolean).join('\n');
      }
      if (node.id && (_node$def = node.def) !== null && _node$def !== void 0 && _node$def.namespace) {
        return this.generateComponentJSX(node);
      }
      if (node.slots && Array.isArray(node.slots)) {
        return node.slots.map(slot => {
          if (slot.components && Array.isArray(slot.components)) {
            return this.processData(slot.components);
          }
          return '';
        }).filter(Boolean).join('');
      }
      return '';
    }
    static generateComponentJSX(node) {
      var _node$def2;
      let indent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      if (!(node !== null && node !== void 0 && node.id)) return '';
      const namespace = (_node$def2 = node.def) === null || _node$def2 === void 0 ? void 0 : _node$def2.namespace;
      if (namespace !== ROOT_NAMESPACE) {
        this.namespacesSet.add(namespace);
      }
      const layout = this.extractLayout(node.style);
      const styleArray = this.extractStyleArray(node.style);
      let jsx;
      const namespaceTag = ComponentsManager.getAbbreviation(namespace);

      // 遮蔽data中的base64和svg内容
      const maskedData = node.data ? this.maskLargeContent(node.data) : null;
      if (node.asRoot) {
        jsx = "<".concat(ROOT_NAMESPACE, " id=\"").concat(ROOT_ID, "\"") + (maskedData ? " data={".concat(JSON.stringify(maskedData), "}") : '');
      } else {
        jsx = "<".concat(namespaceTag, " id=\"").concat(node.id, "\" title=\"").concat(node.title, "\"") + (maskedData ? " data={".concat(JSON.stringify(maskedData), "}") : '');
      }
      if (Object.keys(layout).length > 0) {
        jsx += " layout={".concat(JSON.stringify(layout), "}");
      }
      if (styleArray.length > 0) {
        // 遮蔽styleArray中的base64和svg内容
        const maskedStyleArray = styleArray.map(style => this.maskLargeContent(style));
        jsx += " styleAry={[".concat(maskedStyleArray.map(style => "\"".concat(style, "\"")).join(', '), "]}");
      }
      jsx += ' >';
      const slotsJSX = this.generateSlotsJSX(node.slots || [], indent + '  ');
      if (slotsJSX) {
        jsx += slotsJSX;
        jsx += "\n".concat(indent, "</").concat(namespaceTag, ">");
      } else {
        jsx += ' />';
      }
      return jsx;
    }
    static generateSlotsJSX(slots) {
      let indent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '  ';
      if (!slots || slots.length === 0) return '';
      let slotsJSX = '';
      slots.forEach(slot => {
        if (slot.id) {
          slotsJSX += "\n".concat(indent, "<slots.").concat(slot.id);
          if (slot.title) {
            slotsJSX += " title=\"".concat(slot.title, "\"");
          }
          if (slot.layout) {
            slotsJSX += " layout={".concat(JSON.stringify(this.extractLayout(slot.layout)), "}");
          }
          slotsJSX += '>';
          if (slot.components && Array.isArray(slot.components)) {
            slot.components.forEach(component => {
              const childJSX = this.generateComponentJSX(component, indent + '    ');
              if (childJSX) {
                slotsJSX += "\n".concat(indent, "  ").concat(childJSX);
              }
            });
          }
          slotsJSX += "\n".concat(indent, "</slots.").concat(slot.id, ">");
        }
      });
      return slotsJSX;
    }
  }
  _defineProperty(OutlineJSXGenerator, "namespacesSet", new Set());

  /**
   * 页面树生成器
   */
  class PageTreeGenerator {
    static generate(pagesInfo) {
      let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      const {
        pageId: focusedPageId
      } = options;
      const processedPages = this.processRawData(pagesInfo);
      return this.generateTreeText(processedPages, focusedPageId);
    }
    static processRawData(rawData) {
      // 如果 rawData 是数组
      if (Array.isArray(rawData)) {
        const allPages = [];
        rawData.forEach(canvas => {
          if (canvas.pageAry && Array.isArray(canvas.pageAry)) {
            // 多画布
            allPages.push(...canvas.pageAry.map(page => ({
              id: page.id,
              title: page.title,
              type: page.type,
              componentType: page.componentType || undefined,
              children: page.children || []
            })));
          } else if (canvas.id) {
            allPages.push(_objectSpread2({}, canvas));
          }
        });
        return allPages;
      }

      // 如果不是数组
      if (!(rawData !== null && rawData !== void 0 && rawData.pageAry)) {
        return [];
      }
      return rawData.pageAry.map(page => ({
        id: page.id,
        title: page.title,
        type: page.type,
        componentType: page.componentType || undefined,
        children: page.children || []
      }));
    }
    static generateTreeText(pages, focusedPageId) {
      let level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      let result = '';
      const indent = '  '.repeat(level);
      pages.forEach(page => {
        let line = "".concat(indent, "- ").concat(page.title, "[id=").concat(page.id, "]");
        if (page.componentType) {
          line += "(".concat(page.componentType, ")");
        }
        if (focusedPageId && page.id === focusedPageId) {
          line += ' 【当前聚焦】';
        }
        result += line + '\n';
        if (page.children && page.children.length > 0) {
          result += this.generateTreeText(page.children, focusedPageId, level + 1);
        }
      });
      return result;
    }
  }

  class UITree {
    constructor() {
      _defineProperty(this, "nodeMap", new Map());
      _defineProperty(this, "comIdToNamespace", new Map());
      _defineProperty(this, "comIdTransform", new ComIdTransform([]));
      _defineProperty(this, "varIdTransform", new ComIdTransform([]));
    }
    getComId(comId) {
      return this.comIdTransform.getComId(comId);
    }
    addNode(node) {
      const {
        id,
        parent
      } = node;
      const namespace = this.comIdToNamespace.get(parent.id);
      let scope = false;
      if (namespace) {
        var _component$all;
        const component = ComponentsManager.getAiComponent(namespace);
        if ((component === null || component === void 0 || (_component$all = component.all) === null || _component$all === void 0 || (_component$all = _component$all.slots) === null || _component$all === void 0 || (_component$all = _component$all.find(slot => slot.id === parent.slotId)) === null || _component$all === void 0 ? void 0 : _component$all.type) === "scope") {
          scope = true;
        }
      }
      this.nodeMap.set(id, {
        id,
        parent: _objectSpread2(_objectSpread2({}, parent), {}, {
          scope
        })
      });
    }
    getScope(nodeId) {
      let node = this.nodeMap.get(nodeId);
      while (node) {
        if (node.parent.id === "_root_") {
          return node.parent;
        }
        if (node.parent.scope) {
          return node.parent;
        }
        node = this.nodeMap.get(node.parent.id);
      }
    }
    setNamespace(comId, namespace) {
      this.comIdToNamespace.set(comId, namespace);
    }
  }
  class MyBricksAPI {
    constructor(config) {
      _defineProperty(this, "operatorMap", new Map());
      _defineProperty(this, "createPageOperator", async pageId => {
        const parser = createActionsParser({
          enabledActionTags: true
        });
        const uiTree = new UITree();
        await this.api.page.api.updatePage(pageId, [], "start");
        this.operatorMap.set(pageId, {
          pageId,
          parser,
          uiTree
        });
      });
      _defineProperty(this, "updatePageOperator", async (pageId, actionsStr) => {
        const context = this.operatorMap.get(pageId);
        if (!context) return;
        const {
          parser,
          uiTree
        } = context;
        debugger
        const actions = parser(actionsStr);
        debugger
        actions.forEach(action => {
          if (action.type === "addChild") {
            const childComId = action.params.comId;
            action.params.comId = uiTree.comIdTransform.addComId(childComId);
            uiTree.setNamespace(action.params.comId, action.params.namespace);
            const parentComId = action.comId;
            if (parentComId !== "_root_") {
              action.comId = uiTree.getComId(parentComId);
            }
            uiTree.addNode({
              id: action.params.comId,
              parent: {
                id: action.comId,
                slotId: action.target
              }
            });
          } else if (action.type === "doConfig") {
            const comId = action.comId;
            if (comId !== "_root_") {
              action.comId = uiTree.getComId(comId);
            }
          }
        });
        for (const action of actions) {
          await this.api.page.api.updatePage(pageId, [action], "ing");
        }
      });
      _defineProperty(this, "completePageOperator", async pageId => {
        const context = this.operatorMap.get(pageId);
        if (!context) return;
        await this.api.page.api.updatePage(pageId, [], "complete");
        this.operatorMap.delete(pageId);
      });
      _defineProperty(this, "getAllComDefPrompts", async () => {
        return this.api.global.api.getAllComDefPrompts();
      });
      _defineProperty(this, "getComEditorPrompts", async namespace => {
        return this.api.global.api.getComEditorPrompts(namespace);
      });
      _defineProperty(this, "getPageContent", async pageId => {
        return this.outlineInfoManager.generateJSXByPageId(pageId);
      });
      _defineProperty(this, "getPagesInfo", async () => {
        const pagesInfo = this.api.global.api.getAllPageInfo();
        const pageTree = PageTreeGenerator.generate(pagesInfo);
        return pageTree;
      });
      this.api = config.api;
      this.outlineInfoManager = new OutlineInfoManager({
        api: this.api
      });
    }
  }

  exports.MyBricksAPI = MyBricksAPI;

}));
