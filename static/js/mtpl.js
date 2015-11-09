/**
 * [使用到了 Object.keys 不支持 IE < 9，
 * 移动站点可以 happy 的使用,
 * 从 undescore 中抽离，去除 with 语句，以及配置选项]
 * @param
 * @return {[type]}     [description]
 */
(function(){
    var templateSettings = {
        evaluate    : /{%([\s\S]+?)%}/g,
        interpolate : /{%-([\s\S]+?)%}/g,
        escape      : /{%=([\s\S]+?)%}/g
    };

    // 用于转义空白字符
    var escapes = {
        "'":      "'",
        '\\':     '\\',
        '\r':     'r',
        '\n':     'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };

    var customEscape = (function(map) {
        var escaper = function(match) {
          return map[match];
        };
        var source = '(?:' + Object.keys(map).join('|') + ')';
        var testRegexp = new RegExp(source);
        var replaceRegexp = new RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    })(escapeMap);

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function(match) {
        return '\\' + escapes[match];
    };

    window.mTpl = function(text) {
        var matcher = new RegExp([
          (templateSettings.escape).source,
          (templateSettings.interpolate).source,
          (templateSettings.evaluate).source
        ].join('|') + '|$', 'g');

        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
          source += text.slice(index, offset).replace(escaper, escapeChar);
          index = offset + match.length;

          if (escape) {
            source += "'+\n((__t=(" + escape + "))==null?'':customEscape(__t))+\n'";
          } else if (interpolate) {
            source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
          } else if (evaluate) {
            source += "';\n" + evaluate + "\n__p+='";
          }

          return match;
        });
        source += "';\n";

        source = "var __t,__p='',__j=Array.prototype.join," +
          "print=function(){__p+=__j.call(arguments,'');};\n" +
          source + 'return __p;\n';

        try {
            var render = new Function('root', 'customEscape', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        return function(data) {
            return render.call(this, data, customEscape);
        };
    };
})();