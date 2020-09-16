(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var SHA256 = Package.sha.SHA256;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var BigInteger, SRP;

var require = meteorInstall({"node_modules":{"meteor":{"srp":{"biginteger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/srp/biginteger.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/// METEOR WRAPPER
BigInteger = function () {
  /// BEGIN jsbn.js

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits; // JavaScript engine analysis

  var canary = 0xdeadbeefcafe;
  var j_lm = (canary & 0xffffff) == 0xefcafe; // (public) Constructor

  function BigInteger(a, b, c) {
    if (a != null) if ("number" == typeof a) this.fromNumber(a, b, c);else if (b == null && "string" != typeof a) this.fromString(a, 256);else this.fromString(a, b);
  } // return new, unset BigInteger


  function nbi() {
    return new BigInteger(null);
  } // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)


  function am1(i, x, w, j, c, n) {
    while (--n >= 0) {
      var v = x * this[i++] + w[j] + c;
      c = Math.floor(v / 0x4000000);
      w[j++] = v & 0x3ffffff;
    }

    return c;
  } // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)


  function am2(i, x, w, j, c, n) {
    var xl = x & 0x7fff,
        xh = x >> 15;

    while (--n >= 0) {
      var l = this[i] & 0x7fff;
      var h = this[i++] >> 15;
      var m = xh * l + h * xl;
      l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
      c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
      w[j++] = l & 0x3fffffff;
    }

    return c;
  } // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.


  function am3(i, x, w, j, c, n) {
    var xl = x & 0x3fff,
        xh = x >> 14;

    while (--n >= 0) {
      var l = this[i] & 0x3fff;
      var h = this[i++] >> 14;
      var m = xh * l + h * xl;
      l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
      c = (l >> 28) + (m >> 14) + xh * h;
      w[j++] = l & 0xfffffff;
    }

    return c;
  }
  /* XXX METEOR XXX
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else 
  */


  {
    // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = (1 << dbits) - 1;
  BigInteger.prototype.DV = 1 << dbits;
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2, BI_FP);
  BigInteger.prototype.F1 = BI_FP - dbits;
  BigInteger.prototype.F2 = 2 * dbits - BI_FP; // Digit conversions

  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr, vv;
  rr = "0".charCodeAt(0);

  for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;

  rr = "a".charCodeAt(0);

  for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  rr = "A".charCodeAt(0);

  for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) {
    return BI_RM.charAt(n);
  }

  function intAt(s, i) {
    var c = BI_RC[s.charCodeAt(i)];
    return c == null ? -1 : c;
  } // (protected) copy this to r


  function bnpCopyTo(r) {
    for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];

    r.t = this.t;
    r.s = this.s;
  } // (protected) set from integer value x, -DV <= x < DV


  function bnpFromInt(x) {
    this.t = 1;
    this.s = x < 0 ? -1 : 0;
    if (x > 0) this[0] = x;else if (x < -1) this[0] = x + DV;else this.t = 0;
  } // return bigint initialized to value


  function nbv(i) {
    var r = nbi();
    r.fromInt(i);
    return r;
  } // (protected) set from string and radix


  function bnpFromString(s, b) {
    var k;
    if (b == 16) k = 4;else if (b == 8) k = 3;else if (b == 256) k = 8; // byte array
    else if (b == 2) k = 1;else if (b == 32) k = 5;else if (b == 4) k = 2;else {
        this.fromRadix(s, b);
        return;
      }
    this.t = 0;
    this.s = 0;
    var i = s.length,
        mi = false,
        sh = 0;

    while (--i >= 0) {
      var x = k == 8 ? s[i] & 0xff : intAt(s, i);

      if (x < 0) {
        if (s.charAt(i) == "-") mi = true;
        continue;
      }

      mi = false;
      if (sh == 0) this[this.t++] = x;else if (sh + k > this.DB) {
        this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
        this[this.t++] = x >> this.DB - sh;
      } else this[this.t - 1] |= x << sh;
      sh += k;
      if (sh >= this.DB) sh -= this.DB;
    }

    if (k == 8 && (s[0] & 0x80) != 0) {
      this.s = -1;
      if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
    }

    this.clamp();
    if (mi) BigInteger.ZERO.subTo(this, this);
  } // (protected) clamp off excess high words


  function bnpClamp() {
    var c = this.s & this.DM;

    while (this.t > 0 && this[this.t - 1] == c) --this.t;
  } // (public) return string representation in given radix


  function bnToString(b) {
    if (this.s < 0) return "-" + this.negate().toString(b);
    var k;
    if (b == 16) k = 4;else if (b == 8) k = 3;else if (b == 2) k = 1;else if (b == 32) k = 5;else if (b == 4) k = 2;else return this.toRadix(b);
    var km = (1 << k) - 1,
        d,
        m = false,
        r = "",
        i = this.t;
    var p = this.DB - i * this.DB % k;

    if (i-- > 0) {
      if (p < this.DB && (d = this[i] >> p) > 0) {
        m = true;
        r = int2char(d);
      }

      while (i >= 0) {
        if (p < k) {
          d = (this[i] & (1 << p) - 1) << k - p;
          d |= this[--i] >> (p += this.DB - k);
        } else {
          d = this[i] >> (p -= k) & km;

          if (p <= 0) {
            p += this.DB;
            --i;
          }
        }

        if (d > 0) m = true;
        if (m) r += int2char(d);
      }
    }

    return m ? r : "0";
  } // (public) -this


  function bnNegate() {
    var r = nbi();
    BigInteger.ZERO.subTo(this, r);
    return r;
  } // (public) |this|


  function bnAbs() {
    return this.s < 0 ? this.negate() : this;
  } // (public) return + if this > a, - if this < a, 0 if equal


  function bnCompareTo(a) {
    var r = this.s - a.s;
    if (r != 0) return r;
    var i = this.t;
    r = i - a.t;
    if (r != 0) return r;

    while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;

    return 0;
  } // returns bit length of the integer x


  function nbits(x) {
    var r = 1,
        t;

    if ((t = x >>> 16) != 0) {
      x = t;
      r += 16;
    }

    if ((t = x >> 8) != 0) {
      x = t;
      r += 8;
    }

    if ((t = x >> 4) != 0) {
      x = t;
      r += 4;
    }

    if ((t = x >> 2) != 0) {
      x = t;
      r += 2;
    }

    if ((t = x >> 1) != 0) {
      x = t;
      r += 1;
    }

    return r;
  } // (public) return the number of bits in "this"


  function bnBitLength() {
    if (this.t <= 0) return 0;
    return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
  } // (protected) r = this << n*DB


  function bnpDLShiftTo(n, r) {
    var i;

    for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];

    for (i = n - 1; i >= 0; --i) r[i] = 0;

    r.t = this.t + n;
    r.s = this.s;
  } // (protected) r = this >> n*DB


  function bnpDRShiftTo(n, r) {
    for (var i = n; i < this.t; ++i) r[i - n] = this[i];

    r.t = Math.max(this.t - n, 0);
    r.s = this.s;
  } // (protected) r = this << n


  function bnpLShiftTo(n, r) {
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << cbs) - 1;
    var ds = Math.floor(n / this.DB),
        c = this.s << bs & this.DM,
        i;

    for (i = this.t - 1; i >= 0; --i) {
      r[i + ds + 1] = this[i] >> cbs | c;
      c = (this[i] & bm) << bs;
    }

    for (i = ds - 1; i >= 0; --i) r[i] = 0;

    r[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
  } // (protected) r = this >> n


  function bnpRShiftTo(n, r) {
    r.s = this.s;
    var ds = Math.floor(n / this.DB);

    if (ds >= this.t) {
      r.t = 0;
      return;
    }

    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << bs) - 1;
    r[0] = this[ds] >> bs;

    for (var i = ds + 1; i < this.t; ++i) {
      r[i - ds - 1] |= (this[i] & bm) << cbs;
      r[i - ds] = this[i] >> bs;
    }

    if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
    r.t = this.t - ds;
    r.clamp();
  } // (protected) r = this - a


  function bnpSubTo(a, r) {
    var i = 0,
        c = 0,
        m = Math.min(a.t, this.t);

    while (i < m) {
      c += this[i] - a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }

    if (a.t < this.t) {
      c -= a.s;

      while (i < this.t) {
        c += this[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }

      c += this.s;
    } else {
      c += this.s;

      while (i < a.t) {
        c -= a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }

      c -= a.s;
    }

    r.s = c < 0 ? -1 : 0;
    if (c < -1) r[i++] = this.DV + c;else if (c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  } // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.


  function bnpMultiplyTo(a, r) {
    var x = this.abs(),
        y = a.abs();
    var i = x.t;
    r.t = i + y.t;

    while (--i >= 0) r[i] = 0;

    for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);

    r.s = 0;
    r.clamp();
    if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
  } // (protected) r = this^2, r != this (HAC 14.16)


  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2 * x.t;

    while (--i >= 0) r[i] = 0;

    for (i = 0; i < x.t - 1; ++i) {
      var c = x.am(i, x[i], r, 2 * i, 0, 1);

      if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
        r[i + x.t] -= x.DV;
        r[i + x.t + 1] = 1;
      }
    }

    if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
    r.s = 0;
    r.clamp();
  } // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.


  function bnpDivRemTo(m, q, r) {
    var pm = m.abs();
    if (pm.t <= 0) return;
    var pt = this.abs();

    if (pt.t < pm.t) {
      if (q != null) q.fromInt(0);
      if (r != null) this.copyTo(r);
      return;
    }

    if (r == null) r = nbi();
    var y = nbi(),
        ts = this.s,
        ms = m.s;
    var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus

    if (nsh > 0) {
      pm.lShiftTo(nsh, y);
      pt.lShiftTo(nsh, r);
    } else {
      pm.copyTo(y);
      pt.copyTo(r);
    }

    var ys = y.t;
    var y0 = y[ys - 1];
    if (y0 == 0) return;
    var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
    var d1 = this.FV / yt,
        d2 = (1 << this.F1) / yt,
        e = 1 << this.F2;
    var i = r.t,
        j = i - ys,
        t = q == null ? nbi() : q;
    y.dlShiftTo(j, t);

    if (r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t, r);
    }

    BigInteger.ONE.dlShiftTo(ys, t);
    t.subTo(y, y); // "negative" y so we can replace sub with am later

    while (y.t < ys) y[y.t++] = 0;

    while (--j >= 0) {
      // Estimate quotient digit
      var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);

      if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
        // Try it out
        y.dlShiftTo(j, t);
        r.subTo(t, r);

        while (r[i] < --qd) r.subTo(t, r);
      }
    }

    if (q != null) {
      r.drShiftTo(ys, q);
      if (ts != ms) BigInteger.ZERO.subTo(q, q);
    }

    r.t = ys;
    r.clamp();
    if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder

    if (ts < 0) BigInteger.ZERO.subTo(r, r);
  } // (public) this mod a


  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a, null, r);
    if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
    return r;
  } // Modular reduction using "classic" algorithm


  function Classic(m) {
    this.m = m;
  }

  function cConvert(x) {
    if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);else return x;
  }

  function cRevert(x) {
    return x;
  }

  function cReduce(x) {
    x.divRemTo(this.m, null, x);
  }

  function cMulTo(x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
  }

  function cSqrTo(x, r) {
    x.squareTo(r);
    this.reduce(r);
  }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo; // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.

  function bnpInvDigit() {
    if (this.t < 1) return 0;
    var x = this[0];
    if ((x & 1) == 0) return 0;
    var y = x & 3; // y == 1/x mod 2^2

    y = y * (2 - (x & 0xf) * y) & 0xf; // y == 1/x mod 2^4

    y = y * (2 - (x & 0xff) * y) & 0xff; // y == 1/x mod 2^8

    y = y * (2 - ((x & 0xffff) * y & 0xffff)) & 0xffff; // y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints

    y = y * (2 - x * y % this.DV) % this.DV; // y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV

    return y > 0 ? this.DV - y : -y;
  } // Montgomery reduction


  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << m.DB - 15) - 1;
    this.mt2 = 2 * m.t;
  } // xR mod m


  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
    return r;
  } // x/R mod m


  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  } // x = x/R mod m (HAC 14.32)


  function montReduce(x) {
    while (x.t <= this.mt2) // pad x so am has enough room later
    x[x.t++] = 0;

    for (var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i] & 0x7fff;
      var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM; // use am to combine the multiply-shift-add into one call

      j = i + this.m.t;
      x[j] += this.m.am(0, u0, x, i, 0, this.m.t); // propagate carry

      while (x[j] >= x.DV) {
        x[j] -= x.DV;
        x[++j]++;
      }
    }

    x.clamp();
    x.drShiftTo(this.m.t, x);
    if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
  } // r = "x^2/R mod m"; x != r


  function montSqrTo(x, r) {
    x.squareTo(r);
    this.reduce(r);
  } // r = "xy/R mod m"; x,y != r


  function montMulTo(x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
  }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo; // (protected) true iff this is even

  function bnpIsEven() {
    return (this.t > 0 ? this[0] & 1 : this.s) == 0;
  } // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)


  function bnpExp(e, z) {
    if (e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(),
        r2 = nbi(),
        g = z.convert(this),
        i = nbits(e) - 1;
    g.copyTo(r);

    while (--i >= 0) {
      z.sqrTo(r, r2);
      if ((e & 1 << i) > 0) z.mulTo(r2, g, r);else {
        var t = r;
        r = r2;
        r2 = t;
      }
    }

    return z.revert(r);
  } // (public) this^e % m, 0 <= e < 2^32


  function bnModPowInt(e, m) {
    var z;
    if (e < 256 || m.isEven()) z = new Classic(m);else z = new Montgomery(m);
    return this.exp(e, z);
  } // protected


  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp; // public

  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt; // "constants"

  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1); /// BEGIN jsbn2.js

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Extended JavaScript BN functions, required for RSA private ops.
  // (public)

  function bnClone() {
    var r = nbi();
    this.copyTo(r);
    return r;
  } // (public) return value as integer


  function bnIntValue() {
    if (this.s < 0) {
      if (this.t == 1) return this[0] - this.DV;else if (this.t == 0) return -1;
    } else if (this.t == 1) return this[0];else if (this.t == 0) return 0; // assumes 16 < DB < 32


    return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
  } // (public) return value as byte


  function bnByteValue() {
    return this.t == 0 ? this.s : this[0] << 24 >> 24;
  } // (public) return value as short (assumes DB>=16)


  function bnShortValue() {
    return this.t == 0 ? this.s : this[0] << 16 >> 16;
  } // (protected) return x s.t. r^x < DV


  function bnpChunkSize(r) {
    return Math.floor(Math.LN2 * this.DB / Math.log(r));
  } // (public) 0 if this == 0, 1 if this > 0


  function bnSigNum() {
    if (this.s < 0) return -1;else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0;else return 1;
  } // (protected) convert to radix string


  function bnpToRadix(b) {
    if (b == null) b = 10;
    if (this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b, cs);
    var d = nbv(a),
        y = nbi(),
        z = nbi(),
        r = "";
    this.divRemTo(d, y, z);

    while (y.signum() > 0) {
      r = (a + z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d, y, z);
    }

    return z.intValue().toString(b) + r;
  } // (protected) convert from radix string


  function bnpFromRadix(s, b) {
    this.fromInt(0);
    if (b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b, cs),
        mi = false,
        j = 0,
        w = 0;

    for (var i = 0; i < s.length; ++i) {
      var x = intAt(s, i);

      if (x < 0) {
        if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }

      w = b * w + x;

      if (++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w, 0);
        j = 0;
        w = 0;
      }
    }

    if (j > 0) {
      this.dMultiply(Math.pow(b, j));
      this.dAddOffset(w, 0);
    }

    if (mi) BigInteger.ZERO.subTo(this, this);
  } // (protected) alternate constructor


  function bnpFromNumber(a, b, c) {
    if ("number" == typeof b) {
      // new BigInteger(int,int,RNG)
      if (a < 2) this.fromInt(1);else {
        this.fromNumber(a, c);
        if (!this.testBit(a - 1)) // force MSB set
          this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
        if (this.isEven()) this.dAddOffset(1, 0); // force odd

        while (!this.isProbablePrime(b)) {
          this.dAddOffset(2, 0);
          if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
        }
      }
    } else {
      // new BigInteger(int,RNG)
      var x = new Array(),
          t = a & 7;
      x.length = (a >> 3) + 1;
      b.nextBytes(x);
      if (t > 0) x[0] &= (1 << t) - 1;else x[0] = 0;
      this.fromString(x, 256);
    }
  } // (public) convert to bigendian byte array


  function bnToByteArray() {
    var i = this.t,
        r = new Array();
    r[0] = this.s;
    var p = this.DB - i * this.DB % 8,
        d,
        k = 0;

    if (i-- > 0) {
      if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) r[k++] = d | this.s << this.DB - p;

      while (i >= 0) {
        if (p < 8) {
          d = (this[i] & (1 << p) - 1) << 8 - p;
          d |= this[--i] >> (p += this.DB - 8);
        } else {
          d = this[i] >> (p -= 8) & 0xff;

          if (p <= 0) {
            p += this.DB;
            --i;
          }
        }

        if ((d & 0x80) != 0) d |= -256;
        if (k == 0 && (this.s & 0x80) != (d & 0x80)) ++k;
        if (k > 0 || d != this.s) r[k++] = d;
      }
    }

    return r;
  }

  function bnEquals(a) {
    return this.compareTo(a) == 0;
  }

  function bnMin(a) {
    return this.compareTo(a) < 0 ? this : a;
  }

  function bnMax(a) {
    return this.compareTo(a) > 0 ? this : a;
  } // (protected) r = this op a (bitwise)


  function bnpBitwiseTo(a, op, r) {
    var i,
        f,
        m = Math.min(a.t, this.t);

    for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);

    if (a.t < this.t) {
      f = a.s & this.DM;

      for (i = m; i < this.t; ++i) r[i] = op(this[i], f);

      r.t = this.t;
    } else {
      f = this.s & this.DM;

      for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);

      r.t = a.t;
    }

    r.s = op(this.s, a.s);
    r.clamp();
  } // (public) this & a


  function op_and(x, y) {
    return x & y;
  }

  function bnAnd(a) {
    var r = nbi();
    this.bitwiseTo(a, op_and, r);
    return r;
  } // (public) this | a


  function op_or(x, y) {
    return x | y;
  }

  function bnOr(a) {
    var r = nbi();
    this.bitwiseTo(a, op_or, r);
    return r;
  } // (public) this ^ a


  function op_xor(x, y) {
    return x ^ y;
  }

  function bnXor(a) {
    var r = nbi();
    this.bitwiseTo(a, op_xor, r);
    return r;
  } // (public) this & ~a


  function op_andnot(x, y) {
    return x & ~y;
  }

  function bnAndNot(a) {
    var r = nbi();
    this.bitwiseTo(a, op_andnot, r);
    return r;
  } // (public) ~this


  function bnNot() {
    var r = nbi();

    for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];

    r.t = this.t;
    r.s = ~this.s;
    return r;
  } // (public) this << n


  function bnShiftLeft(n) {
    var r = nbi();
    if (n < 0) this.rShiftTo(-n, r);else this.lShiftTo(n, r);
    return r;
  } // (public) this >> n


  function bnShiftRight(n) {
    var r = nbi();
    if (n < 0) this.lShiftTo(-n, r);else this.rShiftTo(n, r);
    return r;
  } // return index of lowest 1-bit in x, x < 2^31


  function lbit(x) {
    if (x == 0) return -1;
    var r = 0;

    if ((x & 0xffff) == 0) {
      x >>= 16;
      r += 16;
    }

    if ((x & 0xff) == 0) {
      x >>= 8;
      r += 8;
    }

    if ((x & 0xf) == 0) {
      x >>= 4;
      r += 4;
    }

    if ((x & 3) == 0) {
      x >>= 2;
      r += 2;
    }

    if ((x & 1) == 0) ++r;
    return r;
  } // (public) returns index of lowest 1-bit (or -1 if none)


  function bnGetLowestSetBit() {
    for (var i = 0; i < this.t; ++i) if (this[i] != 0) return i * this.DB + lbit(this[i]);

    if (this.s < 0) return this.t * this.DB;
    return -1;
  } // return number of 1 bits in x


  function cbit(x) {
    var r = 0;

    while (x != 0) {
      x &= x - 1;
      ++r;
    }

    return r;
  } // (public) return number of set bits


  function bnBitCount() {
    var r = 0,
        x = this.s & this.DM;

    for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);

    return r;
  } // (public) true iff nth bit is set


  function bnTestBit(n) {
    var j = Math.floor(n / this.DB);
    if (j >= this.t) return this.s != 0;
    return (this[j] & 1 << n % this.DB) != 0;
  } // (protected) this op (1<<n)


  function bnpChangeBit(n, op) {
    var r = BigInteger.ONE.shiftLeft(n);
    this.bitwiseTo(r, op, r);
    return r;
  } // (public) this | (1<<n)


  function bnSetBit(n) {
    return this.changeBit(n, op_or);
  } // (public) this & ~(1<<n)


  function bnClearBit(n) {
    return this.changeBit(n, op_andnot);
  } // (public) this ^ (1<<n)


  function bnFlipBit(n) {
    return this.changeBit(n, op_xor);
  } // (protected) r = this + a


  function bnpAddTo(a, r) {
    var i = 0,
        c = 0,
        m = Math.min(a.t, this.t);

    while (i < m) {
      c += this[i] + a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }

    if (a.t < this.t) {
      c += a.s;

      while (i < this.t) {
        c += this[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }

      c += this.s;
    } else {
      c += this.s;

      while (i < a.t) {
        c += a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }

      c += a.s;
    }

    r.s = c < 0 ? -1 : 0;
    if (c > 0) r[i++] = c;else if (c < -1) r[i++] = this.DV + c;
    r.t = i;
    r.clamp();
  } // (public) this + a


  function bnAdd(a) {
    var r = nbi();
    this.addTo(a, r);
    return r;
  } // (public) this - a


  function bnSubtract(a) {
    var r = nbi();
    this.subTo(a, r);
    return r;
  } // (public) this * a


  function bnMultiply(a) {
    var r = nbi();
    this.multiplyTo(a, r);
    return r;
  } // (public) this / a


  function bnDivide(a) {
    var r = nbi();
    this.divRemTo(a, r, null);
    return r;
  } // (public) this % a


  function bnRemainder(a) {
    var r = nbi();
    this.divRemTo(a, null, r);
    return r;
  } // (public) [this/a,this%a]


  function bnDivideAndRemainder(a) {
    var q = nbi(),
        r = nbi();
    this.divRemTo(a, q, r);
    return new Array(q, r);
  } // (protected) this *= n, this >= 0, 1 < n < DV


  function bnpDMultiply(n) {
    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
    ++this.t;
    this.clamp();
  } // (protected) this += n << w words, this >= 0


  function bnpDAddOffset(n, w) {
    while (this.t <= w) this[this.t++] = 0;

    this[w] += n;

    while (this[w] >= this.DV) {
      this[w] -= this.DV;
      if (++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  } // A "null" reducer


  function NullExp() {}

  function nNop(x) {
    return x;
  }

  function nMulTo(x, y, r) {
    x.multiplyTo(y, r);
  }

  function nSqrTo(x, r) {
    x.squareTo(r);
  }

  NullExp.prototype.convert = nNop;
  NullExp.prototype.revert = nNop;
  NullExp.prototype.mulTo = nMulTo;
  NullExp.prototype.sqrTo = nSqrTo; // (public) this^e

  function bnPow(e) {
    return this.exp(e, new NullExp());
  } // (protected) r = lower n words of "this * a", a.t <= n
  // "this" should be the larger one if appropriate.


  function bnpMultiplyLowerTo(a, n, r) {
    var i = Math.min(this.t + a.t, n);
    r.s = 0; // assumes a,this >= 0

    r.t = i;

    while (i > 0) r[--i] = 0;

    var j;

    for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);

    for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);

    r.clamp();
  } // (protected) r = "this * a" without lower n words, n > 0
  // "this" should be the larger one if appropriate.


  function bnpMultiplyUpperTo(a, n, r) {
    --n;
    var i = r.t = this.t + a.t - n;
    r.s = 0; // assumes a,this >= 0

    while (--i >= 0) r[i] = 0;

    for (i = Math.max(n - this.t, 0); i < a.t; ++i) r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);

    r.clamp();
    r.drShiftTo(1, r);
  } // Barrett modular reduction


  function Barrett(m) {
    // setup Barrett
    this.r2 = nbi();
    this.q3 = nbi();
    BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
    this.mu = this.r2.divide(m);
    this.m = m;
  }

  function barrettConvert(x) {
    if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);else if (x.compareTo(this.m) < 0) return x;else {
      var r = nbi();
      x.copyTo(r);
      this.reduce(r);
      return r;
    }
  }

  function barrettRevert(x) {
    return x;
  } // x = x mod m (HAC 14.42)


  function barrettReduce(x) {
    x.drShiftTo(this.m.t - 1, this.r2);

    if (x.t > this.m.t + 1) {
      x.t = this.m.t + 1;
      x.clamp();
    }

    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);

    while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);

    x.subTo(this.r2, x);

    while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
  } // r = x^2 mod m; x != r


  function barrettSqrTo(x, r) {
    x.squareTo(r);
    this.reduce(r);
  } // r = x*y mod m; x,y != r


  function barrettMulTo(x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
  }

  Barrett.prototype.convert = barrettConvert;
  Barrett.prototype.revert = barrettRevert;
  Barrett.prototype.reduce = barrettReduce;
  Barrett.prototype.mulTo = barrettMulTo;
  Barrett.prototype.sqrTo = barrettSqrTo; // (public) this^e % m (HAC 14.85)

  function bnModPow(e, m) {
    var i = e.bitLength(),
        k,
        r = nbv(1),
        z;
    if (i <= 0) return r;else if (i < 18) k = 1;else if (i < 48) k = 3;else if (i < 144) k = 4;else if (i < 768) k = 5;else k = 6;
    if (i < 8) z = new Classic(m);else if (m.isEven()) z = new Barrett(m);else z = new Montgomery(m); // precomputation

    var g = new Array(),
        n = 3,
        k1 = k - 1,
        km = (1 << k) - 1;
    g[1] = z.convert(this);

    if (k > 1) {
      var g2 = nbi();
      z.sqrTo(g[1], g2);

      while (n <= km) {
        g[n] = nbi();
        z.mulTo(g2, g[n - 2], g[n]);
        n += 2;
      }
    }

    var j = e.t - 1,
        w,
        is1 = true,
        r2 = nbi(),
        t;
    i = nbits(e[j]) - 1;

    while (j >= 0) {
      if (i >= k1) w = e[j] >> i - k1 & km;else {
        w = (e[j] & (1 << i + 1) - 1) << k1 - i;
        if (j > 0) w |= e[j - 1] >> this.DB + i - k1;
      }
      n = k;

      while ((w & 1) == 0) {
        w >>= 1;
        --n;
      }

      if ((i -= n) < 0) {
        i += this.DB;
        --j;
      }

      if (is1) {
        // ret == 1, don't bother squaring or multiplying it
        g[w].copyTo(r);
        is1 = false;
      } else {
        while (n > 1) {
          z.sqrTo(r, r2);
          z.sqrTo(r2, r);
          n -= 2;
        }

        if (n > 0) z.sqrTo(r, r2);else {
          t = r;
          r = r2;
          r2 = t;
        }
        z.mulTo(r2, g[w], r);
      }

      while (j >= 0 && (e[j] & 1 << i) == 0) {
        z.sqrTo(r, r2);
        t = r;
        r = r2;
        r2 = t;

        if (--i < 0) {
          i = this.DB - 1;
          --j;
        }
      }
    }

    return z.revert(r);
  } // (public) gcd(this,a) (HAC 14.54)


  function bnGCD(a) {
    var x = this.s < 0 ? this.negate() : this.clone();
    var y = a.s < 0 ? a.negate() : a.clone();

    if (x.compareTo(y) < 0) {
      var t = x;
      x = y;
      y = t;
    }

    var i = x.getLowestSetBit(),
        g = y.getLowestSetBit();
    if (g < 0) return x;
    if (i < g) g = i;

    if (g > 0) {
      x.rShiftTo(g, x);
      y.rShiftTo(g, y);
    }

    while (x.signum() > 0) {
      if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
      if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);

      if (x.compareTo(y) >= 0) {
        x.subTo(y, x);
        x.rShiftTo(1, x);
      } else {
        y.subTo(x, y);
        y.rShiftTo(1, y);
      }
    }

    if (g > 0) y.lShiftTo(g, y);
    return y;
  } // (protected) this % n, n < 2^26


  function bnpModInt(n) {
    if (n <= 0) return 0;
    var d = this.DV % n,
        r = this.s < 0 ? n - 1 : 0;
    if (this.t > 0) if (d == 0) r = this[0] % n;else for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
    return r;
  } // (public) 1/this % m (HAC 14.61)


  function bnModInverse(m) {
    var ac = m.isEven();
    if (this.isEven() && ac || m.signum() == 0) return BigInteger.ZERO;
    var u = m.clone(),
        v = this.clone();
    var a = nbv(1),
        b = nbv(0),
        c = nbv(0),
        d = nbv(1);

    while (u.signum() != 0) {
      while (u.isEven()) {
        u.rShiftTo(1, u);

        if (ac) {
          if (!a.isEven() || !b.isEven()) {
            a.addTo(this, a);
            b.subTo(m, b);
          }

          a.rShiftTo(1, a);
        } else if (!b.isEven()) b.subTo(m, b);

        b.rShiftTo(1, b);
      }

      while (v.isEven()) {
        v.rShiftTo(1, v);

        if (ac) {
          if (!c.isEven() || !d.isEven()) {
            c.addTo(this, c);
            d.subTo(m, d);
          }

          c.rShiftTo(1, c);
        } else if (!d.isEven()) d.subTo(m, d);

        d.rShiftTo(1, d);
      }

      if (u.compareTo(v) >= 0) {
        u.subTo(v, u);
        if (ac) a.subTo(c, a);
        b.subTo(d, b);
      } else {
        v.subTo(u, v);
        if (ac) c.subTo(a, c);
        d.subTo(b, d);
      }
    }

    if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
    if (d.compareTo(m) >= 0) return d.subtract(m);
    if (d.signum() < 0) d.addTo(m, d);else return d;
    if (d.signum() < 0) return d.add(m);else return d;
  }

  var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509];
  var lplim = (1 << 26) / lowprimes[lowprimes.length - 1]; // (public) test primality with certainty >= 1-.5^t

  function bnIsProbablePrime(t) {
    var i,
        x = this.abs();

    if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
      for (i = 0; i < lowprimes.length; ++i) if (x[0] == lowprimes[i]) return true;

      return false;
    }

    if (x.isEven()) return false;
    i = 1;

    while (i < lowprimes.length) {
      var m = lowprimes[i],
          j = i + 1;

      while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];

      m = x.modInt(m);

      while (i < j) if (m % lowprimes[i++] == 0) return false;
    }

    return x.millerRabin(t);
  } // (protected) true if probably prime (HAC 4.24, Miller-Rabin)


  function bnpMillerRabin(t) {
    var n1 = this.subtract(BigInteger.ONE);
    var k = n1.getLowestSetBit();
    if (k <= 0) return false;
    var r = n1.shiftRight(k);
    t = t + 1 >> 1;
    if (t > lowprimes.length) t = lowprimes.length;
    var a = nbi();

    for (var i = 0; i < t; ++i) {
      a.fromInt(lowprimes[i]);
      var y = a.modPow(r, this);

      if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
        var j = 1;

        while (j++ < k && y.compareTo(n1) != 0) {
          y = y.modPowInt(2, this);
          if (y.compareTo(BigInteger.ONE) == 0) return false;
        }

        if (y.compareTo(n1) != 0) return false;
      }
    }

    return true;
  } // protected


  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.fromNumber = bnpFromNumber;
  BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
  BigInteger.prototype.changeBit = bnpChangeBit;
  BigInteger.prototype.addTo = bnpAddTo;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
  BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
  BigInteger.prototype.modInt = bnpModInt;
  BigInteger.prototype.millerRabin = bnpMillerRabin; // public

  BigInteger.prototype.clone = bnClone;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.byteValue = bnByteValue;
  BigInteger.prototype.shortValue = bnShortValue;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.toByteArray = bnToByteArray;
  BigInteger.prototype.equals = bnEquals;
  BigInteger.prototype.min = bnMin;
  BigInteger.prototype.max = bnMax;
  BigInteger.prototype.and = bnAnd;
  BigInteger.prototype.or = bnOr;
  BigInteger.prototype.xor = bnXor;
  BigInteger.prototype.andNot = bnAndNot;
  BigInteger.prototype.not = bnNot;
  BigInteger.prototype.shiftLeft = bnShiftLeft;
  BigInteger.prototype.shiftRight = bnShiftRight;
  BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
  BigInteger.prototype.bitCount = bnBitCount;
  BigInteger.prototype.testBit = bnTestBit;
  BigInteger.prototype.setBit = bnSetBit;
  BigInteger.prototype.clearBit = bnClearBit;
  BigInteger.prototype.flipBit = bnFlipBit;
  BigInteger.prototype.add = bnAdd;
  BigInteger.prototype.subtract = bnSubtract;
  BigInteger.prototype.multiply = bnMultiply;
  BigInteger.prototype.divide = bnDivide;
  BigInteger.prototype.remainder = bnRemainder;
  BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
  BigInteger.prototype.modPow = bnModPow;
  BigInteger.prototype.modInverse = bnModInverse;
  BigInteger.prototype.pow = bnPow;
  BigInteger.prototype.gcd = bnGCD;
  BigInteger.prototype.isProbablePrime = bnIsProbablePrime; // BigInteger interfaces not implemented in jsbn:
  // BigInteger(int signum, byte[] magnitude)
  // double doubleValue()
  // float floatValue()
  // int hashCode()
  // long longValue()
  // static BigInteger valueOf(long val)
  /// METEOR WRAPPER

  return BigInteger;
}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"srp.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/srp/srp.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

