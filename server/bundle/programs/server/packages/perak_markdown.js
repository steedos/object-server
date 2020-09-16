(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var Markdown;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/perak_markdown/packages/perak_markdown.js                                           //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/perak:markdown/marked/lib/marked.js                                         //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
/**                                                                                     // 1
 * marked - a markdown parser                                                           // 2
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)                         // 3
 * https://github.com/chjj/marked                                                       // 4
 */                                                                                     // 5
                                                                                        // 6
;(function() {                                                                          // 7
                                                                                        // 8
/**                                                                                     // 9
 * Block-Level Grammar                                                                  // 10
 */                                                                                     // 11
                                                                                        // 12
var block = {                                                                           // 13
  newline: /^\n+/,                                                                      // 14
  code: /^( {4}[^\n]+\n*)+/,                                                            // 15
  fences: noop,                                                                         // 16
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,                                                      // 17
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,                                     // 18
  nptable: noop,                                                                        // 19
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,                                        // 20
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,                                     // 21
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,                // 22
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/, // 23
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,             // 24
  table: noop,                                                                          // 25
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,          // 26
  text: /^[^\n]+/                                                                       // 27
};                                                                                      // 28
                                                                                        // 29
block.bullet = /(?:[*+-]|\d+\.)/;                                                       // 30
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;                              // 31
block.item = replace(block.item, 'gm')                                                  // 32
  (/bull/g, block.bullet)                                                               // 33
  ();                                                                                   // 34
                                                                                        // 35
block.list = replace(block.list)                                                        // 36
  (/bull/g, block.bullet)                                                               // 37
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')                                       // 38
  ('def', '\\n+(?=' + block.def.source + ')')                                           // 39
  ();                                                                                   // 40
                                                                                        // 41
block.blockquote = replace(block.blockquote)                                            // 42
  ('def', block.def)                                                                    // 43
  ();                                                                                   // 44
                                                                                        // 45
block._tag = '(?!(?:'                                                                   // 46
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'                                // 47
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'                               // 48
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';                          // 49
                                                                                        // 50
block.html = replace(block.html)                                                        // 51
  ('comment', /<!--[\s\S]*?-->/)                                                        // 52
  ('closed', /<(tag)[\s\S]+?<\/\1>/)                                                    // 53
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)                                      // 54
  (/tag/g, block._tag)                                                                  // 55
  ();                                                                                   // 56
                                                                                        // 57
block.paragraph = replace(block.paragraph)                                              // 58
  ('hr', block.hr)                                                                      // 59
  ('heading', block.heading)                                                            // 60
  ('lheading', block.lheading)                                                          // 61
  ('blockquote', block.blockquote)                                                      // 62
  ('tag', '<' + block._tag)                                                             // 63
  ('def', block.def)                                                                    // 64
  ();                                                                                   // 65
                                                                                        // 66
/**                                                                                     // 67
 * Normal Block Grammar                                                                 // 68
 */                                                                                     // 69
                                                                                        // 70
block.normal = merge({}, block);                                                        // 71
                                                                                        // 72
/**                                                                                     // 73
 * GFM Block Grammar                                                                    // 74
 */                                                                                     // 75
                                                                                        // 76
block.gfm = merge({}, block.normal, {                                                   // 77
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,                     // 78
  paragraph: /^/                                                                        // 79
});                                                                                     // 80
                                                                                        // 81
block.gfm.paragraph = replace(block.paragraph)                                          // 82
  ('(?!', '(?!'                                                                         // 83
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'                               // 84
    + block.list.source.replace('\\1', '\\3') + '|')                                    // 85
  ();                                                                                   // 86
                                                                                        // 87
/**                                                                                     // 88
 * GFM + Tables Block Grammar                                                           // 89
 */                                                                                     // 90
                                                                                        // 91
block.tables = merge({}, block.gfm, {                                                   // 92
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,             // 93
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/                    // 94
});                                                                                     // 95
                                                                                        // 96
/**                                                                                     // 97
 * Block Lexer                                                                          // 98
 */                                                                                     // 99
                                                                                        // 100
function Lexer(options) {                                                               // 101
  this.tokens = [];                                                                     // 102
  this.tokens.links = {};                                                               // 103
  this.options = options || marked.defaults;                                            // 104
  this.rules = block.normal;                                                            // 105
                                                                                        // 106
  if (this.options.gfm) {                                                               // 107
    if (this.options.tables) {                                                          // 108
      this.rules = block.tables;                                                        // 109
    } else {                                                                            // 110
      this.rules = block.gfm;                                                           // 111
    }                                                                                   // 112
  }                                                                                     // 113
}                                                                                       // 114
                                                                                        // 115
/**                                                                                     // 116
 * Expose Block Rules                                                                   // 117
 */                                                                                     // 118
                                                                                        // 119
Lexer.rules = block;                                                                    // 120
                                                                                        // 121
/**                                                                                     // 122
 * Static Lex Method                                                                    // 123
 */                                                                                     // 124
                                                                                        // 125
Lexer.lex = function(src, options) {                                                    // 126
  var lexer = new Lexer(options);                                                       // 127
  return lexer.lex(src);                                                                // 128
};                                                                                      // 129
                                                                                        // 130
/**                                                                                     // 131
 * Preprocessing                                                                        // 132
 */                                                                                     // 133
                                                                                        // 134
Lexer.prototype.lex = function(src) {                                                   // 135
  src = src                                                                             // 136
    .replace(/\r\n|\r/g, '\n')                                                          // 137
    .replace(/\t/g, '    ')                                                             // 138
    .replace(/\u00a0/g, ' ')                                                            // 139
    .replace(/\u2424/g, '\n');                                                          // 140
                                                                                        // 141
  return this.token(src, true);                                                         // 142
};                                                                                      // 143
                                                                                        // 144
/**                                                                                     // 145
 * Lexing                                                                               // 146
 */                                                                                     // 147
                                                                                        // 148
Lexer.prototype.token = function(src, top, bq) {                                        // 149
  var src = src.replace(/^ +$/gm, '')                                                   // 150
    , next                                                                              // 151
    , loose                                                                             // 152
    , cap                                                                               // 153
    , bull                                                                              // 154
    , b                                                                                 // 155
    , item                                                                              // 156
    , space                                                                             // 157
    , i                                                                                 // 158
    , l;                                                                                // 159
                                                                                        // 160
  while (src) {                                                                         // 161
    // newline                                                                          // 162
    if (cap = this.rules.newline.exec(src)) {                                           // 163
      src = src.substring(cap[0].length);                                               // 164
      if (cap[0].length > 1) {                                                          // 165
        this.tokens.push({                                                              // 166
          type: 'space'                                                                 // 167
        });                                                                             // 168
      }                                                                                 // 169
    }                                                                                   // 170
                                                                                        // 171
    // code                                                                             // 172
    if (cap = this.rules.code.exec(src)) {                                              // 173
      src = src.substring(cap[0].length);                                               // 174
      cap = cap[0].replace(/^ {4}/gm, '');                                              // 175
      this.tokens.push({                                                                // 176
        type: 'code',                                                                   // 177
        text: !this.options.pedantic                                                    // 178
          ? cap.replace(/\n+$/, '')                                                     // 179
          : cap                                                                         // 180
      });                                                                               // 181
      continue;                                                                         // 182
    }                                                                                   // 183
                                                                                        // 184
    // fences (gfm)                                                                     // 185
    if (cap = this.rules.fences.exec(src)) {                                            // 186
      src = src.substring(cap[0].length);                                               // 187
      this.tokens.push({                                                                // 188
        type: 'code',                                                                   // 189
        lang: cap[2],                                                                   // 190
        text: cap[3]                                                                    // 191
      });                                                                               // 192
      continue;                                                                         // 193
    }                                                                                   // 194
                                                                                        // 195
    // heading                                                                          // 196
    if (cap = this.rules.heading.exec(src)) {                                           // 197
      src = src.substring(cap[0].length);                                               // 198
      this.tokens.push({                                                                // 199
        type: 'heading',                                                                // 200
        depth: cap[1].length,                                                           // 201
        text: cap[2]                                                                    // 202
      });                                                                               // 203
      continue;                                                                         // 204
    }                                                                                   // 205
                                                                                        // 206
    // table no leading pipe (gfm)                                                      // 207
    if (top && (cap = this.rules.nptable.exec(src))) {                                  // 208
      src = src.substring(cap[0].length);                                               // 209
                                                                                        // 210
      item = {                                                                          // 211
        type: 'table',                                                                  // 212
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),                     // 213
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),                        // 214
        cells: cap[3].replace(/\n$/, '').split('\n')                                    // 215
      };                                                                                // 216
                                                                                        // 217
      for (i = 0; i < item.align.length; i++) {                                         // 218
        if (/^ *-+: *$/.test(item.align[i])) {                                          // 219
          item.align[i] = 'right';                                                      // 220
        } else if (/^ *:-+: *$/.test(item.align[i])) {                                  // 221
          item.align[i] = 'center';                                                     // 222
        } else if (/^ *:-+ *$/.test(item.align[i])) {                                   // 223
          item.align[i] = 'left';                                                       // 224
        } else {                                                                        // 225
          item.align[i] = null;                                                         // 226
        }                                                                               // 227
      }                                                                                 // 228
                                                                                        // 229
      for (i = 0; i < item.cells.length; i++) {                                         // 230
        item.cells[i] = item.cells[i].split(/ *\| */);                                  // 231
      }                                                                                 // 232
                                                                                        // 233
      this.tokens.push(item);                                                           // 234
                                                                                        // 235
      continue;                                                                         // 236
    }                                                                                   // 237
                                                                                        // 238
    // lheading                                                                         // 239
    if (cap = this.rules.lheading.exec(src)) {                                          // 240
      src = src.substring(cap[0].length);                                               // 241
      this.tokens.push({                                                                // 242
        type: 'heading',                                                                // 243
        depth: cap[2] === '=' ? 1 : 2,                                                  // 244
        text: cap[1]                                                                    // 245
      });                                                                               // 246
      continue;                                                                         // 247
    }                                                                                   // 248
                                                                                        // 249
    // hr                                                                               // 250
    if (cap = this.rules.hr.exec(src)) {                                                // 251
      src = src.substring(cap[0].length);                                               // 252
      this.tokens.push({                                                                // 253
        type: 'hr'                                                                      // 254
      });                                                                               // 255
      continue;                                                                         // 256
    }                                                                                   // 257
                                                                                        // 258
    // blockquote                                                                       // 259
    if (cap = this.rules.blockquote.exec(src)) {                                        // 260
      src = src.substring(cap[0].length);                                               // 261
                                                                                        // 262
      this.tokens.push({                                                                // 263
        type: 'blockquote_start'                                                        // 264
      });                                                                               // 265
                                                                                        // 266
      cap = cap[0].replace(/^ *> ?/gm, '');                                             // 267
                                                                                        // 268
      // Pass `top` to keep the current                                                 // 269
      // "toplevel" state. This is exactly                                              // 270
      // how markdown.pl works.                                                         // 271
      this.token(cap, top, true);                                                       // 272
                                                                                        // 273
      this.tokens.push({                                                                // 274
        type: 'blockquote_end'                                                          // 275
      });                                                                               // 276
                                                                                        // 277
      continue;                                                                         // 278
    }                                                                                   // 279
                                                                                        // 280
    // list                                                                             // 281
    if (cap = this.rules.list.exec(src)) {                                              // 282
      src = src.substring(cap[0].length);                                               // 283
      bull = cap[2];                                                                    // 284
                                                                                        // 285
      this.tokens.push({                                                                // 286
        type: 'list_start',                                                             // 287
        ordered: bull.length > 1                                                        // 288
      });                                                                               // 289
                                                                                        // 290
      // Get each top-level item.                                                       // 291
      cap = cap[0].match(this.rules.item);                                              // 292
                                                                                        // 293
      next = false;                                                                     // 294
      l = cap.length;                                                                   // 295
      i = 0;                                                                            // 296
                                                                                        // 297
      for (; i < l; i++) {                                                              // 298
        item = cap[i];                                                                  // 299
                                                                                        // 300
        // Remove the list item's bullet                                                // 301
        // so it is seen as the next token.                                             // 302
        space = item.length;                                                            // 303
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');                                  // 304
                                                                                        // 305
        // Outdent whatever the                                                         // 306
        // list item contains. Hacky.                                                   // 307
        if (~item.indexOf('\n ')) {                                                     // 308
          space -= item.length;                                                         // 309
          item = !this.options.pedantic                                                 // 310
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')                 // 311
            : item.replace(/^ {1,4}/gm, '');                                            // 312
        }                                                                               // 313
                                                                                        // 314
        // Determine whether the next list item belongs here.                           // 315
        // Backpedal if it does not belong in this list.                                // 316
        if (this.options.smartLists && i !== l - 1) {                                   // 317
          b = block.bullet.exec(cap[i + 1])[0];                                         // 318
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {                       // 319
            src = cap.slice(i + 1).join('\n') + src;                                    // 320
            i = l - 1;                                                                  // 321
          }                                                                             // 322
        }                                                                               // 323
                                                                                        // 324
        // Determine whether item is loose or not.                                      // 325
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/                                         // 326
        // for discount behavior.                                                       // 327
        loose = next || /\n\n(?!\s*$)/.test(item);                                      // 328
        if (i !== l - 1) {                                                              // 329
          next = item.charAt(item.length - 1) === '\n';                                 // 330
          if (!loose) loose = next;                                                     // 331
        }                                                                               // 332
                                                                                        // 333
        this.tokens.push({                                                              // 334
          type: loose                                                                   // 335
            ? 'loose_item_start'                                                        // 336
            : 'list_item_start'                                                         // 337
        });                                                                             // 338
                                                                                        // 339
        // Recurse.                                                                     // 340
        this.token(item, false, bq);                                                    // 341
                                                                                        // 342
        this.tokens.push({                                                              // 343
          type: 'list_item_end'                                                         // 344
        });                                                                             // 345
      }                                                                                 // 346
                                                                                        // 347
      this.tokens.push({                                                                // 348
        type: 'list_end'                                                                // 349
      });                                                                               // 350
                                                                                        // 351
      continue;                                                                         // 352
    }                                                                                   // 353
                                                                                        // 354
    // html                                                                             // 355
    if (cap = this.rules.html.exec(src)) {                                              // 356
      src = src.substring(cap[0].length);                                               // 357
      this.tokens.push({                                                                // 358
        type: this.options.sanitize                                                     // 359
          ? 'paragraph'                                                                 // 360
          : 'html',                                                                     // 361
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',             // 362
        text: cap[0]                                                                    // 363
      });                                                                               // 364
      continue;                                                                         // 365
    }                                                                                   // 366
                                                                                        // 367
    // def                                                                              // 368
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {                             // 369
      src = src.substring(cap[0].length);                                               // 370
      this.tokens.links[cap[1].toLowerCase()] = {                                       // 371
        href: cap[2],                                                                   // 372
        title: cap[3]                                                                   // 373
      };                                                                                // 374
      continue;                                                                         // 375
    }                                                                                   // 376
                                                                                        // 377
    // table (gfm)                                                                      // 378
    if (top && (cap = this.rules.table.exec(src))) {                                    // 379
      src = src.substring(cap[0].length);                                               // 380
                                                                                        // 381
      item = {                                                                          // 382
        type: 'table',                                                                  // 383
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),                     // 384
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),                        // 385
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')                         // 386
      };                                                                                // 387
                                                                                        // 388
      for (i = 0; i < item.align.length; i++) {                                         // 389
        if (/^ *-+: *$/.test(item.align[i])) {                                          // 390
          item.align[i] = 'right';                                                      // 391
        } else if (/^ *:-+: *$/.test(item.align[i])) {                                  // 392
          item.align[i] = 'center';                                                     // 393
        } else if (/^ *:-+ *$/.test(item.align[i])) {                                   // 394
          item.align[i] = 'left';                                                       // 395
        } else {                                                                        // 396
          item.align[i] = null;                                                         // 397
        }                                                                               // 398
      }                                                                                 // 399
                                                                                        // 400
      for (i = 0; i < item.cells.length; i++) {                                         // 401
        item.cells[i] = item.cells[i]                                                   // 402
          .replace(/^ *\| *| *\| *$/g, '')                                              // 403
          .split(/ *\| */);                                                             // 404
      }                                                                                 // 405
                                                                                        // 406
      this.tokens.push(item);                                                           // 407
                                                                                        // 408
      continue;                                                                         // 409
    }                                                                                   // 410
                                                                                        // 411
    // top-level paragraph                                                              // 412
    if (top && (cap = this.rules.paragraph.exec(src))) {                                // 413
      src = src.substring(cap[0].length);                                               // 414
      this.tokens.push({                                                                // 415
        type: 'paragraph',                                                              // 416
        text: cap[1].charAt(cap[1].length - 1) === '\n'                                 // 417
          ? cap[1].slice(0, -1)                                                         // 418
          : cap[1]                                                                      // 419
      });                                                                               // 420
      continue;                                                                         // 421
    }                                                                                   // 422
                                                                                        // 423
    // text                                                                             // 424
    if (cap = this.rules.text.exec(src)) {                                              // 425
      // Top-level should never reach here.                                             // 426
      src = src.substring(cap[0].length);                                               // 427
      this.tokens.push({                                                                // 428
        type: 'text',                                                                   // 429
        text: cap[0]                                                                    // 430
      });                                                                               // 431
      continue;                                                                         // 432
    }                                                                                   // 433
                                                                                        // 434
    if (src) {                                                                          // 435
      throw new                                                                         // 436
        Error('Infinite loop on byte: ' + src.charCodeAt(0));                           // 437
    }                                                                                   // 438
  }                                                                                     // 439
                                                                                        // 440
  return this.tokens;                                                                   // 441
};                                                                                      // 442
                                                                                        // 443
