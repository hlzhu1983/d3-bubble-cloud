~function(){
  jQuery.fn.d3Click = function () {
    this.each(function (i, e) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      e.dispatchEvent(evt);
    });
  };

  function App(options) {
    this.el = {
      $win: $(window),
      $body: $('body'),
      $header: $('.header'),
      $wrapper: $('.wrapper')
    };

    var self = this;

    var defaults = {
      timelineNum: 30,
      viewportMinHeight: 600,
      viewportMinWidth: 1000,
      category: 'all' // 默认显示分类
    };

    this.options = $.extend({}, defaults, options);

    this.cache = {
      tpls: {

      }
    };

    this.init();
  }

  $.extend(App.prototype, {
    _compileTpl: function(tpl) {
      if(this.cache.tpls[tpl]) {
        return this.cache.tpls[tpl];
      }

      if(!tpl) {
        return this.noop;
      }

      var $tpl = $('#' + tpl);
      if(!$tpl.length) {
        return this.noop;
      }

      this.cache.tpls[tpl] = mTpl($tpl.html() || '');
      return this.cache.tpls[tpl];
    },

    noop: function(){},

    refreshScale: function() {
      var $win = this.el.$win,
        self = this,
        winWidth = $win.width(),
        winHeight = $win.height(),
        viewportMinWidth = this.options.viewportMinWidth,
        viewportMinHeight = this.options.viewportMinHeight;

      this.viewportWidth = winWidth > viewportMinWidth ? winWidth : viewportMinWidth,
      this.viewportHeight = winHeight > viewportMinHeight ? winHeight : viewportMinHeight;

      var xScale = d3.scale.linear().domain([0, 2000]).range([0, this.viewportWidth]),
        yScale = d3.scale.linear().domain([0, 1080]).range([0, this.viewportHeight]);

      this.xScale = function(i) {
        return xScale(i);
      };
      this.yScale = function(i) {
        return yScale(i);
      } 
      return this;
    },

    listenToResize: function() {
      var _resize = 'onorientationchange' in window ? 'orientationchange' : 'resize',
        self = this, resize = function() {
          location.reload();
        };

      this.el.$win.on(_resize, function(e){
        Utils.controlFrequency(resize, null, 300);
      });
      return this;
    },

    renderTimelineData: function() {
      // TODO: 适配屏幕尺寸
     var today = new Date(), totalDay = 864e5, timeList = [],
        timestamp, timelineNum = this.options.timelineNum, endDay = new Date('2015/09/04 12:00:00');

      if(today > endDay) {
        today = endDay;
      }

      for(var i = 0; i < timelineNum; i++) {
        timestamp = today - (timelineNum - i) * totalDay;
        timeList.push({
          href: Utils.dateFormat(timestamp, 'yyyyMMDD'),
          text: Utils.dateFormat(timestamp, 'MM-DD')
        });
      }

      var last = timeList[timelineNum-1];
      last.class = 'active';
      this.timelineDate = last.href;
      return timeList;
    },

    // renderOldIE: function() {
    //   var tpl = '<div class="old-ie">' +
    //       '<h1 class="title">请使用 IE9 及以上版本的浏览器!, 或者下载如下：</h1>' +
    //       '<ul>' +
    //         '<li><a href="http://chrome.360.cn/" target="_blank">360极速浏览器</a><li>' +
    //         '<li><a href="http://se.360.cn/" target="_blank">360安全浏览器</a><li>' +
    //       '</ul>' +
    //     '</div>';

    //   this.el.$wrapper.html(tpl);
    //   return;
    // },

    stringifyStyle: function(obj) {
      var str = '';
      $.each(obj, function(k, v) {
        str += (k + ':' + v + ';')
      });
      return str;
    },

    renderWrapper: function() {
      var self = this;
      this.plotWidth = this.viewportWidth;
      this.plotHeight = this.viewportHeight - this.header.height;
      var scrollBarWidth = Utils.getScrollBarWidth(),
        layerHeight = this.plotHeight * 0.2 > 40 ? this.plotHeight * 0.8 : this.plotHeight - 40,
        // layerHeight = Math.min(this.plotHeight - 40, 854),
        layerMinWidth = 800 + scrollBarWidth,
        // iframeWrapHeight = Math.min(layerHeight , 780);
        iframeWrapHeight = layerHeight - 70;
      var data = {
        plot: {
          style: this.stringifyStyle({
            width: self.plotWidth + 'px',
            height: self.plotHeight + 'px'
          })
        },
        toolbar: {
          style: 'height:' + this.yScale(80) + 'px;',
          title: this.stringifyStyle({
            'font-size': this.yScale(28) + 'px',
            'margin-left': this.xScale(60) + 'px'
          }),
          selectWrapper: 'margin:' + (this.yScale(80) - 28) / 2 + 'px ' + this.xScale(60) + 'px 0 0'
        },
        timeline: {
          style: this.stringifyStyle({
            width: this.xScale(1000) + 'px',
            bottom: this.yScale(30) + 'px',
            padding: '0 ' + this.xScale(80) + 'px',
            'margin-left': '-' + this.xScale(1160 / 2) + 'px',
          }),
          timelineA: 'width:' + this.xScale(1000 / 6) + 'px',
          timeList: this.renderTimelineData()
        },
        content: {
          inner: this.stringifyStyle({
            width: layerMinWidth + 'px',
            // width: this.plotWidth * 0.8 > layerMinWidth ? this.plotWidth * 0.8 : layerMinWidth,
            height: layerHeight + 'px',
            'margin-top': (this.plotHeight - layerHeight) / 2 + 'px'
          }),
          iframeWrap: 'height:' + iframeWrapHeight + 'px',
        }
      }

      this.el.$wrapper.html(this._compileTpl('tpl-wrapper')(data));
      this.el.$loading = $('#loading');
      this.timeline = new IScroll($('.timeline .timeline-inner').get(0), {
        eventPassthrough: true,
        scrollX: true,
        scrollY: false,
        preventDefault: true,
        mouseWheel: true,
        bounce: true,
        snap: false
      });

      this.timeline.scrollTo(this.timeline.maxScrollX, 0 , 0);
    },

    initUI: function() {
      // 初始化 viewport
      this.el.$body.css({
        width: this.viewportWidth,
        height: this.viewportHeight
      });

      // fix header
      var header = this.header = {
        height: this.yScale(90),
        logoHeight: this.yScale(45),
        logoPosition: this.xScale(60),
        font: this.yScale(28)
      };

      $('.header').css({
        height: header.height,
        'line-height': header.height + 'px',
        'font-size': header.font,
        'background-size': 'auto ' + header.logoHeight + 'px',
        'background-position': header.logoPosition + 'px center',
        'display': 'block'
      });

      // init wrapper
      this.renderWrapper();
      return this;
    },
    init: function() {
      // if(Utils.isOldIE()) {
      //   this.renderOldIE();
      //   return this;
      // }
      this.refreshScale().initUI()
        .initPlot()
        .initEvents().listenToResize();
    },

    initPlot: function() {
      var $content = $('.wrapper .content'),
        $iframe = $content.find('iframe'),
        self = this;

      this.plot = MlD3.bubble().clickIn(function(d) {
        $content.find('.iframe-header .js-keyword').text(d.name).end()
          .find('.iframe-header .js-num').text(d.pv).end().show();
        self.el.$loading.show();
        $iframe.attr('src', 'http://index.haosou.com/?c=fullcontent&pid=dayuebing#trend?q=' + encodeURIComponent(d.name)).load(function(e){
          self.el.$loading.hide();
        });
      }).clickOut(function(d){
        $content.hide();
        $iframe.removeAttr('src');
      }).width(this.plotWidth).height(this.plotHeight);

      this._getData(this.timelineDate);
      return this;
    },

    _plotData: function() {
      var data = this.cache.hash[this.category];
      if(data.list) {
        d3.select('#plot').datum(data.list).call(this.plot);
      }
    },

    _getData: function(date) {
      var selectInner = '<option value="all">全部分类</option>', self = this;
      $.ajax({
        url: 'http://sh.qihoo.com/api/btv_get_query_by_date.json',
        type: 'get',
        dataType: 'jsonp',
        data: {
          date: date
        },
        beforeSend: function() {
          self.el.$loading.show();
        }
      }).done(function(data) {
        if(!data || !data.length) {
          return;
        }

        self.cache.data = data;
        self.cache.hash = {};

        var _all = [];

        self.category = self.category || self.options.category;

        $.each(data, function(k, v) {
          selectInner += '<option value="' + v.name + '" '+ (v.name === self.category ? 'selected' : '') +'>' + v.name + '</option>';
          // 词包确认有数据
          Utils.sortArr(v.list, 'pv');
          $.each(v.list, function(kk, vv) {
            vv.__class = 'bubble-node-color-' + (k + 1)
          })
          self.cache.hash[v.name] = v;
          if(v.name !== '新式武器') {
            _all = _all.concat(v.list.slice(0,10));
          }
        });

        $.each(_all, function(k, v){
          _all[k] = $.extend({}, v, {__all: '__'})
        });

        self.cache.hash.all = {
          name: 'all',
          pv: 0,
          list: _all
        }

        $('#file-select').html(selectInner);
        self._plotData();
      }).complete(function(){
        self.el.$loading.hide();
      });
    },

    initEvents: function() {
      var self = this;

      $('.wrapper .content').on('click', function(e) {
        var $target = $(e.target);
        if($target.is('.close')) {
          e.preventDefault();
          $('.bubble-active').d3Click();
        }
      });

      $('#file-select').on('change', function(e) {
        self.category = $(this).val();
        self._plotData();
      });

      $('.timeline').on('click', 'a', function(e) {
        var $target = $(this);
        e.preventDefault();
        if($target.hasClass('active')) {
          return;
        }

        var $active = $('.timeline a.active');
        $active.removeClass('active');
        $target.addClass('active');
        self._getData($target.attr('href').substr(1));
      });

      window.oncontextmenu = function(e)
      {
        e.preventDefault();
        // return false;     // cancel default menu
      }

      return this;
    },

  });

  $(document).ready(function() {
    window.app = new App();
  });
}();