// This package contains just enough of the original SRP code to
// support the backwards-compatibility upgrade path.
//
// An SRP (and possibly also accounts-srp) package should eventually be
// available in Atmosphere so that users can continue to use SRP if they
// want to.
SRP = {};
/**
 * Generate a new SRP verifier. Password is the plaintext password.
 *
 * options is optional and can include:
 * - identity: String. The SRP username to user. Mostly this is passed
 *   in for testing.  Random UUID if not provided.
 * - hashedIdentityAndPassword: combined identity and password, already hashed, for the SRP to bcrypt upgrade path.
 * - salt: String. A salt to use.  Mostly this is passed in for
 *   testing.  Random UUID if not provided.
 * - SRP parameters (see _defaults and paramsFromOptions below)
 */

SRP.generateVerifier = function (password, options) {
  var params = paramsFromOptions(options);
  var salt = options && options.salt || Random.secret();
  var identity;
  var hashedIdentityAndPassword = options && options.hashedIdentityAndPassword;

  if (!hashedIdentityAndPassword) {
    identity = options && options.identity || Random.secret();
    hashedIdentityAndPassword = params.hash(identity + ":" + password);
  }

  var x = params.hash(salt + hashedIdentityAndPassword);
  var xi = new BigInteger(x, 16);
  var v = params.g.modPow(xi, params.N);
  return {
    identity: identity,
    salt: salt,
    verifier: v.toString(16)
  };
}; // For use with check().


SRP.matchVerifier = {
  identity: String,
  salt: String,
  verifier: String
};
/**
 * Default parameter values for SRP.
 *
 */

var _defaults = {
  hash: function (x) {
    return SHA256(x).toLowerCase();
  },
  N: new BigInteger("EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE48E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B297BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9AFD5138FE8376435B9FC61D2FC0EB06E3", 16),
  g: new BigInteger("2")
};
_defaults.k = new BigInteger(_defaults.hash(_defaults.N.toString(16) + _defaults.g.toString(16)), 16);
/**
 * Process an options hash to create SRP parameters.
 *
 * Options can include:
 * - hash: Function. Defaults to SHA256.
 * - N: String or BigInteger. Defaults to 1024 bit value from RFC 5054
 * - g: String or BigInteger. Defaults to 2.
 * - k: String or BigInteger. Defaults to hash(N, g)
 */

var paramsFromOptions = function (options) {
  if (!options) // fast path
    return _defaults;
  var ret = (0, _objectSpread2.default)({}, _defaults);
  ['N', 'g', 'k'].forEach(function (p) {
    if (options[p]) {
      if (typeof options[p] === "string") ret[p] = new BigInteger(options[p], 16);else if (options[p] instanceof BigInteger) ret[p] = options[p];else throw new Error("Invalid parameter: " + p);
    }
  });
  if (options.hash) ret.hash = function (x) {
    return options.hash(x).toLowerCase();
  };

  if (!options.k && (options.N || options.g || options.hash)) {
    ret.k = ret.hash(ret.N.toString(16) + ret.g.toString(16));
  }

  return ret;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/srp/biginteger.js");
require("/node_modules/meteor/srp/srp.js");

/* Exports */
Package._define("srp", {
  SRP: SRP
});

})();