/**                                                                                     // 444
 * Inline-Level Grammar                                                                 // 445
 */                                                                                     // 446
                                                                                        // 447
var inline = {                                                                          // 448
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,                                                // 449
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,                                                 // 450
  url: noop,                                                                            // 451
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,                        // 452
  link: /^!?\[(inside)\]\(href\)/,                                                      // 453
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,                                            // 454
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,                                           // 455
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,                             // 456
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,                        // 457
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,                                             // 458
  br: /^ {2,}\n(?!\s*$)/,                                                               // 459
  del: noop,                                                                            // 460
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/                                            // 461
};                                                                                      // 462
                                                                                        // 463
inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;                              // 464
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;                        // 465
                                                                                        // 466
inline.link = replace(inline.link)                                                      // 467
  ('inside', inline._inside)                                                            // 468
  ('href', inline._href)                                                                // 469
  ();                                                                                   // 470
                                                                                        // 471
inline.reflink = replace(inline.reflink)                                                // 472
  ('inside', inline._inside)                                                            // 473
  ();                                                                                   // 474
                                                                                        // 475
/**                                                                                     // 476
 * Normal Inline Grammar                                                                // 477
 */                                                                                     // 478
                                                                                        // 479
inline.normal = merge({}, inline);                                                      // 480
                                                                                        // 481
