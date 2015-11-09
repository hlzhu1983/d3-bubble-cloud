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
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      // 具体显示区域
      _width,
      _height,
      jitter = 0.6,
      maxSpeed = 2,
      rValue = function(d) { // 半径大小，提供自定义修改的函数
        return +d.pv;
      },
      idValue = function(d) {
        return d.name + d.pv + (d.__all || '') + d.__class;
      },
      textValue = function(d) {
        return d.name;
      },
      data = [], // bubble 的展示数据

      // 输出范围比例尺
      rScale = d3.scale.sqrt(),
      color = d3.scale.category10(),

      node = null,
      label = null,

      collisionPadding = 10,

      // 自定义处理数据函数
      transformData = function(rawData) {

        // 输入值域最大范围
        var maxDomainValue = d3.max(rawData, function(d){
          return rValue(d);
        });

        var maxRadius = ~~((Math.sqrt(_width * _height / rawData.length) - collisionPadding) / 2);

        rScale.domain([0, maxDomainValue]).range([maxRadius/2, maxRadius]);

        var _halfWidth = _width / 2,
          _halfHeight = _height / 2;

        $.each(rawData, function(k, d) {
          var _radius = rScale(rValue(d));
          d.pv = parseInt(d.pv, 10);
          d.color = color(k & 10);
          d.radius = _radius;
          d.x = _halfWidth + (Math.random() - 0.5) * 2 * (_halfWidth - _radius);
          d.y = _halfHeight + (Math.random() - 0.5) * 2 * (_halfHeight - _radius);
          d.speedX = (Math.random() - 0.5) * maxSpeed;
          d.speedY = (Math.random() - 0.5) * maxSpeed;
        });

        return rawData;
      },
      tick = function(e) {
        force.alpha(0.1);
        node.each(gravity(e.alpha))
          .each(collide(jitter))
          .attr('transform', function(d) {
            // limitPosition(d);
            return 'translate(' + d.x + ',' + d.y + ')';
          });

        label.attr('transform', function(d) {
          // limitPosition(d)
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      },
      force = d3.layout.force()
      .gravity(0)
      .charge(0)
      .on('tick', tick),
      // .on('start', function() {
      // })
      // .on('end', function() {
      // }),
      clickIn = null,
      clickOut = null;

    //code code code//

    function dragstarted(d) {
     d3.event.sourceEvent.stopPropagation();
     d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
     d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
     d3.select(this).classed("dragging", false);
    }

    //code code code//

    force.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended)

    function chart(selection) {
      _width = width - padding.left - padding.right;
      _height = height - padding.top - padding.bottom;

      force.size([_width, _height]);
      return selection.each(function(rawData){
        var maxDomainValue,
          svg, svgEnter;

        data = transformData(rawData);

        svg = d3.select(this).selectAll('svg').data([data]);

        svg.exit().remove();

        svgEnter = svg.enter().append('svg');

        svgEnter.attr({
          width: function(d){
            return width;
          },
          height: height
        });

        svg.style('opacity', 1e-6)
        .transition()
        .duration(1000)
        .style('opacity', 1);

        svgEnter.append('rect')
          .attr({
            fill: 'none',
            class: 'bubble-area-bg',
            x: padding.left,
            y: padding.top,
            width: _width,
            height: _height
          });
          // .on('click', clear);

        svgEnter.append('g').attr({
          id: 'bubble-nodes',
          transform: 'translate(' + padding.left + ',' + padding.top + ')'
        });

        node = svg.select('g#bubble-nodes');

        svgEnter.append('g').attr({
          id: 'bubble-labels',
          transform: 'translate(' + padding.left + ',' + padding.top + ')'
        });

        label = svg.select('g#bubble-labels');


        update();
        // hashchange();
        // return d3.select(g).on("hashchange", hashchange);
      });
    }

    function update() {
      force.nodes(data).start();
      updateNodes();
      updateLabels();
    }

    function updateNodes() {
      node = node.selectAll('.bubble-node').data(data, function(d) {
        return idValue(d);
      });

      node.exit().remove();

      node.enter()
        .append('a')
        .attr({
          class: function(d) {
            return 'bubble-node ' + d.__class;
          },
          'xlink:href': function(d) {
            return '#' + (encodeURIComponent(idValue(d)));
          }
        })
        .call(force.drag)
        .call(connectEvents).append('circle')
        .attr({
          r: function(d) {
            return d.radius
          }
        }).append("svg:title")
          .text(function(d, i) { return textValue(d) + '(' + rValue(d) + ')'; });
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
            var len = d.radius * 2 - 20,
              strLen = (textValue(d)+'').length;
            d.nameSize = Math.max(12, ~~(len / strLen));
            return d.nameSize;
          },
          'stroke-width': 0,
          dy: '0.4em'
        })
        .text(function(d) {
          return textValue(d);
        });

      labelEnter.append("svg:title")
          .text(function(d, i) { return textValue(d) + '(' + rValue(d) + ')'; });


      // labelEnter.append('text')
      //   .attr({
      //     'class': 'bubble-label-value',
      //     'text-anchor': 'middle',
      //     fill: '#000',
      //     'font-size': function(d) {
      //       d.pvSize = Math.max(12, d.nameSize / 3);
      //       return d.pvSize;
      //     },
      //     'stroke-width': 0,
      //     dy: function(d) {
      //       return d.nameSize / 3 + d.pvSize * 1.2;
      //     }
      //   })
      //   .text(function(d) {
      //     return rValue(d);
      //   });
    }

    function clear() {
      return location.replace('#');
    }

    function gravity(alpha) {
      return function(d) {
        if ((d.x - d.radius) <= 0) d.speedX = Math.abs(d.speedX);
        if ((d.x + d.radius) >= _width) d.speedX = -1 * Math.abs(d.speedX);
        if ((d.y - d.radius) <= 0) d.speedY = -1 * Math.abs(d.speedY);
        if ((d.y + d.radius) >= _height) d.speedY = Math.abs(d.speedY);
         
        d.x = d.x + (d.speedX * alpha);
        d.y = d.y + (-1 * d.speedY * alpha);
        limitPosition(d);
      };
    }

    function limitPosition(d) {
      if(d.x + d.radius > _width) {
        d.x = _width - d.radius;
      }
      if(d.x - d.radius < 0) {
        d.x = d.radius;
      }
      if(d.y + d.radius > _height) {
        d.y = _height - d.radius;
      }
      if(d.y - d.radius < 0) {
        d.y = d.radius;
      }
    }

    function limitSpeed(d) {
      var speedX = Math.abs(d.speedX),
        speedY = Math.abs(d.speedY);
        // halfMax = maxSpeed / 2;
      if(speedX > maxSpeed) {
        // d.speedX = d.speedX / speedX * (halfMax + halfMax * Math.random()) ;
        d.speedX = d.speedX / speedX * (maxSpeed * Math.random()) ;
      }

      if(speedY > maxSpeed) {
        // d.speedY = d.speedY / speedY * (halfMax + halfMax * Math.random());
        d.speedY = d.speedY / speedY * (maxSpeed * Math.random());
      }
    }

    function connectEvents(d) {
      d.on('click', click);
      d.on('contextmenu', function(d, i) {
        d3.event.preventDefault();
      });
      // d.on('mouseover', mouseover);
      // d.on('mouseout', mouseout);
    }

    function click(d, index) {
      if (d3.event.defaultPrevented) return;
      // location.replace("#" + encodeURIComponent(idValue(d)));

      var targetNode = node.filter(function(d) {
        return d.index == index;
      }).classed('bubble-active', true).transition().duration(700);

      var otherNodes = node.filter(function(d) {
        return d.index != index;
      }).classed('bubble-active', false);

      if(d.__click_big) {
        clickOut && clickOut(d);
        d.fixed = false;
        d.__click_big = false;
        // node.on('mousedown.drag', function(){return true;});
        targetNode.attr({
          transform: 'translate('+ d.x +', '+ d.y +')'
        }).selectAll('circle').attr('r', d.radius).each('end', function(){
          otherNodes.attr({
            display: ''
          });
          label.attr({
            display: ''
          });
          force.start();
        });
      } else { 
        var centerX = _width / 2,
          centerY = _height / 2,
          bigR = Math.sqrt(_width * _width + _height * _height) / 2;
        d.fixed = true;
        d.__click_big = true;
        // node.on('mousedown.drag', null);
        targetNode.each('start', function(){
          force.alpha(0);
          otherNodes.attr({
            display: 'none'
          });
          label.attr({
            display: 'none'
          });
        }).attr({
          transform: 'translate('+ centerX +', '+ centerY +')'
        }).selectAll('circle').attr('r', bigR).each('end', function(){
          clickIn && clickIn(d);
        });
      }

      return d3.event.preventDefault();
    }

    // function mouseover(d) {
    //   node.classed("bubble-hover", function(p) {
    //     return p === d;
    //   });
    // }

    // function mouseout(d) {
    //   node.classed("bubble-hover", false);
    // }

    // function hashchange() {
    //   var id;
    //   id = decodeURIComponent(location.hash.substring(1)).trim();
    //   updateActive(id);
    // }

    // function updateActive(id) {
    //   node.classed("bubble-active", function(d) {
    //     return id === idValue(d);
    //   });
    // }


    function collide(jitter) {
      var quadtree = d3.geom.quadtree(data);
      return function(d) {
        var r = d.radius + rScale.domain()[1],
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius;
            if (l < r) {
              l = (l - r) / l * jitter;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;

              var m1 = d.radius * d.radius,
                m2 = quad.point.radius * quad.point.radius,
                v1x = d.speedX, v1y = d.speedY,
                v2x = quad.point.speedX, v2y = quad.point.speedY,
                m12 = m1 + m2;

              d.speedX = (v1x * (m1 - m2) + 2 * m2 * v2x) / m12;
              d.speedY = (v1y * (m1 - m1) + 2 * m2 * v2y) / m12;
              quad.point.speedX = (v2x * (m2 - m1) + 2 * m1 * v1x) / m12;
              quad.point.speedY = (v2y * (m2 - m1) + 2 * m1 * v1y) / m12;

              limitSpeed(d);
              limitSpeed(quad.point);
            }
          }
          return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
        });
      };
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

    chart.maxSpeed = function(newMaxSpeed) {
      if(!arguments.length) {
        return maxSpeed;
      }
      maxSpeed = newMaxSpeed;
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

    chart.r = function(r) {
      if(!arguments.length) {
        return rValue;
      }

      rValue = r;
      return chart;
    }

    chart.clickIn = function(cb) {
      if(!arguments.length) {
        return clickIn;
      }

      clickIn = cb;
      return chart;
    }

    chart.clickOut = function(cb) {
      if(!arguments.length) {
        return clickOut;
      }

      clickOut = cb;
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