//# sourceURL=meteor://💻app/packages/srp.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3JwL2JpZ2ludGVnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NycC9zcnAuanMiXSwibmFtZXMiOlsiQmlnSW50ZWdlciIsImRiaXRzIiwiY2FuYXJ5Iiwial9sbSIsImEiLCJiIiwiYyIsImZyb21OdW1iZXIiLCJmcm9tU3RyaW5nIiwibmJpIiwiYW0xIiwiaSIsIngiLCJ3IiwiaiIsIm4iLCJ2IiwiTWF0aCIsImZsb29yIiwiYW0yIiwieGwiLCJ4aCIsImwiLCJoIiwibSIsImFtMyIsInByb3RvdHlwZSIsImFtIiwiREIiLCJETSIsIkRWIiwiQklfRlAiLCJGViIsInBvdyIsIkYxIiwiRjIiLCJCSV9STSIsIkJJX1JDIiwiQXJyYXkiLCJyciIsInZ2IiwiY2hhckNvZGVBdCIsImludDJjaGFyIiwiY2hhckF0IiwiaW50QXQiLCJzIiwiYm5wQ29weVRvIiwiciIsInQiLCJibnBGcm9tSW50IiwibmJ2IiwiZnJvbUludCIsImJucEZyb21TdHJpbmciLCJrIiwiZnJvbVJhZGl4IiwibGVuZ3RoIiwibWkiLCJzaCIsImNsYW1wIiwiWkVSTyIsInN1YlRvIiwiYm5wQ2xhbXAiLCJiblRvU3RyaW5nIiwibmVnYXRlIiwidG9TdHJpbmciLCJ0b1JhZGl4Iiwia20iLCJkIiwicCIsImJuTmVnYXRlIiwiYm5BYnMiLCJibkNvbXBhcmVUbyIsIm5iaXRzIiwiYm5CaXRMZW5ndGgiLCJibnBETFNoaWZ0VG8iLCJibnBEUlNoaWZ0VG8iLCJtYXgiLCJibnBMU2hpZnRUbyIsImJzIiwiY2JzIiwiYm0iLCJkcyIsImJucFJTaGlmdFRvIiwiYm5wU3ViVG8iLCJtaW4iLCJibnBNdWx0aXBseVRvIiwiYWJzIiwieSIsImJucFNxdWFyZVRvIiwiYm5wRGl2UmVtVG8iLCJxIiwicG0iLCJwdCIsImNvcHlUbyIsInRzIiwibXMiLCJuc2giLCJsU2hpZnRUbyIsInlzIiwieTAiLCJ5dCIsImQxIiwiZDIiLCJlIiwiZGxTaGlmdFRvIiwiY29tcGFyZVRvIiwiT05FIiwicWQiLCJkclNoaWZ0VG8iLCJyU2hpZnRUbyIsImJuTW9kIiwiZGl2UmVtVG8iLCJDbGFzc2ljIiwiY0NvbnZlcnQiLCJtb2QiLCJjUmV2ZXJ0IiwiY1JlZHVjZSIsImNNdWxUbyIsIm11bHRpcGx5VG8iLCJyZWR1Y2UiLCJjU3FyVG8iLCJzcXVhcmVUbyIsImNvbnZlcnQiLCJyZXZlcnQiLCJtdWxUbyIsInNxclRvIiwiYm5wSW52RGlnaXQiLCJNb250Z29tZXJ5IiwibXAiLCJpbnZEaWdpdCIsIm1wbCIsIm1waCIsInVtIiwibXQyIiwibW9udENvbnZlcnQiLCJtb250UmV2ZXJ0IiwibW9udFJlZHVjZSIsInUwIiwibW9udFNxclRvIiwibW9udE11bFRvIiwiYm5wSXNFdmVuIiwiYm5wRXhwIiwieiIsInIyIiwiZyIsImJuTW9kUG93SW50IiwiaXNFdmVuIiwiZXhwIiwiYml0TGVuZ3RoIiwibW9kUG93SW50IiwiYm5DbG9uZSIsImJuSW50VmFsdWUiLCJibkJ5dGVWYWx1ZSIsImJuU2hvcnRWYWx1ZSIsImJucENodW5rU2l6ZSIsIkxOMiIsImxvZyIsImJuU2lnTnVtIiwiYm5wVG9SYWRpeCIsInNpZ251bSIsImNzIiwiY2h1bmtTaXplIiwiaW50VmFsdWUiLCJzdWJzdHIiLCJibnBGcm9tUmFkaXgiLCJkTXVsdGlwbHkiLCJkQWRkT2Zmc2V0IiwiYm5wRnJvbU51bWJlciIsInRlc3RCaXQiLCJiaXR3aXNlVG8iLCJzaGlmdExlZnQiLCJvcF9vciIsImlzUHJvYmFibGVQcmltZSIsIm5leHRCeXRlcyIsImJuVG9CeXRlQXJyYXkiLCJibkVxdWFscyIsImJuTWluIiwiYm5NYXgiLCJibnBCaXR3aXNlVG8iLCJvcCIsImYiLCJvcF9hbmQiLCJibkFuZCIsImJuT3IiLCJvcF94b3IiLCJiblhvciIsIm9wX2FuZG5vdCIsImJuQW5kTm90IiwiYm5Ob3QiLCJiblNoaWZ0TGVmdCIsImJuU2hpZnRSaWdodCIsImxiaXQiLCJibkdldExvd2VzdFNldEJpdCIsImNiaXQiLCJibkJpdENvdW50IiwiYm5UZXN0Qml0IiwiYm5wQ2hhbmdlQml0IiwiYm5TZXRCaXQiLCJjaGFuZ2VCaXQiLCJibkNsZWFyQml0IiwiYm5GbGlwQml0IiwiYm5wQWRkVG8iLCJibkFkZCIsImFkZFRvIiwiYm5TdWJ0cmFjdCIsImJuTXVsdGlwbHkiLCJibkRpdmlkZSIsImJuUmVtYWluZGVyIiwiYm5EaXZpZGVBbmRSZW1haW5kZXIiLCJibnBETXVsdGlwbHkiLCJibnBEQWRkT2Zmc2V0IiwiTnVsbEV4cCIsIm5Ob3AiLCJuTXVsVG8iLCJuU3FyVG8iLCJiblBvdyIsImJucE11bHRpcGx5TG93ZXJUbyIsImJucE11bHRpcGx5VXBwZXJUbyIsIkJhcnJldHQiLCJxMyIsIm11IiwiZGl2aWRlIiwiYmFycmV0dENvbnZlcnQiLCJiYXJyZXR0UmV2ZXJ0IiwiYmFycmV0dFJlZHVjZSIsIm11bHRpcGx5VXBwZXJUbyIsIm11bHRpcGx5TG93ZXJUbyIsImJhcnJldHRTcXJUbyIsImJhcnJldHRNdWxUbyIsImJuTW9kUG93IiwiazEiLCJnMiIsImlzMSIsImJuR0NEIiwiY2xvbmUiLCJnZXRMb3dlc3RTZXRCaXQiLCJibnBNb2RJbnQiLCJibk1vZEludmVyc2UiLCJhYyIsInUiLCJzdWJ0cmFjdCIsImFkZCIsImxvd3ByaW1lcyIsImxwbGltIiwiYm5Jc1Byb2JhYmxlUHJpbWUiLCJtb2RJbnQiLCJtaWxsZXJSYWJpbiIsImJucE1pbGxlclJhYmluIiwibjEiLCJzaGlmdFJpZ2h0IiwibW9kUG93IiwiYnl0ZVZhbHVlIiwic2hvcnRWYWx1ZSIsInRvQnl0ZUFycmF5IiwiZXF1YWxzIiwiYW5kIiwib3IiLCJ4b3IiLCJhbmROb3QiLCJub3QiLCJiaXRDb3VudCIsInNldEJpdCIsImNsZWFyQml0IiwiZmxpcEJpdCIsIm11bHRpcGx5IiwicmVtYWluZGVyIiwiZGl2aWRlQW5kUmVtYWluZGVyIiwibW9kSW52ZXJzZSIsImdjZCIsIlNSUCIsImdlbmVyYXRlVmVyaWZpZXIiLCJwYXNzd29yZCIsIm9wdGlvbnMiLCJwYXJhbXMiLCJwYXJhbXNGcm9tT3B0aW9ucyIsInNhbHQiLCJSYW5kb20iLCJzZWNyZXQiLCJpZGVudGl0eSIsImhhc2hlZElkZW50aXR5QW5kUGFzc3dvcmQiLCJoYXNoIiwieGkiLCJOIiwidmVyaWZpZXIiLCJtYXRjaFZlcmlmaWVyIiwiU3RyaW5nIiwiX2RlZmF1bHRzIiwiU0hBMjU2IiwidG9Mb3dlckNhc2UiLCJyZXQiLCJmb3JFYWNoIiwiRXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQUEsVUFBVSxHQUFJLFlBQVk7QUFHMUI7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStCQTtBQUVBO0FBQ0EsTUFBSUMsS0FBSixDQXZDMEIsQ0F5QzFCOztBQUNBLE1BQUlDLE1BQU0sR0FBRyxjQUFiO0FBQ0EsTUFBSUMsSUFBSSxHQUFJLENBQUNELE1BQU0sR0FBQyxRQUFSLEtBQW1CLFFBQS9CLENBM0MwQixDQTZDMUI7O0FBQ0EsV0FBU0YsVUFBVCxDQUFvQkksQ0FBcEIsRUFBc0JDLENBQXRCLEVBQXdCQyxDQUF4QixFQUEyQjtBQUN6QixRQUFHRixDQUFDLElBQUksSUFBUixFQUNFLElBQUcsWUFBWSxPQUFPQSxDQUF0QixFQUF5QixLQUFLRyxVQUFMLENBQWdCSCxDQUFoQixFQUFrQkMsQ0FBbEIsRUFBb0JDLENBQXBCLEVBQXpCLEtBQ0ssSUFBR0QsQ0FBQyxJQUFJLElBQUwsSUFBYSxZQUFZLE9BQU9ELENBQW5DLEVBQXNDLEtBQUtJLFVBQUwsQ0FBZ0JKLENBQWhCLEVBQWtCLEdBQWxCLEVBQXRDLEtBQ0EsS0FBS0ksVUFBTCxDQUFnQkosQ0FBaEIsRUFBa0JDLENBQWxCO0FBQ1IsR0FuRHlCLENBcUQxQjs7O0FBQ0EsV0FBU0ksR0FBVCxHQUFlO0FBQUUsV0FBTyxJQUFJVCxVQUFKLENBQWUsSUFBZixDQUFQO0FBQThCLEdBdERyQixDQXdEMUI7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7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LEVBQTFDLEVBQTZDLEVBQTdDLEVBQWdELEVBQWhELEVBQW1ELEVBQW5ELEVBQXNELEVBQXRELEVBQXlELEVBQXpELEVBQTRELEVBQTVELEVBQStELEVBQS9ELEVBQWtFLEVBQWxFLEVBQXFFLEVBQXJFLEVBQXdFLEdBQXhFLEVBQTRFLEdBQTVFLEVBQWdGLEdBQWhGLEVBQW9GLEdBQXBGLEVBQXdGLEdBQXhGLEVBQTRGLEdBQTVGLEVBQWdHLEdBQWhHLEVBQW9HLEdBQXBHLEVBQXdHLEdBQXhHLEVBQTRHLEdBQTVHLEVBQWdILEdBQWhILEVBQW9ILEdBQXBILEVBQXdILEdBQXhILEVBQTRILEdBQTVILEVBQWdJLEdBQWhJLEVBQW9JLEdBQXBJLEVBQXdJLEdBQXhJLEVBQTRJLEdBQTVJLEVBQWdKLEdBQWhKLEVBQW9KLEdBQXBKLEVBQXdKLEdBQXhKLEVBQTRKLEdBQTVKLEVBQWdLLEdBQWhLLEVBQW9LLEdBQXBLLEVBQXdLLEdBQXhLLEVBQTRLLEdBQTVLLEVBQWdMLEdBQWhMLEVBQW9MLEdBQXBMLEVBQXdMLEdBQXhMLEVBQTRMLEdBQTVMLEVBQWdNLEdBQWhNLEVBQW9NLEdBQXBNLEVBQXdNLEdBQXhNLEVBQTRNLEdBQTVNLEVBQWdOLEdBQWhOLEVBQW9OLEdBQXBOLEVBQXdOLEdBQXhOLEVBQTROLEdBQTVOLEVBQWdPLEdBQWhPLEVBQW9PLEdBQXBPLEVBQXdPLEdBQXhPLEVBQTRPLEdBQTVPLEVBQWdQLEdBQWhQLEVBQW9QLEdBQXBQLEVBQXdQLEdBQXhQLEVBQTRQLEdBQTVQLEVBQWdRLEdBQWhRLEVBQW9RLEdBQXBRLEVBQXdRLEdBQXhRLEVBQTRRLEdBQTVRLEVBQWdSLEdBQWhSLEVBQW9SLEdBQXBSLEVBQXdSLEdBQXhSLEVBQTRSLEdBQTVSLEVBQWdTLEdBQWhTLEVBQW9TLEdBQXBTLEVBQXdTLEdBQXhTLEVBQTRTLEdBQTVTLEVBQWdULEdBQWhULEVBQW9ULEdBQXBULEVBQXdULEdBQXhULEVBQTRULEdBQTVULEVBQWdVLEdBQWhVLEVBQW9VLEdBQXBVLEVBQXdVLEdBQXhVLEVBQTRV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T1IgV1JBUFBFUlxuQmlnSW50ZWdlciA9IChmdW5jdGlvbiAoKSB7XG5cblxuLy8vIEJFR0lOIGpzYm4uanNcblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAwMy0yMDA1ICBUb20gV3VcbiAqIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMtSVNcIiBBTkQgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgXG4gKiBFWFBSRVNTLCBJTVBMSUVEIE9SIE9USEVSV0lTRSwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiwgQU5ZIFxuICogV0FSUkFOVFkgT0YgTUVSQ0hBTlRBQklMSVRZIE9SIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgXG4gKlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVE9NIFdVIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIElOQ0lERU5UQUwsXG4gKiBJTkRJUkVDVCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT0YgQU5ZIEtJTkQsIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVJcbiAqIFJFU1VMVElORyBGUk9NIExPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgT1IgTk9UIEFEVklTRUQgT0ZcbiAqIFRIRSBQT1NTSUJJTElUWSBPRiBEQU1BR0UsIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgQVJJU0lORyBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SIFBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXG4gKlxuICogSW4gYWRkaXRpb24sIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uIGFwcGxpZXM6XG4gKlxuICogQWxsIHJlZGlzdHJpYnV0aW9ucyBtdXN0IHJldGFpbiBhbiBpbnRhY3QgY29weSBvZiB0aGlzIGNvcHlyaWdodCBub3RpY2VcbiAqIGFuZCBkaXNjbGFpbWVyLlxuICovXG5cbi8vIEJhc2ljIEphdmFTY3JpcHQgQk4gbGlicmFyeSAtIHN1YnNldCB1c2VmdWwgZm9yIFJTQSBlbmNyeXB0aW9uLlxuXG4vLyBCaXRzIHBlciBkaWdpdFxudmFyIGRiaXRzO1xuXG4vLyBKYXZhU2NyaXB0IGVuZ2luZSBhbmFseXNpc1xudmFyIGNhbmFyeSA9IDB4ZGVhZGJlZWZjYWZlO1xudmFyIGpfbG0gPSAoKGNhbmFyeSYweGZmZmZmZik9PTB4ZWZjYWZlKTtcblxuLy8gKHB1YmxpYykgQ29uc3RydWN0b3JcbmZ1bmN0aW9uIEJpZ0ludGVnZXIoYSxiLGMpIHtcbiAgaWYoYSAhPSBudWxsKVxuICAgIGlmKFwibnVtYmVyXCIgPT0gdHlwZW9mIGEpIHRoaXMuZnJvbU51bWJlcihhLGIsYyk7XG4gICAgZWxzZSBpZihiID09IG51bGwgJiYgXCJzdHJpbmdcIiAhPSB0eXBlb2YgYSkgdGhpcy5mcm9tU3RyaW5nKGEsMjU2KTtcbiAgICBlbHNlIHRoaXMuZnJvbVN0cmluZyhhLGIpO1xufVxuXG4vLyByZXR1cm4gbmV3LCB1bnNldCBCaWdJbnRlZ2VyXG5mdW5jdGlvbiBuYmkoKSB7IHJldHVybiBuZXcgQmlnSW50ZWdlcihudWxsKTsgfVxuXG4vLyBhbTogQ29tcHV0ZSB3X2ogKz0gKHgqdGhpc19pKSwgcHJvcGFnYXRlIGNhcnJpZXMsXG4vLyBjIGlzIGluaXRpYWwgY2FycnksIHJldHVybnMgZmluYWwgY2FycnkuXG4vLyBjIDwgMypkdmFsdWUsIHggPCAyKmR2YWx1ZSwgdGhpc19pIDwgZHZhbHVlXG4vLyBXZSBuZWVkIHRvIHNlbGVjdCB0aGUgZmFzdGVzdCBvbmUgdGhhdCB3b3JrcyBpbiB0aGlzIGVudmlyb25tZW50LlxuXG4vLyBhbTE6IHVzZSBhIHNpbmdsZSBtdWx0IGFuZCBkaXZpZGUgdG8gZ2V0IHRoZSBoaWdoIGJpdHMsXG4vLyBtYXggZGlnaXQgYml0cyBzaG91bGQgYmUgMjYgYmVjYXVzZVxuLy8gbWF4IGludGVybmFsIHZhbHVlID0gMipkdmFsdWVeMi0yKmR2YWx1ZSAoPCAyXjUzKVxuZnVuY3Rpb24gYW0xKGkseCx3LGosYyxuKSB7XG4gIHdoaWxlKC0tbiA+PSAwKSB7XG4gICAgdmFyIHYgPSB4KnRoaXNbaSsrXSt3W2pdK2M7XG4gICAgYyA9IE1hdGguZmxvb3Iodi8weDQwMDAwMDApO1xuICAgIHdbaisrXSA9IHYmMHgzZmZmZmZmO1xuICB9XG4gIHJldHVybiBjO1xufVxuLy8gYW0yIGF2b2lkcyBhIGJpZyBtdWx0LWFuZC1leHRyYWN0IGNvbXBsZXRlbHkuXG4vLyBNYXggZGlnaXQgYml0cyBzaG91bGQgYmUgPD0gMzAgYmVjYXVzZSB3ZSBkbyBiaXR3aXNlIG9wc1xuLy8gb24gdmFsdWVzIHVwIHRvIDIqaGR2YWx1ZV4yLWhkdmFsdWUtMSAoPCAyXjMxKVxuZnVuY3Rpb24gYW0yKGkseCx3LGosYyxuKSB7XG4gIHZhciB4bCA9IHgmMHg3ZmZmLCB4aCA9IHg+PjE1O1xuICB3aGlsZSgtLW4gPj0gMCkge1xuICAgIHZhciBsID0gdGhpc1tpXSYweDdmZmY7XG4gICAgdmFyIGggPSB0aGlzW2krK10+PjE1O1xuICAgIHZhciBtID0geGgqbCtoKnhsO1xuICAgIGwgPSB4bCpsKygobSYweDdmZmYpPDwxNSkrd1tqXSsoYyYweDNmZmZmZmZmKTtcbiAgICBjID0gKGw+Pj4zMCkrKG0+Pj4xNSkreGgqaCsoYz4+PjMwKTtcbiAgICB3W2orK10gPSBsJjB4M2ZmZmZmZmY7XG4gIH1cbiAgcmV0dXJuIGM7XG59XG4vLyBBbHRlcm5hdGVseSwgc2V0IG1heCBkaWdpdCBiaXRzIHRvIDI4IHNpbmNlIHNvbWVcbi8vIGJyb3dzZXJzIHNsb3cgZG93biB3aGVuIGRlYWxpbmcgd2l0aCAzMi1iaXQgbnVtYmVycy5cbmZ1bmN0aW9uIGFtMyhpLHgsdyxqLGMsbikge1xuICB2YXIgeGwgPSB4JjB4M2ZmZiwgeGggPSB4Pj4xNDtcbiAgd2hpbGUoLS1uID49IDApIHtcbiAgICB2YXIgbCA9IHRoaXNbaV0mMHgzZmZmO1xuICAgIHZhciBoID0gdGhpc1tpKytdPj4xNDtcbiAgICB2YXIgbSA9IHhoKmwraCp4bDtcbiAgICBsID0geGwqbCsoKG0mMHgzZmZmKTw8MTQpK3dbal0rYztcbiAgICBjID0gKGw+PjI4KSsobT4+MTQpK3hoKmg7XG4gICAgd1tqKytdID0gbCYweGZmZmZmZmY7XG4gIH1cbiAgcmV0dXJuIGM7XG59XG5cbi8qIFhYWCBNRVRFT1IgWFhYXG5pZihqX2xtICYmIChuYXZpZ2F0b3IuYXBwTmFtZSA9PSBcIk1pY3Jvc29mdCBJbnRlcm5ldCBFeHBsb3JlclwiKSkge1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMjtcbiAgZGJpdHMgPSAzMDtcbn1cbmVsc2UgaWYoal9sbSAmJiAobmF2aWdhdG9yLmFwcE5hbWUgIT0gXCJOZXRzY2FwZVwiKSkge1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMTtcbiAgZGJpdHMgPSAyNjtcbn1cbmVsc2UgXG4qL1xuXG57IC8vIE1vemlsbGEvTmV0c2NhcGUgc2VlbXMgdG8gcHJlZmVyIGFtM1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMztcbiAgZGJpdHMgPSAyODtcbn1cblxuQmlnSW50ZWdlci5wcm90b3R5cGUuREIgPSBkYml0cztcbkJpZ0ludGVnZXIucHJvdG90eXBlLkRNID0gKCgxPDxkYml0cyktMSk7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5EViA9ICgxPDxkYml0cyk7XG5cbnZhciBCSV9GUCA9IDUyO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRlYgPSBNYXRoLnBvdygyLEJJX0ZQKTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLkYxID0gQklfRlAtZGJpdHM7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5GMiA9IDIqZGJpdHMtQklfRlA7XG5cbi8vIERpZ2l0IGNvbnZlcnNpb25zXG52YXIgQklfUk0gPSBcIjAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiO1xudmFyIEJJX1JDID0gbmV3IEFycmF5KCk7XG52YXIgcnIsdnY7XG5yciA9IFwiMFwiLmNoYXJDb2RlQXQoMCk7XG5mb3IodnYgPSAwOyB2diA8PSA5OyArK3Z2KSBCSV9SQ1tycisrXSA9IHZ2O1xucnIgPSBcImFcIi5jaGFyQ29kZUF0KDApO1xuZm9yKHZ2ID0gMTA7IHZ2IDwgMzY7ICsrdnYpIEJJX1JDW3JyKytdID0gdnY7XG5yciA9IFwiQVwiLmNoYXJDb2RlQXQoMCk7XG5mb3IodnYgPSAxMDsgdnYgPCAzNjsgKyt2dikgQklfUkNbcnIrK10gPSB2djtcblxuZnVuY3Rpb24gaW50MmNoYXIobikgeyByZXR1cm4gQklfUk0uY2hhckF0KG4pOyB9XG5mdW5jdGlvbiBpbnRBdChzLGkpIHtcbiAgdmFyIGMgPSBCSV9SQ1tzLmNoYXJDb2RlQXQoaSldO1xuICByZXR1cm4gKGM9PW51bGwpPy0xOmM7XG59XG5cbi8vIChwcm90ZWN0ZWQpIGNvcHkgdGhpcyB0byByXG5mdW5jdGlvbiBibnBDb3B5VG8ocikge1xuICBmb3IodmFyIGkgPSB0aGlzLnQtMTsgaSA+PSAwOyAtLWkpIHJbaV0gPSB0aGlzW2ldO1xuICByLnQgPSB0aGlzLnQ7XG4gIHIucyA9IHRoaXMucztcbn1cblxuLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gaW50ZWdlciB2YWx1ZSB4LCAtRFYgPD0geCA8IERWXG5mdW5jdGlvbiBibnBGcm9tSW50KHgpIHtcbiAgdGhpcy50ID0gMTtcbiAgdGhpcy5zID0gKHg8MCk/LTE6MDtcbiAgaWYoeCA+IDApIHRoaXNbMF0gPSB4O1xuICBlbHNlIGlmKHggPCAtMSkgdGhpc1swXSA9IHgrRFY7XG4gIGVsc2UgdGhpcy50ID0gMDtcbn1cblxuLy8gcmV0dXJuIGJpZ2ludCBpbml0aWFsaXplZCB0byB2YWx1ZVxuZnVuY3Rpb24gbmJ2KGkpIHsgdmFyIHIgPSBuYmkoKTsgci5mcm9tSW50KGkpOyByZXR1cm4gcjsgfVxuXG4vLyAocHJvdGVjdGVkKSBzZXQgZnJvbSBzdHJpbmcgYW5kIHJhZGl4XG5mdW5jdGlvbiBibnBGcm9tU3RyaW5nKHMsYikge1xuICB2YXIgaztcbiAgaWYoYiA9PSAxNikgayA9IDQ7XG4gIGVsc2UgaWYoYiA9PSA4KSBrID0gMztcbiAgZWxzZSBpZihiID09IDI1NikgayA9IDg7IC8vIGJ5dGUgYXJyYXlcbiAgZWxzZSBpZihiID09IDIpIGsgPSAxO1xuICBlbHNlIGlmKGIgPT0gMzIpIGsgPSA1O1xuICBlbHNlIGlmKGIgPT0gNCkgayA9IDI7XG4gIGVsc2UgeyB0aGlzLmZyb21SYWRpeChzLGIpOyByZXR1cm47IH1cbiAgdGhpcy50ID0gMDtcbiAgdGhpcy5zID0gMDtcbiAgdmFyIGkgPSBzLmxlbmd0aCwgbWkgPSBmYWxzZSwgc2ggPSAwO1xuICB3aGlsZSgtLWkgPj0gMCkge1xuICAgIHZhciB4ID0gKGs9PTgpP3NbaV0mMHhmZjppbnRBdChzLGkpO1xuICAgIGlmKHggPCAwKSB7XG4gICAgICBpZihzLmNoYXJBdChpKSA9PSBcIi1cIikgbWkgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIG1pID0gZmFsc2U7XG4gICAgaWYoc2ggPT0gMClcbiAgICAgIHRoaXNbdGhpcy50KytdID0geDtcbiAgICBlbHNlIGlmKHNoK2sgPiB0aGlzLkRCKSB7XG4gICAgICB0aGlzW3RoaXMudC0xXSB8PSAoeCYoKDE8PCh0aGlzLkRCLXNoKSktMSkpPDxzaDtcbiAgICAgIHRoaXNbdGhpcy50KytdID0gKHg+Pih0aGlzLkRCLXNoKSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHRoaXNbdGhpcy50LTFdIHw9IHg8PHNoO1xuICAgIHNoICs9IGs7XG4gICAgaWYoc2ggPj0gdGhpcy5EQikgc2ggLT0gdGhpcy5EQjtcbiAgfVxuICBpZihrID09IDggJiYgKHNbMF0mMHg4MCkgIT0gMCkge1xuICAgIHRoaXMucyA9IC0xO1xuICAgIGlmKHNoID4gMCkgdGhpc1t0aGlzLnQtMV0gfD0gKCgxPDwodGhpcy5EQi1zaCkpLTEpPDxzaDtcbiAgfVxuICB0aGlzLmNsYW1wKCk7XG4gIGlmKG1pKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8odGhpcyx0aGlzKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgY2xhbXAgb2ZmIGV4Y2VzcyBoaWdoIHdvcmRzXG5mdW5jdGlvbiBibnBDbGFtcCgpIHtcbiAgdmFyIGMgPSB0aGlzLnMmdGhpcy5ETTtcbiAgd2hpbGUodGhpcy50ID4gMCAmJiB0aGlzW3RoaXMudC0xXSA9PSBjKSAtLXRoaXMudDtcbn1cblxuLy8gKHB1YmxpYykgcmV0dXJuIHN0cmluZyByZXByZXNlbnRhdGlvbiBpbiBnaXZlbiByYWRpeFxuZnVuY3Rpb24gYm5Ub1N0cmluZyhiKSB7XG4gIGlmKHRoaXMucyA8IDApIHJldHVybiBcIi1cIit0aGlzLm5lZ2F0ZSgpLnRvU3RyaW5nKGIpO1xuICB2YXIgaztcbiAgaWYoYiA9PSAxNikgayA9IDQ7XG4gIGVsc2UgaWYoYiA9PSA4KSBrID0gMztcbiAgZWxzZSBpZihiID09IDIpIGsgPSAxO1xuICBlbHNlIGlmKGIgPT0gMzIpIGsgPSA1O1xuICBlbHNlIGlmKGIgPT0gNCkgayA9IDI7XG4gIGVsc2UgcmV0dXJuIHRoaXMudG9SYWRpeChiKTtcbiAgdmFyIGttID0gKDE8PGspLTEsIGQsIG0gPSBmYWxzZSwgciA9IFwiXCIsIGkgPSB0aGlzLnQ7XG4gIHZhciBwID0gdGhpcy5EQi0oaSp0aGlzLkRCKSVrO1xuICBpZihpLS0gPiAwKSB7XG4gICAgaWYocCA8IHRoaXMuREIgJiYgKGQgPSB0aGlzW2ldPj5wKSA+IDApIHsgbSA9IHRydWU7IHIgPSBpbnQyY2hhcihkKTsgfVxuICAgIHdoaWxlKGkgPj0gMCkge1xuICAgICAgaWYocCA8IGspIHtcbiAgICAgICAgZCA9ICh0aGlzW2ldJigoMTw8cCktMSkpPDwoay1wKTtcbiAgICAgICAgZCB8PSB0aGlzWy0taV0+PihwKz10aGlzLkRCLWspO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGQgPSAodGhpc1tpXT4+KHAtPWspKSZrbTtcbiAgICAgICAgaWYocCA8PSAwKSB7IHAgKz0gdGhpcy5EQjsgLS1pOyB9XG4gICAgICB9XG4gICAgICBpZihkID4gMCkgbSA9IHRydWU7XG4gICAgICBpZihtKSByICs9IGludDJjaGFyKGQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbT9yOlwiMFwiO1xufVxuXG4vLyAocHVibGljKSAtdGhpc1xuZnVuY3Rpb24gYm5OZWdhdGUoKSB7IHZhciByID0gbmJpKCk7IEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB8dGhpc3xcbmZ1bmN0aW9uIGJuQWJzKCkgeyByZXR1cm4gKHRoaXMuczwwKT90aGlzLm5lZ2F0ZSgpOnRoaXM7IH1cblxuLy8gKHB1YmxpYykgcmV0dXJuICsgaWYgdGhpcyA+IGEsIC0gaWYgdGhpcyA8IGEsIDAgaWYgZXF1YWxcbmZ1bmN0aW9uIGJuQ29tcGFyZVRvKGEpIHtcbiAgdmFyIHIgPSB0aGlzLnMtYS5zO1xuICBpZihyICE9IDApIHJldHVybiByO1xuICB2YXIgaSA9IHRoaXMudDtcbiAgciA9IGktYS50O1xuICBpZihyICE9IDApIHJldHVybiByO1xuICB3aGlsZSgtLWkgPj0gMCkgaWYoKHI9dGhpc1tpXS1hW2ldKSAhPSAwKSByZXR1cm4gcjtcbiAgcmV0dXJuIDA7XG59XG5cbi8vIHJldHVybnMgYml0IGxlbmd0aCBvZiB0aGUgaW50ZWdlciB4XG5mdW5jdGlvbiBuYml0cyh4KSB7XG4gIHZhciByID0gMSwgdDtcbiAgaWYoKHQ9eD4+PjE2KSAhPSAwKSB7IHggPSB0OyByICs9IDE2OyB9XG4gIGlmKCh0PXg+PjgpICE9IDApIHsgeCA9IHQ7IHIgKz0gODsgfVxuICBpZigodD14Pj40KSAhPSAwKSB7IHggPSB0OyByICs9IDQ7IH1cbiAgaWYoKHQ9eD4+MikgIT0gMCkgeyB4ID0gdDsgciArPSAyOyB9XG4gIGlmKCh0PXg+PjEpICE9IDApIHsgeCA9IHQ7IHIgKz0gMTsgfVxuICByZXR1cm4gcjtcbn1cblxuLy8gKHB1YmxpYykgcmV0dXJuIHRoZSBudW1iZXIgb2YgYml0cyBpbiBcInRoaXNcIlxuZnVuY3Rpb24gYm5CaXRMZW5ndGgoKSB7XG4gIGlmKHRoaXMudCA8PSAwKSByZXR1cm4gMDtcbiAgcmV0dXJuIHRoaXMuREIqKHRoaXMudC0xKStuYml0cyh0aGlzW3RoaXMudC0xXV4odGhpcy5zJnRoaXMuRE0pKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPDwgbipEQlxuZnVuY3Rpb24gYm5wRExTaGlmdFRvKG4scikge1xuICB2YXIgaTtcbiAgZm9yKGkgPSB0aGlzLnQtMTsgaSA+PSAwOyAtLWkpIHJbaStuXSA9IHRoaXNbaV07XG4gIGZvcihpID0gbi0xOyBpID49IDA7IC0taSkgcltpXSA9IDA7XG4gIHIudCA9IHRoaXMudCtuO1xuICByLnMgPSB0aGlzLnM7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzID4+IG4qREJcbmZ1bmN0aW9uIGJucERSU2hpZnRUbyhuLHIpIHtcbiAgZm9yKHZhciBpID0gbjsgaSA8IHRoaXMudDsgKytpKSByW2ktbl0gPSB0aGlzW2ldO1xuICByLnQgPSBNYXRoLm1heCh0aGlzLnQtbiwwKTtcbiAgci5zID0gdGhpcy5zO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuXG5mdW5jdGlvbiBibnBMU2hpZnRUbyhuLHIpIHtcbiAgdmFyIGJzID0gbiV0aGlzLkRCO1xuICB2YXIgY2JzID0gdGhpcy5EQi1icztcbiAgdmFyIGJtID0gKDE8PGNicyktMTtcbiAgdmFyIGRzID0gTWF0aC5mbG9vcihuL3RoaXMuREIpLCBjID0gKHRoaXMuczw8YnMpJnRoaXMuRE0sIGk7XG4gIGZvcihpID0gdGhpcy50LTE7IGkgPj0gMDsgLS1pKSB7XG4gICAgcltpK2RzKzFdID0gKHRoaXNbaV0+PmNicyl8YztcbiAgICBjID0gKHRoaXNbaV0mYm0pPDxicztcbiAgfVxuICBmb3IoaSA9IGRzLTE7IGkgPj0gMDsgLS1pKSByW2ldID0gMDtcbiAgcltkc10gPSBjO1xuICByLnQgPSB0aGlzLnQrZHMrMTtcbiAgci5zID0gdGhpcy5zO1xuICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzID4+IG5cbmZ1bmN0aW9uIGJucFJTaGlmdFRvKG4scikge1xuICByLnMgPSB0aGlzLnM7XG4gIHZhciBkcyA9IE1hdGguZmxvb3Iobi90aGlzLkRCKTtcbiAgaWYoZHMgPj0gdGhpcy50KSB7IHIudCA9IDA7IHJldHVybjsgfVxuICB2YXIgYnMgPSBuJXRoaXMuREI7XG4gIHZhciBjYnMgPSB0aGlzLkRCLWJzO1xuICB2YXIgYm0gPSAoMTw8YnMpLTE7XG4gIHJbMF0gPSB0aGlzW2RzXT4+YnM7XG4gIGZvcih2YXIgaSA9IGRzKzE7IGkgPCB0aGlzLnQ7ICsraSkge1xuICAgIHJbaS1kcy0xXSB8PSAodGhpc1tpXSZibSk8PGNicztcbiAgICByW2ktZHNdID0gdGhpc1tpXT4+YnM7XG4gIH1cbiAgaWYoYnMgPiAwKSByW3RoaXMudC1kcy0xXSB8PSAodGhpcy5zJmJtKTw8Y2JzO1xuICByLnQgPSB0aGlzLnQtZHM7XG4gIHIuY2xhbXAoKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgLSBhXG5mdW5jdGlvbiBibnBTdWJUbyhhLHIpIHtcbiAgdmFyIGkgPSAwLCBjID0gMCwgbSA9IE1hdGgubWluKGEudCx0aGlzLnQpO1xuICB3aGlsZShpIDwgbSkge1xuICAgIGMgKz0gdGhpc1tpXS1hW2ldO1xuICAgIHJbaSsrXSA9IGMmdGhpcy5ETTtcbiAgICBjID4+PSB0aGlzLkRCO1xuICB9XG4gIGlmKGEudCA8IHRoaXMudCkge1xuICAgIGMgLT0gYS5zO1xuICAgIHdoaWxlKGkgPCB0aGlzLnQpIHtcbiAgICAgIGMgKz0gdGhpc1tpXTtcbiAgICAgIHJbaSsrXSA9IGMmdGhpcy5ETTtcbiAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGMgKz0gdGhpcy5zO1xuICB9XG4gIGVsc2Uge1xuICAgIGMgKz0gdGhpcy5zO1xuICAgIHdoaWxlKGkgPCBhLnQpIHtcbiAgICAgIGMgLT0gYVtpXTtcbiAgICAgIHJbaSsrXSA9IGMmdGhpcy5ETTtcbiAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGMgLT0gYS5zO1xuICB9XG4gIHIucyA9IChjPDApPy0xOjA7XG4gIGlmKGMgPCAtMSkgcltpKytdID0gdGhpcy5EVitjO1xuICBlbHNlIGlmKGMgPiAwKSByW2krK10gPSBjO1xuICByLnQgPSBpO1xuICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICogYSwgciAhPSB0aGlzLGEgKEhBQyAxNC4xMilcbi8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbmZ1bmN0aW9uIGJucE11bHRpcGx5VG8oYSxyKSB7XG4gIHZhciB4ID0gdGhpcy5hYnMoKSwgeSA9IGEuYWJzKCk7XG4gIHZhciBpID0geC50O1xuICByLnQgPSBpK3kudDtcbiAgd2hpbGUoLS1pID49IDApIHJbaV0gPSAwO1xuICBmb3IoaSA9IDA7IGkgPCB5LnQ7ICsraSkgcltpK3gudF0gPSB4LmFtKDAseVtpXSxyLGksMCx4LnQpO1xuICByLnMgPSAwO1xuICByLmNsYW1wKCk7XG4gIGlmKHRoaXMucyAhPSBhLnMpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLHIpO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpc14yLCByICE9IHRoaXMgKEhBQyAxNC4xNilcbmZ1bmN0aW9uIGJucFNxdWFyZVRvKHIpIHtcbiAgdmFyIHggPSB0aGlzLmFicygpO1xuICB2YXIgaSA9IHIudCA9IDIqeC50O1xuICB3aGlsZSgtLWkgPj0gMCkgcltpXSA9IDA7XG4gIGZvcihpID0gMDsgaSA8IHgudC0xOyArK2kpIHtcbiAgICB2YXIgYyA9IHguYW0oaSx4W2ldLHIsMippLDAsMSk7XG4gICAgaWYoKHJbaSt4LnRdKz14LmFtKGkrMSwyKnhbaV0sciwyKmkrMSxjLHgudC1pLTEpKSA+PSB4LkRWKSB7XG4gICAgICByW2kreC50XSAtPSB4LkRWO1xuICAgICAgcltpK3gudCsxXSA9IDE7XG4gICAgfVxuICB9XG4gIGlmKHIudCA+IDApIHJbci50LTFdICs9IHguYW0oaSx4W2ldLHIsMippLDAsMSk7XG4gIHIucyA9IDA7XG4gIHIuY2xhbXAoKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgZGl2aWRlIHRoaXMgYnkgbSwgcXVvdGllbnQgYW5kIHJlbWFpbmRlciB0byBxLCByIChIQUMgMTQuMjApXG4vLyByICE9IHEsIHRoaXMgIT0gbS4gIHEgb3IgciBtYXkgYmUgbnVsbC5cbmZ1bmN0aW9uIGJucERpdlJlbVRvKG0scSxyKSB7XG4gIHZhciBwbSA9IG0uYWJzKCk7XG4gIGlmKHBtLnQgPD0gMCkgcmV0dXJuO1xuICB2YXIgcHQgPSB0aGlzLmFicygpO1xuICBpZihwdC50IDwgcG0udCkge1xuICAgIGlmKHEgIT0gbnVsbCkgcS5mcm9tSW50KDApO1xuICAgIGlmKHIgIT0gbnVsbCkgdGhpcy5jb3B5VG8ocik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmKHIgPT0gbnVsbCkgciA9IG5iaSgpO1xuICB2YXIgeSA9IG5iaSgpLCB0cyA9IHRoaXMucywgbXMgPSBtLnM7XG4gIHZhciBuc2ggPSB0aGlzLkRCLW5iaXRzKHBtW3BtLnQtMV0pO1x0Ly8gbm9ybWFsaXplIG1vZHVsdXNcbiAgaWYobnNoID4gMCkgeyBwbS5sU2hpZnRUbyhuc2gseSk7IHB0LmxTaGlmdFRvKG5zaCxyKTsgfVxuICBlbHNlIHsgcG0uY29weVRvKHkpOyBwdC5jb3B5VG8ocik7IH1cbiAgdmFyIHlzID0geS50O1xuICB2YXIgeTAgPSB5W3lzLTFdO1xuICBpZih5MCA9PSAwKSByZXR1cm47XG4gIHZhciB5dCA9IHkwKigxPDx0aGlzLkYxKSsoKHlzPjEpP3lbeXMtMl0+PnRoaXMuRjI6MCk7XG4gIHZhciBkMSA9IHRoaXMuRlYveXQsIGQyID0gKDE8PHRoaXMuRjEpL3l0LCBlID0gMTw8dGhpcy5GMjtcbiAgdmFyIGkgPSByLnQsIGogPSBpLXlzLCB0ID0gKHE9PW51bGwpP25iaSgpOnE7XG4gIHkuZGxTaGlmdFRvKGosdCk7XG4gIGlmKHIuY29tcGFyZVRvKHQpID49IDApIHtcbiAgICByW3IudCsrXSA9IDE7XG4gICAgci5zdWJUbyh0LHIpO1xuICB9XG4gIEJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbyh5cyx0KTtcbiAgdC5zdWJUbyh5LHkpO1x0Ly8gXCJuZWdhdGl2ZVwiIHkgc28gd2UgY2FuIHJlcGxhY2Ugc3ViIHdpdGggYW0gbGF0ZXJcbiAgd2hpbGUoeS50IDwgeXMpIHlbeS50KytdID0gMDtcbiAgd2hpbGUoLS1qID49IDApIHtcbiAgICAvLyBFc3RpbWF0ZSBxdW90aWVudCBkaWdpdFxuICAgIHZhciBxZCA9IChyWy0taV09PXkwKT90aGlzLkRNOk1hdGguZmxvb3IocltpXSpkMSsocltpLTFdK2UpKmQyKTtcbiAgICBpZigocltpXSs9eS5hbSgwLHFkLHIsaiwwLHlzKSkgPCBxZCkge1x0Ly8gVHJ5IGl0IG91dFxuICAgICAgeS5kbFNoaWZ0VG8oaix0KTtcbiAgICAgIHIuc3ViVG8odCxyKTtcbiAgICAgIHdoaWxlKHJbaV0gPCAtLXFkKSByLnN1YlRvKHQscik7XG4gICAgfVxuICB9XG4gIGlmKHEgIT0gbnVsbCkge1xuICAgIHIuZHJTaGlmdFRvKHlzLHEpO1xuICAgIGlmKHRzICE9IG1zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocSxxKTtcbiAgfVxuICByLnQgPSB5cztcbiAgci5jbGFtcCgpO1xuICBpZihuc2ggPiAwKSByLnJTaGlmdFRvKG5zaCxyKTtcdC8vIERlbm9ybWFsaXplIHJlbWFpbmRlclxuICBpZih0cyA8IDApIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLHIpO1xufVxuXG4vLyAocHVibGljKSB0aGlzIG1vZCBhXG5mdW5jdGlvbiBibk1vZChhKSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHRoaXMuYWJzKCkuZGl2UmVtVG8oYSxudWxsLHIpO1xuICBpZih0aGlzLnMgPCAwICYmIHIuY29tcGFyZVRvKEJpZ0ludGVnZXIuWkVSTykgPiAwKSBhLnN1YlRvKHIscik7XG4gIHJldHVybiByO1xufVxuXG4vLyBNb2R1bGFyIHJlZHVjdGlvbiB1c2luZyBcImNsYXNzaWNcIiBhbGdvcml0aG1cbmZ1bmN0aW9uIENsYXNzaWMobSkgeyB0aGlzLm0gPSBtOyB9XG5mdW5jdGlvbiBjQ29udmVydCh4KSB7XG4gIGlmKHgucyA8IDAgfHwgeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSByZXR1cm4geC5tb2QodGhpcy5tKTtcbiAgZWxzZSByZXR1cm4geDtcbn1cbmZ1bmN0aW9uIGNSZXZlcnQoeCkgeyByZXR1cm4geDsgfVxuZnVuY3Rpb24gY1JlZHVjZSh4KSB7IHguZGl2UmVtVG8odGhpcy5tLG51bGwseCk7IH1cbmZ1bmN0aW9uIGNNdWxUbyh4LHkscikgeyB4Lm11bHRpcGx5VG8oeSxyKTsgdGhpcy5yZWR1Y2Uocik7IH1cbmZ1bmN0aW9uIGNTcXJUbyh4LHIpIHsgeC5zcXVhcmVUbyhyKTsgdGhpcy5yZWR1Y2Uocik7IH1cblxuQ2xhc3NpYy5wcm90b3R5cGUuY29udmVydCA9IGNDb252ZXJ0O1xuQ2xhc3NpYy5wcm90b3R5cGUucmV2ZXJ0ID0gY1JldmVydDtcbkNsYXNzaWMucHJvdG90eXBlLnJlZHVjZSA9IGNSZWR1Y2U7XG5DbGFzc2ljLnByb3RvdHlwZS5tdWxUbyA9IGNNdWxUbztcbkNsYXNzaWMucHJvdG90eXBlLnNxclRvID0gY1NxclRvO1xuXG4vLyAocHJvdGVjdGVkKSByZXR1cm4gXCItMS90aGlzICUgMl5EQlwiOyB1c2VmdWwgZm9yIE1vbnQuIHJlZHVjdGlvblxuLy8ganVzdGlmaWNhdGlvbjpcbi8vICAgICAgICAgeHkgPT0gMSAobW9kIG0pXG4vLyAgICAgICAgIHh5ID0gIDEra21cbi8vICAgeHkoMi14eSkgPSAoMStrbSkoMS1rbSlcbi8vIHhbeSgyLXh5KV0gPSAxLWteMm1eMlxuLy8geFt5KDIteHkpXSA9PSAxIChtb2QgbV4yKVxuLy8gaWYgeSBpcyAxL3ggbW9kIG0sIHRoZW4geSgyLXh5KSBpcyAxL3ggbW9kIG1eMlxuLy8gc2hvdWxkIHJlZHVjZSB4IGFuZCB5KDIteHkpIGJ5IG1eMiBhdCBlYWNoIHN0ZXAgdG8ga2VlcCBzaXplIGJvdW5kZWQuXG4vLyBKUyBtdWx0aXBseSBcIm92ZXJmbG93c1wiIGRpZmZlcmVudGx5IGZyb20gQy9DKyssIHNvIGNhcmUgaXMgbmVlZGVkIGhlcmUuXG5mdW5jdGlvbiBibnBJbnZEaWdpdCgpIHtcbiAgaWYodGhpcy50IDwgMSkgcmV0dXJuIDA7XG4gIHZhciB4ID0gdGhpc1swXTtcbiAgaWYoKHgmMSkgPT0gMCkgcmV0dXJuIDA7XG4gIHZhciB5ID0geCYzO1x0XHQvLyB5ID09IDEveCBtb2QgMl4yXG4gIHkgPSAoeSooMi0oeCYweGYpKnkpKSYweGY7XHQvLyB5ID09IDEveCBtb2QgMl40XG4gIHkgPSAoeSooMi0oeCYweGZmKSp5KSkmMHhmZjtcdC8vIHkgPT0gMS94IG1vZCAyXjhcbiAgeSA9ICh5KigyLSgoKHgmMHhmZmZmKSp5KSYweGZmZmYpKSkmMHhmZmZmO1x0Ly8geSA9PSAxL3ggbW9kIDJeMTZcbiAgLy8gbGFzdCBzdGVwIC0gY2FsY3VsYXRlIGludmVyc2UgbW9kIERWIGRpcmVjdGx5O1xuICAvLyBhc3N1bWVzIDE2IDwgREIgPD0gMzIgYW5kIGFzc3VtZXMgYWJpbGl0eSB0byBoYW5kbGUgNDgtYml0IGludHNcbiAgeSA9ICh5KigyLXgqeSV0aGlzLkRWKSkldGhpcy5EVjtcdFx0Ly8geSA9PSAxL3ggbW9kIDJeZGJpdHNcbiAgLy8gd2UgcmVhbGx5IHdhbnQgdGhlIG5lZ2F0aXZlIGludmVyc2UsIGFuZCAtRFYgPCB5IDwgRFZcbiAgcmV0dXJuICh5PjApP3RoaXMuRFYteToteTtcbn1cblxuLy8gTW9udGdvbWVyeSByZWR1Y3Rpb25cbmZ1bmN0aW9uIE1vbnRnb21lcnkobSkge1xuICB0aGlzLm0gPSBtO1xuICB0aGlzLm1wID0gbS5pbnZEaWdpdCgpO1xuICB0aGlzLm1wbCA9IHRoaXMubXAmMHg3ZmZmO1xuICB0aGlzLm1waCA9IHRoaXMubXA+PjE1O1xuICB0aGlzLnVtID0gKDE8PChtLkRCLTE1KSktMTtcbiAgdGhpcy5tdDIgPSAyKm0udDtcbn1cblxuLy8geFIgbW9kIG1cbmZ1bmN0aW9uIG1vbnRDb252ZXJ0KHgpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgeC5hYnMoKS5kbFNoaWZ0VG8odGhpcy5tLnQscik7XG4gIHIuZGl2UmVtVG8odGhpcy5tLG51bGwscik7XG4gIGlmKHgucyA8IDAgJiYgci5jb21wYXJlVG8oQmlnSW50ZWdlci5aRVJPKSA+IDApIHRoaXMubS5zdWJUbyhyLHIpO1xuICByZXR1cm4gcjtcbn1cblxuLy8geC9SIG1vZCBtXG5mdW5jdGlvbiBtb250UmV2ZXJ0KHgpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgeC5jb3B5VG8ocik7XG4gIHRoaXMucmVkdWNlKHIpO1xuICByZXR1cm4gcjtcbn1cblxuLy8geCA9IHgvUiBtb2QgbSAoSEFDIDE0LjMyKVxuZnVuY3Rpb24gbW9udFJlZHVjZSh4KSB7XG4gIHdoaWxlKHgudCA8PSB0aGlzLm10MilcdC8vIHBhZCB4IHNvIGFtIGhhcyBlbm91Z2ggcm9vbSBsYXRlclxuICAgIHhbeC50KytdID0gMDtcbiAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubS50OyArK2kpIHtcbiAgICAvLyBmYXN0ZXIgd2F5IG9mIGNhbGN1bGF0aW5nIHUwID0geFtpXSptcCBtb2QgRFZcbiAgICB2YXIgaiA9IHhbaV0mMHg3ZmZmO1xuICAgIHZhciB1MCA9IChqKnRoaXMubXBsKygoKGoqdGhpcy5tcGgrKHhbaV0+PjE1KSp0aGlzLm1wbCkmdGhpcy51bSk8PDE1KSkmeC5ETTtcbiAgICAvLyB1c2UgYW0gdG8gY29tYmluZSB0aGUgbXVsdGlwbHktc2hpZnQtYWRkIGludG8gb25lIGNhbGxcbiAgICBqID0gaSt0aGlzLm0udDtcbiAgICB4W2pdICs9IHRoaXMubS5hbSgwLHUwLHgsaSwwLHRoaXMubS50KTtcbiAgICAvLyBwcm9wYWdhdGUgY2FycnlcbiAgICB3aGlsZSh4W2pdID49IHguRFYpIHsgeFtqXSAtPSB4LkRWOyB4Wysral0rKzsgfVxuICB9XG4gIHguY2xhbXAoKTtcbiAgeC5kclNoaWZ0VG8odGhpcy5tLnQseCk7XG4gIGlmKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMCkgeC5zdWJUbyh0aGlzLm0seCk7XG59XG5cbi8vIHIgPSBcInheMi9SIG1vZCBtXCI7IHggIT0gclxuZnVuY3Rpb24gbW9udFNxclRvKHgscikgeyB4LnNxdWFyZVRvKHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG4vLyByID0gXCJ4eS9SIG1vZCBtXCI7IHgseSAhPSByXG5mdW5jdGlvbiBtb250TXVsVG8oeCx5LHIpIHsgeC5tdWx0aXBseVRvKHkscik7IHRoaXMucmVkdWNlKHIpOyB9XG5cbk1vbnRnb21lcnkucHJvdG90eXBlLmNvbnZlcnQgPSBtb250Q29udmVydDtcbk1vbnRnb21lcnkucHJvdG90eXBlLnJldmVydCA9IG1vbnRSZXZlcnQ7XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5yZWR1Y2UgPSBtb250UmVkdWNlO1xuTW9udGdvbWVyeS5wcm90b3R5cGUubXVsVG8gPSBtb250TXVsVG87XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5zcXJUbyA9IG1vbnRTcXJUbztcblxuLy8gKHByb3RlY3RlZCkgdHJ1ZSBpZmYgdGhpcyBpcyBldmVuXG5mdW5jdGlvbiBibnBJc0V2ZW4oKSB7IHJldHVybiAoKHRoaXMudD4wKT8odGhpc1swXSYxKTp0aGlzLnMpID09IDA7IH1cblxuLy8gKHByb3RlY3RlZCkgdGhpc15lLCBlIDwgMl4zMiwgZG9pbmcgc3FyIGFuZCBtdWwgd2l0aCBcInJcIiAoSEFDIDE0Ljc5KVxuZnVuY3Rpb24gYm5wRXhwKGUseikge1xuICBpZihlID4gMHhmZmZmZmZmZiB8fCBlIDwgMSkgcmV0dXJuIEJpZ0ludGVnZXIuT05FO1xuICB2YXIgciA9IG5iaSgpLCByMiA9IG5iaSgpLCBnID0gei5jb252ZXJ0KHRoaXMpLCBpID0gbmJpdHMoZSktMTtcbiAgZy5jb3B5VG8ocik7XG4gIHdoaWxlKC0taSA+PSAwKSB7XG4gICAgei5zcXJUbyhyLHIyKTtcbiAgICBpZigoZSYoMTw8aSkpID4gMCkgei5tdWxUbyhyMixnLHIpO1xuICAgIGVsc2UgeyB2YXIgdCA9IHI7IHIgPSByMjsgcjIgPSB0OyB9XG4gIH1cbiAgcmV0dXJuIHoucmV2ZXJ0KHIpO1xufVxuXG4vLyAocHVibGljKSB0aGlzXmUgJSBtLCAwIDw9IGUgPCAyXjMyXG5mdW5jdGlvbiBibk1vZFBvd0ludChlLG0pIHtcbiAgdmFyIHo7XG4gIGlmKGUgPCAyNTYgfHwgbS5pc0V2ZW4oKSkgeiA9IG5ldyBDbGFzc2ljKG0pOyBlbHNlIHogPSBuZXcgTW9udGdvbWVyeShtKTtcbiAgcmV0dXJuIHRoaXMuZXhwKGUseik7XG59XG5cbi8vIHByb3RlY3RlZFxuQmlnSW50ZWdlci5wcm90b3R5cGUuY29weVRvID0gYm5wQ29weVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbUludCA9IGJucEZyb21JbnQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5mcm9tU3RyaW5nID0gYm5wRnJvbVN0cmluZztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNsYW1wID0gYm5wQ2xhbXA7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5kbFNoaWZ0VG8gPSBibnBETFNoaWZ0VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5kclNoaWZ0VG8gPSBibnBEUlNoaWZ0VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5sU2hpZnRUbyA9IGJucExTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuclNoaWZ0VG8gPSBibnBSU2hpZnRUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLnN1YlRvID0gYm5wU3ViVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseVRvID0gYm5wTXVsdGlwbHlUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZVRvID0gYm5wU3F1YXJlVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZSZW1UbyA9IGJucERpdlJlbVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuaW52RGlnaXQgPSBibnBJbnZEaWdpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmlzRXZlbiA9IGJucElzRXZlbjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmV4cCA9IGJucEV4cDtcblxuLy8gcHVibGljXG5CaWdJbnRlZ2VyLnByb3RvdHlwZS50b1N0cmluZyA9IGJuVG9TdHJpbmc7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5uZWdhdGUgPSBibk5lZ2F0ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmFicyA9IGJuQWJzO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuY29tcGFyZVRvID0gYm5Db21wYXJlVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGggPSBibkJpdExlbmd0aDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1vZCA9IGJuTW9kO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93SW50ID0gYm5Nb2RQb3dJbnQ7XG5cbi8vIFwiY29uc3RhbnRzXCJcbkJpZ0ludGVnZXIuWkVSTyA9IG5idigwKTtcbkJpZ0ludGVnZXIuT05FID0gbmJ2KDEpO1xuXG5cbi8vLyBCRUdJTiBqc2JuMi5qc1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDAzLTIwMDUgIFRvbSBXdVxuICogQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUy1JU1wiIEFORCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBcbiAqIEVYUFJFU1MsIElNUExJRUQgT1IgT1RIRVJXSVNFLCBJTkNMVURJTkcgV0lUSE9VVCBMSU1JVEFUSU9OLCBBTlkgXG4gKiBXQVJSQU5UWSBPRiBNRVJDSEFOVEFCSUxJVFkgT1IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBcbiAqXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUT00gV1UgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgSU5DSURFTlRBTCxcbiAqIElORElSRUNUIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPRiBBTlkgS0lORCwgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUlxuICogUkVTVUxUSU5HIEZST00gTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBPUiBOT1QgQURWSVNFRCBPRlxuICogVEhFIFBPU1NJQklMSVRZIE9GIERBTUFHRSwgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBBUklTSU5HIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1IgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cbiAqXG4gKiBJbiBhZGRpdGlvbiwgdGhlIGZvbGxvd2luZyBjb25kaXRpb24gYXBwbGllczpcbiAqXG4gKiBBbGwgcmVkaXN0cmlidXRpb25zIG11c3QgcmV0YWluIGFuIGludGFjdCBjb3B5IG9mIHRoaXMgY29weXJpZ2h0IG5vdGljZVxuICogYW5kIGRpc2NsYWltZXIuXG4gKi9cblxuLy8gRXh0ZW5kZWQgSmF2YVNjcmlwdCBCTiBmdW5jdGlvbnMsIHJlcXVpcmVkIGZvciBSU0EgcHJpdmF0ZSBvcHMuXG5cbi8vIChwdWJsaWMpXG5mdW5jdGlvbiBibkNsb25lKCkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmNvcHlUbyhyKTsgcmV0dXJuIHI7IH1cblxuLy8gKHB1YmxpYykgcmV0dXJuIHZhbHVlIGFzIGludGVnZXJcbmZ1bmN0aW9uIGJuSW50VmFsdWUoKSB7XG4gIGlmKHRoaXMucyA8IDApIHtcbiAgICBpZih0aGlzLnQgPT0gMSkgcmV0dXJuIHRoaXNbMF0tdGhpcy5EVjtcbiAgICBlbHNlIGlmKHRoaXMudCA9PSAwKSByZXR1cm4gLTE7XG4gIH1cbiAgZWxzZSBpZih0aGlzLnQgPT0gMSkgcmV0dXJuIHRoaXNbMF07XG4gIGVsc2UgaWYodGhpcy50ID09IDApIHJldHVybiAwO1xuICAvLyBhc3N1bWVzIDE2IDwgREIgPCAzMlxuICByZXR1cm4gKCh0aGlzWzFdJigoMTw8KDMyLXRoaXMuREIpKS0xKSk8PHRoaXMuREIpfHRoaXNbMF07XG59XG5cbi8vIChwdWJsaWMpIHJldHVybiB2YWx1ZSBhcyBieXRlXG5mdW5jdGlvbiBibkJ5dGVWYWx1ZSgpIHsgcmV0dXJuICh0aGlzLnQ9PTApP3RoaXMuczoodGhpc1swXTw8MjQpPj4yNDsgfVxuXG4vLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgc2hvcnQgKGFzc3VtZXMgREI+PTE2KVxuZnVuY3Rpb24gYm5TaG9ydFZhbHVlKCkgeyByZXR1cm4gKHRoaXMudD09MCk/dGhpcy5zOih0aGlzWzBdPDwxNik+PjE2OyB9XG5cbi8vIChwcm90ZWN0ZWQpIHJldHVybiB4IHMudC4gcl54IDwgRFZcbmZ1bmN0aW9uIGJucENodW5rU2l6ZShyKSB7IHJldHVybiBNYXRoLmZsb29yKE1hdGguTE4yKnRoaXMuREIvTWF0aC5sb2cocikpOyB9XG5cbi8vIChwdWJsaWMpIDAgaWYgdGhpcyA9PSAwLCAxIGlmIHRoaXMgPiAwXG5mdW5jdGlvbiBiblNpZ051bSgpIHtcbiAgaWYodGhpcy5zIDwgMCkgcmV0dXJuIC0xO1xuICBlbHNlIGlmKHRoaXMudCA8PSAwIHx8ICh0aGlzLnQgPT0gMSAmJiB0aGlzWzBdIDw9IDApKSByZXR1cm4gMDtcbiAgZWxzZSByZXR1cm4gMTtcbn1cblxuLy8gKHByb3RlY3RlZCkgY29udmVydCB0byByYWRpeCBzdHJpbmdcbmZ1bmN0aW9uIGJucFRvUmFkaXgoYikge1xuICBpZihiID09IG51bGwpIGIgPSAxMDtcbiAgaWYodGhpcy5zaWdudW0oKSA9PSAwIHx8IGIgPCAyIHx8IGIgPiAzNikgcmV0dXJuIFwiMFwiO1xuICB2YXIgY3MgPSB0aGlzLmNodW5rU2l6ZShiKTtcbiAgdmFyIGEgPSBNYXRoLnBvdyhiLGNzKTtcbiAgdmFyIGQgPSBuYnYoYSksIHkgPSBuYmkoKSwgeiA9IG5iaSgpLCByID0gXCJcIjtcbiAgdGhpcy5kaXZSZW1UbyhkLHkseik7XG4gIHdoaWxlKHkuc2lnbnVtKCkgPiAwKSB7XG4gICAgciA9IChhK3ouaW50VmFsdWUoKSkudG9TdHJpbmcoYikuc3Vic3RyKDEpICsgcjtcbiAgICB5LmRpdlJlbVRvKGQseSx6KTtcbiAgfVxuICByZXR1cm4gei5pbnRWYWx1ZSgpLnRvU3RyaW5nKGIpICsgcjtcbn1cblxuLy8gKHByb3RlY3RlZCkgY29udmVydCBmcm9tIHJhZGl4IHN0cmluZ1xuZnVuY3Rpb24gYm5wRnJvbVJhZGl4KHMsYikge1xuICB0aGlzLmZyb21JbnQoMCk7XG4gIGlmKGIgPT0gbnVsbCkgYiA9IDEwO1xuICB2YXIgY3MgPSB0aGlzLmNodW5rU2l6ZShiKTtcbiAgdmFyIGQgPSBNYXRoLnBvdyhiLGNzKSwgbWkgPSBmYWxzZSwgaiA9IDAsIHcgPSAwO1xuICBmb3IodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7ICsraSkge1xuICAgIHZhciB4ID0gaW50QXQocyxpKTtcbiAgICBpZih4IDwgMCkge1xuICAgICAgaWYocy5jaGFyQXQoaSkgPT0gXCItXCIgJiYgdGhpcy5zaWdudW0oKSA9PSAwKSBtaSA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgdyA9IGIqdyt4O1xuICAgIGlmKCsraiA+PSBjcykge1xuICAgICAgdGhpcy5kTXVsdGlwbHkoZCk7XG4gICAgICB0aGlzLmRBZGRPZmZzZXQodywwKTtcbiAgICAgIGogPSAwO1xuICAgICAgdyA9IDA7XG4gICAgfVxuICB9XG4gIGlmKGogPiAwKSB7XG4gICAgdGhpcy5kTXVsdGlwbHkoTWF0aC5wb3coYixqKSk7XG4gICAgdGhpcy5kQWRkT2Zmc2V0KHcsMCk7XG4gIH1cbiAgaWYobWkpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLHRoaXMpO1xufVxuXG4vLyAocHJvdGVjdGVkKSBhbHRlcm5hdGUgY29uc3RydWN0b3JcbmZ1bmN0aW9uIGJucEZyb21OdW1iZXIoYSxiLGMpIHtcbiAgaWYoXCJudW1iZXJcIiA9PSB0eXBlb2YgYikge1xuICAgIC8vIG5ldyBCaWdJbnRlZ2VyKGludCxpbnQsUk5HKVxuICAgIGlmKGEgPCAyKSB0aGlzLmZyb21JbnQoMSk7XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmZyb21OdW1iZXIoYSxjKTtcbiAgICAgIGlmKCF0aGlzLnRlc3RCaXQoYS0xKSlcdC8vIGZvcmNlIE1TQiBzZXRcbiAgICAgICAgdGhpcy5iaXR3aXNlVG8oQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KGEtMSksb3Bfb3IsdGhpcyk7XG4gICAgICBpZih0aGlzLmlzRXZlbigpKSB0aGlzLmRBZGRPZmZzZXQoMSwwKTsgLy8gZm9yY2Ugb2RkXG4gICAgICB3aGlsZSghdGhpcy5pc1Byb2JhYmxlUHJpbWUoYikpIHtcbiAgICAgICAgdGhpcy5kQWRkT2Zmc2V0KDIsMCk7XG4gICAgICAgIGlmKHRoaXMuYml0TGVuZ3RoKCkgPiBhKSB0aGlzLnN1YlRvKEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChhLTEpLHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICAvLyBuZXcgQmlnSW50ZWdlcihpbnQsUk5HKVxuICAgIHZhciB4ID0gbmV3IEFycmF5KCksIHQgPSBhJjc7XG4gICAgeC5sZW5ndGggPSAoYT4+MykrMTtcbiAgICBiLm5leHRCeXRlcyh4KTtcbiAgICBpZih0ID4gMCkgeFswXSAmPSAoKDE8PHQpLTEpOyBlbHNlIHhbMF0gPSAwO1xuICAgIHRoaXMuZnJvbVN0cmluZyh4LDI1Nik7XG4gIH1cbn1cblxuLy8gKHB1YmxpYykgY29udmVydCB0byBiaWdlbmRpYW4gYnl0ZSBhcnJheVxuZnVuY3Rpb24gYm5Ub0J5dGVBcnJheSgpIHtcbiAgdmFyIGkgPSB0aGlzLnQsIHIgPSBuZXcgQXJyYXkoKTtcbiAgclswXSA9IHRoaXMucztcbiAgdmFyIHAgPSB0aGlzLkRCLShpKnRoaXMuREIpJTgsIGQsIGsgPSAwO1xuICBpZihpLS0gPiAwKSB7XG4gICAgaWYocCA8IHRoaXMuREIgJiYgKGQgPSB0aGlzW2ldPj5wKSAhPSAodGhpcy5zJnRoaXMuRE0pPj5wKVxuICAgICAgcltrKytdID0gZHwodGhpcy5zPDwodGhpcy5EQi1wKSk7XG4gICAgd2hpbGUoaSA+PSAwKSB7XG4gICAgICBpZihwIDwgOCkge1xuICAgICAgICBkID0gKHRoaXNbaV0mKCgxPDxwKS0xKSk8PCg4LXApO1xuICAgICAgICBkIHw9IHRoaXNbLS1pXT4+KHArPXRoaXMuREItOCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZCA9ICh0aGlzW2ldPj4ocC09OCkpJjB4ZmY7XG4gICAgICAgIGlmKHAgPD0gMCkgeyBwICs9IHRoaXMuREI7IC0taTsgfVxuICAgICAgfVxuICAgICAgaWYoKGQmMHg4MCkgIT0gMCkgZCB8PSAtMjU2O1xuICAgICAgaWYoayA9PSAwICYmICh0aGlzLnMmMHg4MCkgIT0gKGQmMHg4MCkpICsraztcbiAgICAgIGlmKGsgPiAwIHx8IGQgIT0gdGhpcy5zKSByW2srK10gPSBkO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcjtcbn1cblxuZnVuY3Rpb24gYm5FcXVhbHMoYSkgeyByZXR1cm4odGhpcy5jb21wYXJlVG8oYSk9PTApOyB9XG5mdW5jdGlvbiBibk1pbihhKSB7IHJldHVybih0aGlzLmNvbXBhcmVUbyhhKTwwKT90aGlzOmE7IH1cbmZ1bmN0aW9uIGJuTWF4KGEpIHsgcmV0dXJuKHRoaXMuY29tcGFyZVRvKGEpPjApP3RoaXM6YTsgfVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyBvcCBhIChiaXR3aXNlKVxuZnVuY3Rpb24gYm5wQml0d2lzZVRvKGEsb3Ascikge1xuICB2YXIgaSwgZiwgbSA9IE1hdGgubWluKGEudCx0aGlzLnQpO1xuICBmb3IoaSA9IDA7IGkgPCBtOyArK2kpIHJbaV0gPSBvcCh0aGlzW2ldLGFbaV0pO1xuICBpZihhLnQgPCB0aGlzLnQpIHtcbiAgICBmID0gYS5zJnRoaXMuRE07XG4gICAgZm9yKGkgPSBtOyBpIDwgdGhpcy50OyArK2kpIHJbaV0gPSBvcCh0aGlzW2ldLGYpO1xuICAgIHIudCA9IHRoaXMudDtcbiAgfVxuICBlbHNlIHtcbiAgICBmID0gdGhpcy5zJnRoaXMuRE07XG4gICAgZm9yKGkgPSBtOyBpIDwgYS50OyArK2kpIHJbaV0gPSBvcChmLGFbaV0pO1xuICAgIHIudCA9IGEudDtcbiAgfVxuICByLnMgPSBvcCh0aGlzLnMsYS5zKTtcbiAgci5jbGFtcCgpO1xufVxuXG4vLyAocHVibGljKSB0aGlzICYgYVxuZnVuY3Rpb24gb3BfYW5kKHgseSkgeyByZXR1cm4geCZ5OyB9XG5mdW5jdGlvbiBibkFuZChhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuYml0d2lzZVRvKGEsb3BfYW5kLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB0aGlzIHwgYVxuZnVuY3Rpb24gb3Bfb3IoeCx5KSB7IHJldHVybiB4fHk7IH1cbmZ1bmN0aW9uIGJuT3IoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmJpdHdpc2VUbyhhLG9wX29yLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB0aGlzIF4gYVxuZnVuY3Rpb24gb3BfeG9yKHgseSkgeyByZXR1cm4geF55OyB9XG5mdW5jdGlvbiBiblhvcihhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuYml0d2lzZVRvKGEsb3BfeG9yLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB0aGlzICYgfmFcbmZ1bmN0aW9uIG9wX2FuZG5vdCh4LHkpIHsgcmV0dXJuIHgmfnk7IH1cbmZ1bmN0aW9uIGJuQW5kTm90KGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5iaXR3aXNlVG8oYSxvcF9hbmRub3Qscik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIH50aGlzXG5mdW5jdGlvbiBibk5vdCgpIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKSByW2ldID0gdGhpcy5ETSZ+dGhpc1tpXTtcbiAgci50ID0gdGhpcy50O1xuICByLnMgPSB+dGhpcy5zO1xuICByZXR1cm4gcjtcbn1cblxuLy8gKHB1YmxpYykgdGhpcyA8PCBuXG5mdW5jdGlvbiBiblNoaWZ0TGVmdChuKSB7XG4gIHZhciByID0gbmJpKCk7XG4gIGlmKG4gPCAwKSB0aGlzLnJTaGlmdFRvKC1uLHIpOyBlbHNlIHRoaXMubFNoaWZ0VG8obixyKTtcbiAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIHRoaXMgPj4gblxuZnVuY3Rpb24gYm5TaGlmdFJpZ2h0KG4pIHtcbiAgdmFyIHIgPSBuYmkoKTtcbiAgaWYobiA8IDApIHRoaXMubFNoaWZ0VG8oLW4scik7IGVsc2UgdGhpcy5yU2hpZnRUbyhuLHIpO1xuICByZXR1cm4gcjtcbn1cblxuLy8gcmV0dXJuIGluZGV4IG9mIGxvd2VzdCAxLWJpdCBpbiB4LCB4IDwgMl4zMVxuZnVuY3Rpb24gbGJpdCh4KSB7XG4gIGlmKHggPT0gMCkgcmV0dXJuIC0xO1xuICB2YXIgciA9IDA7XG4gIGlmKCh4JjB4ZmZmZikgPT0gMCkgeyB4ID4+PSAxNjsgciArPSAxNjsgfVxuICBpZigoeCYweGZmKSA9PSAwKSB7IHggPj49IDg7IHIgKz0gODsgfVxuICBpZigoeCYweGYpID09IDApIHsgeCA+Pj0gNDsgciArPSA0OyB9XG4gIGlmKCh4JjMpID09IDApIHsgeCA+Pj0gMjsgciArPSAyOyB9XG4gIGlmKCh4JjEpID09IDApICsrcjtcbiAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIHJldHVybnMgaW5kZXggb2YgbG93ZXN0IDEtYml0IChvciAtMSBpZiBub25lKVxuZnVuY3Rpb24gYm5HZXRMb3dlc3RTZXRCaXQoKSB7XG4gIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICBpZih0aGlzW2ldICE9IDApIHJldHVybiBpKnRoaXMuREIrbGJpdCh0aGlzW2ldKTtcbiAgaWYodGhpcy5zIDwgMCkgcmV0dXJuIHRoaXMudCp0aGlzLkRCO1xuICByZXR1cm4gLTE7XG59XG5cbi8vIHJldHVybiBudW1iZXIgb2YgMSBiaXRzIGluIHhcbmZ1bmN0aW9uIGNiaXQoeCkge1xuICB2YXIgciA9IDA7XG4gIHdoaWxlKHggIT0gMCkgeyB4ICY9IHgtMTsgKytyOyB9XG4gIHJldHVybiByO1xufVxuXG4vLyAocHVibGljKSByZXR1cm4gbnVtYmVyIG9mIHNldCBiaXRzXG5mdW5jdGlvbiBibkJpdENvdW50KCkge1xuICB2YXIgciA9IDAsIHggPSB0aGlzLnMmdGhpcy5ETTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKSByICs9IGNiaXQodGhpc1tpXV54KTtcbiAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIHRydWUgaWZmIG50aCBiaXQgaXMgc2V0XG5mdW5jdGlvbiBiblRlc3RCaXQobikge1xuICB2YXIgaiA9IE1hdGguZmxvb3Iobi90aGlzLkRCKTtcbiAgaWYoaiA+PSB0aGlzLnQpIHJldHVybih0aGlzLnMhPTApO1xuICByZXR1cm4oKHRoaXNbal0mKDE8PChuJXRoaXMuREIpKSkhPTApO1xufVxuXG4vLyAocHJvdGVjdGVkKSB0aGlzIG9wICgxPDxuKVxuZnVuY3Rpb24gYm5wQ2hhbmdlQml0KG4sb3ApIHtcbiAgdmFyIHIgPSBCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQobik7XG4gIHRoaXMuYml0d2lzZVRvKHIsb3Ascik7XG4gIHJldHVybiByO1xufVxuXG4vLyAocHVibGljKSB0aGlzIHwgKDE8PG4pXG5mdW5jdGlvbiBiblNldEJpdChuKSB7IHJldHVybiB0aGlzLmNoYW5nZUJpdChuLG9wX29yKTsgfVxuXG4vLyAocHVibGljKSB0aGlzICYgfigxPDxuKVxuZnVuY3Rpb24gYm5DbGVhckJpdChuKSB7IHJldHVybiB0aGlzLmNoYW5nZUJpdChuLG9wX2FuZG5vdCk7IH1cblxuLy8gKHB1YmxpYykgdGhpcyBeICgxPDxuKVxuZnVuY3Rpb24gYm5GbGlwQml0KG4pIHsgcmV0dXJuIHRoaXMuY2hhbmdlQml0KG4sb3BfeG9yKTsgfVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyArIGFcbmZ1bmN0aW9uIGJucEFkZFRvKGEscikge1xuICB2YXIgaSA9IDAsIGMgPSAwLCBtID0gTWF0aC5taW4oYS50LHRoaXMudCk7XG4gIHdoaWxlKGkgPCBtKSB7XG4gICAgYyArPSB0aGlzW2ldK2FbaV07XG4gICAgcltpKytdID0gYyZ0aGlzLkRNO1xuICAgIGMgPj49IHRoaXMuREI7XG4gIH1cbiAgaWYoYS50IDwgdGhpcy50KSB7XG4gICAgYyArPSBhLnM7XG4gICAgd2hpbGUoaSA8IHRoaXMudCkge1xuICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgcltpKytdID0gYyZ0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG4gICAgYyArPSB0aGlzLnM7XG4gIH1cbiAgZWxzZSB7XG4gICAgYyArPSB0aGlzLnM7XG4gICAgd2hpbGUoaSA8IGEudCkge1xuICAgICAgYyArPSBhW2ldO1xuICAgICAgcltpKytdID0gYyZ0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG4gICAgYyArPSBhLnM7XG4gIH1cbiAgci5zID0gKGM8MCk/LTE6MDtcbiAgaWYoYyA+IDApIHJbaSsrXSA9IGM7XG4gIGVsc2UgaWYoYyA8IC0xKSByW2krK10gPSB0aGlzLkRWK2M7XG4gIHIudCA9IGk7XG4gIHIuY2xhbXAoKTtcbn1cblxuLy8gKHB1YmxpYykgdGhpcyArIGFcbmZ1bmN0aW9uIGJuQWRkKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5hZGRUbyhhLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB0aGlzIC0gYVxuZnVuY3Rpb24gYm5TdWJ0cmFjdChhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuc3ViVG8oYSxyKTsgcmV0dXJuIHI7IH1cblxuLy8gKHB1YmxpYykgdGhpcyAqIGFcbmZ1bmN0aW9uIGJuTXVsdGlwbHkoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLm11bHRpcGx5VG8oYSxyKTsgcmV0dXJuIHI7IH1cblxuLy8gKHB1YmxpYykgdGhpcyAvIGFcbmZ1bmN0aW9uIGJuRGl2aWRlKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5kaXZSZW1UbyhhLHIsbnVsbCk7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgJSBhXG5mdW5jdGlvbiBiblJlbWFpbmRlcihhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuZGl2UmVtVG8oYSxudWxsLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSBbdGhpcy9hLHRoaXMlYV1cbmZ1bmN0aW9uIGJuRGl2aWRlQW5kUmVtYWluZGVyKGEpIHtcbiAgdmFyIHEgPSBuYmkoKSwgciA9IG5iaSgpO1xuICB0aGlzLmRpdlJlbVRvKGEscSxyKTtcbiAgcmV0dXJuIG5ldyBBcnJheShxLHIpO1xufVxuXG4vLyAocHJvdGVjdGVkKSB0aGlzICo9IG4sIHRoaXMgPj0gMCwgMSA8IG4gPCBEVlxuZnVuY3Rpb24gYm5wRE11bHRpcGx5KG4pIHtcbiAgdGhpc1t0aGlzLnRdID0gdGhpcy5hbSgwLG4tMSx0aGlzLDAsMCx0aGlzLnQpO1xuICArK3RoaXMudDtcbiAgdGhpcy5jbGFtcCgpO1xufVxuXG4vLyAocHJvdGVjdGVkKSB0aGlzICs9IG4gPDwgdyB3b3JkcywgdGhpcyA+PSAwXG5mdW5jdGlvbiBibnBEQWRkT2Zmc2V0KG4sdykge1xuICB3aGlsZSh0aGlzLnQgPD0gdykgdGhpc1t0aGlzLnQrK10gPSAwO1xuICB0aGlzW3ddICs9IG47XG4gIHdoaWxlKHRoaXNbd10gPj0gdGhpcy5EVikge1xuICAgIHRoaXNbd10gLT0gdGhpcy5EVjtcbiAgICBpZigrK3cgPj0gdGhpcy50KSB0aGlzW3RoaXMudCsrXSA9IDA7XG4gICAgKyt0aGlzW3ddO1xuICB9XG59XG5cbi8vIEEgXCJudWxsXCIgcmVkdWNlclxuZnVuY3Rpb24gTnVsbEV4cCgpIHt9XG5mdW5jdGlvbiBuTm9wKHgpIHsgcmV0dXJuIHg7IH1cbmZ1bmN0aW9uIG5NdWxUbyh4LHkscikgeyB4Lm11bHRpcGx5VG8oeSxyKTsgfVxuZnVuY3Rpb24gblNxclRvKHgscikgeyB4LnNxdWFyZVRvKHIpOyB9XG5cbk51bGxFeHAucHJvdG90eXBlLmNvbnZlcnQgPSBuTm9wO1xuTnVsbEV4cC5wcm90b3R5cGUucmV2ZXJ0ID0gbk5vcDtcbk51bGxFeHAucHJvdG90eXBlLm11bFRvID0gbk11bFRvO1xuTnVsbEV4cC5wcm90b3R5cGUuc3FyVG8gPSBuU3FyVG87XG5cbi8vIChwdWJsaWMpIHRoaXNeZVxuZnVuY3Rpb24gYm5Qb3coZSkgeyByZXR1cm4gdGhpcy5leHAoZSxuZXcgTnVsbEV4cCgpKTsgfVxuXG4vLyAocHJvdGVjdGVkKSByID0gbG93ZXIgbiB3b3JkcyBvZiBcInRoaXMgKiBhXCIsIGEudCA8PSBuXG4vLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG5mdW5jdGlvbiBibnBNdWx0aXBseUxvd2VyVG8oYSxuLHIpIHtcbiAgdmFyIGkgPSBNYXRoLm1pbih0aGlzLnQrYS50LG4pO1xuICByLnMgPSAwOyAvLyBhc3N1bWVzIGEsdGhpcyA+PSAwXG4gIHIudCA9IGk7XG4gIHdoaWxlKGkgPiAwKSByWy0taV0gPSAwO1xuICB2YXIgajtcbiAgZm9yKGogPSByLnQtdGhpcy50OyBpIDwgajsgKytpKSByW2krdGhpcy50XSA9IHRoaXMuYW0oMCxhW2ldLHIsaSwwLHRoaXMudCk7XG4gIGZvcihqID0gTWF0aC5taW4oYS50LG4pOyBpIDwgajsgKytpKSB0aGlzLmFtKDAsYVtpXSxyLGksMCxuLWkpO1xuICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSBcInRoaXMgKiBhXCIgd2l0aG91dCBsb3dlciBuIHdvcmRzLCBuID4gMFxuLy8gXCJ0aGlzXCIgc2hvdWxkIGJlIHRoZSBsYXJnZXIgb25lIGlmIGFwcHJvcHJpYXRlLlxuZnVuY3Rpb24gYm5wTXVsdGlwbHlVcHBlclRvKGEsbixyKSB7XG4gIC0tbjtcbiAgdmFyIGkgPSByLnQgPSB0aGlzLnQrYS50LW47XG4gIHIucyA9IDA7IC8vIGFzc3VtZXMgYSx0aGlzID49IDBcbiAgd2hpbGUoLS1pID49IDApIHJbaV0gPSAwO1xuICBmb3IoaSA9IE1hdGgubWF4KG4tdGhpcy50LDApOyBpIDwgYS50OyArK2kpXG4gICAgclt0aGlzLnQraS1uXSA9IHRoaXMuYW0obi1pLGFbaV0sciwwLDAsdGhpcy50K2ktbik7XG4gIHIuY2xhbXAoKTtcbiAgci5kclNoaWZ0VG8oMSxyKTtcbn1cblxuLy8gQmFycmV0dCBtb2R1bGFyIHJlZHVjdGlvblxuZnVuY3Rpb24gQmFycmV0dChtKSB7XG4gIC8vIHNldHVwIEJhcnJldHRcbiAgdGhpcy5yMiA9IG5iaSgpO1xuICB0aGlzLnEzID0gbmJpKCk7XG4gIEJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbygyKm0udCx0aGlzLnIyKTtcbiAgdGhpcy5tdSA9IHRoaXMucjIuZGl2aWRlKG0pO1xuICB0aGlzLm0gPSBtO1xufVxuXG5mdW5jdGlvbiBiYXJyZXR0Q29udmVydCh4KSB7XG4gIGlmKHgucyA8IDAgfHwgeC50ID4gMip0aGlzLm0udCkgcmV0dXJuIHgubW9kKHRoaXMubSk7XG4gIGVsc2UgaWYoeC5jb21wYXJlVG8odGhpcy5tKSA8IDApIHJldHVybiB4O1xuICBlbHNlIHsgdmFyIHIgPSBuYmkoKTsgeC5jb3B5VG8ocik7IHRoaXMucmVkdWNlKHIpOyByZXR1cm4gcjsgfVxufVxuXG5mdW5jdGlvbiBiYXJyZXR0UmV2ZXJ0KHgpIHsgcmV0dXJuIHg7IH1cblxuLy8geCA9IHggbW9kIG0gKEhBQyAxNC40MilcbmZ1bmN0aW9uIGJhcnJldHRSZWR1Y2UoeCkge1xuICB4LmRyU2hpZnRUbyh0aGlzLm0udC0xLHRoaXMucjIpO1xuICBpZih4LnQgPiB0aGlzLm0udCsxKSB7IHgudCA9IHRoaXMubS50KzE7IHguY2xhbXAoKTsgfVxuICB0aGlzLm11Lm11bHRpcGx5VXBwZXJUbyh0aGlzLnIyLHRoaXMubS50KzEsdGhpcy5xMyk7XG4gIHRoaXMubS5tdWx0aXBseUxvd2VyVG8odGhpcy5xMyx0aGlzLm0udCsxLHRoaXMucjIpO1xuICB3aGlsZSh4LmNvbXBhcmVUbyh0aGlzLnIyKSA8IDApIHguZEFkZE9mZnNldCgxLHRoaXMubS50KzEpO1xuICB4LnN1YlRvKHRoaXMucjIseCk7XG4gIHdoaWxlKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMCkgeC5zdWJUbyh0aGlzLm0seCk7XG59XG5cbi8vIHIgPSB4XjIgbW9kIG07IHggIT0gclxuZnVuY3Rpb24gYmFycmV0dFNxclRvKHgscikgeyB4LnNxdWFyZVRvKHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG4vLyByID0geCp5IG1vZCBtOyB4LHkgIT0gclxuZnVuY3Rpb24gYmFycmV0dE11bFRvKHgseSxyKSB7IHgubXVsdGlwbHlUbyh5LHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG5CYXJyZXR0LnByb3RvdHlwZS5jb252ZXJ0ID0gYmFycmV0dENvbnZlcnQ7XG5CYXJyZXR0LnByb3RvdHlwZS5yZXZlcnQgPSBiYXJyZXR0UmV2ZXJ0O1xuQmFycmV0dC5wcm90b3R5cGUucmVkdWNlID0gYmFycmV0dFJlZHVjZTtcbkJhcnJldHQucHJvdG90eXBlLm11bFRvID0gYmFycmV0dE11bFRvO1xuQmFycmV0dC5wcm90b3R5cGUuc3FyVG8gPSBiYXJyZXR0U3FyVG87XG5cbi8vIChwdWJsaWMpIHRoaXNeZSAlIG0gKEhBQyAxNC44NSlcbmZ1bmN0aW9uIGJuTW9kUG93KGUsbSkge1xuICB2YXIgaSA9IGUuYml0TGVuZ3RoKCksIGssIHIgPSBuYnYoMSksIHo7XG4gIGlmKGkgPD0gMCkgcmV0dXJuIHI7XG4gIGVsc2UgaWYoaSA8IDE4KSBrID0gMTtcbiAgZWxzZSBpZihpIDwgNDgpIGsgPSAzO1xuICBlbHNlIGlmKGkgPCAxNDQpIGsgPSA0O1xuICBlbHNlIGlmKGkgPCA3NjgpIGsgPSA1O1xuICBlbHNlIGsgPSA2O1xuICBpZihpIDwgOClcbiAgICB6ID0gbmV3IENsYXNzaWMobSk7XG4gIGVsc2UgaWYobS5pc0V2ZW4oKSlcbiAgICB6ID0gbmV3IEJhcnJldHQobSk7XG4gIGVsc2VcbiAgICB6ID0gbmV3IE1vbnRnb21lcnkobSk7XG5cbiAgLy8gcHJlY29tcHV0YXRpb25cbiAgdmFyIGcgPSBuZXcgQXJyYXkoKSwgbiA9IDMsIGsxID0gay0xLCBrbSA9ICgxPDxrKS0xO1xuICBnWzFdID0gei5jb252ZXJ0KHRoaXMpO1xuICBpZihrID4gMSkge1xuICAgIHZhciBnMiA9IG5iaSgpO1xuICAgIHouc3FyVG8oZ1sxXSxnMik7XG4gICAgd2hpbGUobiA8PSBrbSkge1xuICAgICAgZ1tuXSA9IG5iaSgpO1xuICAgICAgei5tdWxUbyhnMixnW24tMl0sZ1tuXSk7XG4gICAgICBuICs9IDI7XG4gICAgfVxuICB9XG5cbiAgdmFyIGogPSBlLnQtMSwgdywgaXMxID0gdHJ1ZSwgcjIgPSBuYmkoKSwgdDtcbiAgaSA9IG5iaXRzKGVbal0pLTE7XG4gIHdoaWxlKGogPj0gMCkge1xuICAgIGlmKGkgPj0gazEpIHcgPSAoZVtqXT4+KGktazEpKSZrbTtcbiAgICBlbHNlIHtcbiAgICAgIHcgPSAoZVtqXSYoKDE8PChpKzEpKS0xKSk8PChrMS1pKTtcbiAgICAgIGlmKGogPiAwKSB3IHw9IGVbai0xXT4+KHRoaXMuREIraS1rMSk7XG4gICAgfVxuXG4gICAgbiA9IGs7XG4gICAgd2hpbGUoKHcmMSkgPT0gMCkgeyB3ID4+PSAxOyAtLW47IH1cbiAgICBpZigoaSAtPSBuKSA8IDApIHsgaSArPSB0aGlzLkRCOyAtLWo7IH1cbiAgICBpZihpczEpIHtcdC8vIHJldCA9PSAxLCBkb24ndCBib3RoZXIgc3F1YXJpbmcgb3IgbXVsdGlwbHlpbmcgaXRcbiAgICAgIGdbd10uY29weVRvKHIpO1xuICAgICAgaXMxID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgd2hpbGUobiA+IDEpIHsgei5zcXJUbyhyLHIyKTsgei5zcXJUbyhyMixyKTsgbiAtPSAyOyB9XG4gICAgICBpZihuID4gMCkgei5zcXJUbyhyLHIyKTsgZWxzZSB7IHQgPSByOyByID0gcjI7IHIyID0gdDsgfVxuICAgICAgei5tdWxUbyhyMixnW3ddLHIpO1xuICAgIH1cblxuICAgIHdoaWxlKGogPj0gMCAmJiAoZVtqXSYoMTw8aSkpID09IDApIHtcbiAgICAgIHouc3FyVG8ocixyMik7IHQgPSByOyByID0gcjI7IHIyID0gdDtcbiAgICAgIGlmKC0taSA8IDApIHsgaSA9IHRoaXMuREItMTsgLS1qOyB9XG4gICAgfVxuICB9XG4gIHJldHVybiB6LnJldmVydChyKTtcbn1cblxuLy8gKHB1YmxpYykgZ2NkKHRoaXMsYSkgKEhBQyAxNC41NClcbmZ1bmN0aW9uIGJuR0NEKGEpIHtcbiAgdmFyIHggPSAodGhpcy5zPDApP3RoaXMubmVnYXRlKCk6dGhpcy5jbG9uZSgpO1xuICB2YXIgeSA9IChhLnM8MCk/YS5uZWdhdGUoKTphLmNsb25lKCk7XG4gIGlmKHguY29tcGFyZVRvKHkpIDwgMCkgeyB2YXIgdCA9IHg7IHggPSB5OyB5ID0gdDsgfVxuICB2YXIgaSA9IHguZ2V0TG93ZXN0U2V0Qml0KCksIGcgPSB5LmdldExvd2VzdFNldEJpdCgpO1xuICBpZihnIDwgMCkgcmV0dXJuIHg7XG4gIGlmKGkgPCBnKSBnID0gaTtcbiAgaWYoZyA+IDApIHtcbiAgICB4LnJTaGlmdFRvKGcseCk7XG4gICAgeS5yU2hpZnRUbyhnLHkpO1xuICB9XG4gIHdoaWxlKHguc2lnbnVtKCkgPiAwKSB7XG4gICAgaWYoKGkgPSB4LmdldExvd2VzdFNldEJpdCgpKSA+IDApIHguclNoaWZ0VG8oaSx4KTtcbiAgICBpZigoaSA9IHkuZ2V0TG93ZXN0U2V0Qml0KCkpID4gMCkgeS5yU2hpZnRUbyhpLHkpO1xuICAgIGlmKHguY29tcGFyZVRvKHkpID49IDApIHtcbiAgICAgIHguc3ViVG8oeSx4KTtcbiAgICAgIHguclNoaWZ0VG8oMSx4KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB5LnN1YlRvKHgseSk7XG4gICAgICB5LnJTaGlmdFRvKDEseSk7XG4gICAgfVxuICB9XG4gIGlmKGcgPiAwKSB5LmxTaGlmdFRvKGcseSk7XG4gIHJldHVybiB5O1xufVxuXG4vLyAocHJvdGVjdGVkKSB0aGlzICUgbiwgbiA8IDJeMjZcbmZ1bmN0aW9uIGJucE1vZEludChuKSB7XG4gIGlmKG4gPD0gMCkgcmV0dXJuIDA7XG4gIHZhciBkID0gdGhpcy5EViVuLCByID0gKHRoaXMuczwwKT9uLTE6MDtcbiAgaWYodGhpcy50ID4gMClcbiAgICBpZihkID09IDApIHIgPSB0aGlzWzBdJW47XG4gICAgZWxzZSBmb3IodmFyIGkgPSB0aGlzLnQtMTsgaSA+PSAwOyAtLWkpIHIgPSAoZCpyK3RoaXNbaV0pJW47XG4gIHJldHVybiByO1xufVxuXG4vLyAocHVibGljKSAxL3RoaXMgJSBtIChIQUMgMTQuNjEpXG5mdW5jdGlvbiBibk1vZEludmVyc2UobSkge1xuICB2YXIgYWMgPSBtLmlzRXZlbigpO1xuICBpZigodGhpcy5pc0V2ZW4oKSAmJiBhYykgfHwgbS5zaWdudW0oKSA9PSAwKSByZXR1cm4gQmlnSW50ZWdlci5aRVJPO1xuICB2YXIgdSA9IG0uY2xvbmUoKSwgdiA9IHRoaXMuY2xvbmUoKTtcbiAgdmFyIGEgPSBuYnYoMSksIGIgPSBuYnYoMCksIGMgPSBuYnYoMCksIGQgPSBuYnYoMSk7XG4gIHdoaWxlKHUuc2lnbnVtKCkgIT0gMCkge1xuICAgIHdoaWxlKHUuaXNFdmVuKCkpIHtcbiAgICAgIHUuclNoaWZ0VG8oMSx1KTtcbiAgICAgIGlmKGFjKSB7XG4gICAgICAgIGlmKCFhLmlzRXZlbigpIHx8ICFiLmlzRXZlbigpKSB7IGEuYWRkVG8odGhpcyxhKTsgYi5zdWJUbyhtLGIpOyB9XG4gICAgICAgIGEuclNoaWZ0VG8oMSxhKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoIWIuaXNFdmVuKCkpIGIuc3ViVG8obSxiKTtcbiAgICAgIGIuclNoaWZ0VG8oMSxiKTtcbiAgICB9XG4gICAgd2hpbGUodi5pc0V2ZW4oKSkge1xuICAgICAgdi5yU2hpZnRUbygxLHYpO1xuICAgICAgaWYoYWMpIHtcbiAgICAgICAgaWYoIWMuaXNFdmVuKCkgfHwgIWQuaXNFdmVuKCkpIHsgYy5hZGRUbyh0aGlzLGMpOyBkLnN1YlRvKG0sZCk7IH1cbiAgICAgICAgYy5yU2hpZnRUbygxLGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZighZC5pc0V2ZW4oKSkgZC5zdWJUbyhtLGQpO1xuICAgICAgZC5yU2hpZnRUbygxLGQpO1xuICAgIH1cbiAgICBpZih1LmNvbXBhcmVUbyh2KSA+PSAwKSB7XG4gICAgICB1LnN1YlRvKHYsdSk7XG4gICAgICBpZihhYykgYS5zdWJUbyhjLGEpO1xuICAgICAgYi5zdWJUbyhkLGIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHYuc3ViVG8odSx2KTtcbiAgICAgIGlmKGFjKSBjLnN1YlRvKGEsYyk7XG4gICAgICBkLnN1YlRvKGIsZCk7XG4gICAgfVxuICB9XG4gIGlmKHYuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSAhPSAwKSByZXR1cm4gQmlnSW50ZWdlci5aRVJPO1xuICBpZihkLmNvbXBhcmVUbyhtKSA+PSAwKSByZXR1cm4gZC5zdWJ0cmFjdChtKTtcbiAgaWYoZC5zaWdudW0oKSA8IDApIGQuYWRkVG8obSxkKTsgZWxzZSByZXR1cm4gZDtcbiAgaWYoZC5zaWdudW0oKSA8IDApIHJldHVybiBkLmFkZChtKTsgZWxzZSByZXR1cm4gZDtcbn1cblxudmFyIGxvd3ByaW1lcyA9IFsyLDMsNSw3LDExLDEzLDE3LDE5LDIzLDI5LDMxLDM3LDQxLDQzLDQ3LDUzLDU5LDYxLDY3LDcxLDczLDc5LDgzLDg5LDk3LDEwMSwxMDMsMTA3LDEwOSwxMTMsMTI3LDEzMSwxMzcsMTM5LDE0OSwxNTEsMTU3LDE2MywxNjcsMTczLDE3OSwxODEsMTkxLDE5MywxOTcsMTk5LDIxMSwyMjMsMjI3LDIyOSwyMzMsMjM5LDI0MSwyNTEsMjU3LDI2MywyNjksMjcxLDI3NywyODEsMjgzLDI5MywzMDcsMzExLDMxMywzMTcsMzMxLDMzNywzNDcsMzQ5LDM1MywzNTksMzY3LDM3MywzNzksMzgzLDM4OSwzOTcsNDAxLDQwOSw0MTksNDIxLDQzMSw0MzMsNDM5LDQ0Myw0NDksNDU3LDQ2MSw0NjMsNDY3LDQ3OSw0ODcsNDkxLDQ5OSw1MDMsNTA5XTtcbnZhciBscGxpbSA9ICgxPDwyNikvbG93cHJpbWVzW2xvd3ByaW1lcy5sZW5ndGgtMV07XG5cbi8vIChwdWJsaWMpIHRlc3QgcHJpbWFsaXR5IHdpdGggY2VydGFpbnR5ID49IDEtLjVedFxuZnVuY3Rpb24gYm5Jc1Byb2JhYmxlUHJpbWUodCkge1xuICB2YXIgaSwgeCA9IHRoaXMuYWJzKCk7XG4gIGlmKHgudCA9PSAxICYmIHhbMF0gPD0gbG93cHJpbWVzW2xvd3ByaW1lcy5sZW5ndGgtMV0pIHtcbiAgICBmb3IoaSA9IDA7IGkgPCBsb3dwcmltZXMubGVuZ3RoOyArK2kpXG4gICAgICBpZih4WzBdID09IGxvd3ByaW1lc1tpXSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmKHguaXNFdmVuKCkpIHJldHVybiBmYWxzZTtcbiAgaSA9IDE7XG4gIHdoaWxlKGkgPCBsb3dwcmltZXMubGVuZ3RoKSB7XG4gICAgdmFyIG0gPSBsb3dwcmltZXNbaV0sIGogPSBpKzE7XG4gICAgd2hpbGUoaiA8IGxvd3ByaW1lcy5sZW5ndGggJiYgbSA8IGxwbGltKSBtICo9IGxvd3ByaW1lc1tqKytdO1xuICAgIG0gPSB4Lm1vZEludChtKTtcbiAgICB3aGlsZShpIDwgaikgaWYobSVsb3dwcmltZXNbaSsrXSA9PSAwKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHgubWlsbGVyUmFiaW4odCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHRydWUgaWYgcHJvYmFibHkgcHJpbWUgKEhBQyA0LjI0LCBNaWxsZXItUmFiaW4pXG5mdW5jdGlvbiBibnBNaWxsZXJSYWJpbih0KSB7XG4gIHZhciBuMSA9IHRoaXMuc3VidHJhY3QoQmlnSW50ZWdlci5PTkUpO1xuICB2YXIgayA9IG4xLmdldExvd2VzdFNldEJpdCgpO1xuICBpZihrIDw9IDApIHJldHVybiBmYWxzZTtcbiAgdmFyIHIgPSBuMS5zaGlmdFJpZ2h0KGspO1xuICB0ID0gKHQrMSk+PjE7XG4gIGlmKHQgPiBsb3dwcmltZXMubGVuZ3RoKSB0ID0gbG93cHJpbWVzLmxlbmd0aDtcbiAgdmFyIGEgPSBuYmkoKTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IHQ7ICsraSkge1xuICAgIGEuZnJvbUludChsb3dwcmltZXNbaV0pO1xuICAgIHZhciB5ID0gYS5tb2RQb3cocix0aGlzKTtcbiAgICBpZih5LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgIT0gMCAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMCkge1xuICAgICAgdmFyIGogPSAxO1xuICAgICAgd2hpbGUoaisrIDwgayAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMCkge1xuICAgICAgICB5ID0geS5tb2RQb3dJbnQoMix0aGlzKTtcbiAgICAgICAgaWYoeS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpID09IDApIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmKHkuY29tcGFyZVRvKG4xKSAhPSAwKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBwcm90ZWN0ZWRcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNodW5rU2l6ZSA9IGJucENodW5rU2l6ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnRvUmFkaXggPSBibnBUb1JhZGl4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVJhZGl4ID0gYm5wRnJvbVJhZGl4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbU51bWJlciA9IGJucEZyb21OdW1iZXI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXR3aXNlVG8gPSBibnBCaXR3aXNlVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jaGFuZ2VCaXQgPSBibnBDaGFuZ2VCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGRUbyA9IGJucEFkZFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZE11bHRpcGx5ID0gYm5wRE11bHRpcGx5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZEFkZE9mZnNldCA9IGJucERBZGRPZmZzZXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseUxvd2VyVG8gPSBibnBNdWx0aXBseUxvd2VyVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseVVwcGVyVG8gPSBibnBNdWx0aXBseVVwcGVyVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnQgPSBibnBNb2RJbnQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5taWxsZXJSYWJpbiA9IGJucE1pbGxlclJhYmluO1xuXG4vLyBwdWJsaWNcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNsb25lID0gYm5DbG9uZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmludFZhbHVlID0gYm5JbnRWYWx1ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmJ5dGVWYWx1ZSA9IGJuQnl0ZVZhbHVlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc2hvcnRWYWx1ZSA9IGJuU2hvcnRWYWx1ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNpZ251bSA9IGJuU2lnTnVtO1xuQmlnSW50ZWdlci5wcm90b3R5cGUudG9CeXRlQXJyYXkgPSBiblRvQnl0ZUFycmF5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZXF1YWxzID0gYm5FcXVhbHM7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5taW4gPSBibk1pbjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1heCA9IGJuTWF4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYW5kID0gYm5BbmQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5vciA9IGJuT3I7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS54b3IgPSBiblhvcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmFuZE5vdCA9IGJuQW5kTm90O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubm90ID0gYm5Ob3Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQgPSBiblNoaWZ0TGVmdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0UmlnaHQgPSBiblNoaWZ0UmlnaHQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5nZXRMb3dlc3RTZXRCaXQgPSBibkdldExvd2VzdFNldEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmJpdENvdW50ID0gYm5CaXRDb3VudDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnRlc3RCaXQgPSBiblRlc3RCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zZXRCaXQgPSBiblNldEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNsZWFyQml0ID0gYm5DbGVhckJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZsaXBCaXQgPSBibkZsaXBCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBibkFkZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnN1YnRyYWN0ID0gYm5TdWJ0cmFjdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gYm5NdWx0aXBseTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZSA9IGJuRGl2aWRlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUucmVtYWluZGVyID0gYm5SZW1haW5kZXI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGVBbmRSZW1haW5kZXIgPSBibkRpdmlkZUFuZFJlbWFpbmRlcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvdyA9IGJuTW9kUG93O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW52ZXJzZSA9IGJuTW9kSW52ZXJzZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnBvdyA9IGJuUG93O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZ2NkID0gYm5HQ0Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1Byb2JhYmxlUHJpbWUgPSBibklzUHJvYmFibGVQcmltZTtcblxuLy8gQmlnSW50ZWdlciBpbnRlcmZhY2VzIG5vdCBpbXBsZW1lbnRlZCBpbiBqc2JuOlxuXG4vLyBCaWdJbnRlZ2VyKGludCBzaWdudW0sIGJ5dGVbXSBtYWduaXR1ZGUpXG4vLyBkb3VibGUgZG91YmxlVmFsdWUoKVxuLy8gZmxvYXQgZmxvYXRWYWx1ZSgpXG4vLyBpbnQgaGFzaENvZGUoKVxuLy8gbG9uZyBsb25nVmFsdWUoKVxuLy8gc3RhdGljIEJpZ0ludGVnZXIgdmFsdWVPZihsb25nIHZhbClcblxuLy8vIE1FVEVPUiBXUkFQUEVSXG5yZXR1cm4gQmlnSW50ZWdlcjtcbn0pKCk7XG4iLCIvLyBUaGlzIHBhY2thZ2UgY29udGFpbnMganVzdCBlbm91Z2ggb2YgdGhlIG9yaWdpbmFsIFNSUCBjb2RlIHRvXG4vLyBzdXBwb3J0IHRoZSBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSB1cGdyYWRlIHBhdGguXG4vL1xuLy8gQW4gU1JQIChhbmQgcG9zc2libHkgYWxzbyBhY2NvdW50cy1zcnApIHBhY2thZ2Ugc2hvdWxkIGV2ZW50dWFsbHkgYmVcbi8vIGF2YWlsYWJsZSBpbiBBdG1vc3BoZXJlIHNvIHRoYXQgdXNlcnMgY2FuIGNvbnRpbnVlIHRvIHVzZSBTUlAgaWYgdGhleVxuLy8gd2FudCB0by5cblxuU1JQID0ge307XG5cbi8qKlxuICogR2VuZXJhdGUgYSBuZXcgU1JQIHZlcmlmaWVyLiBQYXNzd29yZCBpcyB0aGUgcGxhaW50ZXh0IHBhc3N3b3JkLlxuICpcbiAqIG9wdGlvbnMgaXMgb3B0aW9uYWwgYW5kIGNhbiBpbmNsdWRlOlxuICogLSBpZGVudGl0eTogU3RyaW5nLiBUaGUgU1JQIHVzZXJuYW1lIHRvIHVzZXIuIE1vc3RseSB0aGlzIGlzIHBhc3NlZFxuICogICBpbiBmb3IgdGVzdGluZy4gIFJhbmRvbSBVVUlEIGlmIG5vdCBwcm92aWRlZC5cbiAqIC0gaGFzaGVkSWRlbnRpdHlBbmRQYXNzd29yZDogY29tYmluZWQgaWRlbnRpdHkgYW5kIHBhc3N3b3JkLCBhbHJlYWR5IGhhc2hlZCwgZm9yIHRoZSBTUlAgdG8gYmNyeXB0IHVwZ3JhZGUgcGF0aC5cbiAqIC0gc2FsdDogU3RyaW5nLiBBIHNhbHQgdG8gdXNlLiAgTW9zdGx5IHRoaXMgaXMgcGFzc2VkIGluIGZvclxuICogICB0ZXN0aW5nLiAgUmFuZG9tIFVVSUQgaWYgbm90IHByb3ZpZGVkLlxuICogLSBTUlAgcGFyYW1ldGVycyAoc2VlIF9kZWZhdWx0cyBhbmQgcGFyYW1zRnJvbU9wdGlvbnMgYmVsb3cpXG4gKi9cblNSUC5nZW5lcmF0ZVZlcmlmaWVyID0gZnVuY3Rpb24gKHBhc3N3b3JkLCBvcHRpb25zKSB7XG4gIHZhciBwYXJhbXMgPSBwYXJhbXNGcm9tT3B0aW9ucyhvcHRpb25zKTtcblxuICB2YXIgc2FsdCA9IChvcHRpb25zICYmIG9wdGlvbnMuc2FsdCkgfHwgUmFuZG9tLnNlY3JldCgpO1xuXG4gIHZhciBpZGVudGl0eTtcbiAgdmFyIGhhc2hlZElkZW50aXR5QW5kUGFzc3dvcmQgPSBvcHRpb25zICYmIG9wdGlvbnMuaGFzaGVkSWRlbnRpdHlBbmRQYXNzd29yZDtcbiAgaWYgKCFoYXNoZWRJZGVudGl0eUFuZFBhc3N3b3JkKSB7XG4gICAgaWRlbnRpdHkgPSAob3B0aW9ucyAmJiBvcHRpb25zLmlkZW50aXR5KSB8fCBSYW5kb20uc2VjcmV0KCk7XG4gICAgaGFzaGVkSWRlbnRpdHlBbmRQYXNzd29yZCA9IHBhcmFtcy5oYXNoKGlkZW50aXR5ICsgXCI6XCIgKyBwYXNzd29yZCk7XG4gIH1cblxuICB2YXIgeCA9IHBhcmFtcy5oYXNoKHNhbHQgKyBoYXNoZWRJZGVudGl0eUFuZFBhc3N3b3JkKTtcbiAgdmFyIHhpID0gbmV3IEJpZ0ludGVnZXIoeCwgMTYpO1xuICB2YXIgdiA9IHBhcmFtcy5nLm1vZFBvdyh4aSwgcGFyYW1zLk4pO1xuXG4gIHJldHVybiB7XG4gICAgaWRlbnRpdHk6IGlkZW50aXR5LFxuICAgIHNhbHQ6IHNhbHQsXG4gICAgdmVyaWZpZXI6IHYudG9TdHJpbmcoMTYpXG4gIH07XG59O1xuXG4vLyBGb3IgdXNlIHdpdGggY2hlY2soKS5cblNSUC5tYXRjaFZlcmlmaWVyID0ge1xuICBpZGVudGl0eTogU3RyaW5nLFxuICBzYWx0OiBTdHJpbmcsXG4gIHZlcmlmaWVyOiBTdHJpbmdcbn07XG5cblxuLyoqXG4gKiBEZWZhdWx0IHBhcmFtZXRlciB2YWx1ZXMgZm9yIFNSUC5cbiAqXG4gKi9cbnZhciBfZGVmYXVsdHMgPSB7XG4gIGhhc2g6IGZ1bmN0aW9uICh4KSB7IHJldHVybiBTSEEyNTYoeCkudG9Mb3dlckNhc2UoKTsgfSxcbiAgTjogbmV3IEJpZ0ludGVnZXIoXCJFRUFGMEFCOUFEQjM4REQ2OUMzM0Y4MEFGQThGQzVFODYwNzI2MTg3NzVGRjNDMEI5RUEyMzE0QzlDMjU2NTc2RDY3NERGNzQ5NkVBODFEMzM4M0I0ODEzRDY5MkM2RTBFMEQ1RDhFMjUwQjk4QkU0OEU0OTVDMUQ2MDg5REFEMTVEQzdEN0I0NjE1NEQ2QjZDRThFRjRBRDY5QjE1RDQ5ODI1NTlCMjk3QkNGMTg4NUM1MjlGNTY2NjYwRTU3RUM2OEVEQkMzQzA1NzI2Q0MwMkZENENCRjQ5NzZFQUE5QUZENTEzOEZFODM3NjQzNUI5RkM2MUQyRkMwRUIwNkUzXCIsIDE2KSxcbiAgZzogbmV3IEJpZ0ludGVnZXIoXCIyXCIpXG59O1xuX2RlZmF1bHRzLmsgPSBuZXcgQmlnSW50ZWdlcihcbiAgX2RlZmF1bHRzLmhhc2goXG4gICAgX2RlZmF1bHRzLk4udG9TdHJpbmcoMTYpICtcbiAgICAgIF9kZWZhdWx0cy5nLnRvU3RyaW5nKDE2KSksXG4gIDE2KTtcblxuLyoqXG4gKiBQcm9jZXNzIGFuIG9wdGlvbnMgaGFzaCB0byBjcmVhdGUgU1JQIHBhcmFtZXRlcnMuXG4gKlxuICogT3B0aW9ucyBjYW4gaW5jbHVkZTpcbiAqIC0gaGFzaDogRnVuY3Rpb24uIERlZmF1bHRzIHRvIFNIQTI1Ni5cbiAqIC0gTjogU3RyaW5nIG9yIEJpZ0ludGVnZXIuIERlZmF1bHRzIHRvIDEwMjQgYml0IHZhbHVlIGZyb20gUkZDIDUwNTRcbiAqIC0gZzogU3RyaW5nIG9yIEJpZ0ludGVnZXIuIERlZmF1bHRzIHRvIDIuXG4gKiAtIGs6IFN0cmluZyBvciBCaWdJbnRlZ2VyLiBEZWZhdWx0cyB0byBoYXNoKE4sIGcpXG4gKi9cbnZhciBwYXJhbXNGcm9tT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucykgLy8gZmFzdCBwYXRoXG4gICAgcmV0dXJuIF9kZWZhdWx0cztcblxuICB2YXIgcmV0ID0geyAuLi5fZGVmYXVsdHMgfTtcblxuICBbJ04nLCAnZycsICdrJ10uZm9yRWFjaChmdW5jdGlvbiAocCkge1xuICAgIGlmIChvcHRpb25zW3BdKSB7XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnNbcF0gPT09IFwic3RyaW5nXCIpXG4gICAgICAgIHJldFtwXSA9IG5ldyBCaWdJbnRlZ2VyKG9wdGlvbnNbcF0sIDE2KTtcbiAgICAgIGVsc2UgaWYgKG9wdGlvbnNbcF0gaW5zdGFuY2VvZiBCaWdJbnRlZ2VyKVxuICAgICAgICByZXRbcF0gPSBvcHRpb25zW3BdO1xuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHBhcmFtZXRlcjogXCIgKyBwKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChvcHRpb25zLmhhc2gpXG4gICAgcmV0Lmhhc2ggPSBmdW5jdGlvbiAoeCkgeyByZXR1cm4gb3B0aW9ucy5oYXNoKHgpLnRvTG93ZXJDYXNlKCk7IH07XG5cbiAgaWYgKCFvcHRpb25zLmsgJiYgKG9wdGlvbnMuTiB8fCBvcHRpb25zLmcgfHwgb3B0aW9ucy5oYXNoKSkge1xuICAgIHJldC5rID0gcmV0Lmhhc2gocmV0Lk4udG9TdHJpbmcoMTYpICsgcmV0LmcudG9TdHJpbmcoMTYpKTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuIl19