/**                                                                                     // 482
 * Pedantic Inline Grammar                                                              // 483
 */                                                                                     // 484
                                                                                        // 485
inline.pedantic = merge({}, inline.normal, {                                            // 486
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,             // 487
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/                        // 488
});                                                                                     // 489
                                                                                        // 490
/**                                                                                     // 491
 * GFM Inline Grammar                                                                   // 492
 */                                                                                     // 493
                                                                                        // 494
inline.gfm = merge({}, inline.normal, {                                                 // 495
  escape: replace(inline.escape)('])', '~|])')(),                                       // 496
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,                                          // 497
  del: /^~~(?=\S)([\s\S]*?\S)~~/,                                                       // 498
  text: replace(inline.text)                                                            // 499
    (']|', '~]|')                                                                       // 500
    ('|', '|https?://|')                                                                // 501
    ()                                                                                  // 502
});                                                                                     // 503
                                                                                        // 504
/**                                                                                     // 505
 * GFM + Line Breaks Inline Grammar                                                     // 506
 */                                                                                     // 507
                                                                                        // 508
inline.breaks = merge({}, inline.gfm, {                                                 // 509
  br: replace(inline.br)('{2,}', '*')(),                                                // 510
  text: replace(inline.gfm.text)('{2,}', '*')()                                         // 511
});                                                                                     // 512
                                                                                        // 513
