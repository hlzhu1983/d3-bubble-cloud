/**
 * name bubble.js
 * author leiman0311@gmail.com
 * 为了避免在与 d3 集成的过程中，维护 this，使用 closures with getter-setters
 * require jquery
 */

~function(g, $, undefined){
  // bubble 主体 closure
  function bubble() {
    // svg 区域
    var width = $(g).width(),
      height = $(g).height(),
      // svg 区域留白
      padding = {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
      },
      // 具体显示区域
      _width = width - padding.left - padding.right,
      _height = height - padding.top - padding.bottom,
      jitter = 0.5,
      rValue = function(d) { // 半径大小，提供自定义修改的函数
        return d.count;
      },
      idValue = function(d) {
        return d.name;
      },
      textValue = function(d) {
        return d.name;
      },
      data = [], // bubble 的展示数据

      maxRadius = Math.max(_width, _height) / 20, // 限制最大显示半径
      // 输出范围比例尺
      rScale = d3.scale.sqrt().range([0, maxRadius]),

      node = null,
      label = null,

      collisionPadding = 10,
      minCollisionRadius = 12,

      // 自定义处理数据函数
      transformData = function(rawData) {
        $.each(rawData, function(k, d) {
          d.count = parseInt(d.count, 10);
        });
        rawData.sort(function() {
          return 0.5 - Math.random();
        });
        return rawData;
      },

      tick = function(e) {
        var dampenedAlpha = e.alpha * 0.1;

        node.each(gravity(dampenedAlpha))
          .each(collide(jitter))
          .attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });

        label.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      },
      force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .size([_width, _height])
        .on('tick', tick)
        .on('start', function() {
          console.log('force start:', arguments);
        })
        .on('end', function() {
          console.log('force end:', arguments);
        });

    function chart(selection) {
      return selection.each(function(rawData){
        var maxDomainValue,
          svg;

        data = transformData(rawData);

        // 输入值域最大范围
        maxDomainValue = d3.max(data, function(d){
          return rValue(d);
        });

        rScale.domain([0, maxDomainValue]);

        svg = d3.select(this).selectAll('svg').data([data]).enter().append('svg')
              .attr({
                width: width,
                height: height
              });

        svg.style('opacity', 1e-6)
          .transition()
          .duration(1000)
          .style('opacity', 1);

        var chartAreaOptions = {
          x: padding.left,
          y: padding.top,
          width: _width,
          height: _height
        }

        svg.append('clipPath')
          .attr('id', 'chart-area')
          .append('rect')
          .attr(chartAreaOptions);

        svg.append('rect')
          .attr(chartAreaOptions)
          .attr({
            fill: 'none',
            class: 'bubble-area-bg'
          })
          .on('click', clear);

        node = svg.append('g').attr({
          id: 'bubble-nodes',
          'clip-path': 'url(#chart-area)'
        }).append('svg').attr({
          x: padding.left,
          y: padding.top
        });

        label = svg.append('g').attr({
          id: 'bubble-labels',
          'clip-path': 'url(#chart-area)'
        }).append('svg').attr({
          x: padding.left,
          y: padding.top
        });

        update();
        hashchange();
        return d3.select(g).on("hashchange", hashchange);
      });
    }

    function update() {
      $.each(data, function(k, d) {
        d.forceR = Math.max(minCollisionRadius, rScale(rValue(d)));
      });

      force.nodes(data).start();
      updateNodes();
      updateLabels();
    }

    function updateNodes() {
      node = node.selectAll('.bubble-nodes').data(data, function(d) {
        return idValue(d);
      });

      node.exit().remove();

      node.enter()
        .append('a')
        .attr({
          class: 'bubble-node',
          'xlink:href': function(d) {
            return '#' + (encodeURIComponent(idValue(d)));
          }
        })
        .call(force.drag)
        .call(connectEvents).append('circle')
        .attr('r', function(d) {
          return rScale(rValue(d));
        });
    }

    function updateLabels() {
      var labelEnter;

      label = label.selectAll('.bubble-label').data(data, function(d) {
        return idValue(d);
      });

      label.exit().remove();

      labelEnter = label.enter()
        .append('a')
        .attr({
          class: 'bubble-label',
          'xlink:href': function(d) {
            return '#' + (encodeURIComponent(idValue(d)));
          }
        }).call(force.drag).call(connectEvents);

      labelEnter.append('text')
        .attr({
          'class': 'bubble-label-name',
          'text-anchor': 'middle',
          'font-size': function(d) {
            return Math.max(8, rScale(rValue(d) / 2));
          },
          fill: '#000',
          'stroke-width': 0
        })
        .text(function(d) {
          return textValue(d);
        });

      labelEnter.append('text')
        .attr({
          'class': 'bubble-label-value',
          'text-anchor': 'middle',
          fill: '#000',
          'font-size': function(d) {
            return Math.max(8, rScale(rValue(d) / 6));
          },
          'stroke-width': 0,
          dy: '1.2em'
        })
        .text(function(d) {
          return rValue(d);
        });
    }

    function clear() {
      return location.replace('#');
    }

    function gravity(alpha) {
      var cx = _width / 2,
        cy = _height / 2,
        ax = alpha / 2,
        ay = alpha / 1.5;

      return function(d) {
        d.x += (cx - d.x) * ax;
        d.y += (cy - d.y) * ay;
      }
    }

    function connectEvents(d) {
      // console.log(d, 'connectEvents');
      d.on('click', click);
      d.on('mouseover', mouseover);
      d.on('mouseout', mouseout);
    }

    function click(d) {
      location.replace("#" + encodeURIComponent(idValue(d)));
      return d3.event.preventDefault();
    }

    function mouseover(d) {
      node.classed("bubble-hover", function(p) {
        return p === d;
      });
    }

    function mouseout(d) {
      node.classed("bubble-hover", false);
    }

    function hashchange() {
      var id;
      id = decodeURIComponent(location.hash.substring(1)).trim();
      updateActive(id);
    }

    function updateActive(id) {
      node.classed("bubble-active", function(d) {
        return id === idValue(d);
      });
    }


    function collide(jitter) {
      return function(d) {
        // console.log('collide:', d, data)
        $.each(data, function(k, d2) {
          var distance, minDistance, moveX, moveY, x, y;

          if(d !== d2) {
            x = d.x - d2.x;
            y = d.y - d2.y;
            distance = Math.sqrt(x * x + y * y);
            minDistance = d.forceR + d2.forceR + collisionPadding;

            if(distance < minDistance) {
              distance = (distance - minDistance) / distance * jitter;
              moveX = x * distance;
              moveY = y * distance;
              d.x -= moveX;
              d.y -= moveY;
              d2.x += moveX;
              d2.y += moveY;
            }
          }
        });
      }
    }

    chart.width = function(newWidth) {
      if(!arguments.length) {
        return width;
      }
      width = newWidth;
      return chart;
    }

    chart.height = function(newHeight) {
      if(!arguments.length) {
        return height;
      }
      height = newHeight;
      return chart;
    }

    chart.jitter = function(newJitter) {
      if(!arguments.length) {
        return jitter;
      }
      jitter = newJitter;
      force.start();
      return chart;
    }

    chart.maxRadius = function(newMaxRadius) {
      if(!arguments.length) {
        return maxRadius;
      }
      maxRadius = newMaxRadius;
      return chart;
    }

    // FIXME:
    chart.r = function(r) {
      if(!arguments.length) {
        return rValue;
      }

      rValue = r;
      return chart;
    }

    return chart;
  }

  // 图表命名空间
  if(!g.MlD3) {
    g.MlD3 = {};
  }
  if(!g.MlD3.bubble) {
    g.MlD3.bubble = bubble;
  }
}(window, jQuery);