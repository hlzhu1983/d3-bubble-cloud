var Utils = {
  dateFormat: function(date, format) {
    if (Object.prototype.toString.call(date) !== '[object Date]') {
      date = new Date(date);
    }
    if(!date) {
      return '';
    }

    format = format || 'yyyy-MM-DD';

    var y = date.getFullYear().toString();
    var o = {
      M: date.getMonth() + 1,
      D: date.getDate(),
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds()
    }, replacer = function(a, b) {
      return (o[i] < 10 && b.length > 1) ? '0' + o[i] : o[i];
    };
    format = format.replace(/(y+)/ig, function(a, b) {
      return y.substr(4 - Math.min(4, b.length));
    });
    for (var i in o) {
      format = format.replace(new RegExp('(' + i + '+)', 'g'), replacer);
    }
    return format;
  },
  getScrollBarWidth: function() {
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild (inner);

    document.body.appendChild (outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;

    document.body.removeChild (outer);

    return (w1 - w2);
  },
  controlFrequency: function(ctrlFn,context,time) {
    time = time || 200;
    clearTimeout(ctrlFn.timerId);
    ctrlFn.timerId = setTimeout(function(){
      ctrlFn.call(context);
    },time);
  },
  isOldIE: function() {
    if($('html').is('.ie6, .ie7, .ie8')) {
      return true;
    }
    return false;
  },
  sortArr: function(arr,key,flag){
    var temp;
    for(var i = 0, len = arr.length; i < len - 1; i++) {
      for(var j = 0; j < len - i - 1; j++) {
        if(flag) { // 由小到大
          if((+arr[j][key]) > (+arr[j+1][key])) {
            temp = arr[j];
            arr[j] = arr[j+1];
            arr[j+1] = temp;
          }
        } else { // 由大到小
          if((+arr[j][key]) < (+arr[j+1][key])) {
            temp = arr[j];
            arr[j] = arr[j+1];
            arr[j+1] = temp;
          }
        }
      }
    }
  }
};