/**                                                                                     // 514
 * Inline Lexer & Compiler                                                              // 515
 */                                                                                     // 516
                                                                                        // 517
function InlineLexer(links, options) {                                                  // 518
  this.options = options || marked.defaults;                                            // 519
  this.links = links;                                                                   // 520
  this.rules = inline.normal;                                                           // 521
  this.renderer = this.options.renderer || new Renderer;                                // 522
  this.renderer.options = this.options;                                                 // 523
                                                                                        // 524
  if (!this.links) {                                                                    // 525
    throw new                                                                           // 526
      Error('Tokens array requires a `links` property.');                               // 527
  }                                                                                     // 528
                                                                                        // 529
  if (this.options.gfm) {                                                               // 530
    if (this.options.breaks) {                                                          // 531
      this.rules = inline.breaks;                                                       // 532
    } else {                                                                            // 533
      this.rules = inline.gfm;                                                          // 534
    }                                                                                   // 535
  } else if (this.options.pedantic) {                                                   // 536
    this.rules = inline.pedantic;                                                       // 537
  }                                                                                     // 538
}                                                                                       // 539
                                                                                        // 540
/**                                                                                     // 541
 * Expose Inline Rules                                                                  // 542
 */                                                                                     // 543
                                                                                        // 544
InlineLexer.rules = inline;                                                             // 545
                                                                                        // 546
/**                                                                                     // 547
 * Static Lexing/Compiling Method                                                       // 548
 */                                                                                     // 549
                                                                                        // 550
InlineLexer.output = function(src, links, options) {                                    // 551
  var inline = new InlineLexer(links, options);                                         // 552
  return inline.output(src);                                                            // 553
};                                                                                      // 554
                                                                                        // 555
/**                                                                                     // 556
 * Lexing/Compiling                                                                     // 557
 */                                                                                     // 558
                                                                                        // 559
InlineLexer.prototype.output = function(src) {                                          // 560
  var out = ''                                                                          // 561
    , link                                                                              // 562
    , text                                                                              // 563
    , href                                                                              // 564
    , cap;                                                                              // 565
                                                                                        // 566
  while (src) {                                                                         // 567
    // escape                                                                           // 568
    if (cap = this.rules.escape.exec(src)) {                                            // 569
      src = src.substring(cap[0].length);                                               // 570
      out += cap[1];                                                                    // 571
      continue;                                                                         // 572
    }                                                                                   // 573
                                                                                        // 574
    // autolink                                                                         // 575
    if (cap = this.rules.autolink.exec(src)) {                                          // 576
      src = src.substring(cap[0].length);                                               // 577
      if (cap[2] === '@') {                                                             // 578
        text = cap[1].charAt(6) === ':'                                                 // 579
          ? this.mangle(cap[1].substring(7))                                            // 580
          : this.mangle(cap[1]);                                                        // 581
        href = this.mangle('mailto:') + text;                                           // 582
      } else {                                                                          // 583
        text = escape(cap[1]);                                                          // 584
        href = text;                                                                    // 585
      }                                                                                 // 586
      out += this.renderer.link(href, null, text);                                      // 587
      continue;                                                                         // 588
    }                                                                                   // 589
                                                                                        // 590
    // url (gfm)                                                                        // 591
    if (!this.inLink && (cap = this.rules.url.exec(src))) {                             // 592
      src = src.substring(cap[0].length);                                               // 593
      text = escape(cap[1]);                                                            // 594
      href = text;                                                                      // 595
      out += this.renderer.link(href, null, text);                                      // 596
      continue;                                                                         // 597
    }                                                                                   // 598
                                                                                        // 599
    // tag                                                                              // 600
    if (cap = this.rules.tag.exec(src)) {                                               // 601
      if (!this.inLink && /^<a /i.test(cap[0])) {                                       // 602
        this.inLink = true;                                                             // 603
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {                               // 604
        this.inLink = false;                                                            // 605
      }                                                                                 // 606
      src = src.substring(cap[0].length);                                               // 607
      out += this.options.sanitize                                                      // 608
        ? escape(cap[0])                                                                // 609
        : cap[0];                                                                       // 610
      continue;                                                                         // 611
    }                                                                                   // 612
                                                                                        // 613
    // link                                                                             // 614
    if (cap = this.rules.link.exec(src)) {                                              // 615
      src = src.substring(cap[0].length);                                               // 616
      this.inLink = true;                                                               // 617
      out += this.outputLink(cap, {                                                     // 618
        href: cap[2],                                                                   // 619
        title: cap[3]                                                                   // 620
      });                                                                               // 621
      this.inLink = false;                                                              // 622
      continue;                                                                         // 623
    }                                                                                   // 624
                                                                                        // 625
    // reflink, nolink                                                                  // 626
    if ((cap = this.rules.reflink.exec(src))                                            // 627
        || (cap = this.rules.nolink.exec(src))) {                                       // 628
      src = src.substring(cap[0].length);                                               // 629
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');                                   // 630
      link = this.links[link.toLowerCase()];                                            // 631
      if (!link || !link.href) {                                                        // 632
        out += cap[0].charAt(0);                                                        // 633
        src = cap[0].substring(1) + src;                                                // 634
        continue;                                                                       // 635
      }                                                                                 // 636
      this.inLink = true;                                                               // 637
      out += this.outputLink(cap, link);                                                // 638
      this.inLink = false;                                                              // 639
      continue;                                                                         // 640
    }                                                                                   // 641
                                                                                        // 642
    // strong                                                                           // 643
    if (cap = this.rules.strong.exec(src)) {                                            // 644
      src = src.substring(cap[0].length);                                               // 645
      out += this.renderer.strong(this.output(cap[2] || cap[1]));                       // 646
      continue;                                                                         // 647
    }                                                                                   // 648
                                                                                        // 649
    // em                                                                               // 650
    if (cap = this.rules.em.exec(src)) {                                                // 651
      src = src.substring(cap[0].length);                                               // 652
      out += this.renderer.em(this.output(cap[2] || cap[1]));                           // 653
      continue;                                                                         // 654
    }                                                                                   // 655
                                                                                        // 656
    // code                                                                             // 657
    if (cap = this.rules.code.exec(src)) {                                              // 658
      src = src.substring(cap[0].length);                                               // 659
      out += this.renderer.codespan(escape(cap[2], true));                              // 660
      continue;                                                                         // 661
    }                                                                                   // 662
                                                                                        // 663
    // br                                                                               // 664
    if (cap = this.rules.br.exec(src)) {                                                // 665
      src = src.substring(cap[0].length);                                               // 666
      out += this.renderer.br();                                                        // 667
      continue;                                                                         // 668
    }                                                                                   // 669
                                                                                        // 670
    // del (gfm)                                                                        // 671
    if (cap = this.rules.del.exec(src)) {                                               // 672
      src = src.substring(cap[0].length);                                               // 673
      out += this.renderer.del(this.output(cap[1]));                                    // 674
      continue;                                                                         // 675
    }                                                                                   // 676
                                                                                        // 677
    // text                                                                             // 678
    if (cap = this.rules.text.exec(src)) {                                              // 679
      src = src.substring(cap[0].length);                                               // 680
      out += escape(this.smartypants(cap[0]));                                          // 681
      continue;                                                                         // 682
    }                                                                                   // 683
                                                                                        // 684
    if (src) {                                                                          // 685
      throw new                                                                         // 686
        Error('Infinite loop on byte: ' + src.charCodeAt(0));                           // 687
    }                                                                                   // 688
  }                                                                                     // 689
                                                                                        // 690
  return out;                                                                           // 691
};                                                                                      // 692
                                                                                        // 693
/**                                                                                     // 694
 * Compile Link                                                                         // 695
 */                                                                                     // 696
                                                                                        // 697
InlineLexer.prototype.outputLink = function(cap, link) {                                // 698
  var href = escape(link.href)                                                          // 699
    , title = link.title ? escape(link.title) : null;                                   // 700
                                                                                        // 701
  return cap[0].charAt(0) !== '!'                                                       // 702
    ? this.renderer.link(href, title, this.output(cap[1]))                              // 703
    : this.renderer.image(href, title, escape(cap[1]));                                 // 704
};                                                                                      // 705
                                                                                        // 706
/**                                                                                     // 707
 * Smartypants Transformations                                                          // 708
 */                                                                                     // 709
                                                                                        // 710
InlineLexer.prototype.smartypants = function(text) {                                    // 711
  if (!this.options.smartypants) return text;                                           // 712
  return text                                                                           // 713
    // em-dashes                                                                        // 714
    .replace(/--/g, '\u2014')                                                           // 715
    // opening singles                                                                  // 716
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')                                     // 717
    // closing singles & apostrophes                                                    // 718
    .replace(/'/g, '\u2019')                                                            // 719
    // opening doubles                                                                  // 720
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')                                // 721
    // closing doubles                                                                  // 722
    .replace(/"/g, '\u201d')                                                            // 723
    // ellipses                                                                         // 724
    .replace(/\.{3}/g, '\u2026');                                                       // 725
};                                                                                      // 726
                                                                                        // 727
/**                                                                                     // 728
 * Mangle Links                                                                         // 729
 */                                                                                     // 730
                                                                                        // 731
InlineLexer.prototype.mangle = function(text) {                                         // 732
  var out = ''                                                                          // 733
    , l = text.length                                                                   // 734
    , i = 0                                                                             // 735
    , ch;                                                                               // 736
                                                                                        // 737
  for (; i < l; i++) {                                                                  // 738
    ch = text.charCodeAt(i);                                                            // 739
    if (Math.random() > 0.5) {                                                          // 740
      ch = 'x' + ch.toString(16);                                                       // 741
    }                                                                                   // 742
    out += '&#' + ch + ';';                                                             // 743
  }                                                                                     // 744
                                                                                        // 745
  return out;                                                                           // 746
};                                                                                      // 747
                                                                                        // 748
/**                                                                                     // 749
 * Renderer                                                                             // 750
 */                                                                                     // 751
                                                                                        // 752
function Renderer(options) {                                                            // 753
  this.options = options || {};                                                         // 754
}                                                                                       // 755
                                                                                        // 756
Renderer.prototype.code = function(code, lang, escaped) {                               // 757
  if (this.options.highlight) {                                                         // 758
    var out = this.options.highlight(code, lang);                                       // 759
    if (out != null && out !== code) {                                                  // 760
      escaped = true;                                                                   // 761
      code = out;                                                                       // 762
    }                                                                                   // 763
  }                                                                                     // 764
                                                                                        // 765
  if (!lang) {                                                                          // 766
    return '<pre><code>'                                                                // 767
      + (escaped ? code : escape(code, true))                                           // 768
      + '\n</code></pre>';                                                              // 769
  }                                                                                     // 770
                                                                                        // 771
  return '<pre><code class="'                                                           // 772
    + this.options.langPrefix                                                           // 773
    + escape(lang, true)                                                                // 774
    + '">'                                                                              // 775
    + (escaped ? code : escape(code, true))                                             // 776
    + '\n</code></pre>\n';                                                              // 777
};                                                                                      // 778
                                                                                        // 779
Renderer.prototype.blockquote = function(quote) {                                       // 780
  return '<blockquote>\n' + quote + '</blockquote>\n';                                  // 781
};                                                                                      // 782
                                                                                        // 783
Renderer.prototype.html = function(html) {                                              // 784
  return html;                                                                          // 785
};                                                                                      // 786
                                                                                        // 787
Renderer.prototype.heading = function(text, level, raw) {                               // 788
  return '<h'                                                                           // 789
    + level                                                                             // 790
    + ' id="'                                                                           // 791
    + this.options.headerPrefix                                                         // 792
    + raw.toLowerCase().replace(/[^\w]+/g, '-')                                         // 793
    + '">'                                                                              // 794
    + text                                                                              // 795
    + '</h'                                                                             // 796
    + level                                                                             // 797
    + '>\n';                                                                            // 798
};                                                                                      // 799
                                                                                        // 800
Renderer.prototype.hr = function() {                                                    // 801
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';                                     // 802
};                                                                                      // 803
                                                                                        // 804
Renderer.prototype.list = function(body, ordered) {                                     // 805
  var type = ordered ? 'ol' : 'ul';                                                     // 806
  return '<' + type + '>\n' + body + '</' + type + '>\n';                               // 807
};                                                                                      // 808
                                                                                        // 809
Renderer.prototype.listitem = function(text) {                                          // 810
  return '<li>' + text + '</li>\n';                                                     // 811
};                                                                                      // 812
                                                                                        // 813
Renderer.prototype.paragraph = function(text) {                                         // 814
  return '<p>' + text + '</p>\n';                                                       // 815
};                                                                                      // 816
                                                                                        // 817
Renderer.prototype.table = function(header, body) {                                     // 818
  return '<table>\n'                                                                    // 819
    + '<thead>\n'                                                                       // 820
    + header                                                                            // 821
    + '</thead>\n'                                                                      // 822
    + '<tbody>\n'                                                                       // 823
    + body                                                                              // 824
    + '</tbody>\n'                                                                      // 825
    + '</table>\n';                                                                     // 826
};                                                                                      // 827
                                                                                        // 828
Renderer.prototype.tablerow = function(content) {                                       // 829
  return '<tr>\n' + content + '</tr>\n';                                                // 830
};                                                                                      // 831
                                                                                        // 832
Renderer.prototype.tablecell = function(content, flags) {                               // 833
  var type = flags.header ? 'th' : 'td';                                                // 834
  var tag = flags.align                                                                 // 835
    ? '<' + type + ' style="text-align:' + flags.align + '">'                           // 836
    : '<' + type + '>';                                                                 // 837
  return tag + content + '</' + type + '>\n';                                           // 838
};                                                                                      // 839
                                                                                        // 840
// span level renderer                                                                  // 841
Renderer.prototype.strong = function(text) {                                            // 842
  return '<strong>' + text + '</strong>';                                               // 843
};                                                                                      // 844
                                                                                        // 845
Renderer.prototype.em = function(text) {                                                // 846
  return '<em>' + text + '</em>';                                                       // 847
};                                                                                      // 848
                                                                                        // 849
Renderer.prototype.codespan = function(text) {                                          // 850
  return '<code>' + text + '</code>';                                                   // 851
};                                                                                      // 852
                                                                                        // 853
Renderer.prototype.br = function() {                                                    // 854
  return this.options.xhtml ? '<br/>' : '<br>';                                         // 855
};                                                                                      // 856
                                                                                        // 857
Renderer.prototype.del = function(text) {                                               // 858
  return '<del>' + text + '</del>';                                                     // 859
};                                                                                      // 860
                                                                                        // 861
Renderer.prototype.link = function(href, title, text) {                                 // 862
  if (this.options.sanitize) {                                                          // 863
    try {                                                                               // 864
      var prot = decodeURIComponent(unescape(href))                                     // 865
        .replace(/[^\w:]/g, '')                                                         // 866
        .toLowerCase();                                                                 // 867
    } catch (e) {                                                                       // 868
      return '';                                                                        // 869
    }                                                                                   // 870
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {         // 871
      return '';                                                                        // 872
    }                                                                                   // 873
  }                                                                                     // 874
  var out = '<a href="' + href + '"';                                                   // 875
  if (title) {                                                                          // 876
    out += ' title="' + title + '"';                                                    // 877
  }                                                                                     // 878
  out += '>' + text + '</a>';                                                           // 879
  return out;                                                                           // 880
};                                                                                      // 881
                                                                                        // 882
Renderer.prototype.image = function(href, title, text) {                                // 883
  var out = '<img src="' + href + '" alt="' + text + '"';                               // 884
  if (title) {                                                                          // 885
    out += ' title="' + title + '"';                                                    // 886
  }                                                                                     // 887
  out += this.options.xhtml ? '/>' : '>';                                               // 888
  return out;                                                                           // 889
};                                                                                      // 890
                                                                                        // 891
/**                                                                                     // 892
 * Parsing & Compiling                                                                  // 893
 */                                                                                     // 894
                                                                                        // 895
function Parser(options) {                                                              // 896
  this.tokens = [];                                                                     // 897
  this.token = null;                                                                    // 898
  this.options = options || marked.defaults;                                            // 899
  this.options.renderer = this.options.renderer || new Renderer;                        // 900
  this.renderer = this.options.renderer;                                                // 901
  this.renderer.options = this.options;                                                 // 902
}                                                                                       // 903
                                                                                        // 904
/**                                                                                     // 905
 * Static Parse Method                                                                  // 906
 */                                                                                     // 907
                                                                                        // 908
Parser.parse = function(src, options, renderer) {                                       // 909
  var parser = new Parser(options, renderer);                                           // 910
  return parser.parse(src);                                                             // 911
};                                                                                      // 912
                                                                                        // 913
/**                                                                                     // 914
 * Parse Loop                                                                           // 915
 */                                                                                     // 916
                                                                                        // 917
Parser.prototype.parse = function(src) {                                                // 918
  this.inline = new InlineLexer(src.links, this.options, this.renderer);                // 919
  this.tokens = src.reverse();                                                          // 920
                                                                                        // 921
  var out = '';                                                                         // 922
  while (this.next()) {                                                                 // 923
    out += this.tok();                                                                  // 924
  }                                                                                     // 925
                                                                                        // 926
  return out;                                                                           // 927
};                                                                                      // 928
                                                                                        // 929
/**                                                                                     // 930
 * Next Token                                                                           // 931
 */                                                                                     // 932
                                                                                        // 933
Parser.prototype.next = function() {                                                    // 934
  return this.token = this.tokens.pop();                                                // 935
};                                                                                      // 936
                                                                                        // 937
/**                                                                                     // 938
 * Preview Next Token                                                                   // 939
 */                                                                                     // 940
                                                                                        // 941
Parser.prototype.peek = function() {                                                    // 942
  return this.tokens[this.tokens.length - 1] || 0;                                      // 943
};                                                                                      // 944
                                                                                        // 945
/**                                                                                     // 946
 * Parse Text Tokens                                                                    // 947
 */                                                                                     // 948
                                                                                        // 949
Parser.prototype.parseText = function() {                                               // 950
  var body = this.token.text;                                                           // 951
                                                                                        // 952
  while (this.peek().type === 'text') {                                                 // 953
    body += '\n' + this.next().text;                                                    // 954
  }                                                                                     // 955
                                                                                        // 956
  return this.inline.output(body);                                                      // 957
};                                                                                      // 958
                                                                                        // 959
/**                                                                                     // 960
 * Parse Current Token                                                                  // 961
 */                                                                                     // 962
                                                                                        // 963
Parser.prototype.tok = function() {                                                     // 964
  switch (this.token.type) {                                                            // 965
    case 'space': {                                                                     // 966
      return '';                                                                        // 967
    }                                                                                   // 968
    case 'hr': {                                                                        // 969
      return this.renderer.hr();                                                        // 970
    }                                                                                   // 971
    case 'heading': {                                                                   // 972
      return this.renderer.heading(                                                     // 973
        this.inline.output(this.token.text),                                            // 974
        this.token.depth,                                                               // 975
        this.token.text);                                                               // 976
    }                                                                                   // 977
    case 'code': {                                                                      // 978
      return this.renderer.code(this.token.text,                                        // 979
        this.token.lang,                                                                // 980
        this.token.escaped);                                                            // 981
    }                                                                                   // 982
    case 'table': {                                                                     // 983
      var header = ''                                                                   // 984
        , body = ''                                                                     // 985
        , i                                                                             // 986
        , row                                                                           // 987
        , cell                                                                          // 988
        , flags                                                                         // 989
        , j;                                                                            // 990
                                                                                        // 991
      // header                                                                         // 992
      cell = '';                                                                        // 993
      for (i = 0; i < this.token.header.length; i++) {                                  // 994
        flags = { header: true, align: this.token.align[i] };                           // 995
        cell += this.renderer.tablecell(                                                // 996
          this.inline.output(this.token.header[i]),                                     // 997
          { header: true, align: this.token.align[i] }                                  // 998
        );                                                                              // 999
      }                                                                                 // 1000
      header += this.renderer.tablerow(cell);                                           // 1001
                                                                                        // 1002
      for (i = 0; i < this.token.cells.length; i++) {                                   // 1003
        row = this.token.cells[i];                                                      // 1004
                                                                                        // 1005
        cell = '';                                                                      // 1006
        for (j = 0; j < row.length; j++) {                                              // 1007
          cell += this.renderer.tablecell(                                              // 1008
            this.inline.output(row[j]),                                                 // 1009
            { header: false, align: this.token.align[j] }                               // 1010
          );                                                                            // 1011
        }                                                                               // 1012
                                                                                        // 1013
        body += this.renderer.tablerow(cell);                                           // 1014
      }                                                                                 // 1015
      return this.renderer.table(header, body);                                         // 1016
    }                                                                                   // 1017
    case 'blockquote_start': {                                                          // 1018
      var body = '';                                                                    // 1019
                                                                                        // 1020
      while (this.next().type !== 'blockquote_end') {                                   // 1021
        body += this.tok();                                                             // 1022
      }                                                                                 // 1023
                                                                                        // 1024
      return this.renderer.blockquote(body);                                            // 1025
    }                                                                                   // 1026
    case 'list_start': {                                                                // 1027
      var body = ''                                                                     // 1028
        , ordered = this.token.ordered;                                                 // 1029
                                                                                        // 1030
      while (this.next().type !== 'list_end') {                                         // 1031
        body += this.tok();                                                             // 1032
      }                                                                                 // 1033
                                                                                        // 1034
      return this.renderer.list(body, ordered);                                         // 1035
    }                                                                                   // 1036
    case 'list_item_start': {                                                           // 1037
      var body = '';                                                                    // 1038
                                                                                        // 1039
      while (this.next().type !== 'list_item_end') {                                    // 1040
        body += this.token.type === 'text'                                              // 1041
          ? this.parseText()                                                            // 1042
          : this.tok();                                                                 // 1043
      }                                                                                 // 1044
                                                                                        // 1045
      return this.renderer.listitem(body);                                              // 1046
    }                                                                                   // 1047
    case 'loose_item_start': {                                                          // 1048
      var body = '';                                                                    // 1049
                                                                                        // 1050
      while (this.next().type !== 'list_item_end') {                                    // 1051
        body += this.tok();                                                             // 1052
      }                                                                                 // 1053
                                                                                        // 1054
      return this.renderer.listitem(body);                                              // 1055
    }                                                                                   // 1056
    case 'html': {                                                                      // 1057
      var html = !this.token.pre && !this.options.pedantic                              // 1058
        ? this.inline.output(this.token.text)                                           // 1059
        : this.token.text;                                                              // 1060
      return this.renderer.html(html);                                                  // 1061
    }                                                                                   // 1062
    case 'paragraph': {                                                                 // 1063
      return this.renderer.paragraph(this.inline.output(this.token.text));              // 1064
    }                                                                                   // 1065
    case 'text': {                                                                      // 1066
      return this.renderer.paragraph(this.parseText());                                 // 1067
    }                                                                                   // 1068
  }                                                                                     // 1069
};                                                                                      // 1070
                                                                                        // 1071
/**                                                                                     // 1072
 * Helpers                                                                              // 1073
 */                                                                                     // 1074
                                                                                        // 1075
function escape(html, encode) {                                                         // 1076
  return html                                                                           // 1077
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')                                  // 1078
    .replace(/</g, '&lt;')                                                              // 1079
    .replace(/>/g, '&gt;')                                                              // 1080
    .replace(/"/g, '&quot;')                                                            // 1081
    .replace(/'/g, '&#39;');                                                            // 1082
}                                                                                       // 1083
                                                                                        // 1084
function unescape(html) {                                                               // 1085
  return html.replace(/&([#\w]+);/g, function(_, n) {                                   // 1086
    n = n.toLowerCase();                                                                // 1087
    if (n === 'colon') return ':';                                                      // 1088
    if (n.charAt(0) === '#') {                                                          // 1089
      return n.charAt(1) === 'x'                                                        // 1090
        ? String.fromCharCode(parseInt(n.substring(2), 16))                             // 1091
        : String.fromCharCode(+n.substring(1));                                         // 1092
    }                                                                                   // 1093
    return '';                                                                          // 1094
  });                                                                                   // 1095
}                                                                                       // 1096
                                                                                        // 1097
function replace(regex, opt) {                                                          // 1098
  regex = regex.source;                                                                 // 1099
  opt = opt || '';                                                                      // 1100
  return function self(name, val) {                                                     // 1101
    if (!name) return new RegExp(regex, opt);                                           // 1102
    val = val.source || val;                                                            // 1103
    val = val.replace(/(^|[^\[])\^/g, '$1');                                            // 1104
    regex = regex.replace(name, val);                                                   // 1105
    return self;                                                                        // 1106
  };                                                                                    // 1107
}                                                                                       // 1108
                                                                                        // 1109
function noop() {}                                                                      // 1110
noop.exec = noop;                                                                       // 1111
                                                                                        // 1112
function merge(obj) {                                                                   // 1113
  var i = 1                                                                             // 1114
    , target                                                                            // 1115
    , key;                                                                              // 1116
                                                                                        // 1117
  for (; i < arguments.length; i++) {                                                   // 1118
    target = arguments[i];                                                              // 1119
    for (key in target) {                                                               // 1120
      if (Object.prototype.hasOwnProperty.call(target, key)) {                          // 1121
        obj[key] = target[key];                                                         // 1122
      }                                                                                 // 1123
    }                                                                                   // 1124
  }                                                                                     // 1125
                                                                                        // 1126
  return obj;                                                                           // 1127
}                                                                                       // 1128
                                                                                        // 1129
                                                                                        // 1130
/**                                                                                     // 1131
 * Marked                                                                               // 1132
 */                                                                                     // 1133
                                                                                        // 1134
function marked(src, opt, callback) {                                                   // 1135
  if (callback || typeof opt === 'function') {                                          // 1136
    if (!callback) {                                                                    // 1137
      callback = opt;                                                                   // 1138
      opt = null;                                                                       // 1139
    }                                                                                   // 1140
                                                                                        // 1141
    opt = merge({}, marked.defaults, opt || {});                                        // 1142
                                                                                        // 1143
    var highlight = opt.highlight                                                       // 1144
      , tokens                                                                          // 1145
      , pending                                                                         // 1146
      , i = 0;                                                                          // 1147
                                                                                        // 1148
    try {                                                                               // 1149
      tokens = Lexer.lex(src, opt)                                                      // 1150
    } catch (e) {                                                                       // 1151
      return callback(e);                                                               // 1152
    }                                                                                   // 1153
                                                                                        // 1154
    pending = tokens.length;                                                            // 1155
                                                                                        // 1156
    var done = function(err) {                                                          // 1157
      if (err) {                                                                        // 1158
        opt.highlight = highlight;                                                      // 1159
        return callback(err);                                                           // 1160
      }                                                                                 // 1161
                                                                                        // 1162
      var out;                                                                          // 1163
                                                                                        // 1164
      try {                                                                             // 1165
        out = Parser.parse(tokens, opt);                                                // 1166
      } catch (e) {                                                                     // 1167
        err = e;                                                                        // 1168
      }                                                                                 // 1169
                                                                                        // 1170
      opt.highlight = highlight;                                                        // 1171
                                                                                        // 1172
      return err                                                                        // 1173
        ? callback(err)                                                                 // 1174
        : callback(null, out);                                                          // 1175
    };                                                                                  // 1176
                                                                                        // 1177
    if (!highlight || highlight.length < 3) {                                           // 1178
      return done();                                                                    // 1179
    }                                                                                   // 1180
                                                                                        // 1181
    delete opt.highlight;                                                               // 1182
                                                                                        // 1183
    if (!pending) return done();                                                        // 1184
                                                                                        // 1185
    for (; i < tokens.length; i++) {                                                    // 1186
      (function(token) {                                                                // 1187
        if (token.type !== 'code') {                                                    // 1188
          return --pending || done();                                                   // 1189
        }                                                                               // 1190
        return highlight(token.text, token.lang, function(err, code) {                  // 1191
          if (err) return done(err);                                                    // 1192
          if (code == null || code === token.text) {                                    // 1193
            return --pending || done();                                                 // 1194
          }                                                                             // 1195
          token.text = code;                                                            // 1196
          token.escaped = true;                                                         // 1197
          --pending || done();                                                          // 1198
        });                                                                             // 1199
      })(tokens[i]);                                                                    // 1200
    }                                                                                   // 1201
                                                                                        // 1202
    return;                                                                             // 1203
  }                                                                                     // 1204
  try {                                                                                 // 1205
    if (opt) opt = merge({}, marked.defaults, opt);                                     // 1206
    return Parser.parse(Lexer.lex(src, opt), opt);                                      // 1207
  } catch (e) {                                                                         // 1208
    e.message += '\nPlease report this to https://github.com/chjj/marked.';             // 1209
    if ((opt || marked.defaults).silent) {                                              // 1210
      return '<p>An error occured:</p><pre>'                                            // 1211
        + escape(e.message + '', true)                                                  // 1212
        + '</pre>';                                                                     // 1213
    }                                                                                   // 1214
    throw e;                                                                            // 1215
  }                                                                                     // 1216
}                                                                                       // 1217
                                                                                        // 1218
/**                                                                                     // 1219
 * Options                                                                              // 1220
 */                                                                                     // 1221
                                                                                        // 1222
marked.options =                                                                        // 1223
marked.setOptions = function(opt) {                                                     // 1224
  merge(marked.defaults, opt);                                                          // 1225
  return marked;                                                                        // 1226
};                                                                                      // 1227
                                                                                        // 1228
marked.defaults = {                                                                     // 1229
  gfm: true,                                                                            // 1230
  tables: true,                                                                         // 1231
  breaks: false,                                                                        // 1232
  pedantic: false,                                                                      // 1233
  sanitize: false,                                                                      // 1234
  smartLists: false,                                                                    // 1235
  silent: false,                                                                        // 1236
  highlight: null,                                                                      // 1237
  langPrefix: 'lang-',                                                                  // 1238
  smartypants: false,                                                                   // 1239
  headerPrefix: '',                                                                     // 1240
  renderer: new Renderer,                                                               // 1241
  xhtml: false                                                                          // 1242
};                                                                                      // 1243
                                                                                        // 1244
/**                                                                                     // 1245
 * Expose                                                                               // 1246
 */                                                                                     // 1247
                                                                                        // 1248
marked.Parser = Parser;                                                                 // 1249
marked.parser = Parser.parse;                                                           // 1250
                                                                                        // 1251
marked.Renderer = Renderer;                                                             // 1252
                                                                                        // 1253
marked.Lexer = Lexer;                                                                   // 1254
marked.lexer = Lexer.lex;                                                               // 1255
                                                                                        // 1256
marked.InlineLexer = InlineLexer;                                                       // 1257
marked.inlineLexer = InlineLexer.output;                                                // 1258
                                                                                        // 1259
marked.parse = marked;                                                                  // 1260
                                                                                        // 1261
if (typeof module !== 'undefined' && typeof exports === 'object') {                     // 1262
  module.exports = marked;                                                              // 1263
} else if (typeof define === 'function' && define.amd) {                                // 1264
  define(function() { return marked; });                                                // 1265
} else {                                                                                // 1266
  this.marked = marked;                                                                 // 1267
}                                                                                       // 1268
                                                                                        // 1269
}).call(function() {                                                                    // 1270
  return this || (typeof window !== 'undefined' ? window : global);                     // 1271
}());                                                                                   // 1272
                                                                                        // 1273
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/perak:markdown/markdown.js                                                  //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
var mark = marked;                                                                      // 1
                                                                                        // 2
mark.setOptions({                                                                       // 3
  gfm: true,                                                                            // 4
  tables: true,                                                                         // 5
  breaks: true                                                                          // 6
});                                                                                     // 7
                                                                                        // 8
Markdown = mark;                                                                        // 9
                                                                                        // 10
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("perak:markdown", {
  Markdown: Markdown
});

})();
